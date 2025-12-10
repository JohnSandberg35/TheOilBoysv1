import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Clock, Shield, Star } from "lucide-react";
import { Link } from "wouter";
import heroImage from "@assets/generated_images/professional_mobile_mechanic_working_on_a_car_in_a_clean_driveway.png";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex flex-col gap-0">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Mechanic working on car" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 to-secondary/40" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl text-white"
          >
            <div className="inline-block bg-primary text-primary-foreground px-3 py-1 text-sm font-bold uppercase tracking-wider mb-4 rounded-sm">
              We Come To You
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-none">
              OIL CHANGES <br />
              <span className="text-primary">AT YOUR DOORSTEP</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-lg">
              Skip the waiting room. Our certified mechanics perform full-service oil changes in your driveway or office parking lot.
            </p>
            <div className="flex gap-4">
              <Link href="/booking">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 h-14 font-bold uppercase tracking-wide">
                  Schedule Now
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-white border-white hover:bg-white/10 text-lg px-8 h-14 font-bold uppercase tracking-wide">
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Clock}
              title="Save Time"
              description="No more driving to the shop and waiting for hours. We service your car while you work or relax."
            />
            <FeatureCard 
              icon={Shield}
              title="Certified Mechanics"
              description="Our team consists of fully vetted, insured, and experienced mechanics you can trust."
            />
            <FeatureCard 
              icon={Star}
              title="Premium Products"
              description="We only use top-tier synthetic oils and filters to ensure your engine runs smoother, longer."
            />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display font-bold text-secondary mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simple, transparent pricing. All services include a multi-point inspection and fluid top-off.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <ServiceCard 
              title="Standard Blend"
              price="$59"
              features={["5 Quarts Conventional Oil", "Standard Filter", "Multi-point Inspection", "Tire Pressure Check"]}
            />
            <ServiceCard 
              title="Full Synthetic"
              price="$89"
              features={["5 Quarts Synthetic Oil", "Premium Filter", "Multi-point Inspection", "Tire Pressure Check", "Fluid Top-off"]}
              featured={true}
            />
            <ServiceCard 
              title="High Mileage"
              price="$79"
              features={["5 Quarts High Mileage Oil", "Premium Filter", "Multi-point Inspection", "Leak Prevention Additives"]}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-display font-bold mb-6">Ready for a smoother ride?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of happy customers who have switched to the most convenient oil change service.
          </p>
          <Link href="/booking">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-12 h-16 font-bold uppercase tracking-wide">
              Book Appointment
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border shadow-sm">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function ServiceCard({ title, price, features, featured = false }: { title: string, price: string, features: string[], featured?: boolean }) {
  return (
    <Card className={`relative flex flex-col ${featured ? 'border-primary shadow-lg ring-1 ring-primary' : ''}`}>
      {featured && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Most Popular
        </div>
      )}
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-bold uppercase tracking-wide">{title}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-display font-bold">{price}</span>
          <span className="text-muted-foreground">/service</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3 mt-4">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Link href="/booking" className="w-full">
          <Button className={`w-full font-bold uppercase ${featured ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`} variant={featured ? 'default' : 'outline'}>
            Select Plan
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
