import express from "express"
import "dotenv/config"
import  {tavily} from "@tavily/core"

const app = express()
const port = process.env.PORT || 3000
console.log(port)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
