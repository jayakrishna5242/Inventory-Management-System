import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("inventory.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    price REAL,
    quantity INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    quantity INTEGER,
    purchase_price REAL,
    purchase_date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    quantity INTEGER,
    selling_price REAL,
    sale_date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Products
  app.get("/api/products", (req, res) => {
    const search = req.query.search as string;
    let products;
    if (search) {
      products = db.prepare("SELECT * FROM products WHERE name LIKE ? OR category LIKE ?").all(`%${search}%`, `%${search}%`);
    } else {
      products = db.prepare("SELECT * FROM products").all();
    }
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const { name, category, price, reorder_level } = req.body;
    const info = db.prepare("INSERT INTO products (name, category, price, reorder_level) VALUES (?, ?, ?, ?)").run(name, category, price, reorder_level);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/products/:id", (req, res) => {
    const { name, category, price, reorder_level } = req.body;
    db.prepare("UPDATE products SET name = ?, category = ?, price = ?, reorder_level = ? WHERE id = ?").run(name, category, price, reorder_level, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", (req, res) => {
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Purchases
  app.get("/api/purchases", (req, res) => {
    const purchases = db.prepare(`
      SELECT p.*, pr.name as product_name 
      FROM purchases p 
      JOIN products pr ON p.product_id = pr.id
      ORDER BY p.purchase_date DESC
    `).all();
    res.json(purchases);
  });

  app.post("/api/purchases", (req, res) => {
    const { product_id, quantity, purchase_price } = req.body;
    
    const transaction = db.transaction(() => {
      db.prepare("INSERT INTO purchases (product_id, quantity, purchase_price) VALUES (?, ?, ?)").run(product_id, quantity, purchase_price);
      db.prepare("UPDATE products SET quantity = quantity + ? WHERE id = ?").run(quantity, product_id);
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Sales
  app.get("/api/sales", (req, res) => {
    const sales = db.prepare(`
      SELECT s.*, pr.name as product_name 
      FROM sales s 
      JOIN products pr ON s.product_id = pr.id
      ORDER BY s.sale_date DESC
    `).all();
    res.json(sales);
  });

  app.post("/api/sales", (req, res) => {
    const { product_id, quantity, selling_price } = req.body;
    
    const product = db.prepare("SELECT quantity FROM products WHERE id = ?").get(product_id) as { quantity: number };
    
    if (!product || product.quantity < quantity) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    const transaction = db.transaction(() => {
      db.prepare("INSERT INTO sales (product_id, quantity, selling_price) VALUES (?, ?, ?)").run(product_id, quantity, selling_price);
      db.prepare("UPDATE products SET quantity = quantity - ? WHERE id = ?").run(quantity, product_id);
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Reports
  app.get("/api/reports/stats", (req, res) => {
    const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
    const lowStock = db.prepare("SELECT COUNT(*) as count FROM products WHERE quantity < reorder_level").get() as { count: number };
    const totalRevenue = db.prepare("SELECT SUM(quantity * selling_price) as total FROM sales").get() as { total: number };
    const totalPurchases = db.prepare("SELECT SUM(quantity * purchase_price) as total FROM purchases").get() as { total: number };

    res.json({
      totalProducts: totalProducts.count,
      lowStock: lowStock.count,
      totalRevenue: totalRevenue.total || 0,
      totalPurchases: totalPurchases.total || 0,
      profit: (totalRevenue.total || 0) - (totalPurchases.total || 0)
    });
  });

  app.get("/api/reports/low-stock", (req, res) => {
    const products = db.prepare("SELECT * FROM products WHERE quantity < reorder_level").all();
    res.json(products);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
