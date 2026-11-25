import { FormEvent, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { API_BASE_URL as API } from '@/lib/api';

export default function Signup() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    try {
      const response = await fetch(`${API}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Signup failed');
      setLocation('/login');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Signup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-36 pb-24 min-h-screen bg-muted/10">
      <div className="max-w-md mx-auto px-6">
        <h1 className="font-serif text-4xl mb-3">Create Your Account</h1>
        <p className="text-muted-foreground mb-10">Join the Shine Jewelry private client list.</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <input required name="firstName" placeholder="First name" value={formData.firstName} onChange={(event) => setFormData({ ...formData, firstName: event.target.value })} className="bg-background border border-border p-4 text-sm" />
            <input required name="lastName" placeholder="Last name" value={formData.lastName} onChange={(event) => setFormData({ ...formData, lastName: event.target.value })} className="bg-background border border-border p-4 text-sm" />
          </div>
          <input required type="email" name="email" placeholder="Email address" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} className="w-full bg-background border border-border p-4 text-sm" />
          <input required minLength={6} type="password" name="password" placeholder="Password (6+ characters)" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} className="w-full bg-background border border-border p-4 text-sm" />
          {message && <p className="text-sm text-destructive">{message}</p>}
          <Button disabled={isSubmitting} className="w-full h-14 rounded-none uppercase tracking-widest text-xs">{isSubmitting ? 'Creating...' : 'Create Account'}</Button>
        </form>
        <p className="text-sm text-muted-foreground mt-8">Already registered? <Link href="/login" className="text-foreground underline">Sign in</Link></p>
      </div>
    </div>
  );
}
