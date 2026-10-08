import { emitKeypressEvents } from "node:readline"
import { stdin, stdout } from "node:process"
import bcrypt from "bcrypt"

import pool from "../config/db.js"

const email = String(process.argv[2] || "").trim().toLowerCase()
const lockName = "garageflow-create-super-admin"

function readSecret(prompt) {
  if (!stdin.isTTY) {
    throw new Error("Run this command in an interactive terminal to enter a password.")
  }

  emitKeypressEvents(stdin)
  stdin.setRawMode(true)
  stdin.resume()
  stdout.write(prompt)

  return new Promise((resolve, reject) => {
    let value = ""

    const finish = (error) => {
      stdin.off("keypress", onKeypress)
      stdin.setRawMode(false)
      stdout.write("\n")
      if (error) reject(error)
      else resolve(value)
    }

    const onKeypress = (character, key = {}) => {
      if (key.ctrl && key.name === "c") {
        finish(new Error("Password entry cancelled."))
      } else if (key.name === "return" || key.name === "enter") {
        finish()
      } else if (key.name === "backspace") {
        if (value.length) {
          value = value.slice(0, -1)
          stdout.write("\b \b")
        }
      } else if (character && !key.ctrl && !key.meta) {
        value += character
        stdout.write("*")
      }
    }

    stdin.on("keypress", onKeypress)
  })
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Usage: npm run create:admin -- <email>")
  process.exitCode = 1
} else {
  let connection
  let lockAcquired = false
  let exitCode = 0

  try {
    const password = await readSecret("Admin password (minimum 10 characters): ")
    const confirmation = await readSecret("Confirm password: ")

    if (password.length < 10) {
      throw new Error("Admin password must be at least 10 characters.")
    }

    if (password !== confirmation) {
      throw new Error("Passwords do not match.")
    }

    const passwordHash = await bcrypt.hash(password, 12)
    connection = await pool.getConnection()

    const [lockRows] = await connection.query("SELECT GET_LOCK(?, 10) AS acquired", [lockName])
    lockAcquired = lockRows[0]?.acquired === 1
    if (!lockAcquired) {
      throw new Error("Could not acquire the admin setup lock. Try again.")
    }

    const [admins] = await connection.query("SELECT id FROM admins LIMIT 1")
    if (admins.length) {
      throw new Error("An admin account already exists. This setup command can only be used once.")
    }

    await connection.query(
      `INSERT INTO admins (email, password_hash, role)
       VALUES (?, ?, 'super_admin')`,
      [email, passwordHash]
    )

    console.log(`Super admin created: ${email}`)
  } catch (error) {
    console.error("Failed to create super admin:", error.message)
    exitCode = 1
  } finally {
    if (connection) {
      if (lockAcquired) {
        try {
          await connection.query("SELECT RELEASE_LOCK(?)", [lockName])
        } catch (error) {
          console.error("Failed to release the admin setup lock:", error.message)
          exitCode = 1
        }
      }
      connection.release()
    }

    await pool.end()
  }

  process.exitCode = exitCode
}
