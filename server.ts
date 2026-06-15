import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { requireAuth, AuthRequest } from './middleware/auth.ts';
import { getOrCreateUser, getUserProfile } from './src/db/users.ts';
import { db } from './src/db/index.ts';
import { tasks } from './src/db/schema.ts';
import { eq, desc } from 'drizzle-orm';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Chat Route
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { prompt, systemInstruction, context } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const genAI = new GoogleGenAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash", 
        systemInstruction: systemInstruction 
      });

      const fullPrompt = context ? `Context: ${context}\n\nHuman: ${prompt}` : prompt;
      
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      res.json({ text });
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });

  // API endpoints
  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, subject, html } = req.body;
      
      if (!process.env.RESEND_API_KEY) {
        // If no API key is provided, log mock sending
        console.log("Mock Email Sent:");
        console.log("To:", to);
        console.log("Subject:", subject);
        console.log("Body:", html);
        return res.json({ success: true, mock: true, message: "Email simulated successfully (add RESEND_API_KEY to send real emails)" });
      }

      const data = await resend.emails.send({
        from: 'Acme <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: html,
      });

      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: "Failed to send email" });
    }
  });

  // User Profile Synchronization & Lookup Endpoint
  app.post("/api/users/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const decodedUser = req.user;
      if (!decodedUser) {
        return res.status(401).json({ error: "Invalid auth" });
      }

      const { name, avatar, phoneNumber, role } = req.body;
      const email = decodedUser.email || "";
      const uid = decodedUser.uid;

      const user = await getOrCreateUser({
        uid,
        name: name || decodedUser.name || email.split("@")[0] || "User",
        email,
        avatar: avatar || decodedUser.picture || undefined,
        phoneNumber,
        role,
      });

      res.status(200).json({ success: true, user });
    } catch (error) {
      console.error("User Sync Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to sync user profile";
      res.status(500).json({ error: errorMessage });
    }
  });

  app.get("/api/users/me", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const user = await getUserProfile(req.user.uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(200).json({ success: true, user });
    } catch (error) {
      console.error("Get Profile Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch user profile";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Cloud SQL Tasks APIs
  app.get("/api/tasks", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const userTasks = await db.select()
        .from(tasks)
        .where(eq(tasks.ownerId, req.user.uid))
        .orderBy(desc(tasks.updatedAt));
      res.status(200).json(userTasks);
    } catch (error) {
      console.error("Get Tasks Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch tasks";
      res.status(500).json({ error: errorMessage });
    }
  });

  app.post("/api/tasks", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const { id, title, description, completed, status, priority, recurring, dueDate, taskListId, order } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }

      let result;
      if (id) {
        // Update task
        result = await db.update(tasks)
          .set({
            title,
            description,
            completed: completed ?? false,
            status: status || 'Cần làm',
            priority: priority || 'Trung bình',
            recurring: recurring || 'none',
            dueDate,
            taskListId,
            order: order || 0,
            updatedAt: new Date(),
          })
          .where(eq(tasks.id, Number(id)))
          .returning();
      } else {
        // Create task
        result = await db.insert(tasks)
          .values({
            title,
            description,
            completed: completed ?? false,
            status: status || 'Cần làm',
            priority: priority || 'Trung bình',
            recurring: recurring || 'none',
            dueDate,
            taskListId,
            order: order || 0,
            ownerId: req.user.uid,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
      }

      res.status(200).json(result[0]);
    } catch (error) {
      console.error("Save Task Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save task";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
