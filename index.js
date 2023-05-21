const express = require("express");
const app = express();

require("dotenv").config();

const PORT = process.env.PORT || 3000;

// middleware
app.use(express.json());

// Db connection
const connectWithDB = require("./config/database");
connectWithDB();

// start database
app.listen(PORT, () => {
    console.log(`App is started at Port no ${PORT}`)
});

// default route

app.get("/", (req,res)=> {
    res.send(`<h1>This is my default route</h1>`)
})