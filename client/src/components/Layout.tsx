import { Link, useLocation } from "wouter";
import { Wrench, Calendar, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logoImage from "@assets/generated_images/modern_clean_typography_logo_for_the_oil_boys.png";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const NavLink = ({ href, children, icon: Icon }: { href: string; children: React.ReactNode; icon: any }) => {
    const isActive = location === href;
    return (
      <Link href={href}>
        <div 
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors cursor-pointer ${
            isActive 
              ? "bg-primary text-primary-foreground font-bold" 
              : "text-foreground hover:bg-muted"
          }`}
          onClick={() => setIsOpen(false)}
        >
          <Icon className="w-4 h-4" />
          <span className="uppercase tracking-wide text-sm">{children}</span>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img src={logoImage} alt="The Oil Boys Logo" className="h-10 w-auto object-contain" />
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLink href="/" icon={Wrench}>Services</NavLink>
            <NavLink href="/booking" icon={Calendar}>Book Now</NavLink>
            <NavLink href="/mechanic" icon={User}>Mechanic Login</NavLink>
          </nav>

          {/* Mobile Nav */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <NavLink href="/" icon={Wrench}>Services</NavLink>
                  <NavLink href="/booking" icon={Calendar}>Book Now</NavLink>
                  <NavLink href="/mechanic" icon={User}>Mechanic Login</NavLink>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-secondary text-secondary-foreground py-12">
        <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-display text-2xl font-bold tracking-tighter text-white">
                THE OIL<span className="text-primary"> BOYS</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Professional mobile oil change service. We come to you, so you can keep moving.
            </p>
          </div>
          <div>
            <h4 className="font-display text-lg mb-4 text-white">Contact</h4>
            <p className="text-gray-400 text-sm">801-555-OILS</p>
            <p className="text-gray-400 text-sm">service@oilboys.com</p>
          </div>
          <div>
            <h4 className="font-display text-lg mb-4 text-white">Service Areas</h4>
            <p className="text-gray-400 text-sm">Utah County</p>
            <p className="text-gray-400 text-sm">Orem, Provo, Lehi & Surrounds</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
