import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';

import Home from '@/pages/Home';
import Collections from '@/pages/Collections';
import ProductDetail from '@/pages/ProductDetail';
import Checkout from '@/pages/Checkout';
import About from '@/pages/About';
import HighJewelry from '@/pages/HighJewelry';
import Journal from '@/pages/Journal';
import JournalArticle from '@/pages/JournalArticle';
import DiamondGuide from '@/pages/DiamondGuide';
import Gifting from '@/pages/Gifting';
import Contact from '@/pages/Contact';
import Bespoke from '@/pages/Bespoke';
import Wishlist from '@/pages/Wishlist';
import Signup from '@/pages/Signup';
import Login from '@/pages/Login';
import Profile from '@/pages/Profile';
import { AuthProvider } from '@/context/AuthContext';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminLogin from '@/pages/AdminLogin';
import DeliveryDashboard from '@/pages/DeliveryDashboard';
import SellerDashboard from '@/pages/SellerDashboard';
import OrderTracking from '@/pages/OrderTracking';
import OrderHistory from '@/pages/OrderHistory';

const queryClient = new QueryClient();

function Router() {
  const [location] = useLocation();
  const isAdminArea = location === '/admin' || location === '/admin-login' || location === '/delivery' || location === '/seller';

  if (isAdminArea) {
    return <main className="min-h-screen"><Switch><Route path="/admin-login" component={AdminLogin} /><Route path="/admin" component={AdminDashboard} /><Route path="/delivery" component={DeliveryDashboard} /><Route path="/seller" component={SellerDashboard} /></Switch></main>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <CartDrawer />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/collections" component={Collections} />
          <Route path="/product/:id" component={ProductDetail} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/track-order/:id" component={OrderTracking} />
          <Route path="/about" component={About} />
          
          <Route path="/high-jewelry" component={HighJewelry} />
          <Route path="/journal" component={Journal} />
          <Route path="/journal/:slug" component={JournalArticle} />
          <Route path="/diamond-guide" component={DiamondGuide} />
          <Route path="/gifting" component={Gifting} />
          <Route path="/contact" component={Contact} />
          <Route path="/bespoke" component={Bespoke} />
          <Route path="/wishlist" component={Wishlist} />
          <Route path="/signup" component={Signup} />
          <Route path="/login" component={Login} />
          <Route path="/profile" component={Profile} />
          <Route path="/order-history" component={OrderHistory} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin-login" component={AdminLogin} />
          <Route path="/delivery" component={DeliveryDashboard} />
          <Route path="/seller" component={SellerDashboard} />
          
          {/* Catch all */}
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <AuthProvider>
          <WishlistProvider>
            <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster />
            </TooltipProvider>
          </WishlistProvider>
        </AuthProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
