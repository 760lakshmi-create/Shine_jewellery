import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { Check, Clock3, PackageCheck, RotateCcw, ShieldCheck, Truck } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
type TrackingEvent = { status: string; note: string; occurredAt: string };
type TrackedOrder = {
  id: string;
  customerName: string;
  email: string;
  items: { id: string; name: string; quantity: number; price: number; image: string }[];
  total: number;
  paymentStatus: string;
  status: string;
  trackingStatus: string;
  trackingEvents: TrackingEvent[];
  estimatedDeliveryAt?: string;
  courierName?: string;
  trackingNo?: string;
  deliveryAddress?: string;
  deliveryPartner?: { name: string; phone?: string } | null;
  cancelReason?: string;
  returnStatus: string;
  returnReason?: string;
  returnPickupDate?: string;
  cancellationAllowed: boolean;
  returnAllowed: boolean;
};
const money = (amount: number) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
const label = (value: string) => value.replaceAll('_', ' ');

const deliverySteps = [
  { key: 'order_placed', title: 'Order placed', hint: 'We received your order', Icon: Check },
  { key: 'shipped', title: 'Shipped', hint: 'Handed to delivery partner', Icon: PackageCheck },
  { key: 'out_for_delivery', title: 'Out for delivery', hint: 'Your order is on its way', Icon: Truck },
  { key: 'delivered', title: 'Delivered', hint: 'Order delivered to you', Icon: ShieldCheck },
];

function DeliveryProgress({ order }: { order: TrackedOrder }) {
  const status = order.trackingStatus || 'order_placed';
  const currentStep = status === 'delivered' ? 3
    : status === 'out_for_delivery' ? 2
    : ['shipped', 'in_transit'].includes(status) ? 1
    : 0;
  const exceptional = ['cancelled', 'returned', 'exception'].includes(status);
  const eventAt = (keys: string[]) => order.trackingEvents?.find((event) => keys.includes(event.status))?.occurredAt;
  const eventDates = [eventAt(['order_placed']), eventAt(['shipped', 'in_transit']), eventAt(['out_for_delivery']), eventAt(['delivered'])];

  return <section className="bg-white border border-[#e2dacf] p-6 md:p-8 mb-6">
    <div className="flex flex-wrap justify-between items-start gap-3">
      <div><p className="text-[10px] uppercase tracking-widest text-[#a6814f]">Delivery progress</p><h3 className="font-serif text-2xl mt-1">{exceptional ? `Order ${label(status)}` : deliverySteps[currentStep].title}</h3></div>
      {order.estimatedDeliveryAt && !['delivered', 'cancelled', 'returned'].includes(status) && <p className="text-sm text-[#665b50]">Expected by <strong>{new Date(order.estimatedDeliveryAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</strong></p>}
    </div>
    {exceptional ? <div className="mt-6 border border-[#e8d8c9] bg-[#fbf5ef] p-4"><p className="capitalize font-medium">{label(status)}</p><p className="text-sm text-[#81776d] mt-1">{order.cancelReason || (status === 'returned' ? 'This order has been returned.' : 'Please contact customer support for an update.')}</p></div> : <div className="relative mt-9 grid grid-cols-4 gap-2">
      <div className="absolute left-[12.5%] right-[12.5%] top-4 h-1 bg-[#e9e2d9]" />
      <div className="absolute left-[12.5%] top-4 h-1 bg-[#5e7951] transition-all" style={{ width: `${(currentStep / 3) * 75}%` }} />
      {deliverySteps.map(({ key, title, hint, Icon }, index) => {
        const complete = index <= currentStep;
        const occurredAt = eventDates[index];
        return <div key={key} className="relative z-10 flex flex-col items-center text-center">
          <span className={`w-9 h-9 rounded-full grid place-items-center ring-4 ring-white ${complete ? 'bg-[#5e7951] text-white' : 'bg-[#e9e2d9] text-[#897f73]'}`}><Icon className="w-4 h-4"/></span>
          <p className={`mt-3 text-[11px] sm:text-sm font-medium ${complete ? 'text-[#302b25]' : 'text-[#93897e]'}`}>{title}</p>
          <p className="hidden sm:block text-[11px] text-[#81776d] mt-1">{hint}</p>
          {occurredAt && <p className="text-[10px] text-[#81776d] mt-1">{new Date(occurredAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>}
        </div>;
      })}
    </div>}
    <div className="mt-7 grid sm:grid-cols-2 gap-3 border-t border-[#eee8df] pt-5 text-sm">
      <div><p className="text-[10px] uppercase tracking-widest text-[#81776d]">Delivery partner</p><p className="mt-1">{order.courierName || 'Shine delivery partner'}</p></div>
      {order.trackingNo && <div><p className="text-[10px] uppercase tracking-widest text-[#81776d]">Tracking number</p><p className="mt-1 font-medium">{order.trackingNo}</p></div>}
    </div>
  </section>;
}

export default function OrderTracking() {
  const [, params] = useRoute('/track-order/:id');
  const orderId = params?.id || '';
  const [email, setEmail] = useState(() => sessionStorage.getItem('shine_tracking_email') || '');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [reason, setReason] = useState('');
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().slice(0, 10));
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'cancel' | 'return' | null>(null);

  const loadOrder = useCallback(async (lookupEmail = email, quiet = false) => {
    if (!orderId || !lookupEmail) return;
    if (!quiet) setLoading(true);
    try {
      const response = await fetch(`${API}/orders/${encodeURIComponent(orderId)}/track?email=${encodeURIComponent(lookupEmail)}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not find this order.');
      setOrder(result); setNotice(''); sessionStorage.setItem('shine_tracking_email', lookupEmail);
    } catch (error) {
      if (!quiet) { setOrder(null); setNotice(error instanceof Error ? error.message : 'Could not load order tracking.'); }
    } finally { if (!quiet) setLoading(false); }
  }, [orderId, email]);

  useEffect(() => {
    if (!email) return;
    void loadOrder(email);
    const timer = window.setInterval(() => void loadOrder(email, true), 20000);
    return () => window.clearInterval(timer);
  }, [email, loadOrder]);

  const lookup = async (event: FormEvent) => { event.preventDefault(); await loadOrder(email); };
  const submitAction = async (event: FormEvent) => {
    event.preventDefault(); if (!order || !action) return;
    setLoading(true); setNotice('');
    try {
      const response = await fetch(`${API}/orders/${encodeURIComponent(order.id)}/${action}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, reason }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `Could not ${action} this order.`);
      setReason(''); setAction(null); await loadOrder(email);
      setNotice(action === 'cancel' ? 'Cancellation request completed.' : 'Return request sent to the seller.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not update the order.'); }
    finally { setLoading(false); }
  };

  const acceptReturnPickup = async () => {
    if (!order) return;
    setLoading(true); setNotice('');
    try {
      const response = await fetch(`${API}/orders/${encodeURIComponent(order.id)}/return/pickup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, pickupDate }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not accept pickup date.');
      await loadOrder(email); setNotice('Return pickup date confirmed. The seller will complete the return after receiving the item.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not schedule the return pickup.'); }
    finally { setLoading(false); }
  };

  const decideDelivery = async (decision: 'accepted' | 'rejected') => {
    if (!order) return;
    if (decision === 'rejected' && !window.confirm('Reject this delivery? The order will be cancelled and any eligible refund will be requested.')) return;
    setLoading(true); setNotice('');
    try {
      const response = await fetch(`${API}/orders/${encodeURIComponent(order.id)}/delivery/decision`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, decision }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not save your delivery decision.');
      await loadOrder(email);
      setNotice(decision === 'accepted' ? 'Delivery confirmed. Your order is marked delivered.' : 'Delivery rejected. The order has been cancelled and the seller will process any eligible refund.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not save your delivery decision.'); }
    finally { setLoading(false); }
  };

  return <main className="min-h-screen bg-[#f1f3f6] pt-32 pb-20 px-4 text-[#24272c]">
    <div className="max-w-5xl mx-auto">
      <div className="mb-7"><p className="text-xs text-[#68717d]">My account <span className="mx-2">›</span> My orders <span className="mx-2">›</span> Track order</p><h1 className="font-serif text-4xl md:text-5xl mt-3">Track your order</h1><p className="text-sm text-[#68717d] mt-2">See the latest delivery updates and estimated arrival.</p></div>
      <form onSubmit={lookup} className="bg-white border border-[#e1e5e9] shadow-sm p-5 md:p-6 grid md:grid-cols-[1fr_1.4fr_auto] gap-3 items-end mb-5">
        <label className="block text-[10px] uppercase tracking-widest text-[#81776d]">Order number<input readOnly value={orderId} className="mt-2 w-full border border-[#ded6ca] bg-[#f7f4ef] p-3 text-sm normal-case tracking-normal" /></label>
        <label className="block text-[10px] uppercase tracking-widest text-[#81776d]">Checkout email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full border border-[#ded6ca] bg-white p-3 text-sm normal-case tracking-normal" /></label>
        <button disabled={loading} className="bg-[#302b25] text-white px-6 py-3 text-xs uppercase tracking-widest disabled:opacity-60">{loading ? 'Loading…' : 'Find order'}</button>
      </form>
      {notice && <p role="status" className="mb-6 border border-[#ded6ca] bg-white p-4 text-sm text-[#75695f]">{notice}</p>}
      {order && <>
        <DeliveryProgress order={order}/>
        <section className="bg-white border border-[#e1e5e9] shadow-sm p-6 md:p-8 mb-5">
          <div className="flex flex-wrap justify-between gap-4"><div className="flex items-center gap-3"><img src={order.items[0]?.image || '/img/product1.jpeg'} alt={order.items[0]?.name || 'Order item'} className="w-14 h-14 object-cover bg-[#f7f4ef] border border-[#e1e5e9]" onError={event => { event.currentTarget.src='/img/product1.jpeg'; }}/><div><p className="text-[10px] uppercase tracking-widest text-[#a6814f]">Order confirmed</p><h2 className="font-serif text-2xl mt-1">#{order.id.slice(-8).toUpperCase()}</h2><p className="text-sm text-[#81776d] mt-2">{order.customerName} · {new Date(order.trackingEvents?.[0]?.occurredAt || Date.now()).toLocaleDateString()}</p></div></div><div className="text-right"><p className="font-serif text-2xl">{money(order.total)}</p><p className="text-xs uppercase tracking-widest text-emerald-700 mt-2">Payment {order.paymentStatus}</p></div></div>
          <div className="mt-7 grid sm:grid-cols-3 gap-4 bg-[#f7f4ef] p-5"><div><p className="text-[10px] uppercase tracking-widest text-[#81776d]">Current status</p><p className="capitalize font-medium mt-2">{label(order.trackingStatus)}</p></div><div><p className="text-[10px] uppercase tracking-widest text-[#81776d]">Estimated delivery</p><p className="mt-2">{order.estimatedDeliveryAt ? new Date(order.estimatedDeliveryAt).toLocaleDateString() : 'Being prepared'}</p></div><div><p className="text-[10px] uppercase tracking-widest text-[#81776d]">Courier tracking</p><p className="mt-2">{order.courierName ? `${order.courierName} · ${order.trackingNo || ''}` : 'Shine delivery partner'}</p></div></div>
          {order.trackingStatus === 'out_for_delivery' && <div className="mt-6 border border-[#c9d9ef] bg-[#f3f8ff] p-5 md:p-6">
            <div className="flex items-start gap-3"><Truck className="w-6 h-6 text-[#2874a6] mt-1"/><div><p className="text-xs uppercase tracking-widest text-[#2874a6]">Delivery confirmation</p><h3 className="font-serif text-2xl mt-1">Your order is out for delivery</h3><p className="text-sm text-[#68717d] mt-2">Review the delivery and order details below. Accept after you receive the complete order, or reject if you do not want to receive it.</p></div></div>
            <div className="grid sm:grid-cols-2 gap-4 mt-5 border-t border-[#dce8f6] pt-4 text-sm"><div><p className="text-[10px] uppercase tracking-widest text-[#68717d]">Delivery partner</p><p className="mt-1">{order.deliveryPartner?.name || order.courierName || 'Shine delivery partner'}</p>{order.deliveryPartner?.phone && <p className="text-[#2874a6] mt-1">{order.deliveryPartner.phone}</p>}</div><div><p className="text-[10px] uppercase tracking-widest text-[#68717d]">Delivering to</p><p className="mt-1">{order.deliveryAddress || `${order.customerName}`}</p></div><div><p className="text-[10px] uppercase tracking-widest text-[#68717d]">Order total</p><p className="mt-1 font-medium">{money(order.total)} · {order.items.reduce((count, item) => count + item.quantity, 0)} item(s)</p></div><div><p className="text-[10px] uppercase tracking-widest text-[#68717d]">Items</p><p className="mt-1">{order.items.map((item) => `${item.name} × ${item.quantity}`).join(', ')}</p></div></div>
            <div className="flex flex-wrap gap-3 mt-5"><button disabled={loading} onClick={() => void decideDelivery('accepted')} className="bg-[#287a4b] text-white px-5 py-3 text-xs uppercase tracking-widest disabled:opacity-50">Accept delivery</button><button disabled={loading} onClick={() => void decideDelivery('rejected')} className="border border-[#c9d9ef] bg-white text-[#394b60] px-5 py-3 text-xs uppercase tracking-widest disabled:opacity-50">Reject delivery</button></div>
          </div>}
          <div className="mt-8"><h3 className="font-serif text-2xl mb-5">Tracking history</h3><div className="space-y-0">{(order.trackingEvents || []).map((event, index) => <div key={`${event.status}-${index}`} className="flex gap-4 pb-6 last:pb-0"><div className="flex flex-col items-center"><span className={`w-8 h-8 rounded-full grid place-items-center ${index === (order.trackingEvents.length - 1) ? 'bg-[#302b25] text-white' : 'bg-[#eee8df] text-[#8b7d6b]'}`}>{index === order.trackingEvents.length - 1 ? <Truck className="w-4 h-4"/> : <Check className="w-4 h-4"/>}</span>{index < order.trackingEvents.length - 1 && <span className="w-px flex-1 bg-[#ded6ca] mt-1"/>}</div><div className="pt-1"><p className="capitalize text-sm font-medium">{label(event.status)}</p><p className="text-sm text-[#81776d] mt-1">{event.note}</p><p className="text-xs text-[#a69a8e] mt-1">{new Date(event.occurredAt).toLocaleString()}</p></div></div>)}</div></div>
        </section>
        <section className="bg-white border border-[#e2dacf] p-6 md:p-8 mb-6"><div className="flex items-center gap-2 mb-4"><PackageCheck className="w-5 h-5 text-[#a6814f]"/><h3 className="font-serif text-2xl">Items in this order</h3></div>{order.items.map((item) => <div key={item.id} className="flex justify-between border-t border-[#eee8df] py-3 text-sm"><span>{item.name} × {item.quantity}</span><span>{money(item.price * item.quantity)}</span></div>)}</section>
        <section className="bg-white border border-[#e1e5e9] shadow-sm p-6 md:p-8">
          <h3 className="font-serif text-2xl">Order help</h3>
          {order.cancellationAllowed && <button onClick={() => { setAction('cancel'); setReason(''); }} className="mt-4 mr-3 border border-[#ded6ca] px-4 py-2 text-xs uppercase tracking-widest">Cancel order</button>}
          {order.returnAllowed && <button onClick={() => { setAction('return'); setReason(''); }} className="mt-4 border border-[#ded6ca] px-4 py-2 text-xs uppercase tracking-widest"><RotateCcw className="w-3.5 h-3.5 inline mr-2"/>Request return</button>}
          {order.cancelReason && <p className="mt-4 text-sm text-[#81776d]">Cancellation reason: {order.cancelReason}</p>}
          {order.returnStatus !== 'none' && <div className="mt-5 border-t border-[#eee8df] pt-5"><p className="text-sm"><span className="capitalize font-medium">Return {label(order.returnStatus)}</span>{order.returnReason ? ` · ${order.returnReason}` : ''}</p>{order.returnStatus === 'accepted' && <div className="mt-4 flex flex-wrap items-end gap-3"><label className="text-[10px] uppercase tracking-widest text-[#81776d]">Choose return pickup date<input type="date" min={new Date().toISOString().slice(0,10)} value={pickupDate} onChange={(event) => setPickupDate(event.target.value)} className="block mt-2 border border-[#ded6ca] bg-white p-3 text-sm" /></label><button onClick={acceptReturnPickup} disabled={loading} className="bg-[#302b25] text-white px-5 py-3 text-xs uppercase tracking-widest disabled:opacity-60">Accept pickup</button></div>}{order.returnStatus === 'pickup_scheduled' && <p className="text-sm text-[#81776d] mt-2">Pickup date: {order.returnPickupDate ? new Date(order.returnPickupDate).toLocaleDateString() : 'Confirmed'}. Waiting for seller to receive the return.</p>}</div>}
          {action && <form onSubmit={submitAction} className="mt-5 border-t border-[#eee8df] pt-5"><label className="block text-[10px] uppercase tracking-widest text-[#81776d]">{action === 'cancel' ? 'Why are you cancelling?' : 'Why are you returning this item?'}<textarea required minLength={5} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 block w-full min-h-24 border border-[#ded6ca] p-3 text-sm normal-case tracking-normal" placeholder="Please share a short reason (required)." /></label><div className="flex gap-3 mt-3"><button disabled={loading} className="bg-[#302b25] text-white px-5 py-3 text-xs uppercase tracking-widest">Submit {action === 'cancel' ? 'cancellation' : 'return'}</button><button type="button" onClick={() => setAction(null)} className="border border-[#ded6ca] px-5 py-3 text-xs uppercase tracking-widest">Keep order</button></div></form>}
          {!order.cancellationAllowed && !order.returnAllowed && order.returnStatus === 'none' && <p className="text-sm text-[#81776d] mt-3">No cancellation or return action is available for this order at its current stage.</p>}
        </section>
      </>}
      {!order && !notice && !loading && <div className="text-center py-10 text-[#81776d]"><Clock3 className="w-7 h-7 mx-auto mb-3"/><p>Enter the email used at checkout to view order tracking.</p></div>}
    </div>
  </main>;
}
