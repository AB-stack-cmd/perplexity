import express from "express"
import "dotenv/config"
import { tavily } from "@tavily/core"
import { error } from "console"

const app = express()
const port = process.env.PORT || 3000
console.log(port)

const client = tavily({ apiKey:process.env.TAVILY_API_KEY });
if(!client){
  console.error(`Error : ${client}`)  
}
app.post('/preplexity_ask',async (req, res) => {

  const { query } =  req.body.query;
  if(!query){
    res.json({
      error:"empty query",
      reqest:400
    })
  }

  // Response from trively
  const response = await client.search(query , {
    searchDepth:"advanced"
  });

})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
