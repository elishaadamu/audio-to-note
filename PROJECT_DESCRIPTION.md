# 🎙️ AudioNote AI — Intelligent Audio-to-Note Study Suite

> **An enterprise-grade, full-stack multimodal AI platform that captures live lectures, meetings, and audio files—instantly transforming them into structured study notes, verbatim timestamped transcripts, interactive quizzes, and multilingual translations.**

---

## 🌟 Executive Summary

**AudioNote AI** is an end-to-end academic companion designed to eliminate manual note-taking. Powered by **Google's Gemini 2.5 Flash** multimodal engine and an **Express.js** backend, the platform processes raw spoken audio directly through cloud streaming pipelines.

Within seconds, spoken audio is synthesized into:
1. **Intelligent Categorization & Title Extraction** (Topic hierarchy and key concept identification).
2. **Structured Academic Summaries** (Formatted in rich GitHub-flavored Markdown with bold key terms and bulleted takeaways).
3. **Verbatim Timestamped Transcripts** (Word-for-word spoken transcription with granular `[MM:SS]` markers every 10 seconds).
4. **Interactive Multi-Choice Quizzes** (AI-generated 10-question assessments with instant scoring and celebration effects).
5. **Real-time Multilingual Translations** (Instant bidirectional translation across 9 global and regional languages).

---

## 🏗️ System Architecture Overview

```
 ┌────────────────────────────────────────────────────────┐
 │            Mobile & Web Client (Expo / React Native)   │
 │   • Audio Recording & Metering (expo-av / expo-audio)  │
 │   • Waveform Visualizer & Reanimated UI                │
 │   • Native Markdown Renderer & Quiz Simulator          │
 └─────────────────────────┬──────────────────────────────┘
                           │ HTTPS / JSON / Multipart
                           ▼
 ┌────────────────────────────────────────────────────────┐
 │           Backend API Server (Express.js + TypeScript) │
 │   • JWT Authentication & Fast-Access 4-Digit PIN       │
 │   • File Upload Pipeline (Multer / IPv4 Streams)       │
 │   • Google Gemini 2.5 Flash Multimodal Pipeline        │
 │   • Prisma ORM v6 + PostgreSQL DB Connection Pool      │
 └─────────────┬────────────────────────────┬─────────────┘
               │                            │
               ▼                            ▼
 ┌──────────────────────────┐   ┌─────────────────────────┐
 │   Admin Management Suite │   │  Cloud Infrastructure   │
 │   • Real-Time Analytics  │   │  • Render Web Services  │
 │   • User & Note Control  │   │  • PostgreSQL DB Engine │
 │   • Live SMTP Tester     │   │  • EAS Cloud Build (APK)│
 └──────────────────────────┘   └─────────────────────────┘
```

---

## 📱 Mobile & Web Application (Frontend)

Built with **Expo (SDK 54)** and **React Native**, the client offers a native experience across Android, iOS, and Web.

### Key Features & User Experience
* **Hardware-Accelerated Audio Engine**:
  - Leverages `expo-av` and `expo-audio` with real-time decibel polling throttled at 250ms to render dynamic waveform animations.
  - Automatically isolates temporary recordings into `FileSystem.documentDirectory` to eliminate memory crashes and sandbox cache purges.
* **Frictionless 4-Digit PIN Security**:
  - Streamlined authentication requiring only an email and a 4-digit PIN.
  - Automatic account verification upon registration with zero email OTP blockers.
  - Biometric-ready PIN-only quick unlock for returning users.
* **Interactive Markdown Study View**:
  - Live native rendering via `react-native-markdown-display` supporting code blocks, mathematical structures, tables, and highlighted takeaways.
* **Gamified Quiz Arena**:
  - Native multiple-choice quiz engine with instant score calculations, answer explanations, and haptic feedback with confetti cannons (`react-native-confetti-cannon`).
* **Multilingual Translation Hub**:
  - Translate any note into **9 languages** (*English, Spanish, French, German, Yoruba, Igbo, Hausa, Swahili, Arabic*) with a single tap, preserving structural layout and timestamps.
  - One-tap "Reset to Original" to restore baseline English transcripts.
* **Design & Aesthetics**:
  - Dark mode glassmorphic UI styled with **NativeWind (Tailwind CSS)**, custom HSL color tokens, and fluid layout animations powered by **React Native Reanimated**.

---

## ⚡ Express.js Backend Server

The backend is built as a high-performance **Express.js** REST API in strict **TypeScript**, architected for throughput, low-latency audio transmission, and reliable database operations.

### Key Modules & Capabilities
* **Multimodal Gemini 2.5 Flash Integration**:
  - Directly streams audio files through `@google/generative-ai/server` (`GoogleAIFileManager`), bypassing local CPU bottlenecks.
  - Prompt-engineered output schemas strictly segment output payloads into `TITLE:`, `TOPIC:`, `SUMMARY:`, `TRANSCRIPT:`, and `QUIZ:` blocks for automated parsing.
* **Prisma ORM & PostgreSQL Database**:
  - Backed by **Prisma v6** and PostgreSQL with connection pooling via `@prisma/adapter-pg` and `pg.Pool`.
  - Full relational integrity linking users to notes, word counts, original audio references, and localized translations.
* **Bulletproof Authentication & Security**:
  - Industry-standard **JWT tokenization** and salted password/PIN hashing via **bcryptjs**.
  - Flexible authentication middleware protecting all note creation, deletion, and translation endpoints.
* **Robust SMTP Communication**:
  - Lazy-loaded **Nodemailer** transporter with forced IPv4 resolution (`family: 4`) and strict socket timeouts to prevent cloud networking hangs.

---

## 📊 Centralized Admin Dashboard

A dedicated management portal built for administrative control, observability, and real-time system diagnostics.

### Capabilities:
* **System Telemetry & Metrics**:
  - Live metrics tracking total users, verified statuses, total lecture notes generated, and aggregate word count processed.
* **User & Content Management**:
  - View, inspect, search, and delete registered user accounts and associated lecture notes.
* **Live System Settings & In-Memory Config**:
  - Inspect and hot-update runtime variables (`DATABASE_URL`, `GEMINI_API_KEY`, `JWT_SECRET`, `SMTP_*`).
* **Interactive SMTP Diagnostic Tool**:
  - Send live verification handshake test emails with real-time error code parsing (`EAUTH`, `ETIMEDOUT`, `ESOCKET`) directly from the browser.

---

## 🗄️ Database Schema

```prisma
model User {
  id                String    @id @default(uuid())
  email             String    @unique
  password          String
  pin               String?
  name              String?
  preferredLanguage String    @default("English")
  isVerified        Boolean   @default(true)
  signupToken       String?
  signupTokenExpiry DateTime?
  resetToken        String?
  resetTokenExpiry  DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  notes             Note[]
}

model Note {
  id                 String   @id @default(uuid())
  title              String
  topic              String
  duration           String
  wordCount          Int
  summary            String
  transcript         String
  originalSummary    String?
  originalTranscript String?
  originalQuiz       String?
  quiz               String?
  audioUrl           String?
  status             String   @default("processed")
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  userId             String
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 🛠️ Complete Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Mobile & Web App** | React Native, Expo (SDK 54), Expo Router, TypeScript, NativeWind, React Native Reanimated, Expo AV |
| **Backend API** | Node.js, Express.js, TypeScript, Multer, Nodemailer, BcryptJS, JSON Web Tokens (JWT) |
| **AI & Multimodal Engine** | Google Gemini 2.5 Flash (`@google/generative-ai`), Google AI File Manager |
| **Database & ORM** | PostgreSQL, Prisma ORM v6, `@prisma/adapter-pg`, Connection Pooling |
| **Admin Dashboard** | Next.js (App Router), React, Tailwind CSS, Lucide Icons, React-Toastify |
| **DevOps & Build** | Render Cloud Deployment, EAS Build (Android Standalone `.apk`), Metro Bundler |

---

## 📦 Android Build & Distribution

The application includes an **EAS Build** configuration (`eas.json`) optimized for standalone Android `.apk` generation:

```bash
# Build standalone release APK in the cloud
npm run build:apk
# or
npx eas-cli build -p android --profile preview
```

---

## 🔒 Security & Performance Engineering
* **Fast Failover**: Strict timeouts across all AI calls and SMTP handshakes to eliminate UI freezing.
* **Declarative Routing**: Zero navigation race conditions via Expo Router declarative entry points.
* **Storage Isolation**: Encrypted token and key-value persistence via `expo-secure-store` on native platforms and `localStorage` on web.
