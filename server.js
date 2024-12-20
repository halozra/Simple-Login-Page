import express from "express"
import bodyParser from "body-parser"
import pool from "./db.js"

const app = express()

app.set("views engine", "ejs")
app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:false}))


//  GET ROUTE
app.get("/", (req,res)=>{
    res.render("index.ejs")
})

app.get("/login", (req, res)=>{
    res.render("login.ejs")
})

app.get("/regis", (req, res)=>{
    res.render("regis.ejs")
})

// POST

app.post("/regis", async (req, res)=>{
    try {
        const {email,password} = req.body
        console.log(email,password)
        await pool.query("INSERT INTO users(email,password) VALUES($1,$2)",[email,password])
        console.log("Berhasil regis")
        res.redirect("/")
    } catch (error) {
        console.log(error)
    }


})

app.post("/login", async (req, res)=>{
    try {
        const {email,password} = req.body
        console.log(email,password)
        const data = await pool.query("SELECT * FROM users WHERE email=$1",[email])
        if (data.rows.length===0){
            return res.status(404).json("email tidak ditemukan")
        }
        const dataSu = data.rows[0]
        const pass = dataSu.password
        if(pass=== password){
            res.status(200).json("Berhasil login")
        }else{
            res.send("password wrong")
        }
    } catch (error) {
        console.log(error)
    }


})

const port = 3000;
app.listen(port ,()=>{
    console.log(`Server runnign at port ${port}`)
})