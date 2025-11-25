import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Award } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/95 to-navy/80" />
      </div>
      
      <div className="container relative z-10 mx-auto px-6 py-32">
        <div className="max-w-4xl">
          <Badge variant="secondary" className="mb-6 bg-secondary/80 text-secondary-foreground border border-border/50 backdrop-blur-sm">
            <Award className="w-4 h-4 mr-2" />
            ISO 9001:2015 Sertifikalı
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Hassas Dişli Üretiminde{" "}
            <span className="text-primary">Mükemmellik</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
            Gear hobbing, CNC işleme ve ileri teknoloji üretim yöntemleriyle, otomotiv, 
            savunma sanayi ve endüstriyel uygulamalar için yüksek hassasiyetli dişli çözümleri sunuyoruz.
          </p>
          
          <div className="flex flex-wrap gap-4 mb-12">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Teklif Alın
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-border bg-secondary/50 text-foreground hover:bg-secondary">
              Ürünlerimiz
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-8 max-w-2xl">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">25+</div>
              <div className="text-muted-foreground">Yıllık Deneyim</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Tamamlanan Proje</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">99.8%</div>
              <div className="text-muted-foreground">Kalite Oranı</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
