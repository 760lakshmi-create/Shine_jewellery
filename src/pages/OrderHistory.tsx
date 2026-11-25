import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Package, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
type HistoryOrder = {
  id: string;
  total: number;
  paymentStatus: string;
  status: string;
  trackingStatus: string;
  createdAt: string;
  items: { id: string; name: string; quantity: number; image?: string }[];
};
const money = (amount: number) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
const prettyStatus = (status: string) => (status || 'order_placed').replaceAll('_', ' ');

export default function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      const token = localStorage.getItem('shine_customer_token');
      if (!user || !token) { setError('Please sign in again to view your order history.'); setLoading(false); return; }
      try {
        const response = await fetch(`${API}/customer/orders`, { headers: { Authorization: `Bearer ${token}` } });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not load your orders.');
        if (active) setOrders(Array.isArray(result.orders) ? result.orders : []);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load your orders.');
      } finally { if (active) setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [user]);

  return <main className="min-h-screen bg-[#f7f4ef] pt-32 pb-20 px-4 text-[#2d2925]">
    <div className="max-w-4xl mx-auto">
      <Link href="/profile" className="text-xs uppercase tracking-widest text-[#987548]">Back to profile</Link>
      <div className="flex flex-wrap justify-between items-end gap-4 mt-5 mb-8"><div><p className="text-[10px] uppercase tracking-[0.3em] text-[#a6814f]">Private client</p><h1 className="font-serif text-4xl md:text-5xl mt-2">Your orders</h1><p className="text-sm text-[#81776d] mt-2">Order history and delivery progress for {user?.email}.</p></div><span className="text-sm text-[#81776d]">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span></div>

      {loading && <div className="bg-white border border-[#e2dacf] p-8 flex items-center gap-3 text-sm text-[#81776d]"><RefreshCw className="w-4 h-4 animate-spin"/>Loading your orders…</div>}
      {!loading && error && <div role="alert" className="bg-white border border-[#e2dacf] p-8"><p className="text-sm text-[#8a3f4f]">{error}</p><Link href="/login" className="inline-block mt-4 text-sm underline text-[#987548]">Sign in again</Link></div>}
      {!loading && !error && orders.length === 0 && <div className="bg-white border border-[#e2dacf] p-10 text-center"><Package className="w-8 h-8 mx-auto text-[#a6814f]"/><h2 className="font-serif text-2xl mt-4">No orders yet</h2><p className="text-sm text-[#81776d] mt-2">Orders placed with this account email will appear here.</p><Link href="/collections" className="inline-flex items-center gap-2 mt-6 bg-[#302b25] text-white px-5 py-3 text-xs uppercase tracking-widest">Explore collection <ArrowRight className="w-4 h-4"/></Link></div>}
      {!loading && !error && orders.length > 0 && <div className="space-y-4">{orders.map((order) => <article key={order.id} className="bg-white border border-[#e2dacf] p-5 md:p-6">
        <div className="flex flex-wrap justify-between gap-3 border-b border-[#eee8df] pb-4"><div className="flex items-center gap-3 min-w-0">{order.items[0]?.image ? <img src={order.items[0].image} alt={order.items[0].name} className="w-14 h-14 shrink-0 object-cover bg-[#f7f4ef] border border-[#eee8df]" onError={event => { event.currentTarget.src='/img/product1.jpeg'; }}/> : <div className="w-14 h-14 shrink-0 bg-[#f7f4ef] grid place-items-center"><Package className="w-4 h-4 text-[#a6814f]"/></div>}<div><p className="text-[10px] uppercase tracking-widest text-[#81776d]">Order placed {new Date(order.createdAt).toLocaleDateString()}</p><p className="text-sm font-medium mt-1">Order #{order.id.slice(-8).toUpperCase()}</p></div></div><div className="text-right"><p className="font-serif text-xl">{money(order.total)}</p><p className="text-[10px] uppercase tracking-widest text-[#5e7951] mt-1">Payment {prettyStatus(order.paymentStatus)}</p></div></div>
        <div className="divide-y divide-[#eee8df]">{order.items.map((item, index) => <div key={`${item.id}-${index}`} className="flex items-center gap-3 py-3"><div className="w-12 h-12 bg-[#f7f4ef] overflow-hidden shrink-0">{item.image ? <img src={item.image} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full grid place-items-center"><Package className="w-4 h-4 text-[#a6814f]"/></div>}</div><div className="min-w-0 flex-1"><p className="text-sm truncate">{item.name}</p><p className="text-xs text-[#81776d] mt-1">Qty {item.quantity}</p></div></div>)}</div>
        <div className="flex flex-wrap justify-between items-center gap-3 border-t border-[#eee8df] pt-4"><p className="text-sm capitalize"><span className="text-[#81776d]">Delivery status </span><strong>{prettyStatus(order.trackingStatus)}</strong></p><Link href={`/track-order/${order.id}`} className="inline-flex items-center gap-2 border border-[#ded6ca] px-4 py-2 text-[10px] uppercase tracking-widest hover:border-[#987548]">Track order <ArrowRight className="w-3.5 h-3.5"/></Link></div>
      </article>)}</div>}
    </div>
  </main>;
}
