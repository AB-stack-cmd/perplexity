import express from "express"
import "dotenv/config"
import { tavily } from "@tavily/core"
import cors from "cors"
import { GoogleGenerativeAI } from "@google/generative-ai"

const app = express()
const port = process.env.PORT || 3000

// Use CORS to allow requests from the frontend
app.use(cors())
app.use(express.json())

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

app.get('/', (req, res) => {
  res.send('Hello World!')
})

// Streaming Endpoint for AI responses
app.get('/api/chat', async (req, res) => {
  const prompt = req.query.prompt as string;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // Set headers for Server-Sent Events (SSE) to enable streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      // Send chunk as an SSE event
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    res.write(`data: ${JSON.stringify({ error: "AI processing failed" })}\n\n`);
  } finally {
    res.end();
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
