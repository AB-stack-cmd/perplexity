import express from "express"
import "dotenv/config"
import { tavily } from "@tavily/core"
import { streamText  ,  Output} from 'ai';
import cors from "cors"
import { PROMPT_TEMPLATE , SYSTEM_PROMT} from "./prompts.ts";
import * as z from "zod";
import prisma from "./db.ts"
import Validation from "./middleware.ts";


const app = express()
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000", // frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

const port = process.env.PORT 


const client = tavily({ apiKey:process.env.TAVILY_API_KEY });
if(!client){
  console.error(`Error : ${client}`)  
}

app.get("/conversation", Validation, async (req, res) => {
  try {

    console.log("2 userId:", req.userId);

    return res.json({
      success: true,
      userId : req.userId
    });

  } catch (e) {
    console.error("FULL ERROR:", e);

    return res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
});

app.post('/preplexity_ask',Validation,async (req, res) => {

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

  const Prompt = PROMPT_TEMPLATE
                .replace("{{WEB_SEARCH_RESULTS}}",JSON.stringify(webResult))
                .replace("{{USER_QUERY}}",JSON.stringify(query));

  // Get response in with output format according to schema
  const { textStream } = streamText({
      model: "google/gemini-2.5-flash",
      prompt: Prompt,
      system: SYSTEM_PROMT,
      output:Output.object({
        schema:z.object({
          followUps:z.array(z.string()),
          answer:z.string()
        })
      })
    });

    res.header("Cache-Control","no-cache");
    res.header("Control-Type","text/event-stream");

    for await (const textPart of textStream) {
      process.stdout.write(textPart);
      res.write(textPart);
    }

    const context = webSearch.results.map(r => r.content).join("\n\n");// result content form the web search 

    res.write("\n<SOURCE>\n")
    // Send resourch url
    res.write(JSON.stringify(webResult.map(result => { url : result.url})))

    
    res.end()

  } catch (error) {
    console.error(error);
     res.status(500).json({ error: "Internal Server Error" });
  }

})




app.listen(port, () => {
  console.log(`listening on port ${port}...`)
})
