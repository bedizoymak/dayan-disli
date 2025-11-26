import { Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Precision Gear</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-foreground hover:text-primary transition-colors">Ana Sayfa</button>
            <button onClick={() => scrollToSection('services')} className="text-foreground hover:text-primary transition-colors">Hizmetler</button>
            <button onClick={() => scrollToSection('technologies')} className="text-foreground hover:text-primary transition-colors">Teknolojiler</button>
            <button onClick={() => scrollToSection('products')} className="text-foreground hover:text-primary transition-colors">Ürünler</button>
            <button onClick={() => scrollToSection('sectors')} className="text-foreground hover:text-primary transition-colors">Sektörler</button>
            <Button onClick={() => scrollToSection('contact')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              İletişim
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-foreground">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[70%] bg-navy border-border">
              <nav className="flex flex-col gap-6 mt-8">
                <button 
                  onClick={() => scrollToSection('services')} 
                  className="text-lg text-foreground hover:text-primary transition-colors text-left"
                >
                  Hizmetler
                </button>
                <button 
                  onClick={() => scrollToSection('technologies')} 
                  className="text-lg text-foreground hover:text-primary transition-colors text-left"
                >
                  Teknolojiler
                </button>
                <button 
                  onClick={() => scrollToSection('products')} 
                  className="text-lg text-foreground hover:text-primary transition-colors text-left"
                >
                  Ürünler
                </button>
                <button 
                  onClick={() => scrollToSection('sectors')} 
                  className="text-lg text-foreground hover:text-primary transition-colors text-left"
                >
                  Sektörler
                </button>
                <Button 
                  onClick={() => scrollToSection('contact')} 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
                >
                  İletişim
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
