import express from "express"
import bodyParser from "body-parser"
import pool from "./db.js"
import bcrypt from "bcrypt"

const app = express()
const PEPPER = "iloveu3000years"

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

        // Check email from database
        const selectEmail = await pool.query("SELECT * FROM users WHERE email=$1",[email])
        if (selectEmail.rows.length > 0){
            console.log("Email used")
            return res.status(400).send("email sudah digunakan")
        }

        // hash pass input user
        const passPepper = password+ PEPPER
        const saltRound = 10 ;
        const hashPass = await bcrypt.hash(passPepper,saltRound)

        // post email and pass to database
        await pool.query("INSERT INTO users(email,password) VALUES($1,$2)",[email,hashPass])
        console.log("Berhasil regis")
        res.redirect("/")

    } catch (error) {
        console.error("Error saat regis", error.message)
        res.status(500).json("Terjadi kesalahan pada server")
    }


})

app.post("/login", async (req, res)=>{
    try {
        const {email,password} = req.body

        // check email dari database
        const data = await pool.query("SELECT * FROM users WHERE email=$1",[email])
        if (data.rows.length === 0){
            return res.status(404).json("email tidak ditemukan")
        }
        // mengambil pass dari database
        const dataSu = data.rows[0]
        const pass = dataSu.password

        // hash password input
        const passWithPepper = password + PEPPER

        //bandikan password input dengan di database
        const isMatch = await bcrypt.compare(passWithPepper,pass)

        // check validation
        if(isMatch){
            res.status(200).json("Berhasil login")
        }else{
            res.status(401).send("password salah")
        }
    } catch (error) {
        console.error("error saat login",error.message)
        res.status(500).json("Ada kesalahan di server")
    }


})

const port = 3000;
app.listen(port ,()=>{
    console.log(`Server runnign at port ${port}`)
})