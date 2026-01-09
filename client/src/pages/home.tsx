import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Truck, Car, Phone, Mail, Facebook, Instagram, Twitter } from "lucide-react";
import { Link } from "wouter";
import heroImage from "@assets/stock_images/classic_muscle_car_b_0af1eeeb.jpg";

export default function Home() {
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

      {/* How It Works */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-4">
            Premium Oil Change Service
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-12"></div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <StepCard 
              number="1"
              icon={Calendar}
              title="Pick a Time"
              description="Fill out our booking form to schedule a time that works for you. We'll reach out to confirm your appointment."
            />
            <StepCard 
              number="2"
              icon={Truck}
              title="We'll Stop By"
              description="When the time comes, we'll come to you to start the change!"
            />
            <StepCard 
              number="3"
              icon={Car}
              title="Drive With Confidence"
              description="Tired of keeping track of vehicle maintenance? We manage a schedule for your vehicle's needs, including reminders for your next oil change!"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Price</h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-8"></div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            Starting at <span className="text-primary font-bold text-3xl">$85</span> for most vehicles
          </p>
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

      {/* Referral Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
            Share to Save Big!
          </h2>
          <p className="text-xl">
            Refer a friend to get <span className="font-bold text-2xl">20% off</span> your next oil change.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div>
              <h3 className="text-2xl font-display font-bold mb-6">Contact Us</h3>
              <div className="space-y-4">
                <a href="tel:3852691482" className="flex items-center gap-3 text-lg text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="w-5 h-5" />
                  <span>Call or Text: (385) 269-1482</span>
                </a>
                <a href="mailto:theoilboysllc@gmail.com" className="flex items-center gap-3 text-lg text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="w-5 h-5" />
                  <span>theoilboysllc@gmail.com</span>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-display font-bold mb-6">Social Media</h3>
              <div className="flex gap-4">
                <a href="https://www.facebook.com/profile.php?id=61558814451469" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors" data-testid="link-facebook">
                  <Facebook className="w-6 h-6" />
                </a>
                <a href="https://www.instagram.com/theoilboysllc" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors" data-testid="link-instagram">
                  <Instagram className="w-6 h-6" />
                </a>
                <a href="https://x.com/theoilboysllc" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors" data-testid="link-twitter">
                  <Twitter className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
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
