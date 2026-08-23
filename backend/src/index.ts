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
const getTransporter = () => {
  const user = process.env.SMTP_USER?.trim();
  const rawPass = process.env.SMTP_PASS?.trim() || "";
  const pass = rawPass.replace(/^["']|["']$/g, "").replace(/\s+/g, "");
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT.trim(), 10) : 587;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    family: 4, // Force IPv4 to avoid ENETUNREACH on Render/cloud networks
    tls: {
      rejectUnauthorized: false,
    },
  } as any);
};

app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user)
      return res.status(404).json({ error: "User with this email not found" });

    res.json({ 
      success: true,
      message: "User verified. You can now reset your security PIN.",
      email: normalizedEmail 
    });
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/verify-reset-token", async (req, res) => {
  try {
    res.json({ message: "Code verified successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/reset-password", async (req, res) => {
  try {
    const { email, newPassword, pin } = req.body;
    const targetPin = pin || newPassword;
    if (!email || !targetPin) {
      return res.status(400).json({ error: "Email and new PIN are required" });
    }

    if (targetPin.length !== 4) {
      return res.status(400).json({ error: "PIN must be exactly 4 digits" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user)
      return res.status(404).json({ error: "User with this email not found" });

    const hashedPin = await hashPassword(targetPin);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        pin: hashedPin,
        resetToken: null,
        resetTokenExpiry: null,
        isVerified: true,
      },
    });

    res.json({ message: "Security PIN reset successfully!" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/signup", async (req, res) => {
  try {
    const { email, password, name, preferredLanguage } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    if (password.length < 4)
      return res.status(400).json({ error: "Password must be at least 4 characters" });

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }

    const hashedPassword = await hashPassword(password);
    const isFourDigitPin = /^\d{4}$/.test(password.trim());
    const hashedPin = isFourDigitPin ? hashedPassword : null;

    const user = await prisma.user.create({
      data: { 
        email: normalizedEmail, 
        password: hashedPassword, 
        pin: hashedPin,
        name: name?.trim() || "User",
        preferredLanguage: preferredLanguage || "English",
        isVerified: true, // Automatically verified upon signup
        signupToken: null,
        signupTokenExpiry: null,
      },
    });

    const token = generateToken(user.id);

    res.status(201).json({
      message: "Account created successfully!",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        preferredLanguage: user.preferredLanguage,
        hasPin: !!user.pin,
      },
    });
  } catch (error: any) {
    if (error.code === "P2002")
      return res.status(400).json({ error: "Email already exists" });
    console.error("Signup Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/set-pin", authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { pin } = req.body;

    if (!pin || pin.length !== 4)
      return res.status(400).json({ error: "PIN must be exactly 4 digits" });

    const hashedPin = await hashPassword(pin); // Reusing password hash for PIN
    await prisma.user.update({
      where: { id: userId },
      data: { pin: hashedPin },
    });

    res.json({ message: "Security PIN set successfully!" });
  } catch (error) {
    console.error("Set PIN Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, pin } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or PIN" });
    }

    // Auto-mark account as verified so legacy unverified accounts are immediately active
    if (!user.isVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true, signupToken: null, signupTokenExpiry: null }
      });
    }

    // If user has NO PIN yet, register the entered PIN as their future PIN or request set-pin
    if (!user.pin) {
      if (pin && pin.length === 4) {
        const hashedPin = await hashPassword(pin);
        user = await prisma.user.update({
          where: { id: user.id },
          data: { pin: hashedPin, isVerified: true }
        });
      } else {
        const token = generateToken(user.id);
        return res.json({
          requiresSetPin: true,
          message: "Please set your 4-digit security PIN",
          user: { 
            id: user.id, 
            email: user.email, 
            name: user.name,
            preferredLanguage: user.preferredLanguage 
          },
          token,
        });
      }
    } else {
      // Validate PIN against pin or password
      const pinMatches = await comparePassword(pin, user.pin);
      const passMatches = user.password ? await comparePassword(pin, user.password) : false;
      if (!pinMatches && !passMatches) {
        return res.status(401).json({ error: "Invalid email or PIN" });
      }
    }

    const token = generateToken(user.id);
    res.json({
      message: "Login successful!",
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        preferredLanguage: user.preferredLanguage 
      },
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
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
    const { name, email, password, pin, preferredLanguage } = req.body;

    const data: any = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (preferredLanguage) (data as any).preferredLanguage = preferredLanguage;
    if (password) {
      if (password.length < 6)
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      data.password = await hashPassword(password);
    }
    if (pin) {
      if (pin.length !== 4)
        return res.status(400).json({ error: "PIN must be exactly 4 digits" });
      data.pin = await hashPassword(pin);
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

// --- ADMIN ROUTES ---

app.get("/api/admin/stats", async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const verifiedUsers = await prisma.user.count({ where: { isVerified: true } });
    const totalNotes = await prisma.note.count();
    const wordCountSum = await prisma.note.aggregate({
      _sum: { wordCount: true },
    });

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
        signupToken: true,
        signupTokenExpiry: true,
        resetToken: true,
        resetTokenExpiry: true,
        createdAt: true,
      },
    });

    const recentNotes = await prisma.note.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        topic: true,
        duration: true,
        createdAt: true,
        user: { select: { email: true, name: true } },
      },
    });

    res.json({
      totalUsers,
      verifiedUsers,
      totalNotes,
      totalWords: wordCountSum._sum.wordCount || 0,
      recentUsers,
      recentNotes,
      systemStatus: "Healthy",
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Failed to fetch admin stats: " + error.message });
  }
});

app.get("/api/admin/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
        preferredLanguage: true,
        signupToken: true,
        signupTokenExpiry: true,
        resetToken: true,
        resetTokenExpiry: true,
        createdAt: true,
        _count: { select: { notes: true } },
      },
    });
    res.json(users);
  } catch (error: any) {
    console.error("Admin users error:", error);
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

app.get("/api/admin/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: { notes: { orderBy: { createdAt: "desc" } } },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch user details." });
  }
});

app.delete("/api/admin/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ message: "User and associated notes deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete user." });
  }
});

app.get("/api/admin/notes", async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    res.json(notes);
  } catch (error: any) {
    console.error("Admin notes error:", error);
    res.status(500).json({ error: "Failed to fetch all notes." });
  }
});

app.get("/api/admin/notes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const note = await prisma.note.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!note) return res.status(404).json({ error: "Note not found" });
    res.json(note);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch note." });
  }
});

app.delete("/api/admin/notes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.note.delete({ where: { id } });
    res.json({ message: "Note deleted successfully by admin" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete note." });
  }
});

// Admin System Settings Endpoints
app.get("/api/admin/settings", async (req, res) => {
  try {
    res.json({
      DATABASE_URL: process.env.DATABASE_URL || "",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
      JWT_SECRET: process.env.JWT_SECRET || "",
      SMTP_USER: process.env.SMTP_USER || "",
      SMTP_PASS: process.env.SMTP_PASS || "",
      SMTP_HOST: process.env.SMTP_HOST || "",
      SMTP_PORT: process.env.SMTP_PORT || "",
      SMTP_SECURE: process.env.SMTP_SECURE || "",
      SMTP_FROM: process.env.SMTP_FROM || "",
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch settings." });
  }
});

app.post("/api/admin/settings", async (req, res) => {
  try {
    const {
      DATABASE_URL,
      GEMINI_API_KEY,
      JWT_SECRET,
      SMTP_USER,
      SMTP_PASS,
      SMTP_HOST,
      SMTP_PORT,
      SMTP_SECURE,
      SMTP_FROM,
    } = req.body;
    if (DATABASE_URL !== undefined) process.env.DATABASE_URL = DATABASE_URL;
    if (GEMINI_API_KEY !== undefined) process.env.GEMINI_API_KEY = GEMINI_API_KEY;
    if (JWT_SECRET !== undefined) process.env.JWT_SECRET = JWT_SECRET;
    if (SMTP_USER !== undefined) process.env.SMTP_USER = SMTP_USER;
    if (SMTP_PASS !== undefined) process.env.SMTP_PASS = SMTP_PASS;
    if (SMTP_HOST !== undefined) process.env.SMTP_HOST = SMTP_HOST;
    if (SMTP_PORT !== undefined) process.env.SMTP_PORT = SMTP_PORT;
    if (SMTP_SECURE !== undefined) process.env.SMTP_SECURE = SMTP_SECURE;
    if (SMTP_FROM !== undefined) process.env.SMTP_FROM = SMTP_FROM;

    res.json({ message: "Environment settings updated successfully in memory!" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update settings." });
  }
});

// Admin Email / SMTP Tester Endpoint
app.post("/api/admin/test-email", async (req, res) => {
  try {
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();

    if (!user || !pass) {
      return res.status(400).json({
        error: "SMTP credentials are missing. Please ensure SMTP_USER and SMTP_PASS are configured in your environment.",
        success: false,
      });
    }

    const { recipientEmail, testRecipient, to } = req.body || {};
    const targetEmail = recipientEmail || testRecipient || to || user;

    const transporter = getTransporter();

    // Verify SMTP connection
    await transporter.verify();

    // Send test email
    const sender = process.env.SMTP_FROM?.trim() || `"AudioNote System" <${user}>`;
    const info = await transporter.sendMail({
      from: sender,
      to: targetEmail,
      subject: "AudioNote SMTP Test Email ✅",
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 520px; padding: 32px; border-radius: 16px; background-color: #ffffff; border: 1px solid #e2e8f0; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #EEF2FF; color: #6366F1; font-size: 28px; width: 60px; height: 60px; line-height: 60px; border-radius: 50%;">✨</div>
            <h2 style="color: #1E293B; margin: 16px 0 6px; font-size: 22px; font-weight: 700;">SMTP Connected Successfully!</h2>
            <p style="color: #64748B; font-size: 14px; margin: 0;">AudioNote Email Transporter is Active</p>
          </div>
          <p style="color: #334155; line-height: 1.6; font-size: 15px;">Your SMTP configuration is working perfectly. Your server can now deliver user verification OTPs, password reset emails, and notifications.</p>
          <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 14px 18px; border-radius: 10px; font-size: 13px; color: #475569; margin: 20px 0; line-height: 1.8;">
            <div><strong>Sender:</strong> ${user}</div>
            <div><strong>Recipient:</strong> ${targetEmail}</div>
            <div><strong>Timestamp:</strong> ${new Date().toISOString()}</div>
          </div>
          <p style="color: #94A3B8; font-size: 12px; text-align: center; margin-top: 24px; border-top: 1px solid #F1F5F9; padding-top: 16px;">
            AudioNote Admin System • Live Verification
          </p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: `Test email sent successfully to ${targetEmail}!`,
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error("SMTP Test Error:", error);
    let errorMessage = error.message || "Failed to send test email";
    if (
      error.code === "EAUTH" ||
      errorMessage.includes("535-5.7.8") ||
      errorMessage.includes("Username and Password not accepted")
    ) {
      errorMessage =
        "SMTP Authentication failed (EAUTH). If using Gmail, make sure you generated a 16-character Google 'App Password' (not regular password) and enabled 2-Step Verification on the Google Account.";
    } else if (error.code === "ETIMEDOUT" || error.code === "ESOCKET") {
      errorMessage =
        `SMTP Connection failed (${error.code}). Check your network connection or SMTP host/port.`;
    }
    res.status(500).json({
      success: false,
      error: errorMessage,
      code: error.code,
      details: error.message,
    });
  }
});

const HOST = "0.0.0.0";

app.listen(port, HOST, () => {
  console.log(`🚀 Audio-to-Note Server is running on:`);
  console.log(`   - Local:    http://localhost:${port}`);
  console.log(`   - Network:  http://10.40.36.154:${port}`);
});
