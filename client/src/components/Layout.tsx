import { Link, useLocation } from "wouter";
import { Menu, Phone, Mail, Facebook, Instagram, Twitter } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logoImage from "../assets/logo.png";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    if (location !== "/") {
      window.location.href = `/#${sectionId}`;
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    setIsOpen(false);
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
          <nav className="hidden md:flex items-center gap-3">
            <Link href="/booking">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wide text-sm" data-testid="nav-book-now">
                Book Now
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold uppercase tracking-wide text-sm"
              onClick={() => scrollToSection("technicians")}
              data-testid="nav-technicians"
            >
              Technicians
            </Button>
            <Button 
              variant="outline" 
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold uppercase tracking-wide text-sm"
              onClick={() => scrollToSection("service")}
              data-testid="nav-service"
            >
              Service
            </Button>
            <Button 
              variant="outline" 
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold uppercase tracking-wide text-sm"
              onClick={() => scrollToSection("price")}
              data-testid="nav-price"
            >
              Price
            </Button>
            <Link href="/faq">
              <Button 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold uppercase tracking-wide text-sm"
                data-testid="nav-faq"
              >
                FAQ
              </Button>
            </Link>
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
                  <Link href="/booking">
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wide" onClick={() => setIsOpen(false)}>
                      Book Now
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold uppercase tracking-wide"
                    onClick={() => scrollToSection("technicians")}
                  >
                    Technicians
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold uppercase tracking-wide"
                    onClick={() => scrollToSection("service")}
                  >
                    Service
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold uppercase tracking-wide"
                    onClick={() => scrollToSection("price")}
                  >
                    Price
                  </Button>
                  <Link href="/faq">
                    <Button 
                      variant="outline" 
                      className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold uppercase tracking-wide"
                      onClick={() => setIsOpen(false)}
                    >
                      FAQ
                    </Button>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-primary text-white py-12">
        <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-display text-2xl font-bold tracking-tighter">
                THE OIL BOYS
              </span>
            </div>
            <p className="text-white/70 text-sm">
              Professional mobile oil change service. We come to you, so you can keep moving.
            </p>
          </div>
          <div>
            <h4 className="font-display text-lg mb-4">Contact</h4>
            <div className="space-y-2">
              <a href="tel:3852691482" className="flex items-center gap-2 text-white/70 text-sm hover:text-white transition-colors">
                <Phone className="w-4 h-4" />
                <span>(385) 269-1482</span>
              </a>
              <a href="mailto:theoilboysllc@gmail.com" className="flex items-center gap-2 text-white/70 text-sm hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
                <span>theoilboysllc@gmail.com</span>
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-display text-lg mb-4">Service Areas</h4>
            <p className="text-white/70 text-sm">Utah County</p>
          </div>
          <div>
            <h4 className="font-display text-lg mb-4">Follow Us</h4>
            <div className="flex gap-3">
              <a href="https://www.facebook.com/profile.php?id=61558814451469" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors" data-testid="link-facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/theoilboysllc" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors" data-testid="link-instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://x.com/theoilboysllc" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors" data-testid="link-twitter">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-6 border-t border-white/20 text-center">
          <Link href="/manage">
            <span className="text-white/40 text-xs hover:text-white/60 transition-colors cursor-pointer">
              Manager Access
            </span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
