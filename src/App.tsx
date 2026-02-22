import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle, 
  Plus, 
  Search,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownRight,
  History,
  FileText,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Types
interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  reorder_level: number;
}

interface Purchase {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  purchase_price: number;
  purchase_date: string;
}

interface Sale {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  selling_price: number;
  sale_date: string;
}

interface Stats {
  totalProducts: number;
  lowStock: number;
  totalRevenue: number;
  totalPurchases: number;
  profit: number;
}

type View = "dashboard" | "products" | "purchases" | "sales" | "reports";

export default function App() {
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize data from localStorage
  useEffect(() => {
    const storedProducts = localStorage.getItem("inventory_products");
    const storedPurchases = localStorage.getItem("inventory_purchases");
    const storedSales = localStorage.getItem("inventory_sales");

    if (storedProducts) setProducts(JSON.parse(storedProducts));
    if (storedPurchases) setPurchases(JSON.parse(storedPurchases));
    if (storedSales) setSales(JSON.parse(storedSales));
    
    setLoading(false);
  }, []);

  // Sync data to localStorage and update stats
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("inventory_products", JSON.stringify(products));
      localStorage.setItem("inventory_purchases", JSON.stringify(purchases));
      localStorage.setItem("inventory_sales", JSON.stringify(sales));

      const totalRevenue = sales.reduce((acc, s) => acc + (s.quantity * s.selling_price), 0);
      const totalPurchases = purchases.reduce((acc, p) => acc + (p.quantity * p.purchase_price), 0);
      const lowStock = products.filter(p => p.quantity < p.reorder_level).length;

      setStats({
        totalProducts: products.length,
        lowStock,
        totalRevenue,
        totalPurchases,
        profit: totalRevenue - totalPurchases
      });
    }
  }, [products, purchases, sales, loading]);

  const handleAddProduct = (newProduct: Omit<Product, "id">) => {
    const product: Product = {
      ...newProduct,
      id: Date.now(),
    };
    setProducts([...products, product]);
  };

  const handleDeleteProduct = (id: number) => {
    const product = products.find(p => p.id === id);
    if (product) setProductToDelete(product);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      setProducts(products.filter(p => p.id !== productToDelete.id));
      setProductToDelete(null);
    }
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleRecordPurchase = (purchaseData: Omit<Purchase, "id" | "product_name" | "purchase_date">) => {
    const product = products.find(p => p.id === purchaseData.product_id);
    if (!product) return;

    const newPurchase: Purchase = {
      ...purchaseData,
      id: Date.now(),
      product_name: product.name,
      purchase_date: new Date().toISOString()
    };

    setPurchases([newPurchase, ...purchases]);
    setProducts(products.map(p => 
      p.id === purchaseData.product_id 
        ? { ...p, quantity: p.quantity + purchaseData.quantity } 
        : p
    ));
  };

  const handleRecordSale = (saleData: Omit<Sale, "id" | "product_name" | "sale_date">) => {
    const product = products.find(p => p.id === saleData.product_id);
    if (!product) return;

    if (product.quantity < saleData.quantity) {
      alert("Insufficient stock!");
      return;
    }

    const newSale: Sale = {
      ...saleData,
      id: Date.now(),
      product_name: product.name,
      sale_date: new Date().toISOString()
    };

    setSales([newSale, ...sales]);
    setProducts(products.map(p => 
      p.id === saleData.product_id 
        ? { ...p, quantity: p.quantity - saleData.quantity } 
        : p
    ));
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPurchases = purchases.filter(p => 
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSales = sales.filter(s => 
    s.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
            <Package size={28} />
            <span>InventoryPro</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={currentView === "dashboard"} 
            onClick={() => setCurrentView("dashboard")} 
          />
          <NavItem 
            icon={<Package size={20} />} 
            label="Products" 
            active={currentView === "products"} 
            onClick={() => setCurrentView("products")} 
            badge={products.filter(p => p.quantity < p.reorder_level).length || undefined}
          />
          <NavItem 
            icon={<ShoppingCart size={20} />} 
            label="Purchases" 
            active={currentView === "purchases"} 
            onClick={() => setCurrentView("purchases")} 
          />
          <NavItem 
            icon={<TrendingUp size={20} />} 
            label="Sales" 
            active={currentView === "sales"} 
            onClick={() => setCurrentView("sales")} 
          />
          <NavItem 
            icon={<FileText size={20} />} 
            label="Reports" 
            active={currentView === "reports"} 
            onClick={() => setCurrentView("reports")} 
          />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-indigo-50 rounded-xl p-4">
            <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mb-1">System Status</p>
            <div className="flex items-center gap-2 text-sm text-indigo-900">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Operational (Local)
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-lg font-semibold capitalize">{currentView}</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search inventory..." 
                className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 w-64 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              JD
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === "dashboard" && <Dashboard stats={stats} products={filteredProducts} onNavigate={setCurrentView} />}
              {currentView === "products" && (
                <ProductsView 
                  products={filteredProducts} 
                  onAdd={handleAddProduct} 
                  onDelete={handleDeleteProduct} 
                  onUpdate={handleUpdateProduct}
                />
              )}
              {currentView === "purchases" && <PurchasesView products={products} purchases={filteredPurchases} onRecord={handleRecordPurchase} />}
              {currentView === "sales" && <SalesView products={products} sales={filteredSales} onRecord={handleRecordSale} />}
              {currentView === "reports" && <ReportsView stats={stats} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                  <Trash2 size={24} />
                </div>
                <button 
                  onClick={() => setProductToDelete(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Product?</h3>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-gray-900">"{productToDelete.name}"</span>? 
                This action cannot be undone and will remove all associated inventory data.
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-lg shadow-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, badge }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, badge?: number }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        active 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        {label}
      </div>
      {badge !== undefined && (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${active ? "bg-white text-indigo-600" : "bg-red-100 text-red-600"}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

// --- View Components ---

function Dashboard({ stats, products, onNavigate }: { stats: Stats | null, products: Product[], onNavigate: (view: View) => void }) {
  if (!stats) return null;

  const lowStockItems = products.filter(p => p.quantity < p.reorder_level);

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {lowStockItems.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg text-red-600 animate-pulse">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="font-bold text-red-900 text-sm">Inventory Alert: Low Stock Detected</p>
                <p className="text-red-700 text-xs">{lowStockItems.length} products are currently below their reorder level.</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate("products")}
              className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
            >
              Restock Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Revenue" 
          value={`$${stats.totalRevenue.toLocaleString()}`} 
          icon={<TrendingUp className="text-emerald-600" />} 
          trend="+12.5%" 
          color="bg-emerald-50"
        />
        <StatCard 
          label="Total Purchases" 
          value={`$${stats.totalPurchases.toLocaleString()}`} 
          icon={<ShoppingCart className="text-blue-600" />} 
          trend="+5.2%" 
          color="bg-blue-50"
        />
        <StatCard 
          label="Low Stock Alerts" 
          value={stats.lowStock.toString()} 
          icon={<AlertTriangle className="text-amber-600" />} 
          trend={stats.lowStock > 0 ? "Action Required" : "All Good"} 
          color="bg-amber-50"
        />
        <StatCard 
          label="Net Profit" 
          value={`$${stats.profit.toLocaleString()}`} 
          icon={<ArrowUpRight className="text-indigo-600" />} 
          trend="+8.1%" 
          color="bg-indigo-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Low Stock Inventory</h3>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase">Critical</span>
          </div>
          <div className="space-y-4">
            {lowStockItems.length > 0 ? (
              lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{item.quantity} left</p>
                    <p className="text-xs text-gray-400">Min: {item.reorder_level}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 italic">No low stock items found.</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <QuickAction icon={<Plus />} label="Add Product" color="bg-indigo-600" onClick={() => onNavigate("products")} />
            <QuickAction icon={<ShoppingCart />} label="New Purchase" color="bg-blue-600" onClick={() => onNavigate("purchases")} />
            <QuickAction icon={<TrendingUp />} label="Record Sale" color="bg-emerald-600" onClick={() => onNavigate("sales")} />
            <QuickAction icon={<History />} label="View History" color="bg-gray-800" onClick={() => onNavigate("reports")} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, trend, color }: { label: string, value: string, icon: React.ReactNode, trend: string, color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-gray-400">{trend}</span>
      </div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <h2 className="text-2xl font-bold text-gray-900 mt-1">{value}</h2>
    </div>
  );
}

function QuickAction({ icon, label, color, onClick }: { icon: React.ReactNode, label: string, color: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group w-full"
    >
      <div className={`p-3 rounded-xl text-white ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="text-sm font-semibold text-gray-700">{label}</span>
    </button>
  );
}

function ProductsView({ products, onAdd, onDelete, onUpdate }: { 
  products: Product[], 
  onAdd: (p: Omit<Product, "id">) => void, 
  onDelete: (id: number) => void,
  onUpdate: (p: Product) => void
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: "", category: "", price: 0, reorder_level: 10, quantity: 15 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdate({ ...editingProduct, ...formData });
      setEditingProduct(null);
    } else {
      onAdd(formData);
      setIsAdding(false);
    }
    setFormData({ name: "", category: "", price: 0, reorder_level: 10, quantity: 15 });
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({ 
      name: product.name, 
      category: product.category, 
      price: product.price, 
      reorder_level: product.reorder_level,
      quantity: product.quantity
    });
    setIsAdding(false);
  };

  const cancel = () => {
    setIsAdding(false);
    setEditingProduct(null);
    setFormData({ name: "", category: "", price: 0, reorder_level: 10, quantity: 15 });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        {!isAdding && !editingProduct && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} /> Add Product
          </button>
        )}
      </div>

      {(isAdding || editingProduct) && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-lg overflow-hidden"
        >
          <h3 className="text-lg font-bold mb-4">{editingProduct ? "Edit Product" : "Add New Product"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
              <input 
                required
                type="text" 
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
              <input 
                required
                type="text" 
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price ($)</label>
              <input 
                required
                type="number" 
                step="0.01"
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                value={formData.price}
                onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stock</label>
              <input 
                required
                type="number" 
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold">
                {editingProduct ? "Update" : "Save"}
              </button>
              <button type="button" onClick={cancel} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Product</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Price</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4 font-semibold text-gray-900">{product.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{product.category}</td>
                <td className="px-6 py-4 text-sm font-medium">${product.price.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm font-bold">{product.quantity}</td>
                <td className="px-6 py-4">
                  {product.quantity < product.reorder_level ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase">
                      <AlertTriangle size={12} /> Low Stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase">
                      In Stock
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => startEdit(product)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => onDelete(product.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PurchasesView({ products, purchases, onRecord }: { products: Product[], purchases: Purchase[], onRecord: (p: Omit<Purchase, "id" | "product_name" | "purchase_date">) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ product_id: 0, quantity: 0, purchase_price: 0 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRecord(formData);
    setIsAdding(false);
    setFormData({ product_id: 0, quantity: 0, purchase_price: 0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Purchase History</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} /> Record Purchase
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-white p-6 rounded-2xl border border-blue-200 shadow-lg overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product</label>
              <select 
                required
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                value={formData.product_id}
                onChange={e => {
                  const pid = parseInt(e.target.value);
                  const p = products.find(x => x.id === pid);
                  setFormData({...formData, product_id: pid, purchase_price: p ? p.price : 0});
                }}
              >
                <option value="">Select Product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity</label>
              <input 
                required
                type="number" 
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unit Cost ($)</label>
              <input 
                readOnly
                type="number" 
                step="0.01"
                className="w-full p-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                value={formData.purchase_price}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold">Record</button>
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Product</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Unit Cost</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {purchases.map(purchase => (
              <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(purchase.purchase_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-semibold text-gray-900">{purchase.product_name}</td>
                <td className="px-6 py-4 text-sm font-medium">{purchase.quantity}</td>
                <td className="px-6 py-4 text-sm font-medium">${purchase.purchase_price.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm font-bold text-right">${(purchase.quantity * purchase.purchase_price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SalesView({ products, sales, onRecord }: { products: Product[], sales: Sale[], onRecord: (s: Omit<Sale, "id" | "product_name" | "sale_date">) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ product_id: 0, quantity: 0, selling_price: 0 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRecord(formData);
    setIsAdding(false);
    setFormData({ product_id: 0, quantity: 0, selling_price: 0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sales Records</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-colors"
        >
          <Plus size={20} /> Record Sale
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-lg overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product</label>
              <select 
                required
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                value={formData.product_id}
                onChange={e => {
                  const pid = parseInt(e.target.value);
                  const p = products.find(x => x.id === pid);
                  setFormData({...formData, product_id: pid, selling_price: p ? p.price : 0});
                }}
              >
                <option value="">Select Product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.quantity} in stock)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity</label>
              <input 
                required
                type="number" 
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Selling Price ($)</label>
              <input 
                readOnly
                type="number" 
                step="0.01"
                className="w-full p-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                value={formData.selling_price}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-bold">Record</button>
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Product</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Price</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.map(sale => (
              <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(sale.sale_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-semibold text-gray-900">{sale.product_name}</td>
                <td className="px-6 py-4 text-sm font-medium">{sale.quantity}</td>
                <td className="px-6 py-4 text-sm font-medium">${sale.selling_price.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm font-bold text-right text-emerald-600">${(sale.quantity * sale.selling_price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportsView({ stats }: { stats: Stats | null }) {
  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Financial Reports</h2>
        <button className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold">
          <ArrowDownRight size={18} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-center">
          <p className="text-gray-500 font-medium mb-2">Gross Revenue</p>
          <h3 className="text-4xl font-black text-emerald-600">${stats.totalRevenue.toLocaleString()}</h3>
          <div className="mt-4 h-1 bg-emerald-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-3/4" />
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-center">
          <p className="text-gray-500 font-medium mb-2">Total Expenses</p>
          <h3 className="text-4xl font-black text-blue-600">${stats.totalPurchases.toLocaleString()}</h3>
          <div className="mt-4 h-1 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-1/2" />
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-center">
          <p className="text-gray-500 font-medium mb-2">Net Profit</p>
          <h3 className={`text-4xl font-black ${stats.profit >= 0 ? "text-indigo-600" : "text-red-600"}`}>
            ${stats.profit.toLocaleString()}
          </h3>
          <div className="mt-4 h-1 bg-indigo-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-2/3" />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 text-white p-8 rounded-3xl relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-2">Inventory Efficiency</h3>
          <p className="text-gray-400 text-sm max-w-md mb-6">Your inventory turnover rate is currently optimal. Low stock items have decreased by 15% compared to last month.</p>
          <button className="bg-white text-gray-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors">
            View Optimization Tips
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
      </div>
    </div>
  );
}
