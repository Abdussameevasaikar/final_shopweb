
require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("./db");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function createAdmin() {
    try {
        const username = await new Promise(resolve => {
            rl.question("Enter administrator username: ", resolve);
        });

        const password = await new Promise(resolve => {
            rl.question("Enter administrator password (minimum 12 characters): ", resolve);
        });

        if (!username.trim() || password.length < 12) {
            throw new Error(
                "Username is required and password must contain at least 12 characters."
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);

        db.query(
            `INSERT INTO users (username, password_hash)
             VALUES (?, ?)`,
            [username.trim(), passwordHash],
            (error) => {
                if (error) {
                    if (error.code === "ER_DUP_ENTRY") {
                        console.error("That username already exists.");
                    } else {
                        console.error("Database error:", error.message);
                    }
                } else {
                    console.log("Administrator account created successfully.");
                }

                rl.close();
                if (typeof db.end === "function") {
                    db.end();
                }
            }
        );
    } catch (error) {
        console.error(error.message);
        rl.close();
        if (typeof db.end === "function") {
            db.end();
        }
    }
}

createAdmin();
