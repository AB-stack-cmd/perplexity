import express from "express"
import "dotenv/config"
import { tavily } from "@tavily/core"
import { streamText } from 'ai';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PROMPT_TEMPLATE } from "./prompts";

const app = express()
app.use(express.json());
const port = process.env.PORT || 3000
console.log(port)

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const client = tavily({ apiKey:process.env.TAVILY_API_KEY });
if(!client){
  console.error(`Error : ${client}`)  
}


app.post('/preplexity_ask',async (req, res) => {

  const { query } =  req.body.query;

  if(!query){
    return res.status(400).json({
      error:"empty query"
    })
  }
  try{
  // web search
   const webSearch = await client.search(query , {
    searchDepth:"advanced"
  });

  const webResult = webSearch.results; // result from trively

  const promt = PROMPT_TEMPLATE
                .replace("{{WEB_SEARCH_RESULTS}}",JSON.stringify(webResult))
                .replace("{{USER_QUERY}}",JSON.stringify(query));
                
  const { textStream } = streamText({
      model: "google/gemini-2.5-flash",
      prompt: query,
      system:""
    });

    for await (const textPart of textStream) {
      process.stdout.write(textPart);
    }

    const context = webSearch.results.map(r => r.content).join("\n\n");// result content form the web search 
    const prompt = `You are a helpful assistant. Use the following search results to answer the user query: ${query}\n\nSearch Results:\n${context}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      answer: text,
      sources: webSearch.results
    });
  } catch (error) {
    console.error(error);
     res.status(500).json({ error: "Internal Server Error" });
  }

})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
