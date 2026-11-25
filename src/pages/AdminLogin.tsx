import { FormEvent, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    try {
      const response = await fetch('http://localhost:5001/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Login failed');
      localStorage.setItem('shine_admin', JSON.stringify(result.admin));
      localStorage.setItem('shine_admin_token', result.token);
      setLocation('/admin');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f1eb] text-[#28231f] flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr_0.9fr] bg-[#fbfaf7] shadow-[0_24px_80px_rgba(66,48,35,0.14)]">
        <div className="hidden lg:flex min-h-[600px] p-14 bg-[#28231f] text-[#f5f1eb] flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full border border-[#c8a979]/30" />
          <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full border border-[#c8a979]/20" />
          <div><p className="text-xs tracking-[0.35em] uppercase text-[#c8a979]">Shine Jewelry</p><p className="font-serif text-5xl leading-tight mt-8">The house<br />behind the glow.</p></div>
          <div><div className="w-12 h-px bg-[#c8a979] mb-5" /><p className="text-sm text-[#d8cec2] max-w-xs leading-7">A quiet room for the people who shape every detail of the maison.</p></div>
        </div>
        <div className="p-8 sm:p-14 lg:p-16 flex flex-col justify-center">
          <Link href="/" className="text-xs tracking-[0.2em] uppercase text-[#8a6c43] mb-16">Back to storefront</Link>
          <LockKeyhole className="w-6 h-6 text-[#a6814f] mb-6" strokeWidth={1.5} />
          <p className="text-xs tracking-[0.3em] uppercase text-[#a6814f]">Private access</p>
          <h1 className="font-serif text-4xl sm:text-5xl mt-3 mb-4">Admin sign in</h1>
          <p className="text-sm text-[#7c7168] leading-6 mb-9">Enter the house credentials to continue to your dashboard.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required type="email" placeholder="Admin email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full bg-transparent border border-[#d9d0c6] p-4 text-sm outline-none focus:border-[#a6814f]" />
            <input required type="password" placeholder="Admin password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full bg-transparent border border-[#d9d0c6] p-4 text-sm outline-none focus:border-[#a6814f]" />
            {message && <p className="text-sm text-red-700">{message}</p>}
            <Button disabled={isSubmitting} className="w-full h-14 rounded-none bg-[#28231f] hover:bg-[#a6814f] text-white uppercase tracking-[0.2em] text-xs">{isSubmitting ? 'Verifying...' : 'Enter dashboard'}<ArrowRight className="w-4 h-4 ml-3" /></Button>
          </form>
        </div>
      </div>
    </div>
  );
}
