import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { exec, spawn, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import axios from "axios";
import { Server } from "socket.io";
import http from "http";
import connectDB from "./lib/db.js";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import snapshotRoutes from "./routes/codeSnapshotRoutes.js";
import { saveMessage } from "./controllers/messageController.js";

import { updateSnapshot } from "./controllers/codeSnapshotController.js";

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

const TEMP_DIR = "./temp";
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

const isWindows = os.platform() === "win32";

const runners = {
  javascript: { ext: "js", cmd: () => "node", args: (file) => [`"${file}"`] },
  python: { ext: "py", cmd: () => "python", args: (file) => [`"${file}"`] },
  cpp: {
    ext: "cpp",
    compile: (file) => ["g++", `"${file}"`, "-o", `"${file}.exe"`],
    cmd: (file) => `"${file}.exe"`,
    args: () => []
  },
  c: {
    ext: "c",
    compile: (file) => ["gcc", `"${file}"`, "-o", `"${file}.exe"`],
    cmd: (file) => `"${file}.exe"`,
    args: () => []
  },
  java: {
    ext: "java",
    compile: (file) => ["javac", `"${file}"`],
    cmd: () => "java",
    args: (file) => ["-cp", TEMP_DIR, "Main"]
  },
};

// ------------------- Code Execution Route -------------------

// Helper to run spawn logic
const executeSpawn = (command, args, inputStr) => {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let timer;
    const startTime = Date.now();

    try {
      const child = spawn(command, args, { shell: true });

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        const executionTime = Date.now() - startTime;

        if (code === 0) {
          resolve({
            status: "SUCCESS",
            output: stdout.trim() || stderr.trim() || "Execution finished (no output)",
            time: executionTime
          });
        } else {
          resolve({
            status: "RUNTIME_ERROR",
            output: stderr.trim() || stdout.trim() || "Process exited with error",
            time: executionTime
          });
        }
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        resolve({ status: "SYSTEM_ERROR", output: err.message, time: Date.now() - startTime });
      });

      timer = setTimeout(() => {
        child.kill('SIGKILL');
        resolve({ status: "TIME_LIMIT_EXCEEDED", output: "Execution timed out (5s).", time: 5000 });
      }, 5000);

      child.stdin.on("error", (err) => {
        console.error("stdin error:", err);
      });

      if (inputStr) {
        child.stdin.write(inputStr);
      }
      child.stdin.end();

    } catch (err) {
      resolve({ status: "SYSTEM_ERROR", output: err.message, time: Date.now() - startTime });
    }
  });
};

// ------------------- Code Execution Route -------------------
app.post("/api/run", async (req, res) => {
  const { language, code, input } = req.body;

  if (!runners[language]) return res.status(400).json({ status: "ERROR", output: "Unsupported language" });

  const runner = runners[language];
  const filename = language === "java" ? "Main.java" : `code_${Date.now()}.${runner.ext}`;
  const filePath = path.join(TEMP_DIR, filename);
  fs.writeFileSync(filePath, code);

  try {
    if (runner.compile) {
      const compileArgs = runner.compile(filePath);
      const compileResult = spawnSync(compileArgs[0], compileArgs.slice(1), { shell: true, timeout: 5000 });

      if (compileResult.status !== 0) {
        const errorMsg = compileResult.stderr?.toString() || compileResult.stdout?.toString() || "Compilation failed";
        return res.json({
          status: "COMPILE_ERROR",
          output: errorMsg.trim()
        });
      }
    }

    const execResult = await executeSpawn(runner.cmd(filePath), runner.args(filePath), input);
    res.json(execResult);

  } catch (err) {
    res.json({ status: "SYSTEM_ERROR", output: err.message });
  } finally {
    // Optional: Clean up temp files here if needed, but keeping for now for debugging
  }
});

// ------------------- AI Assistant Route -------------------
app.post("/api/ai", async (req, res) => {
  const { prompt } = req.body;

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: "OpenRouter API key not set in .env" });
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    // Correct field for OpenRouter
    const reply = response.data?.choices?.[0]?.message?.content;
    // console.log("AI reply:", reply);

    res.json({ reply: reply || "No reply from AI" });
  } catch (error) {
    console.error("AI request failed:", error.response?.data || error.message);
    res.status(500).json({ error: "AI request failed" });
  }
});

// ------------------- API Routes -------------------
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/snapshots", snapshotRoutes);

// ------------------- Socket.io Real-time -------------------
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on("code-change", async ({ roomId, code, language, userId }) => {
    // Only emit to others in the room
    socket.to(roomId).emit("code-update", { code, language });

    // Persist code snapshot
    try {
      if (roomId && userId) {
        await updateSnapshot(roomId, code, language, userId);
      }
    } catch (err) {
      console.error("Failed to persist code snapshot:", err.message);
    }
  });

  socket.on("send-message", async ({ roomId, userId, content }) => {
    try {
      // Save message to database
      const savedMsg = await saveMessage(roomId, userId, content);

      // Emit the saved message (which includes populated user info) to everyone in the room
      io.to(roomId).emit("receive-message", savedMsg);
    } catch (err) {
      console.error("Failed to save/send message:", err.message);
    }
  });

  socket.on("draw", ({ roomId, x, y, lastX, lastY, color, tool }) => {
    socket.to(roomId).emit("draw-data", { x, y, lastX, lastY, color, tool });
  });

  socket.on("clear-whiteboard", (roomId) => {
    socket.to(roomId).emit("clear-whiteboard");
  });

  socket.on("webrtc-signal", ({ roomId, signal }) => {
    socket.to(roomId).emit("webrtc-signal", { signal });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ------------------- Start Server -------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
