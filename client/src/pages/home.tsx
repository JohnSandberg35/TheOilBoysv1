import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Truck, Car, Shield, User, Wrench } from "lucide-react";
import { Link } from "wouter";
import heroImage from "@assets/stock_images/classic_muscle_car_b_0af1eeeb.jpg";
import logoImage from "@/assets/logo.png";
import { useQuery } from "@tanstack/react-query";

type Mechanic = {
  id: string;
  name: string;
  phone: string | null;
  photoUrl: string | null;
  bio: string | null;
  oilChangeCount: number;
  backgroundCheckVerified: boolean;
  isPublic: boolean;
};

export default function Home() {
  const { data: mechanics = [] } = useQuery<Mechanic[]>({
    queryKey: ['publicMechanics'],
    queryFn: async () => {
      const response = await fetch('/api/mechanics/public');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
  });

  // Scroll to hash when navigating from another page (e.g. /booking with #technicians)
  useEffect(() => {
    const hash = window.location.hash?.replace('#', '');
    if (!hash) return;
    if (hash === 'technicians' && mechanics.length === 0) return; // Wait for mechanics to load
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [mechanics.length]);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[500px] flex items-center justify-center text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Classic car" 
            className="w-full h-full object-cover grayscale"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10 py-20">
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
            No Time for an Oil Change?
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
            For a lower price than your local shop, we come to you.
          </p>
          <Link href="/booking">
            <Button size="lg" className="bg-white text-black hover:bg-gray-200 text-lg px-10 h-14 font-bold" data-testid="button-book-now">
              Book Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Meet the Technicians Section */}
      {mechanics.length > 0 && (
        <section id="technicians" className="py-16 bg-background scroll-mt-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-4">
              Meet Our Technicians
            </h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-12"></div>
            
            <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
              {mechanics.map(mechanic => (
                <div key={mechanic.id} className="w-full max-w-[20rem] sm:w-72 flex-shrink-0">
                  <MechanicCard mechanic={mechanic} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section id="service" className="py-20 bg-muted scroll-mt-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-4">
            Premium Oil Change Service
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-12"></div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <StepCard 
              number="1"
              icon={Calendar}
              title="Book Online"
              description="Fill out our booking form to schedule a time that works for you. You'll receive an email confirmation immediately, and you can cancel up to 2 hours before your appointment if needed."
            />
            <StepCard 
              number="2"
              icon={Truck}
              title="We Come to You"
              description="On the day of your appointment, you'll receive a reminder email. Our technician arrives at your location, you hand over your keys, and we complete the service right at your doorstep. When finished, we return your keys and let you know your vehicle is ready."
            />
            <StepCard 
              number="3"
              icon={Car}
              title="Stay on Schedule"
              description="Six months later, we'll email you a reminder that your oil change is due, making it easy to book your next service and stay on top of your vehicle maintenance."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="price" className="py-16 bg-background scroll-mt-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Price</h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-8"></div>
          <div className="max-w-2xl mx-auto mb-4">
            <p className="text-xl text-muted-foreground mb-2">
              <span className="text-primary font-bold text-3xl">$95</span> for Sedan/Compact
            </p>
            <p className="text-xl text-muted-foreground mb-4">
              <span className="text-primary font-bold text-3xl">$105</span> for SUV/Truck
            </p>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Our service includes complimentary wiper fluid top-off and tire air pressure check.
          </p>
          <Link href="/booking">
            <Button size="lg" className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-10 h-14 font-bold" data-testid="button-book-pricing">
              Book Your Appointment
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}

function StepCard({ number, icon: Icon, title, description }: { number: string, icon: any, title: string, description: string }) {
  return (
    <Card className="text-center p-6 border-2 hover:border-primary transition-colors">
      <CardContent className="pt-6">
        <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
          {number}
        </div>
        <div className="w-12 h-12 text-primary mx-auto mb-4">
          <Icon className="w-full h-full" />
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function MechanicCard({ mechanic }: { mechanic: Mechanic }) {
  const [imgError, setImgError] = useState(false);
  const photoSrc = mechanic.photoUrl && !imgError ? mechanic.photoUrl : logoImage;
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center overflow-hidden mb-4">
            <img
              src={photoSrc}
              alt={mechanic.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold">{mechanic.name}</h3>
            {mechanic.backgroundCheckVerified && (
              <Shield className="w-5 h-5 text-green-600" />
            )}
          </div>
          {mechanic.backgroundCheckVerified && (
            <span className="text-xs text-green-600 font-medium mb-2">Background Verified</span>
          )}
          {mechanic.bio && (
            <p className="text-muted-foreground text-sm mb-4">{mechanic.bio}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wrench className="w-4 h-4" />
            <span>{mechanic.oilChangeCount} oil changes completed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
