
const express = require("express");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, "../frontend_v2");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors({
    origin: true,
    credentials: true
}));

// Login session configuration
const sessionSecret =
    process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");

if (!process.env.SESSION_SECRET) {
    console.warn(
        "SESSION_SECRET is not configured. Set it in backend/.env."
    );
}

app.use(session({
    name: "vb.sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.COOKIE_SECURE === "true",
        maxAge: 8 * 60 * 60 * 1000
    }
}));

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());


/* =====================================================
   STATIC FILES
===================================================== */

// Allow the login page and its required frontend assets to load.
app.get("/login.html", (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, "login.html"));
});

app.use("/css", express.static(path.join(FRONTEND_DIR, "css")));
app.use("/js", express.static(path.join(FRONTEND_DIR, "js")));
app.use("/images", express.static(path.join(FRONTEND_DIR, "images")));

// =====================================================
// HOME ROUTE
// =====================================================

app.get("/", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login.html");
    }

    res.sendFile(
        path.join(FRONTEND_DIR, "dashboard.html")
    );
});

// =====================================================
// DATABASE SETUP
// =====================================================

function initializeDatabase() {

    // =================================================
    // ITEMS
    // =================================================

    db.query(`
        CREATE TABLE IF NOT EXISTS items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL,
            variant VARCHAR(100) NOT NULL DEFAULT '',
            quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
            unit VARCHAR(20) NOT NULL DEFAULT 'piece',
            price DECIMAL(10,2) NOT NULL DEFAULT 0
        )
    `, (err) => {

        if (err) {
            console.error(
                "❌ Error creating items table:",
                err.message
            );
        } else {
            console.log("✅ Items table ready");
        }

    });

    // =================================================
    // CUSTOMERS
    // =================================================

    db.query(`
        CREATE TABLE IF NOT EXISTS customers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            mobile VARCHAR(20) NOT NULL
        )
    `, (err) => {

        if (err) {
            console.error(
                "❌ Error creating customers table:",
                err.message
            );
        } else {
            console.log("✅ Customers table ready");
        }

    });

    // =================================================
    // SALES
    // =================================================

    db.query(`
        CREATE TABLE IF NOT EXISTS sales (
            id INT AUTO_INCREMENT PRIMARY KEY,
            invoice_no VARCHAR(50) NOT NULL,
            total DECIMAL(10,2) NOT NULL,
            payment_method VARCHAR(20) DEFAULT 'cash',
            customer_id INT NULL,
            customer_name VARCHAR(255) NULL,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {

        if (err) {
            console.error(
                "❌ Error creating sales table:",
                err.message
            );
        } else {
            console.log("✅ Sales table ready");
        }

    });

    // =================================================
    // SALE ITEMS
    // =================================================

    db.query(`
        CREATE TABLE IF NOT EXISTS sale_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sale_id INT NOT NULL,
            item_id INT NOT NULL,
            quantity DECIMAL(10,3) NOT NULL,
            price DECIMAL(10,2) NOT NULL
        )
    `, (err) => {

        if (err) {
            console.error(
                "❌ Error creating sale_items table:",
                err.message
            );
        } else {
            console.log("✅ Sale items table ready");
        }

    });

    // =================================================
    // CREDIT TRANSACTIONS
    // =================================================

    db.query(`
        CREATE TABLE IF NOT EXISTS credit_transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            customer_id INT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            type ENUM('credit','payment') NOT NULL,
            bill_no VARCHAR(50),
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {

        if (err) {
            console.error(
                "❌ Error creating credit_transactions table:",
                err.message
            );
        } else {
            console.log(
                "✅ Credit transactions table ready"
            );
        }

    });
}


/* =====================================================
   LOGIN AUTHENTICATION
===================================================== */

app.post("/auth/login", (req, res) => {
    const username =
        typeof req.body.username === "string"
            ? req.body.username.trim()
            : "";

    const password =
        typeof req.body.password === "string"
            ? req.body.password
            : "";

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Username and password are required."
        });
    }

    db.query(
        `SELECT id, username, password_hash
         FROM users
         WHERE username = ?
         LIMIT 1`,
        [username],
        async (error, results) => {
            if (error) {
                console.error("Login database error:", error.message);

                return res.status(500).json({
                    success: false,
                    message: "Unable to process login."
                });
            }

            if (!results || results.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid username or password."
                });
            }

            try {
                const user = results[0];

                const passwordMatches = await bcrypt.compare(
                    password,
                    user.password_hash
                );

                if (!passwordMatches) {
                    return res.status(401).json({
                        success: false,
                        message: "Invalid username or password."
                    });
                }

                req.session.regenerate((sessionError) => {
                    if (sessionError) {
                        console.error(
                            "Session error:",
                            sessionError.message
                        );

                        return res.status(500).json({
                            success: false,
                            message: "Unable to create login session."
                        });
                    }

                    req.session.user = {
                        id: user.id,
                        username: user.username
                    };

                    req.session.save((saveError) => {
                        if (saveError) {
                            console.error(
                                "Session save error:",
                                saveError.message
                            );

                            return res.status(500).json({
                                success: false,
                                message: "Unable to save login session."
                            });
                        }

                        return res.json({
                            success: true,
                            message: "Login successful.",
                            redirect: "/"
                        });
                    });
                });
            } catch (compareError) {
                console.error(
                    "Password verification error:",
                    compareError.message
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to verify login."
                });
            }
        }
    );
});



/* =====================================================
   AUTHENTICATION MIDDLEWARE
===================================================== */


function requireLogin(req, res, next) {
    // Allow authenticated users.
    if (req.session && req.session.user) {
        res.set({
            "Cache-Control": "no-store, no-cache, must-revalidate, private",
            "Pragma": "no-cache",
            "Expires": "0"
        });

        return next();
    }

    // Public login endpoints.
    if (
        req.path === "/auth/login" ||
        req.path === "/login.html"
    ) {
        return next();
    }

    // Redirect only actual HTML page requests.
    const isHtmlPage = req.path.toLowerCase().endsWith(".html");

    if (isHtmlPage) {
        return res.redirect("/login.html");
    }

    // Return JSON for unauthenticated API requests.
    return res.status(401).json({
        success: false,
        message: "Authentication required."
    });
}



/* =====================================================
   LOGOUT
===================================================== */

app.post("/auth/logout", (req, res) => {
    if (!req.session) {
        return res.json({
            success: true,
            redirect: "/login.html"
        });
    }

    req.session.destroy((error) => {
        if (error) {
            console.error("Logout error:", error.message);

            return res.status(500).json({
                success: false,
                message: "Unable to log out."
            });
        }

        res.clearCookie("vb.sid");

        return res.json({
            success: true,
            redirect: "/login.html"
        });
    });
});


app.get("/auth/me", (req, res) => {
    res.set("Cache-Control", "no-store");

    if (req.session && req.session.user) {
        return res.json({
            authenticated: true
        });
    }

    return res.status(401).json({
        authenticated: false
    });
});

// =====================================================
// ITEMS API
// =====================================================

// GET ALL ITEMS

app.use(requireLogin);

app.use(express.static(FRONTEND_DIR));

app.get("/items", (req, res) => {

    db.query(
        "SELECT * FROM items ORDER BY id DESC",
        (err, rows) => {

            if (err) {
                console.error("Get items error:", err);

                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
});

// ADD ITEM
app.post("/items", (req, res) => {

    const {
        name,
        category,
        variant,
        quantity,
        unit,
        price
    } = req.body;

    if (
        !name ||
        !category ||
        quantity === undefined ||
        quantity === null ||
        !unit ||
        price === undefined ||
        price === null
    ) {
        return res.status(400).json({
            success: false,
            message: "All fields are required."
        });
    }

    const numericQuantity = Number(quantity);
    const numericPrice = Number(price);

    if (
        !Number.isFinite(numericQuantity) ||
        numericQuantity < 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid quantity."
        });
    }

    if (
        !Number.isFinite(numericPrice) ||
        numericPrice < 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid price."
        });
    }

    db.query(
        `
        INSERT INTO items
        (
            name,
            category,
            variant,
            quantity,
            unit,
            price
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            name,
            category,
            variant || "",
            numericQuantity,
            unit,
            numericPrice
        ],
        (err, result) => {

            if (err) {
                console.error("Add item error:", err);

                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: "Item Added Successfully",
                id: result.insertId
            });
        }
    );
});

// UPDATE ITEM
app.put("/items/:id", (req, res) => {

    const {
        name,
        category,
        variant,
        quantity,
        unit,
        price
    } = req.body;

    if (
        !name ||
        !category ||
        quantity === undefined ||
        quantity === null ||
        !unit ||
        price === undefined ||
        price === null
    ) {
        return res.status(400).json({
            success: false,
            message: "All fields are required."
        });
    }

    const numericQuantity = Number(quantity);
    const numericPrice = Number(price);

    if (
        !Number.isFinite(numericQuantity) ||
        numericQuantity < 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid quantity."
        });
    }

    if (
        !Number.isFinite(numericPrice) ||
        numericPrice < 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid price."
        });
    }

    db.query(
        `
        UPDATE items
        SET
            name = ?,
            category = ?,
            variant = ?,
            quantity = ?,
            unit = ?,
            price = ?
        WHERE id = ?
        `,
        [
            name,
            category,
            variant || "",
            numericQuantity,
            unit,
            numericPrice,
            req.params.id
        ],
        (err, result) => {

            if (err) {
                console.error("Update item error:", err);

                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Item not found."
                });
            }

            res.json({
                success: true,
                message: "Item Updated Successfully"
            });
        }
    );
});

// DELETE ITEM
app.delete("/items/:id", (req, res) => {

    db.query(
        "DELETE FROM items WHERE id = ?",
        [req.params.id],
        (err, result) => {

            if (err) {
                console.error("Delete item error:", err);

                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Item not found."
                });
            }

            res.json({
                success: true,
                message: "Item Deleted Successfully"
            });
        }
    );
});

// LOW STOCK
app.get("/low-stock", (req, res) => {

    db.query(
        `
        SELECT *
        FROM items
        WHERE quantity <= 5
        ORDER BY quantity ASC
        `,
        (err, rows) => {

            if (err) {
                console.error("Low stock error:", err);

                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
});

// =====================================================
// CUSTOMERS API
// =====================================================

// GET ALL CUSTOMERS + PENDING KHATA
app.get("/customers", (req, res) => {

    const sql = `
        SELECT
            c.id,
            c.name,
            c.mobile,
            COALESCE(
                SUM(
                    CASE
                        WHEN ct.type = 'credit'
                        THEN ct.amount
                        WHEN ct.type = 'payment'
                        THEN -ct.amount
                        ELSE 0
                    END
                ),
                0
            ) AS pending
        FROM customers c
        LEFT JOIN credit_transactions ct
            ON c.id = ct.customer_id
        GROUP BY
            c.id,
            c.name,
            c.mobile
        ORDER BY c.name ASC
    `;

    db.query(sql, (err, rows) => {

        if (err) {
            console.error("Get customers error:", err);

            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json(rows);
    });
});

// ADD CUSTOMER
app.post("/customers", (req, res) => {

    const {
        name,
        mobile
    } = req.body;

    if (!name || !mobile) {
        return res.status(400).json({
            success: false,
            message: "Customer name and mobile are required."
        });
    }

    db.query(
        `
        INSERT INTO customers
        (
            name,
            mobile
        )
        VALUES (?, ?)
        `,
        [
            name,
            mobile
        ],
        (err, result) => {

            if (err) {
                console.error("Add customer error:", err);

                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: "Customer Added Successfully",
                id: result.insertId
            });
        }
    );
});

// UPDATE CUSTOMER
app.put("/customers/:id", (req, res) => {

    const {
        name,
        mobile
    } = req.body;

    if (!name || !mobile) {
        return res.status(400).json({
            success: false,
            message: "Customer name and mobile are required."
        });
    }

    db.query(
        `
        UPDATE customers
        SET
            name = ?,
            mobile = ?
        WHERE id = ?
        `,
        [
            name,
            mobile,
            req.params.id
        ],
        (err, result) => {

            if (err) {
                console.error("Update customer error:", err);

                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Customer not found."
                });
            }

            res.json({
                success: true,
                message: "Customer Updated Successfully"
            });
        }
    );
});

// DELETE CUSTOMER
app.delete("/customers/:id", (req, res) => {

    db.query(
        "DELETE FROM customers WHERE id = ?",
        [req.params.id],
        (err, result) => {

            if (err) {
                console.error("Delete customer error:", err);

                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Customer not found."
                });
            }

            res.json({
                success: true,
                message: "Customer Deleted Successfully"
            });
        }
    );
});

// =====================================================
// CUSTOMER CREDIT / KHATA API
// =====================================================

// GET CUSTOMER TRANSACTIONS
app.get("/customers/:id/transactions", (req, res) => {

    db.query(
        `
        SELECT *
        FROM credit_transactions
        WHERE customer_id = ?
        ORDER BY id DESC
        `,
        [req.params.id],
        (err, rows) => {

            if (err) {
                console.error(
                    "Get transactions error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
});

// ADD PAYMENT
app.post("/customers/:id/payment", (req, res) => {

    const {
        amount
    } = req.body;

    const numericAmount = Number(amount);

    if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid payment amount."
        });
    }

    db.query(
        `
        INSERT INTO credit_transactions
        (
            customer_id,
            amount,
            type
        )
        VALUES (?, ?, 'payment')
        `,
        [
            req.params.id,
            numericAmount
        ],
        (err, result) => {

            if (err) {
                console.error("Payment error:", err);

                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: "Payment Recorded Successfully",
                id: result.insertId
            });
        }
    );
});

// =====================================================
// SALES / BILLING API
// =====================================================

app.post("/sales", (req, res) => {

    const {
        items,
        total,
        paymentMethod,
        customerId,
        customerName
    } = req.body;

    // =================================================
    // VALIDATE ITEMS
    // =================================================

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {
        return res.status(400).json({
            success: false,
            message: "No items in sale."
        });
    }

    // =================================================
    // NORMALIZE ITEMS
    // =================================================

    const normalizedItems = [];

    for (const item of items) {

        if (!item || !item.id) {
            return res.status(400).json({
                success: false,
                message: "Invalid product in sale."
            });
        }

        const rawQuantity =
            item.qtyBase ??
            item.quantity ??
            item.qty;

        const quantity = Number(rawQuantity);
        const price = Number(item.price);

        if (
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Invalid quantity for product ID ${item.id}.`
            });
        }

        if (
            !Number.isFinite(price) ||
            price < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Invalid price for product ID ${item.id}.`
            });
        }

        normalizedItems.push({
            id: Number(item.id),
            quantity,
            price
        });
    }

    // =================================================
    // VALIDATE TOTAL
    // =================================================

    const saleTotal = Number(total);

    if (
        !Number.isFinite(saleTotal) ||
        saleTotal <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid sale total."
        });
    }

    // =================================================
    // PAYMENT METHOD
    // =================================================

    const method = String(
        paymentMethod || "cash"
    )
        .trim()
        .toLowerCase();

    const allowedMethods = [
        "cash",
        "upi",
        "credit"
    ];

    if (!allowedMethods.includes(method)) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment method."
        });
    }

    // =================================================
    // CREDIT REQUIRES CUSTOMER
    // =================================================

    if (
        method === "credit" &&
        (
            customerId === undefined ||
            customerId === null ||
            customerId === ""
        )
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Customer is required for credit sale."
        });
    }

    // =================================================
    // DATABASE CONNECTION
    // =================================================

    db.getConnection(
        (connectionError, connection) => {

            if (connectionError) {

                console.error(
                    "Database connection error:",
                    connectionError
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to connect to database.",
                    error:
                        connectionError.message
                });
            }

            // =================================================
            // START TRANSACTION
            // =================================================

            connection.beginTransaction(
                (transactionError) => {

                    if (transactionError) {

                        connection.release();

                        return res.status(500).json({
                            success: false,
                            message:
                                "Unable to start sale transaction.",
                            error:
                                transactionError.message
                        });
                    }

                    // =================================================
                    // ROLLBACK
                    // =================================================

                    function rollbackSale(error) {

                        console.error(
                            "❌ Sale failed:",
                            error
                        );

                        connection.rollback(() => {

                            connection.release();

                            res.status(500).json({
                                success: false,
                                message:
                                    error.message ||
                                    "Sale failed.",
                                error:
                                    error.message
                            });

                        });
                    }

                    // =================================================
                    // VERIFY CUSTOMER
                    // =================================================

                    function verifyCustomer(callback) {

                        if (method !== "credit") {
                            return callback(null);
                        }

                        connection.query(
                            `
                            SELECT id
                            FROM customers
                            WHERE id = ?
                            `,
                            [customerId],
                            (customerError, rows) => {

                                if (customerError) {
                                    return callback(
                                        customerError
                                    );
                                }

                                if (rows.length === 0) {
                                    return callback(
                                        new Error(
                                            "Customer not found."
                                        )
                                    );
                                }

                                callback(null);
                            }
                        );
                    }

                    // =================================================
                    // CREATE SALE
                    // =================================================

                    function createSale() {

                        const invoiceNo =
                            "INV-" + Date.now();

                        connection.query(
                            `
                            INSERT INTO sales
                            (
                                invoice_no,
                                total,
                                payment_method,
                                customer_id,
                                customer_name
                            )
                            VALUES (?, ?, ?, ?, ?)
                            `,
                            [
                                invoiceNo,
                                saleTotal,
                                method,
                                customerId || null,
                                customerName || null
                            ],
                            (saleError, result) => {

                                if (saleError) {
                                    return rollbackSale(
                                        saleError
                                    );
                                }

                                const saleId =
                                    result.insertId;

                                processSaleItems(
                                    saleId,
                                    invoiceNo
                                );
                            }
                        );
                    }

                    // =================================================
                    // PROCESS SALE ITEMS
                    // =================================================

                    function processSaleItems(
                        saleId,
                        invoiceNo
                    ) {

                        let currentIndex = 0;

                        function processNextItem() {

                            if (
                                currentIndex >=
                                normalizedItems.length
                            ) {
                                return finishSale(
                                    saleId,
                                    invoiceNo
                                );
                            }

                            const item =
                                normalizedItems[
                                    currentIndex
                                ];

                            // GET CURRENT STOCK

                            connection.query(
                                `
                                SELECT
                                    id,
                                    quantity,
                                    price
                                FROM items
                                WHERE id = ?
                                FOR UPDATE
                                `,
                                [item.id],
                                (
                                    stockCheckError,
                                    rows
                                ) => {

                                    if (stockCheckError) {
                                        return rollbackSale(
                                            stockCheckError
                                        );
                                    }

                                    if (rows.length === 0) {
                                        return rollbackSale(
                                            new Error(
                                                `Product ID ${item.id} not found.`
                                            )
                                        );
                                    }

                                    const currentStock =
                                        Number(
                                            rows[0].quantity
                                        );

                                    // CHECK STOCK

                                    if (
                                        !Number.isFinite(
                                            currentStock
                                        ) ||
                                        currentStock <
                                        item.quantity
                                    ) {
                                        return rollbackSale(
                                            new Error(
                                                `Insufficient stock for product ID ${item.id}. Available: ${currentStock}, Required: ${item.quantity}`
                                            )
                                        );
                                    }

                                    // INSERT SALE ITEM

                                    connection.query(
                                        `
                                        INSERT INTO sale_items
                                        (
                                            sale_id,
                                            item_id,
                                            quantity,
                                            price
                                        )
                                        VALUES (?, ?, ?, ?)
                                        `,
                                        [
                                            saleId,
                                            item.id,
                                            item.quantity,
                                            item.price
                                        ],
                                        (saleItemError) => {

                                            if (
                                                saleItemError
                                            ) {
                                                return rollbackSale(
                                                    saleItemError
                                                );
                                            }

                                            // REDUCE STOCK

                                            connection.query(
                                                `
                                                UPDATE items
                                                SET quantity =
                                                    quantity - ?
                                                WHERE id = ?
                                                AND quantity >= ?
                                                `,
                                                [
                                                    item.quantity,
                                                    item.id,
                                                    item.quantity
                                                ],
                                                (
                                                    stockError,
                                                    updateResult
                                                ) => {

                                                    if (
                                                        stockError
                                                    ) {
                                                        return rollbackSale(
                                                            stockError
                                                        );
                                                    }

                                                    if (
                                                        updateResult
                                                            .affectedRows === 0
                                                    ) {
                                                        return rollbackSale(
                                                            new Error(
                                                                `Unable to update stock for product ID ${item.id}.`
                                                            )
                                                        );
                                                    }

                                                    currentIndex++;

                                                    processNextItem();
                                                }
                                            );
                                        }
                                    );
                                }
                            );
                        }

                        processNextItem();
                    }

                    // =================================================
                    // FINISH SALE
                    // =================================================

                    function finishSale(
                        saleId,
                        invoiceNo
                    ) {

                        // CREDIT / KHATA

                        if (method === "credit") {

                            connection.query(
                                `
                                INSERT INTO credit_transactions
                                (
                                    customer_id,
                                    amount,
                                    type,
                                    bill_no
                                )
                                VALUES (?, ?, 'credit', ?)
                                `,
                                [
                                    customerId,
                                    saleTotal,
                                    invoiceNo
                                ],
                                (
                                    creditError,
                                    creditResult
                                ) => {

                                    if (creditError) {
                                        return rollbackSale(
                                            creditError
                                        );
                                    }

                                    commitSale(
                                        saleId,
                                        invoiceNo,
                                        creditResult.insertId
                                    );
                                }
                            );

                        } else {

                            // CASH / UPI

                            commitSale(
                                saleId,
                                invoiceNo,
                                null
                            );
                        }
                    }

                    // =================================================
                    // COMMIT SALE
                    // =================================================

                    function commitSale(
                        saleId,
                        invoiceNo,
                        creditTransactionId
                    ) {

                        connection.commit(
                            (commitError) => {

                                if (commitError) {
                                    return rollbackSale(
                                        commitError
                                    );
                                }

                                connection.release();

                                console.log(
                                    "✅ Sale completed:",
                                    invoiceNo
                                );

                                res.json({
                                    success: true,
                                    invoice: invoiceNo,
                                    saleId: saleId,
                                    creditTransactionId:
                                        creditTransactionId
                                });
                            }
                        );
                    }

                    // START

                    verifyCustomer(
                        (customerError) => {

                            if (customerError) {
                                return rollbackSale(
                                    customerError
                                );
                            }

                            createSale();
                        }
                    );
                }
            );
        }
    );
});

// =====================================================
// SALE ITEMS REPORT API
// =====================================================

app.get("/sales/items", (req, res) => {

    db.query(
        `
        SELECT
            si.sale_id,
            si.item_id,
            si.quantity,
            si.price,
            i.name AS product_name
        FROM sale_items si
        LEFT JOIN items i
            ON si.item_id = i.id
        ORDER BY si.id DESC
        `,
        (err, rows) => {

            if (err) {
                console.error(
                    "Sale items error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
});

// =====================================================
// SALES HISTORY
// =====================================================

app.get("/sales", (req, res) => {

    db.query(
        `
        SELECT
            s.id,
            s.invoice_no,
            s.total,
            s.payment_method,
            s.customer_id,
            s.date,

            COALESCE(
                NULLIF(
                    TRIM(s.customer_name),
                    ''
                ),
                c.name
            ) AS customer_name

        FROM sales s

        LEFT JOIN customers c
            ON s.customer_id = c.id

        ORDER BY s.id DESC
        `,
        (err, rows) => {

            if (err) {
                console.error(
                    "Sales history error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
});

// ============================================================
// REPORTS SUMMARY
// Supports:
// day     -> selected date
// weekly  -> Monday to Sunday containing selected date
// monthly -> entire month containing selected date
// annual  -> entire year containing selected date
// ============================================================

app.get("/reports/summary", async (req, res) => {

    try {

        const period = String(
            req.query.period || "day"
        ).toLowerCase();

        const selectedDate = String(
            req.query.date || ""
        );

        const allowedPeriods = [
            "day",
            "weekly",
            "monthly",
            "annual"
        ];

        if (!allowedPeriods.includes(period)) {

            return res.status(400).json({
                success: false,
                error: "Invalid report period."
            });

        }

        // ----------------------------------------------------
        // Validate date
        // ----------------------------------------------------

        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(
                selectedDate
            )
        ) {

            return res.status(400).json({
                success: false,
                error: "A valid date in YYYY-MM-DD format is required."
            });

        }

        const dateParts = selectedDate
            .split("-")
            .map(Number);

        const year = dateParts[0];
        const month = dateParts[1];
        const day = dateParts[2];

        const selected = new Date(
            Date.UTC(
                year,
                month - 1,
                day
            )
        );

        // Prevent invalid dates such as 2026-02-31
        if (
            selected.getUTCFullYear() !== year ||
            selected.getUTCMonth() !== month - 1 ||
            selected.getUTCDate() !== day
        ) {

            return res.status(400).json({
                success: false,
                error: "Invalid calendar date."
            });

        }

        // ----------------------------------------------------
        // Helper functions
        // ----------------------------------------------------

        function formatUTCDate(date) {

            const y = date.getUTCFullYear();

            const m = String(
                date.getUTCMonth() + 1
            ).padStart(2, "0");

            const d = String(
                date.getUTCDate()
            ).padStart(2, "0");

            return `${y}-${m}-${d}`;
        }

        function addDays(date, numberOfDays) {

            const result = new Date(date);

            result.setUTCDate(
                result.getUTCDate() + numberOfDays
            );

            return result;
        }

        // ----------------------------------------------------
        // Calculate report period
        // ----------------------------------------------------

        let startDate;
        let endDate;
        let periodLabel;

        if (period === "day") {

            startDate = new Date(selected);

            endDate = addDays(
                startDate,
                1
            );

            periodLabel =
                formatUTCDate(startDate);

        }

        else if (period === "weekly") {

            // Sunday = 0
            // Monday = 1
            // Tuesday = 2 ...
            const dayOfWeek =
                selected.getUTCDay();

            // Number of days to move backwards
            // to Monday
            const daysFromMonday =
                (dayOfWeek + 6) % 7;

            startDate = addDays(
                selected,
                -daysFromMonday
            );

            endDate = addDays(
                startDate,
                7
            );

            periodLabel =
                `${formatUTCDate(startDate)} to ${formatUTCDate(
                    addDays(endDate, -1)
                )}`;

        }

        else if (period === "monthly") {

            startDate = new Date(
                Date.UTC(
                    year,
                    month - 1,
                    1
                )
            );

            endDate = new Date(
                Date.UTC(
                    year,
                    month,
                    1
                )
            );

            periodLabel =
                `${year}-${String(month).padStart(2, "0")}`;

        }

        else if (period === "annual") {

            startDate = new Date(
                Date.UTC(
                    year,
                    0,
                    1
                )
            );

            endDate = new Date(
                Date.UTC(
                    year + 1,
                    0,
                    1
                )
            );

            periodLabel =
                String(year);

        }

        const start = formatUTCDate(
            startDate
        );

        const end = formatUTCDate(
            endDate
        );

        // ----------------------------------------------------
        // SALES SUMMARY FOR SELECTED PERIOD
        // ----------------------------------------------------

        const salesQuery = `
            SELECT

                COALESCE(
                    SUM(total),
                    0
                ) AS totalRevenue,

                COUNT(*) AS totalBills,

                COALESCE(
                    SUM(
                        CASE
                            WHEN LOWER(payment_method) = 'cash'
                            THEN total
                            ELSE 0
                        END
                    ),
                    0
                ) AS cashIncome,

                COALESCE(
                    SUM(
                        CASE
                            WHEN LOWER(payment_method) = 'upi'
                            THEN total
                            ELSE 0
                        END
                    ),
                    0
                ) AS upiIncome,

                COALESCE(
                    SUM(
                        CASE
                            WHEN LOWER(payment_method) = 'credit'
                            THEN total
                            ELSE 0
                        END
                    ),
                    0
                ) AS creditSales

            FROM sales

            WHERE date >= ?
              AND date < ?
        `;

        // ----------------------------------------------------
        // STOCK SOLD FOR SELECTED PERIOD
        // ----------------------------------------------------

        const stockQuery = `
            SELECT

                COALESCE(
                    SUM(si.quantity),
                    0
                ) AS totalStockSold

            FROM sale_items si

            INNER JOIN sales s
                ON s.id = si.sale_id

            WHERE s.date >= ?
              AND s.date < ?
        `;

        // ----------------------------------------------------
        // OVERALL PENDING CREDIT
        //
        // This is NOT restricted to the selected report period.
        // It represents the current total Khata amount still
        // pending from customers.
        // ----------------------------------------------------

        const pendingQuery = `
            SELECT

                COALESCE(
                    SUM(
                        CASE
                            WHEN type = 'credit'
                            THEN amount

                            WHEN type = 'payment'
                            THEN -amount

                            ELSE 0
                        END
                    ),
                    0
                ) AS creditPending

            FROM credit_transactions
        `;

        // ----------------------------------------------------
        // Execute queries
        // ----------------------------------------------------

        const [
            salesResult,
            stockResult,
            pendingResult
        ] = await Promise.all([

            new Promise((resolve, reject) => {

                db.query(
                    salesQuery,
                    [
                        `${start} 00:00:00`,
                        `${end} 00:00:00`
                    ],
                    (error, rows) => {

                        if (error) {
                            reject(error);
                            return;
                        }

                        resolve(rows[0]);

                    }
                );

            }),

            new Promise((resolve, reject) => {

                db.query(
                    stockQuery,
                    [
                        `${start} 00:00:00`,
                        `${end} 00:00:00`
                    ],
                    (error, rows) => {

                        if (error) {
                            reject(error);
                            return;
                        }

                        resolve(rows[0]);

                    }
                );

            }),

            new Promise((resolve, reject) => {

                db.query(
                    pendingQuery,
                    (error, rows) => {

                        if (error) {
                            reject(error);
                            return;
                        }

                        resolve(rows[0]);

                    }
                );

            })

        ]);

        // ----------------------------------------------------
        // Send response
        // ----------------------------------------------------

        res.json({

            success: true,

            period: period,

            selectedDate: selectedDate,

            periodStart: start,

            periodEnd: formatUTCDate(
                addDays(endDate, -1)
            ),

            periodLabel: periodLabel,

            totalRevenue:
                Number(
                    salesResult.totalRevenue || 0
                ),

            totalBills:
                Number(
                    salesResult.totalBills || 0
                ),

            cashIncome:
                Number(
                    salesResult.cashIncome || 0
                ),

            upiIncome:
                Number(
                    salesResult.upiIncome || 0
                ),

            creditSales:
                Number(
                    salesResult.creditSales || 0
                ),

            totalStockSold:
                Number(
                    stockResult.totalStockSold || 0
                ),

            creditPending:
                Number(
                    pendingResult.creditPending || 0
                )

        });

    }

    catch (error) {

        console.error(
            "❌ Reports summary error:",
            error
        );

        res.status(500).json({

            success: false,

            error:
                error.message ||
                "Unable to generate report."

        });

    }

});


// =====================================================
// DATABASE INITIALIZATION
// =====================================================

initializeDatabase();

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {

    console.log("");
    console.log("=================================");
    console.log("🚀 VASAIKAR BAKALA SERVER");
    console.log("=================================");
    console.log(
        `🌐 http://localhost:${PORT}`
    );
    console.log("🗄️  Database: MySQL");
    console.log("📁 Frontend: frontend_v2");
    console.log("=================================");
    console.log("");
});