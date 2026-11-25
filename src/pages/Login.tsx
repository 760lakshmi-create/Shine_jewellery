import { FormEvent, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL as API } from '@/lib/api';

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    try {
      const response = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Login failed');
      if (!result.token) throw new Error('Login session was not created. Please try again.');
      login(result.user, result.token);
      setLocation('/profile');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-36 pb-24 min-h-screen bg-muted/10">
      <div className="max-w-md mx-auto px-6">
        <h1 className="font-serif text-4xl mb-3">Welcome Back</h1>
        <p className="text-muted-foreground mb-10">Sign in to view your Shine Jewelry profile.</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input required type="email" placeholder="Email address" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} className="w-full bg-background border border-border p-4 text-sm" />
          <input required type="password" placeholder="Password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} className="w-full bg-background border border-border p-4 text-sm" />
          {message && <p className="text-sm text-destructive">{message}</p>}
          <Button disabled={isSubmitting} className="w-full h-14 rounded-none uppercase tracking-widest text-xs">{isSubmitting ? 'Signing in...' : 'Sign In'}</Button>
        </form>
        <p className="text-sm text-muted-foreground mt-8">New client? <Link href="/signup" className="text-foreground underline">Create an account</Link></p>
      </div>
    </div>
  );
}
