import express from "express"
import "dotenv/config"
import { tavily } from "@tavily/core"
import { streamText } from 'ai';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express()
app.use(express.json());
const port = process.env.PORT || 3000
console.log(port)

const client = tavily({ apiKey:process.env.TAVILY_API_KEY });
if(!client){
  console.error(`Error : ${client}`)
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

app.post('/preplexity_ask',async (req, res) => {
  const { query } = req.body;
  if(!query){
    return res.status(400).json({
      error:"empty query"
    })
  }

  try {
    // Response from Tavily
    const searchResponse = await client.search(query , {
      searchDepth:"advanced"
    });

    const context = searchResponse.results.map(r => r.content).join("\n\n");
    const prompt = `You are a helpful assistant. Use the following search results to answer the user query: ${query}\n\nSearch Results:\n${context}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      answer: text,
      sources: searchResponse.results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
