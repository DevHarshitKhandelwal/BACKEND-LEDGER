const mongoose = require("mongoose")



function connectToDb(){
    mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("server is CONNECTED to DB")
    })
    .catch(err=>{
        console.log("Error connectiong to DB")
        process.exit(1)
    })
}

module.exports=connectToDb