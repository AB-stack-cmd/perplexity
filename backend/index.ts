import express from "express"
import "dotenv/config"
import { tavily } from "@tavily/core"
import { streamText  ,  Output} from 'ai';
import cors from "cors"
import { PROMPT_TEMPLATE , SYSTEM_PROMT} from "./prompts.ts";
import * as z from "zod";
import prisma from "./db.ts"
import Validation from "./middleware.ts";
import  slugify  from "slugify";

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

app.post("/conversation/:conversation" , async(req,res)=>{
  try{
    const conversationId = req.params.conversation;
    if(!conversationId){
      res.status(400).json({
        messsage : "Invalid Id"
      })
    };

    const conversation =  await prisma.conversation.findFirst({
      where:{
        id:conversationId,
        su:req.userId
      },
      include:{
        messages:{orderBy:{createdAt:"asc"}}
      }
    });
        

    res.json({conversation})
    if(!conversation){
      res.status(404).json({message : "Conversation not found"});
      return;
    }

  }catch(error){
    console.error("conversation schema error")

  }
})

app.post('/purplexity_ask',Validation,async (req, res) => {

  const { query } =  req.body.query;

  if(!query){
    return res.status(400).json({
      error:"empty query"
    })
  };

     if (!req.userId) {
          return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
    };

  try{
    const dbUser = await prisma.user.findFirst({
      where: {
         supabaseId: req.userId,
        },
        });

    if (!dbUser) {
        return res.status(404).json({
            error: "User not found",
      });
      }
  // web search
   const webSearch = await client.search(query , {
    searchDepth:"advanced"
  });

  const webResult = webSearch.results; // result from trively
  
  const conversation = await prisma.conversation.create({
    data:{
      title:query.slice(0,80),
      slug: slugify(query, {
       lower: true,
       strict: true,
        }),
      userId:req.userId,
      messages:{
        create :{content:query , role:"User"}
      }
    }
  })

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

    let assistanceText =""
    for await (const textPart of textStream) {
      assistanceText+=textPart
      process.stdout.write(textPart);
      res.write(textPart);
    }

    const context = webSearch.results.map(r => r.content).join("\n\n");// result content form the web search 
    // source url
    const SOURCE = JSON.stringify(webResult.map(result => { url : result.url}));

    res.write("\n<SOURCE>\n")
    // Send resourch url
    res.write(JSON.stringify(webResult.map(result => { url : result.url})))

    
    res.end()

    await prisma.message.create({
      data:{
        content : assistanceText + SOURCE,
        role:"Assistant",
        conversationId : conversation.id,
      }
    })

  } catch (error) {
    console.error(error);
     res.status(500).json({ error: "Internal Server Error" });
  }

})

app.post("/purplexity/follow_up",Validation,async(req,res)=>{
  try {
    // Validate request
    const schema = z.object({
      conversationId: z.string(),

      query: z.string().min(1),
    });

    const parsed = schema.parse(req.body);

    const { conversationId, query } = parsed;

    // Auth check
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Find conversation
    const conversation =
      await prisma.conversation.findFirst({
        where: {
          id: conversationId,

          userId: req.userId,
        },

        include: {
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Save user message
    await prisma.message.create({
      data: {
        content: query,
        role: "User",
        conversationId,
      },
    });

    // Tavily search
    const search = await client.search(
      query,
      {
        searchDepth: "advanced",
      }
    );

    const webResults = search.results;

    // Build history
    const history = conversation.messages
      .map(
        (m) =>
          `${m.role}: ${m.content}`
      )
      .join("\n");

    // Final prompt
    const finalPrompt = `
        Conversation History:
        ${history}

        Web Results:
        ${JSON.stringify(webResults)}

        User Follow-up:
        ${query}
        `;

    // Stream AI response
    const { textStream } = streamText({
      model: "google/gemini-2.5-flash",

      system:
        "You are a helpful AI assistant.",

      prompt: finalPrompt,
    });

    res.setHeader(
      "Content-Type",
      "text/event-stream"
    );

    res.setHeader(
      "Cache-Control",
      "no-cache"
    );

    let finalAnswer = "";

    for await (const chunk of textStream) {
      finalAnswer += chunk;

      res.write(chunk);
    }

    // Save assistant message
    await prisma.message.create({
      data: {
        content: finalAnswer,
        role: "Assistant",
        conversationId,
      },
    });

    // Send sources
    res.write("\n<SOURCES>\n");

    res.write(
      JSON.stringify(
        webResults.map((r) => ({
          title: r.title,
          url: r.url,
        }))
      )
    );

    res.end();

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});





app.listen(port, () => {
  console.log(`listening on port ${port}...`)
})
