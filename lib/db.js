// lib/db.js
const postgres = require('postgres')

// Neon URL already has sslmode=require, but adding ssl option is harmless
const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  idle_timeout: 10,
  connect_timeout: 30,
  prepare: false,
  ssl: 'require'
})

module.exports = { sql }
