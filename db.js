import pkg from "pg"

const {Pool} = pkg;

const pool = new Pool({
    user: 'postgres',
    host : 'localhost',
    database:"nama_database",
    password:"password_kamu",
    port:5432
})

export default pool