import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Archive, ArrowUpRight, ChevronRight, CircleUserRound, ClipboardList, Layers3, LogOut, Package, RefreshCw, Search, ShoppingBag, Store, Truck, UserRound, UsersRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AdminDeliveryManagement from '@/pages/AdminDeliveryManagement';
import AdminSellerManagement from '@/pages/AdminSellerManagement';
import AdminOrderControl from '@/pages/AdminOrderControl';
import { API_BASE_URL as API } from '@/lib/api';

type Product = { _id: string; name: string; category: string; price: number; stock: number; image?: string; largeImage?: string };
type Collection = { _id: string; name: string; description: string; productCount: number };
type Order = { id: string; customerName: string; email: string; total: number; status: string; items: number };
type User = { _id: string; firstName: string; lastName: string; email: string; createdAt: string };

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('shine_admin_token') || ''}`, ...options?.headers } });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Request failed');
  return result;
}

const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('Overview');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({ name: '', category: '', price: '', stock: '', image: '' });
  const [collectionForm, setCollectionForm] = useState({ name: '', description: '' });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [nextProducts, nextCollections, nextOrders, nextUsers] = await Promise.all([
        request<Product[]>('/products'), request<Collection[]>('/collections'), request<Order[]>('/orders'), request<User[]>('/users'),
      ]);
      setProducts(nextProducts); setCollections(nextCollections); setOrders(nextOrders); setUsers(nextUsers); setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to reach the house office.'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (!localStorage.getItem('shine_admin') || !localStorage.getItem('shine_admin_token')) setLocation('/admin-login');
    else loadData();
  }, [setLocation]);

  const filteredProducts = useMemo(() => products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase())), [products, search]);
  const revenue = orders.filter((order) => order.status === 'completed').reduce((sum, order) => sum + order.total, 0);
  const lowStock = products.filter((product) => product.stock < 5);

  const saveProduct = async () => {
    if (!editingProductId || !productForm.name || !productForm.category || !productForm.price) return setMessage('Name, category and price are required.');
    try { await request(`/products/${editingProductId}`, { method: 'PUT', body: JSON.stringify({ ...productForm, price: Number(productForm.price), stock: Number(productForm.stock) || 0 }) }); setEditingProductId(null); setProductForm({ name: '', category: '', price: '', stock: '', image: '' }); await loadData(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not update product.'); }
  };
  const deleteProduct = async (id: string) => { if (!window.confirm('Remove this product from the shop?')) return; try { await request(`/products/${id}`, { method: 'DELETE' }); await loadData(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not remove product.'); } };
  const editProduct = (product: Product) => { setEditingProductId(product._id); setProductForm({ name: product.name, category: product.category, price: String(product.price), stock: String(product.stock), image: product.image || product.largeImage || '' }); };
  const addCollection = async () => { if (!collectionForm.name || !collectionForm.description) return setMessage('Collection name and description are required.'); await request('/collections', { method: 'POST', body: JSON.stringify(collectionForm) }); setCollectionForm({ name: '', description: '' }); await loadData(); };
  const deleteCollection = async (id: string) => { await request(`/collections/${id}`, { method: 'DELETE' }); await loadData(); };
  const signOut = () => { localStorage.removeItem('shine_admin'); localStorage.removeItem('shine_admin_token'); setLocation('/admin-login'); };

  if (!localStorage.getItem('shine_admin') || !localStorage.getItem('shine_admin_token')) return null;

  const navItems = [['Overview', Archive], ['Products', Package], ['Collections', Layers3], ['Orders', ShoppingBag], ['Order Control', ClipboardList], ['Sellers', Store], ['Delivery', Truck], ['Clients', UsersRound]] as const;
  const overviewStats: { label: string; value: string | number; Icon: LucideIcon }[] = [
    { label: 'Net revenue', value: money(revenue), Icon: ArrowUpRight },
    { label: 'Products in shop', value: products.length, Icon: Package },
    { label: 'Orders placed', value: orders.length, Icon: ShoppingBag },
    { label: 'Private clients', value: users.length, Icon: UserRound },
  ];
  return <div className="min-h-screen bg-[#f6f2ec] text-[#29241f] flex">
    <aside className="hidden lg:flex w-64 shrink-0 bg-[#2d2925] text-[#f6f2ec] p-7 flex-col fixed inset-y-0">
      <Link href="/" className="font-serif text-2xl tracking-[0.18em]">SHINE</Link>
      <p className="text-[10px] tracking-[0.28em] uppercase text-[#bda57e] mt-2">House office</p>
      <nav className="mt-16 space-y-2">{navItems.map(([label, Icon]) => <button key={label} onClick={() => setActiveTab(label)} className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${activeTab === label ? 'bg-[#bda57e] text-[#2d2925]' : 'text-[#cfc6bc] hover:bg-[#403a34]'}`}><Icon className="w-4 h-4" strokeWidth={1.5} />{label}</button>)}</nav>
      <div className="mt-auto border-t border-[#514a42] pt-6"><button onClick={signOut} className="flex items-center gap-3 text-sm text-[#cfc6bc] hover:text-white"><LogOut className="w-4 h-4" />Sign out</button></div>
    </aside>
    <main className="flex-1 lg:ml-64 min-w-0">
      <header className="border-b border-[#ded5ca] bg-[#f8f5f0]/90 backdrop-blur-sm px-5 md:px-10 py-5 flex items-center justify-between sticky top-0 z-10"><div><p className="text-[10px] tracking-[0.3em] uppercase text-[#a6814f]">Shine Jewelry / 09.09.2026</p><h1 className="font-serif text-2xl mt-1">{activeTab === 'Overview' ? 'Good morning, Admin' : activeTab}</h1></div><div className="flex items-center gap-3"><button onClick={loadData} className="p-2 text-[#74695f] hover:text-[#a6814f]" title="Refresh data"><RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /></button><div className="w-9 h-9 border border-[#cfc3b6] flex items-center justify-center"><CircleUserRound className="w-5 h-5 text-[#a6814f]" /></div></div></header>
      <div className="lg:hidden px-5 pt-5 flex gap-2 overflow-x-auto">{navItems.map(([label]) => <button key={label} onClick={() => setActiveTab(label)} className={`whitespace-nowrap px-4 py-2 text-xs uppercase tracking-widest border ${activeTab === label ? 'bg-[#2d2925] text-white border-[#2d2925]' : 'border-[#d4c9bc] text-[#74695f]'}`}>{label}</button>)}</div>
      <div className="p-5 md:p-10 max-w-[1400px]">
        {message && <div className="mb-6 border border-[#c58b76] bg-[#fbebe5] text-[#814637] p-4 text-sm flex justify-between gap-4"><span>{message}</span><button onClick={loadData} className="underline">Try again</button></div>}
        {activeTab === 'Overview' && <><section className="grid grid-cols-2 xl:grid-cols-4 gap-px bg-[#dcd2c7] border border-[#dcd2c7] mb-10">{overviewStats.map(({ label, value, Icon }) => <div key={label} className="bg-[#fbfaf7] p-5 md:p-7"><Icon className="w-5 h-5 text-[#a6814f] mb-8" strokeWidth={1.4} /><p className="text-xs uppercase tracking-widest text-[#887d72]">{label}</p><p className="font-serif text-3xl mt-2">{value}</p></div>)}</section><section className="max-w-3xl bg-[#fbfaf7] border border-[#ded5ca] p-7 md:p-10"><p className="text-[10px] uppercase tracking-[0.25em] text-[#a6814f]">Shop inventory</p><h2 className="font-serif text-3xl mt-2">Total products</h2><p className="font-serif text-6xl mt-7">{products.length}</p><p className="text-sm text-[#887d72] mt-2">One shop-wide count. Product listings are managed from the seller account.</p></section></>}
        {activeTab === 'Products' && <section><div className="flex flex-wrap items-end justify-between gap-4 mb-6"><div><p className="text-[10px] uppercase tracking-[0.25em] text-[#a6814f]">Shop catalogue</p><h2 className="font-serif text-3xl mt-2">All products</h2><p className="text-sm text-[#887d72] mt-2">{products.length} products across the shop</p></div><div className="flex items-center gap-3 bg-[#fbfaf7] border border-[#ded5ca] px-4 w-full sm:w-72"><Search className="w-4 h-4 text-[#a6814f]"/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search products" className="bg-transparent py-3 outline-none text-sm w-full"/></div></div>{editingProductId && <div className="bg-[#fbfaf7] border border-[#ded5ca] p-5 md:p-6 mb-5"><div className="flex items-center justify-between mb-4"><div><p className="text-[10px] uppercase tracking-widest text-[#a6814f]">Edit product</p><p className="font-serif text-xl mt-1">Update listing details</p></div><button onClick={() => setEditingProductId(null)} className="text-xs underline text-[#887d72]">Close</button></div><div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3"><input placeholder="Product name" value={productForm.name} onChange={event => setProductForm({...productForm,name:event.target.value})} className="border border-[#ded5ca] bg-white p-3 text-sm"/><input placeholder="Category" value={productForm.category} onChange={event => setProductForm({...productForm,category:event.target.value})} className="border border-[#ded5ca] bg-white p-3 text-sm"/><input type="number" min="0" placeholder="Price" value={productForm.price} onChange={event => setProductForm({...productForm,price:event.target.value})} className="border border-[#ded5ca] bg-white p-3 text-sm"/><input type="number" min="0" placeholder="Stock" value={productForm.stock} onChange={event => setProductForm({...productForm,stock:event.target.value})} className="border border-[#ded5ca] bg-white p-3 text-sm"/><input placeholder="Image URL or /img/path" value={productForm.image} onChange={event => setProductForm({...productForm,image:event.target.value})} className="sm:col-span-2 border border-[#ded5ca] bg-white p-3 text-sm"/>{productForm.image && <div className="w-16 h-16 border border-[#ded5ca] bg-white p-1"><img src={productForm.image} alt="Product preview" className="w-full h-full object-contain" onError={event => { event.currentTarget.src='/img/product1.jpeg'; }}/></div>}</div><div className="flex justify-end mt-4"><button onClick={saveProduct} className="bg-[#2d2925] text-white px-5 py-3 text-xs uppercase tracking-widest">Save changes</button></div></div>}<div className="bg-[#fbfaf7] border border-[#ded5ca] overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="text-[10px] uppercase tracking-widest text-[#887d72] border-b border-[#ebe4dc]"><th className="p-4 font-normal">Product</th><th className="p-4 font-normal">Category</th><th className="p-4 font-normal">Price</th><th className="p-4 font-normal">Stock</th><th className="p-4 font-normal">Listing ID</th><th className="p-4 font-normal">Actions</th></tr></thead><tbody>{filteredProducts.map(product => <tr key={product._id} className="border-b border-[#ebe4dc] last:border-0"><td className="p-4"><div className="flex items-center gap-3"><div className="w-14 h-14 shrink-0 bg-[#f0ebe4] border border-[#eee8df] p-1"><img src={product.image || product.largeImage || '/img/product1.jpeg'} alt={product.name} className="w-full h-full object-contain" onError={event => { event.currentTarget.src='/img/product1.jpeg'; }}/></div><div><p className="text-sm font-medium">{product.name}</p><p className="text-[10px] text-[#887d72] mt-1">{product.stock < 5 ? 'Low stock' : 'In stock'}</p></div></div></td><td className="p-4 text-sm text-[#74695f]">{product.category}</td><td className="p-4 text-sm">{money(product.price)}</td><td className="p-4 text-sm">{product.stock} units</td><td className="p-4 text-xs text-[#887d72]">{product._id.slice(-8).toUpperCase()}</td><td className="p-4"><div className="flex gap-3 text-xs"><button onClick={() => editProduct(product)} className="text-[#987548] underline underline-offset-2">Edit</button><button onClick={() => void deleteProduct(product._id)} className="text-[#a05d4f] underline underline-offset-2">Remove</button></div></td></tr>)}</tbody></table>{filteredProducts.length===0&&<p className="p-8 text-sm text-[#887d72]">No matching products.</p>}</div></section>}
        {activeTab === 'Collections' && <section className="max-w-3xl"><div className="bg-[#fbfaf7] border border-[#ded5ca] p-6 mb-6"><p className="text-[10px] tracking-[0.25em] uppercase text-[#a6814f]">New chapter</p><div className="grid md:grid-cols-[1fr_1.5fr_auto] gap-3 mt-4"><input placeholder="Collection name" value={collectionForm.name} onChange={(e) => setCollectionForm({ ...collectionForm, name: e.target.value })} className="border border-[#ded5ca] p-3 text-sm bg-transparent" /><input placeholder="Description" value={collectionForm.description} onChange={(e) => setCollectionForm({ ...collectionForm, description: e.target.value })} className="border border-[#ded5ca] p-3 text-sm bg-transparent" /><button onClick={addCollection} className="bg-[#2d2925] text-white px-5 text-xs uppercase tracking-widest">Create</button></div></div>{collections.map((collection) => <div key={collection._id} className="bg-[#fbfaf7] border border-[#ded5ca] p-5 mb-3 flex justify-between"><div><p className="font-serif text-xl">{collection.name}</p><p className="text-sm text-[#887d72] mt-1">{collection.description}</p></div><button onClick={() => deleteCollection(collection._id)} className="text-xs uppercase tracking-widest text-[#a6814f]">Remove</button></div>)}</section>}
        {activeTab === 'Orders' && <section className="bg-[#fbfaf7] border border-[#ded5ca] divide-y divide-[#ebe4dc]">{orders.length === 0 ? <p className="p-8 text-sm text-[#887d72]">No orders have arrived yet.</p> : orders.map((order) => <div key={order.id} className="p-5 flex justify-between"><div><p className="font-medium">{order.customerName}</p><p className="text-xs text-[#887d72] mt-1">{order.email} · {order.items} pieces</p></div><div className="text-right"><p className="font-serif text-lg">{money(order.total)}</p><p className="text-xs uppercase tracking-widest text-[#a6814f] mt-1">{order.status}</p></div></div>)}</section>}
        {activeTab === 'Order Control' && <AdminOrderControl token={localStorage.getItem('shine_admin_token') || ''} />}
        {activeTab === 'Delivery' && <AdminDeliveryManagement token={localStorage.getItem('shine_admin_token') || ''} />}
        {activeTab === 'Sellers' && <AdminSellerManagement token={localStorage.getItem('shine_admin_token') || ''} />}
        {activeTab === 'Clients' && <section className="bg-[#fbfaf7] border border-[#ded5ca] divide-y divide-[#ebe4dc]">{users.length === 0 ? <p className="p-8 text-sm text-[#887d72]">No private clients yet.</p> : users.map((user) => <div key={user._id} className="p-5 flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-10 h-10 border border-[#cfc3b6] flex items-center justify-center"><UserRound className="w-4 h-4 text-[#a6814f]" /></div><div><p className="font-medium">{user.firstName} {user.lastName}</p><p className="text-sm text-[#887d72]">{user.email}</p></div></div><p className="text-xs text-[#887d72]">{new Date(user.createdAt).toLocaleDateString()}</p></div>)}</section>}
      </div>
    </main>
  </div>;
}
