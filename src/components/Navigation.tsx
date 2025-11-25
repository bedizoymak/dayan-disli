import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Navigation = () => {
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
            <a href="#" className="text-foreground hover:text-primary transition-colors">Ana Sayfa</a>
            <a href="#services" className="text-foreground hover:text-primary transition-colors">Hizmetler</a>
            <a href="#technologies" className="text-foreground hover:text-primary transition-colors">Teknolojiler</a>
            <a href="#products" className="text-foreground hover:text-primary transition-colors">Ürünler</a>
            <a href="#sectors" className="text-foreground hover:text-primary transition-colors">Sektörler</a>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              İletişim
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
