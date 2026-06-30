require("dotenv").config()
const app = require("./src/app.js");
const connectToDb=require("./src/config/db.js")

connectToDb();


const PORT = 3000;
app.listen(PORT,()=>{
    console.log(`server is running on PORT: ${3000}`)
})
