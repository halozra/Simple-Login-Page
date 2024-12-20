import express from "express"
import bodyParser from "body-parser"
import pool from "./db.js"
import bcrypt from "bcrypt"
import cookieParser from "cookie-parser"

const app = express()
const PEPPER = "iloveu3000years"

app.set("views engine", "ejs")
app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:false}))
app.use(cookieParser())



//  GET ROUTE
app.get("/", (req,res)=>{

    if(req.cookies.userEmail){
        res.redirect("/secret")
    }else{
        res.render("index.ejs")
    }
})

app.get("/login", (req, res)=>{
    res.render("login.ejs")
})

app.get("/regis", (req, res)=>{
    res.render("regis.ejs")
})

app.get("/secret", async (req, res) => {
    try {
        if (req.cookies.userEmail) {
            // Ambil data dari database berdasarkan email
            const result = await pool.query("SELECT * FROM users WHERE email=$1", [req.cookies.userEmail]);

            // Jika data ditemukan
            if (result.rows.length > 0) {
                res.render("secret.ejs", { data: result.rows[0]});
            } else {
                // Jika tidak ada data yang cocok di database
                res.clearCookie("userEmail"); // Hapus cookie
                res.redirect("/login"); // Redirect ke login
            }
        } else {
            // Jika cookie tidak ditemukan
            res.redirect("/login");
        }
    } catch (error) {
        console.error("Error saat mengambil data secret:", error.message);
        res.status(500).send("Ada kesalahan pada server.");
    }
});


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
            res.cookie("userEmail",email,{
                maxAge: 3600000,
                httpOnly:true,
                secure:false,
                sameSite: "lax"
            })
            res.redirect("/secret")
        }else{
            res.status(401).send("password salah")
        }
    } catch (error) {
        console.error("error saat login",error.message)
        res.status(500).json("Ada kesalahan di server")
    }


})

app.post("/secret/logout", (req,res)=>{
    res.clearCookie("userEmail")
    res.redirect("/login")

})

app.post("/secret/post", async(req,res)=>{
    try {
        const {secret} = req.body
        await pool.query("UPDATE users SET secret=$1 WHERE email=$2",[secret,req.cookies.userEmail])
        res.redirect("/secret")
    } catch (error) {
        req.status(500).json("failder add secret")
    }

})

app.get("/secret/edit", async (req, res) => {
    try {
        const data = await pool.query("SELECT * FROM users WHERE email=$1", [req.cookies.userEmail]);
        res.render("edit.ejs", { data: data.rows[0]});
    } catch (error) {
        console.error("Error saat masuk mode edit:", error.message);
        res.status(500).send("Terjadi kesalahan pada server.");
    }
});

app.post("/secret/update", async (req, res) => {
    try {
        const { secret } = req.body;
        await pool.query("UPDATE users SET secret=$1 WHERE email=$2", [secret, req.cookies.userEmail]);
        res.redirect("/secret");
    } catch (error) {
        console.error("Error saat memperbarui secret:", error.message);
        res.status(500).send("Terjadi kesalahan pada server.");
    }
});


const port = 3000;
app.listen(port ,()=>{
    console.log(`Server runnign at port ${port}`)
})