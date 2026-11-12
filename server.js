
const express = require("express");
const Database = require("better-sqlite3");
const session = require("express-session");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const db = new Database(path.join(__dirname, "database", "store.db"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || "change-this-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", secure: false }
}));

app.use(express.static(path.join(__dirname, "public")));

db.exec(`
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    image TEXT,
    category TEXT NOT NULL DEFAULT 'Electronics'
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    total REAL NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL
);
`);

// Existing database mein category column add karna
const columns = db.prepare("PRAGMA table_info(products)").all();
if (!columns.some(col => col.name === "category")) {
    db.exec("ALTER TABLE products ADD COLUMN category TEXT NOT NULL DEFAULT 'Electronics'");
}

function requireAdmin(req, res, next) {
    if (!req.session.isAdmin) {
        return res.status(401).json({ message: "Admin login required" });
    }
    next();
}

// ADMIN LOGIN
app.post("/api/admin/login", (req, res) => {
    const { email, password } = req.body;

    if (
        email !== process.env.ADMIN_EMAIL ||
        password !== process.env.ADMIN_PASSWORD
    ) {
        return res.status(401).json({ message: "Invalid login details" });
    }

    req.session.isAdmin = true;
    res.json({ message: "Login successful" });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
    req.session.destroy(() => {
        res.json({ message: "Logged out successfully" });
    });
});

app.get("/api/admin/check", requireAdmin, (req, res) => {
    res.json({ loggedIn: true });
});

// PRODUCTS
app.get("/api/products", (req, res) => {
    const { category } = req.query;

    if (category) {
        return res.json(
            db.prepare("SELECT * FROM products WHERE category = ? ORDER BY id DESC")
              .all(category)
        );
    }

    res.json(db.prepare("SELECT * FROM products ORDER BY id DESC").all());
});

app.get("/api/products/:id", (req, res) => {
    const product = db.prepare(
        "SELECT * FROM products WHERE id = ?"
    ).get(req.params.id);

    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
});

// ADD PRODUCT
app.post("/api/admin/products", requireAdmin, (req, res) => {
    const { name, description, price, stock, image, category } = req.body;

    const allowedCategories = [
        "Electronics",
        "Fashion",
        "Home & Living",
        "Beauty",
        "Sports",
        "Accessories"
    ];

    if (
        !name?.trim() ||
        !Number.isFinite(Number(price)) ||
        Number(price) <= 0 ||
        !Number.isInteger(Number(stock)) ||
        Number(stock) < 0 ||
        !allowedCategories.includes(category)
    ) {
        return res.status(400).json({ message: "Invalid product details" });
    }

    const result = db.prepare(`
        INSERT INTO products
        (name, description, price, stock, image, category)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(
        name.trim(),
        description || "",
        Number(price),
        Number(stock),
        image || "",
        category
    );

    res.json({
        message: "Product added successfully",
        productId: result.lastInsertRowid
    });
});

// PLACE ORDER
app.post("/api/orders", (req, res) => {
    const { customer_name, phone, address, items } = req.body;

    if (
        !customer_name?.trim() ||
        !phone?.trim() ||
        !address?.trim() ||
        !Array.isArray(items) ||
        items.length === 0
    ) {
        return res.status(400).json({ message: "Please complete all details" });
    }

    try {
        const createOrder = db.transaction(() => {
            let total = 0;
            const orderItems = [];

            for (const item of items) {
                const quantity = Number(item.quantity);

                if (!Number.isInteger(quantity) || quantity < 1) {
                    throw new Error("Invalid quantity");
                }

                const product = db.prepare(
                    "SELECT * FROM products WHERE id = ?"
                ).get(item.id);

                if (!product || product.stock < quantity) {
                    throw new Error("Product unavailable or insufficient stock");
                }

                total += product.price * quantity;
                orderItems.push({
                    id: product.id,
                    quantity,
                    price: product.price
                });
            }

            const order = db.prepare(`
                INSERT INTO orders (customer_name, phone, address, total)
                VALUES (?, ?, ?, ?)
            `).run(customer_name.trim(), phone.trim(), address.trim(), total);

            for (const item of orderItems) {
                db.prepare(`
                    INSERT INTO order_items
                    (order_id, product_id, quantity, price)
                    VALUES (?, ?, ?, ?)
                `).run(order.lastInsertRowid, item.id, item.quantity, item.price);

                db.prepare(
                    "UPDATE products SET stock = stock - ? WHERE id = ?"
                ).run(item.quantity, item.id);
            }

            return order.lastInsertRowid;
        });

        const orderId = createOrder();
        res.json({ message: "Order placed successfully", orderId });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ADMIN ORDERS
app.get("/api/admin/orders", requireAdmin, (req, res) => {
    res.json(
        db.prepare("SELECT * FROM orders ORDER BY id DESC").all()
    );
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`NOVEX Store running at http://localhost:${PORT}`);
});
