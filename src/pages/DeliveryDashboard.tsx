import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Check, Clock3, LogOut, MapPin, PackageCheck, RefreshCw, Truck, Wallet, X } from 'lucide-react';
import { API_BASE_URL as API } from '@/lib/api';

type Assignment = {
  _id: string;
  decision: 'offered' | 'accepted' | 'rejected';
  status: 'assigned' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'customer_rejected';
  payoutAmount: number;
  paymentStatus: 'pending' | 'paid';
  createdAt: string;
  deliveredAt?: string;
  pickupDate?: string;
  order: {
    _id: string;
    customer: { firstName: string; lastName: string; email: string; address: string; city: string; postalCode: string };
    items: { name: string; quantity: number }[];
    total: number;
    trackingNo?: string;
    courierName?: string;
  };
};
type Rider = { id: string; name: string; email: string };
type RiderStats = { total: number; available: number };
const money = (amount: number) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

async function api<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options?.headers },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Request failed.');
  return result;
}

export default function DeliveryDashboard() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState(() => localStorage.getItem('shine_delivery_token') || '');
  const [rider, setRider] = useState<Rider | null>(() => {
    try { return JSON.parse(localStorage.getItem('shine_delivery_boy') || 'null'); } catch { return null; }
  });
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [riderStats, setRiderStats] = useState<RiderStats>({ total: 0, available: 0 });
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async (session = token) => {
    if (!session) return;
    setLoading(true);
    try {
      const [profile, jobs] = await Promise.all([
        api<Rider>('/delivery/me', session), api<Assignment[]>('/delivery/assignments', session),
      ]);
      setRider(profile); setAssignments(jobs); setNotice('');
    } catch (error) {
      if (error instanceof Error && /sign in|session|inactive|invalid/i.test(error.message)) signOut();
      else setNotice(error instanceof Error ? error.message : 'Could not load deliveries.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (token) load(token);
    const refreshStats = () => fetch(`${API}/delivery/stats`).then((response) => response.json()).then((stats) => setRiderStats(stats)).catch(() => {});
    refreshStats();
    const interval = window.setInterval(refreshStats, 30000);
    return () => window.clearInterval(interval);
  }, []);

  const signOut = () => {
    localStorage.removeItem('shine_delivery_token'); localStorage.removeItem('shine_delivery_boy');
    setToken(''); setRider(null); setAssignments([]);
  };

  const signIn = async (event: FormEvent) => {
    event.preventDefault(); setNotice(''); setLoading(true);
    try {
      const response = await fetch(`${API}/delivery/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Sign in failed.');
      localStorage.setItem('shine_delivery_token', result.token);
      localStorage.setItem('shine_delivery_boy', JSON.stringify(result.deliveryBoy));
      setToken(result.token); setRider(result.deliveryBoy); await load(result.token);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Sign in failed.'); }
    finally { setLoading(false); }
  };

  const signUp = async (event: FormEvent) => {
    event.preventDefault(); setNotice(''); setLoading(true);
    try {
      const response = await fetch(`${API}/delivery/signup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Account creation failed.');
      const statsResponse = await fetch(`${API}/delivery/stats`);
      if (statsResponse.ok) setRiderStats(await statsResponse.json());
      setPassword(''); setMode('login'); setNotice('Account created. Sign in with your email and password.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Account creation failed.'); }
    finally { setLoading(false); }
  };

  const act = async (job: Assignment, path: string, body: Record<string, string>) => {
    try { await api(`/delivery/assignments/${job._id}/${path}`, token, { method: 'PATCH', body: JSON.stringify(body) }); await load(); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Could not update delivery.'); }
  };

  const active = useMemo(() => assignments.filter((job) => job.decision === 'accepted' && !['delivered', 'customer_rejected'].includes(job.status)), [assignments]);
  const offers = useMemo(() => assignments.filter((job) => job.decision === 'offered'), [assignments]);
  const history = useMemo(() => assignments.filter((job) => job.decision === 'rejected' || ['delivered', 'customer_rejected'].includes(job.status)), [assignments]);
  const completedPayout = history.filter((job) => job.status === 'delivered').reduce((sum, job) => sum + job.payoutAmount, 0);
  const stats = [
    { value: offers.length, label: 'New offers', Icon: PackageCheck },
    { value: active.length, label: 'Active deliveries', Icon: Truck },
    { value: history.filter((job) => job.status === 'delivered').length, label: 'Completed', Icon: Check },
    { value: money(completedPayout), label: 'Earned delivery pay', Icon: Wallet },
  ];

  if (!token) return <div className="min-h-screen bg-[#f6f2ec] text-[#29241f] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md bg-[#fbfaf7] border border-[#ded5ca] p-8 md:p-12">
      <button onClick={() => setLocation('/')} className="text-[10px] uppercase tracking-[0.28em] text-[#a6814f]">Shine Jewelry</button>
      <Truck className="w-7 h-7 text-[#a6814f] mt-12 mb-5" strokeWidth={1.4} />
      <p className="text-[10px] uppercase tracking-[0.25em] text-[#a6814f]">Delivery partner access</p>
      <h1 className="font-serif text-4xl mt-2">{mode === 'login' ? 'Rider sign in' : 'Join as a rider'}</h1>
      <p className="text-sm text-[#887d72] mt-3">{mode === 'login' ? 'Sign in to manage offers, active deliveries and payouts.' : 'Create your delivery partner account to receive order offers.'}</p>
      <div className="grid grid-cols-2 gap-px bg-[#ded5ca] border border-[#ded5ca] my-6"><div className="bg-[#f6f2ec] p-3"><p className="text-[9px] uppercase tracking-widest text-[#887d72]">Delivery partners</p><p className="font-serif text-xl mt-1">{riderStats.total}</p></div><div className="bg-[#f6f2ec] p-3"><p className="text-[9px] uppercase tracking-widest text-[#887d72]">Available now</p><p className="font-serif text-xl mt-1">{riderStats.available}</p></div></div>
      <form onSubmit={mode === 'login' ? signIn : signUp} className="space-y-4">
        {mode === 'signup' && <input required minLength={2} autoComplete="name" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent border border-[#ded5ca] p-4 text-sm outline-none focus:border-[#a6814f]" />}
        <input required type="email" autoComplete="username" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent border border-[#ded5ca] p-4 text-sm outline-none focus:border-[#a6814f]" />
        <input required minLength={mode === 'signup' ? 8 : undefined} type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder={mode === 'signup' ? 'Password (at least 8 characters)' : 'Password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent border border-[#ded5ca] p-4 text-sm outline-none focus:border-[#a6814f]" />
        {notice && <p role="alert" className={`text-sm ${notice.startsWith('Account created') ? 'text-emerald-700' : 'text-red-700'}`}>{notice}</p>}
        <button disabled={loading} className="w-full bg-[#2d2925] text-white py-4 text-xs uppercase tracking-[0.2em] disabled:opacity-60">{loading ? 'Please wait…' : mode === 'login' ? 'Open delivery desk' : 'Create delivery account'}</button>
      </form>
      <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setNotice(''); }} className="mt-5 text-sm text-[#a6814f] underline underline-offset-4">{mode === 'login' ? 'New delivery partner? Create account' : 'Already registered? Sign in'}</button>
    </div>
  </div>;

  return <div className="min-h-screen bg-[#f6f2ec] text-[#29241f]">
    <header className="bg-[#2d2925] text-[#f6f2ec] px-5 md:px-10 py-5 flex items-center justify-between">
      <div><p className="text-[10px] uppercase tracking-[0.28em] text-[#bda57e]">Shine Jewelry / Delivery desk</p><h1 className="font-serif text-2xl mt-1">Welcome, {rider?.name || 'Rider'}</h1></div>
      <div className="flex gap-3 items-center"><button onClick={() => load()} aria-label="Refresh" className="p-2 text-[#d8cec2]"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button><button onClick={signOut} className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#d8cec2]"><LogOut className="w-4 h-4" /><span className="hidden sm:inline">Sign out</span></button></div>
    </header>
    <main className="max-w-6xl mx-auto px-5 md:px-10 py-8 md:py-12">
      {notice && <div role="alert" className="mb-6 border border-[#c58b76] bg-[#fbebe5] text-[#814637] p-4 text-sm">{notice}</div>}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#dcd2c7] border border-[#dcd2c7] mb-10">
        {stats.map(({ value, label, Icon }) => <div key={label} className="bg-[#fbfaf7] p-5 md:p-7"><Icon className="w-5 h-5 text-[#a6814f] mb-6" strokeWidth={1.4} /><p className="text-[10px] uppercase tracking-widest text-[#887d72]">{label}</p><p className="font-serif text-2xl md:text-3xl mt-2">{value}</p></div>)}
      </section>
      <Section title="Delivery offers" icon={<Clock3 className="w-4 h-4" />} empty="No new delivery offers.">
        {offers.map((job) => <JobCard key={job._id} job={job} footer={<div className="flex gap-2"><button onClick={() => act(job, 'decision', { decision: 'accepted' })} className="bg-[#2d2925] text-white px-4 py-2 text-xs uppercase tracking-widest"><Check className="w-3.5 h-3.5 inline mr-2" />Accept</button><button onClick={() => act(job, 'decision', { decision: 'rejected' })} className="border border-[#ded5ca] px-4 py-2 text-xs uppercase tracking-widest"><X className="w-3.5 h-3.5 inline mr-2" />Reject</button></div>} />)}
      </Section>
      <Section title="Active deliveries" icon={<Truck className="w-4 h-4" />} empty="Accepted deliveries will appear here.">
        {active.map((job) => {
          const footer = job.status === 'out_for_delivery'
            ? <div className="flex flex-wrap items-center gap-3"><span className="text-xs text-[#887d72]">Waiting for customer to accept or reject receipt</span><button onClick={() => void load()} className="border border-[#ded5ca] px-3 py-2 text-[10px] uppercase tracking-widest">Refresh status</button></div>
            : <div className="flex flex-wrap items-center gap-3"><span className="text-xs uppercase tracking-wider text-[#887d72]">{job.status.replaceAll('_', ' ')}</span><button disabled={!job.pickupDate} onClick={() => act(job, 'status', { status: 'out_for_delivery' })} className="bg-[#2d2925] text-white px-4 py-2 text-xs uppercase tracking-widest disabled:opacity-50">{job.pickupDate ? 'Start delivery' : 'Waiting for seller pickup'}</button></div>;
          return <JobCard key={job._id} job={job} footer={footer} />;
        })}
      </Section>
      <Section title="Delivery history & payouts" icon={<Wallet className="w-4 h-4" />} empty="Completed deliveries and payout records will appear here.">
        {history.map((job) => <JobCard key={job._id} job={job} compact footer={<div className="text-right"><p className="font-serif text-lg">{money(job.payoutAmount)}</p><p className={`text-[10px] uppercase tracking-widest mt-1 ${job.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-[#a6814f]'}`}>{job.paymentStatus === 'paid' ? 'Paid' : job.status === 'customer_rejected' ? 'Customer declined' : 'Payout pending'}</p></div>} />)}
      </Section>
    </main>
  </div>;
}

function Section({ title, icon, empty, children }: { title: string; icon: ReactNode; empty: string; children: ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <section className="mb-10"><div className="flex items-center gap-3 mb-4 text-[#a6814f]">{icon}<h2 className="font-serif text-2xl text-[#29241f]">{title}</h2></div><div className="bg-[#fbfaf7] border border-[#ded5ca] divide-y divide-[#ebe4dc]">{hasChildren ? children : <p className="p-6 text-sm text-[#887d72]">{empty}</p>}</div></section>;
}

function JobCard({ job, footer, compact = false }: { job: Assignment; footer: ReactNode; compact?: boolean }) {
  const order = job.order;
  return <article className={`p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 ${compact ? 'py-4' : ''}`}>
    <div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><p className="font-medium">Order #{order._id.slice(-7).toUpperCase()}</p><span className="text-[10px] uppercase tracking-widest text-[#a6814f]">{job.status.replaceAll('_', ' ')}</span></div>
      <p className="text-sm text-[#74695f] mt-1">{order.customer.firstName} {order.customer.lastName} · {order.items.reduce((count, item) => count + item.quantity, 0)} items</p>
      {!compact && <><p className="flex items-start gap-2 text-sm text-[#74695f] mt-3"><MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#a6814f]" />{order.customer.address}, {order.customer.city} {order.customer.postalCode}</p><p className="text-xs text-[#887d72] mt-2">Order value {money(order.total)} · Delivery pay {money(job.payoutAmount)}{order.courierName ? ` · ${order.courierName} ${order.trackingNo || ''}` : ''}</p>{job.pickupDate&&<p className="text-xs text-[#987548] mt-2">Seller confirmed pickup · {new Date(job.pickupDate).toLocaleString()}</p>}</>}
    </div><div className="shrink-0">{footer}</div>
  </article>;
}
