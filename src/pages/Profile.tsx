import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="pt-36 pb-24 min-h-screen text-center">
        <h1 className="font-serif text-4xl mb-5">Sign in to view your profile</h1>
        <Link href="/login" className="underline">Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="pt-36 pb-24 min-h-screen bg-muted/10">
      <div className="max-w-2xl mx-auto px-6">
        <p className="text-xs uppercase tracking-[0.25em] text-primary mb-4">Private Client</p>
        <h1 className="font-serif text-5xl mb-10">Your Profile</h1>
        <div className="bg-background border border-border p-8 space-y-6">
          <div><p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Name</p><p className="font-serif text-2xl">{user.firstName} {user.lastName}</p></div>
          <div><p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Email</p><p>{user.email}</p></div>
        </div>
        <Link href="/order-history" className="mt-6 flex items-center justify-between border border-border bg-background p-5 hover:border-primary transition-colors">
          <span><span className="block font-serif text-xl">Your orders</span><span className="block text-sm text-muted-foreground mt-1">View order history and track deliveries</span></span>
          <span className="text-primary text-xl" aria-hidden="true">â†’</span>
        </Link>
        <Button onClick={() => { logout(); setLocation('/'); }} variant="outline" className="mt-8 rounded-none uppercase tracking-widest text-xs">Sign Out</Button>
      </div>
    </div>
  );
}
