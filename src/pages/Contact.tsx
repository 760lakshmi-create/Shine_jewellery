import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    boutique: 'Mumbai Flagship',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormData({ name: '', email: '', phone: '', boutique: 'Mumbai Flagship', message: '' });
      setTimeout(() => setIsSuccess(false), 5000);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="pt-32 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-24">
          <span className="uppercase tracking-[0.3em] text-secondary text-xs mb-4 block font-semibold">Client Services</span>
          <h1 className="font-serif text-5xl md:text-7xl mb-6">Contact the Maison</h1>
          <p className="text-muted-foreground max-w-xl mx-auto font-serif text-lg">
            Our ambassadors are at your disposal to arrange private viewings, assist with bespoke inquiries, and provide expert guidance.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          
          {/* Boutiques */}
          <div className="space-y-12">
            <h2 className="font-serif text-3xl mb-8 border-b border-border pb-4">Our Boutiques</h2>
            
            <div className="space-y-8">
              <div className="flex gap-6">
                <MapPin className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-serif text-xl mb-2">Mumbai Flagship</h3>
                  <p className="text-muted-foreground text-sm mb-4">The Taj Mahal Palace, Apollo Bunder<br/>Mumbai, Maharashtra 400001</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Phone className="w-4 h-4" /> +91 22 1234 5678
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" /> Mon - Sun, 11:00 AM - 8:00 PM
                  </div>
                </div>
              </div>

              <div className="flex gap-6">
                <MapPin className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-serif text-xl mb-2">Delhi Salon</h3>
                  <p className="text-muted-foreground text-sm mb-4">The Chanakya, Chanakyapuri<br/>New Delhi, Delhi 110021</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Phone className="w-4 h-4" /> +91 11 9876 5432
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" /> Mon - Sun, 11:00 AM - 9:00 PM
                  </div>
                </div>
              </div>

              <div className="flex gap-6">
                <Mail className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-serif text-xl mb-2">General Inquiries</h3>
                  <p className="text-muted-foreground text-sm">concierge@shinejewelry.com<br/>Response within 24 hours.</p>
                </div>
              </div>
            </div>
            
            <div className="aspect-[4/3] w-full overflow-hidden mt-12 bg-muted">
               <img src="/img/fasion1.jpg" alt="SHINE Boutique" className="w-full h-full object-cover mix-blend-multiply" />
            </div>
          </div>

          {/* Form */}
          <div className="bg-muted/10 p-8 md:p-12 border border-border">
            <h2 className="font-serif text-3xl mb-8">Book an Appointment</h2>
            
            {isSuccess ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                <h3 className="font-serif text-2xl mb-4 text-primary">Request Received</h3>
                <p className="text-muted-foreground">
                  Thank you for reaching out to SHINE. An ambassador from the {formData.boutique} will contact you shortly to confirm your appointment.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Full Name</label>
                  <input 
                    required
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-background border border-border p-4 outline-none focus:border-primary transition-colors text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Email</label>
                    <input 
                      required
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-background border border-border p-4 outline-none focus:border-primary transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Phone</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-background border border-border p-4 outline-none focus:border-primary transition-colors text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Preferred Boutique</label>
                  <select 
                    name="boutique"
                    value={formData.boutique}
                    onChange={handleChange}
                    className="w-full bg-background border border-border p-4 outline-none focus:border-primary transition-colors text-sm appearance-none"
                  >
                    <option>Mumbai Flagship</option>
                    <option>Delhi Salon</option>
                    <option>Virtual Consultation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Inquiry Details</label>
                  <textarea 
                    required
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Tell us about the pieces you'd like to view, or the nature of your inquiry..."
                    className="w-full bg-background border border-border p-4 outline-none focus:border-primary transition-colors text-sm resize-none"
                  ></textarea>
                </div>

                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 rounded-none bg-primary text-primary-foreground hover:bg-primary/90 font-sans tracking-[0.2em] uppercase text-xs transition-all mt-4"
                >
                  {isSubmitting ? 'Sending...' : 'Request Appointment'}
                </Button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
