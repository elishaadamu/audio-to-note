import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import express from "express";
import fs from "fs";
import multer from "multer";
import nodemailer from "nodemailer";
import path from "path";
import { Pool } from "pg";
import { fileURLToPath } from "url";

import {
  comparePassword,
  generateToken,
  hashPassword,
  verifyToken,
} from "./auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Multer for audio uploads
const upload = multer({ dest: "uploads/" });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const app = express();
const port = Number(process.env.PORT) || 8080;

app.use(cors());
app.use(express.json());

// Logger for debugging network issues
const logFile = path.join(__dirname, "../server_error.log");
const logger = (msg: string) => {
  const formatted = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(formatted.trim());
  fs.appendFileSync(logFile, formatted);
};

app.use((req, res, next) => {
  logger(`${req.method} ${req.url}`);
  next();
});

// Middleware to protect routes and identify users
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Unauthorized: Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    logger(`Unauthorized: Invalid token for ${token.substring(0, 10)}...`);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }

  req.user = decoded;
  next();
};

// --- AUTH ROUTES ---

// Configure Email Transporter (Lazy-load to ensure env variables are ready)
const getTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return res.status(404).json({ error: "User with this email not found" });

    // Generate numeric 6-digit token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    await prisma.user.update({
      where: { email },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const transporter = getTransporter();
    // Send the email
    const mailOptions = {
      from: `"AudioNote Support" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Password Reset Verification Code",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #6C63FF; margin-bottom: 20px;">AudioNote Recovery</h2>
          <p>You requested a password reset. Please use the following 6-digit verification code to reset your password:</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333; margin: 20px 0;">
            ${token}
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Verification code sent to your email" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ error: "Failed to send reset email" });
  }
});

app.post("/api/verify-reset-token", async (req, res) => {
  try {
    const { email, token } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        email,
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user)
      return res
        .status(400)
        .json({ error: "Invalid or expired verification code" });

    res.json({ message: "Code verified successfully" });
  } catch (error) {
    console.error("Verify Token Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        email,
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user)
      return res
        .status(400)
        .json({ error: "Invalid or expired verification code" });

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Send confirmation email
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `"AudioNote Support" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Password Recovery Success",
        html: `
          <div style="font-family: sans-serif; max-width: 500px; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #34C759; margin-bottom: 20px;">Success!</h2>
            <p>Your AudioNote password has been successfully reset. You can now use your new password to sign in to your account.</p>
            <p style="color: #666; font-size: 14px;">If you did not perform this action, please secure your account immediately.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("Confirmation email failed:", err);
    }

    res.json({ message: "Password reset successful!" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and PIN are required" });

    if (password.length !== 4)
      return res.status(400).json({ error: "PIN must be exactly 4 digits" });

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
    });

    const token = generateToken(user.id);
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error: any) {
    if (error.code === "P2002")
      return res.status(400).json({ error: "Email already exists" });
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or PIN" });
    }

    const token = generateToken(user.id);
    res.json({
      message: "Login successful!",
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/me", authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      preferredLanguage: (user as any).preferredLanguage,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/me", authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { name, email, password, preferredLanguage } = req.body;

    const data: any = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (preferredLanguage) (data as any).preferredLanguage = preferredLanguage;
    if (password) {
      if (password.length !== 4)
        return res.status(400).json({ error: "PIN must be exactly 4 digits" });
      data.password = await hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
    });

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      preferredLanguage: (updatedUser as any).preferredLanguage,
    });
  } catch (error: any) {
    if (error.code === "P2002")
      return res.status(400).json({ error: "Email already exists" });
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- PROTECTED NOTES ROUTES ---

app.get("/api/notes", authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const notes = await prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(notes);
  } catch (error: any) {
    logger(`Fetch notes error: ${error.stack || error}`);
    res.status(500).json({ error: "Failed to fetch notes." });
  }
});

app.get("/api/notes/:id", authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const note = await prisma.note.findFirst({
      where: { id, userId },
    });
    if (!note) return res.status(404).json({ error: "Note not found" });
    res.json(note);
  } catch (error: any) {
    logger(`Fetch note by ID error: ${error.stack || error}`);
    res.status(500).json({ error: "Failed to fetch note." });
  }
});

app.post("/api/notes", authenticate, async (req: any, res) => {
  try {
    const {
      title,
      topic,
      duration,
      wordCount,
      summary,
      transcript,
      quiz,
      audioUrl,
    } = req.body;
    const userId = req.user.userId;

    const newNote = await prisma.note.create({
      data: {
        title,
        topic,
        duration,
        wordCount: Number(wordCount) || 0,
        summary,
        transcript,
        // @ts-ignore
        originalSummary: summary,
        // @ts-ignore
        originalTranscript: transcript,
        // @ts-ignore
        originalQuiz: quiz,
        quiz,
        audioUrl,
        status: "processed",
        user: { connect: { id: userId } },
      },
    });

    res.status(201).json(newNote);
  } catch (error: any) {
    logger(`Save note error: ${error.stack || error}`);
    res.status(500).json({ error: "Failed to save the note." });
  }
});

app.delete("/api/notes/:id", authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note)
      return res.status(404).json({ error: "Note not found or unauthorized" });

    await prisma.note.delete({
      where: { id },
    });

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete note." });
  }
});

app.delete("/api/notes", authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    await prisma.note.deleteMany({
      where: { userId },
    });
    res.json({ message: "All notes cleared successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to clear notes." });
  }
});

// --- AI GENERATION ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY || "");

app.post(
  "/api/generate-notes",
  authenticate,
  upload.single("audio"),
  async (req: any, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No audio file uploaded" });

    try {
      console.log(`Processing audio: ${file.path} for user ${req.user.userId}`);

      // 1. Upload to Gemini File API
      const uploadResult = await fileManager.uploadFile(file.path, {
        mimeType: file.mimetype || "audio/mpeg",
        displayName: "Lecture Audio",
      });

      console.log(`Uploaded to Gemini: ${uploadResult.file.uri}`);

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });
      const targetLang = (user as any)?.preferredLanguage || "English";

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // 2. Build the request
      const prompt =
        `Please transcribe and deeply summarize this recording in ${targetLang}. Format your response EXACTLY like this:\n` +
        "TITLE: [Brief Title]\n" +
        "TOPIC: [Topic Category]\n" +
        `SUMMARY: [Detailed, structured markdown summary in ${targetLang}. USE **BOLD** FOR KEY TERMS. Include bullet points for clarity.]\n` +
        `TRANSCRIPT: [Exhaustive, WORD-FOR-WORD transcript in ${targetLang} using **[MM:SS]** timestamps every 10 seconds. Keep every sentence spoken.]\n` +
        `QUIZ: [Provide 10 multiple-choice questions in ${targetLang}. Format each as:\n` +
        "Q: [Question text]\n" +
        "A: [Option 1]\n" +
        "B: [Option 2]\n" +
        "C: [Option 3]\n" +
        "D: [Option 4]\n" +
        "CORRECT: [A/B/C/D]]\n\n" +
        `CRITICAL: The transcript MUST be exhaustive. ALL content must be in ${targetLang} EXCEPT labels (TITLE:, TOPIC:, SUMMARY:, TRANSCRIPT:, QUIZ:). Ensure EVERY sentence from the recording is in the transcript.`;

      // 3. Generate Content
      const result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadResult.file.mimeType,
            fileUri: uploadResult.file.uri,
          },
        },
        { text: prompt },
      ]);

      const resultPayload = result.response.text();
      console.log("Gemini process complete.");

      // Cleanup: local file & Gemini file
      try {
        fs.unlinkSync(file.path);
        await fileManager.deleteFile(uploadResult.file.name);
      } catch (e) {
        console.error("Cleanup error:", e);
      }

      res.json({ result: resultPayload });
    } catch (error: any) {
      console.error("Gemini Backend error:", error);
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      res.status(500).json({ error: "AI Processing failed: " + error.message });
    }
  },
);

app.post("/api/translate-note", authenticate, async (req: any, res) => {
  const { noteId, targetLanguage } = req.body;
  if (!noteId || !targetLanguage)
    return res
      .status(400)
      .json({ error: "NoteId and targetLanguage are required" });

  try {
    const userId = req.user.userId;
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId },
    });

    if (!note) return res.status(404).json({ error: "Note not found" });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Translate the following lecture notes into ${targetLanguage}. 
    
    CRITICAL: YOU MUST KEEP THE MARKERS (TITLE:, TOPIC:, SUMMARY:, TRANSCRIPT:, QUIZ:) EXACTLY AS THEY ARE IN ENGLISH. Do NOT translate the labels themselves. Only translate the content after the labels.
    
    Example:
    TITLE: [Translated Title in ${targetLanguage}]
    TOPIC: [Translated Topic in ${targetLanguage}]
    ...
    
    Current Note to translate:
    TITLE: ${note.title}
    TOPIC: ${note.topic}
    SUMMARY: ${note.summary}
    TRANSCRIPT: ${note.transcript}
    QUIZ: ${note.quiz || ""}
    
    Translate EVERYTHING into ${targetLanguage} EXCEPT the labels (TITLE:, TOPIC:, SUMMARY:, TRANSCRIPT:, QUIZ:) and the [MM:SS] timestamps.`;

    const result = await model.generateContent(prompt);
    const resultPayload = result.response.text();

    const translatedTitle =
      resultPayload.match(/TITLE:\s*(.*)/i)?.[1]?.trim() ?? note.title;
    const translatedTopic =
      resultPayload.match(/TOPIC:\s*(.*)/i)?.[1]?.trim() ?? note.topic;
    const translatedSummary =
      resultPayload
        .match(/SUMMARY:\s*([\s\S]*?)(?=TRANSCRIPT:|$)/i)?.[1]
        ?.trim() ?? note.summary;
    const translatedTranscript =
      resultPayload
        .match(/TRANSCRIPT:\s*([\s\S]*?)(?=QUIZ:|$)/i)?.[1]
        ?.trim() ?? note.transcript;
    const translatedQuiz =
      resultPayload.match(/QUIZ:\s*([\s\S]*)$/i)?.[1]?.trim() ?? note.quiz;

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        title: translatedTitle,
        topic: translatedTopic,
        summary: translatedSummary,
        transcript: translatedTranscript,
        quiz: translatedQuiz,
        status: "processed",
      },
    });

    res.json({ translatedNote: updatedNote });
  } catch (error: any) {
    console.error("Translation error:", error);
    res.status(500).json({ error: "Translation failed: " + error.message });
  }
});

app.post("/api/notes/:id/reset", authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note || !user)
      return res.status(404).json({ error: "Note or User not found" });

    // @ts-ignore
    if (!note.originalSummary || !note.originalTranscript) {
      return res.status(400).json({ error: "Original content not found." });
    }

    let summary = (note as any).originalSummary;
    let transcript = (note as any).originalTranscript;
    let quiz = (note as any).originalQuiz || note.quiz;
    let title = note.title;
    let topic = note.topic;

    // If preferred language is not English, translate BEFORE resetting
    if ((user as any).preferredLanguage && (user as any).preferredLanguage !== "English") {
      console.log(
        `Resetting note ${id} to user's preferred language: ${(user as any).preferredLanguage}`,
      );
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `Translate the following lecture notes into ${(user as any).preferredLanguage}. 
        CRITICAL: KEEP LABELS (TITLE:, TOPIC:, SUMMARY:, TRANSCRIPT:, QUIZ:) IN ENGLISH.
        
        TITLE: ${note.title}
        TOPIC: ${note.topic}
        SUMMARY: ${summary}
        TRANSCRIPT: ${transcript}
        QUIZ: ${quiz || ""}
        
        Translate EVERYTHING into ${(user as any).preferredLanguage} EXCEPT labels and [MM:SS] timestamps.`;

      const result = await model.generateContent(prompt);
      const resultPayload = result.response.text();

      title = resultPayload.match(/TITLE:\s*(.*)/i)?.[1]?.trim() ?? title;
      topic = resultPayload.match(/TOPIC:\s*(.*)/i)?.[1]?.trim() ?? topic;
      summary =
        resultPayload
          .match(/SUMMARY:\s*([\s\S]*?)(?=TRANSCRIPT:|$)/i)?.[1]
          ?.trim() ?? summary;
      transcript =
        resultPayload
          .match(/TRANSCRIPT:\s*([\s\S]*?)(?=QUIZ:|$)/i)?.[1]
          ?.trim() ?? transcript;
      quiz = resultPayload.match(/QUIZ:\s*([\s\S]*)$/i)?.[1]?.trim() ?? quiz;
    }

    const resetNote = await prisma.note.update({
      where: { id },
      data: {
        title,
        topic,
        summary,
        transcript,
        quiz,
      },
    });

    res.json(resetNote);
  } catch (error) {
    console.error("Reset error:", error);
    res.status(500).json({ error: "Failed to reset note." });
  }
});

const HOST = "0.0.0.0";

app.listen(port, HOST, () => {
  console.log(`🚀 Audio-to-Note Server is running on:`);
  console.log(`   - Local:    http://localhost:${port}`);
  console.log(`   - Network:  http://10.40.36.154:${port}`);
});
