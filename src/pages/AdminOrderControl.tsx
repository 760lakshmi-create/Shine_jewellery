import { useEffect, useState } from 'react';
import { ClipboardList, CreditCard, RefreshCw, RotateCcw } from 'lucide-react';

const API = 'http://localhost:5001/api';
type Log = { provider: string; orderReference?: string; paymentReference?: string; amount: number; status: string; createdAt: string };
type Dispute = { type: string; reason: string; status: string; actor: string; createdAt: string };
type ControlOrder = { id: string; customerName: string; email: string; total: number; status: string; paymentStatus: string; refundRequestedAt?: string; paymentLogs: Log[]; trackingStatus: string; trackingEvents: { status: string; note: string; occurredAt: string }[]; cancelReason?: string; returnStatus: string; returnReason?: string; disputeHistory: Dispute[] };
const money = (amount: number) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

async function request<T>(token: string, path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options?.headers } });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Request failed.');
  return result;
}

export default function AdminOrderControl({ token }: { token: string }) {
  const [orders, setOrders] = useState<ControlOrder[]>([]);
  const [statusDraft, setStatusDraft] = useState<Record<string, string>>({});
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try { const list = await request<ControlOrder[]>(token, '/admin/order-control'); setOrders(list); setStatusDraft(Object.fromEntries(list.map((order) => [order.id, order.status]))); setNotice(''); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Could not load order control.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [token]);

  const saveStatus = async (order: ControlOrder) => {
    try { await request(token, `/admin/orders/${order.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: statusDraft[order.id], note: noteDraft[order.id] || 'Admin updated order status.' }) }); setNotice(`Order ${order.id.slice(-8)} updated.`); await load(); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Could not update order.'); }
  };
  const resolveRefund = async (order: ControlOrder, status: 'refunded' | 'refund_rejected') => {
    const reference = status === 'refunded' ? window.prompt('Razorpay refund reference (optional):') || '' : '';
    try { await request(token, `/admin/orders/${order.id}/refund`, { method: 'PATCH', body: JSON.stringify({ status, reference }) }); await load(); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Could not resolve refund.'); }
  };

  return <div>
    <div className="flex items-center justify-between mb-6"><div><p className="text-[10px] uppercase tracking-[0.25em] text-[#a6814f]">Order operations</p><p className="text-sm text-[#887d72] mt-2">System order control, payment audit records and customer dispute history.</p></div><button onClick={load} aria-label="Refresh order control" className="p-2 text-[#a6814f]"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button></div>
    {notice && <p role="status" className="mb-5 border border-[#ded5ca] bg-[#fbfaf7] p-4 text-sm text-[#74695f]">{notice}</p>}
    {!orders.length && !loading && <div className="bg-[#fbfaf7] border border-[#ded5ca] p-8 text-sm text-[#887d72]">No customer orders yet.</div>}
    <div className="space-y-5">{orders.map((order) => <article key={order.id} className="bg-[#fbfaf7] border border-[#ded5ca] p-5 md:p-7">
      <div className="flex flex-col md:flex-row md:justify-between gap-4"><div><p className="font-serif text-xl">Order #{order.id.slice(-8).toUpperCase()}</p><p className="text-sm mt-1">{order.customerName} · {order.email}</p><p className="text-xs text-[#887d72] mt-1">{money(order.total)} · {order.paymentStatus} · {order.trackingStatus}</p></div><div className="flex flex-wrap items-center gap-2"><select value={statusDraft[order.id] || order.status} onChange={(e) => setStatusDraft({ ...statusDraft, [order.id]: e.target.value })} className="border border-[#ded5ca] bg-white p-2 text-xs"><option value="pending">Pending</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option><option value="fulfilled">Fulfilled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><input value={noteDraft[order.id] || ''} onChange={(e) => setNoteDraft({ ...noteDraft, [order.id]: e.target.value })} placeholder="Admin note" className="border border-[#ded5ca] bg-white p-2 text-xs"/><button onClick={() => saveStatus(order)} className="bg-[#302b25] text-white px-4 py-2 text-xs uppercase tracking-widest">Update</button></div></div>
      <div className="grid lg:grid-cols-2 gap-5 mt-6">
        <section className="border-t border-[#e8e0d6] pt-4"><h3 className="flex items-center gap-2 font-serif text-lg"><CreditCard className="w-4 h-4 text-[#a6814f]"/>Payment log</h3>{order.paymentLogs?.length ? order.paymentLogs.map((log, index) => <div key={index} className="flex justify-between gap-3 py-2 text-xs border-b border-[#eee8df]"><span>{log.provider} · {log.paymentReference || log.orderReference || 'Order payment'} · {new Date(log.createdAt).toLocaleString()}</span><span className="text-right">{money(log.amount)} · {log.status}</span></div>) : <p className="text-xs text-[#887d72] mt-2">No payment events recorded.</p>}{order.refundRequestedAt && <div className="flex gap-2 mt-3"><button onClick={() => resolveRefund(order, 'refunded')} className="bg-[#5e7951] text-white px-3 py-2 text-[10px] uppercase tracking-widest">Mark refunded</button><button onClick={() => resolveRefund(order, 'refund_rejected')} className="border border-[#ded5ca] px-3 py-2 text-[10px] uppercase tracking-widest">Reject refund</button></div>}</section>
        <section className="border-t border-[#e8e0d6] pt-4"><h3 className="flex items-center gap-2 font-serif text-lg"><ClipboardList className="w-4 h-4 text-[#a6814f]"/>Dispute & return history</h3>{order.cancelReason && <p className="text-xs mt-2">Cancellation: {order.cancelReason}</p>}{order.returnStatus !== 'none' && <p className="text-xs mt-2">Return {order.returnStatus}: {order.returnReason}</p>}{order.disputeHistory?.length ? order.disputeHistory.map((entry, index) => <p key={index} className="text-xs py-2 border-b border-[#eee8df]">{entry.type} · {entry.status} · {entry.reason} · {entry.actor} · {new Date(entry.createdAt).toLocaleString()}</p>) : !order.cancelReason && order.returnStatus === 'none' && <p className="text-xs text-[#887d72] mt-2">No disputes or returns.</p>}{order.trackingEvents?.length > 0 && <p className="text-[10px] text-[#887d72] mt-3"><RotateCcw className="inline w-3 h-3 mr-1"/>Latest tracking: {order.trackingEvents[order.trackingEvents.length - 1].status}</p>}</section>
      </div>
    </article>)}</div>
  </div>;
}
