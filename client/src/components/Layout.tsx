import { Link, useLocation } from "wouter";
import { Wrench, Calendar, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logoImage from "@assets/generated_images/minimalist_oil_drop_and_gear_logo_symbol.png";

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
              <img src={logoImage} alt="TurboLube Logo" className="w-8 h-8 object-contain" />
              <span className="font-display text-2xl font-bold tracking-tighter text-secondary">
                TURBO<span className="text-primary">LUBE</span>
              </span>
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
                TURBO<span className="text-primary">LUBE</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Professional mobile oil change service. We come to you, so you can keep moving.
            </p>
          </div>
          <div>
            <h4 className="font-display text-lg mb-4 text-white">Contact</h4>
            <p className="text-gray-400 text-sm">1-800-TURBO-LUBE</p>
            <p className="text-gray-400 text-sm">service@turbolube.com</p>
          </div>
          <div>
            <h4 className="font-display text-lg mb-4 text-white">Service Areas</h4>
            <p className="text-gray-400 text-sm">Greater Metro Area</p>
            <p className="text-gray-400 text-sm">Suburbs & Surrounds</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
