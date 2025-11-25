import { Settings, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/ContactForm";

export const Footer = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer id="contact" className="bg-navy border-t border-border">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4 text-center">İletişime Geçin</h2>
          <p className="text-muted-foreground text-center mb-8">
            Projeniz için hemen teklif alın. Formu doldurun, size en kısa sürede dönüş yapalım.
          </p>
          <ContactForm />
        </div>
        
        <div className="border-t border-border pt-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">Precision Gear</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Hassas dişli üretiminde 25 yılı aşkın deneyim ile sektörde öncü konumdayız.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="icon" className="border-border hover:bg-secondary hover:border-primary">
                  <Facebook className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="border-border hover:bg-secondary hover:border-primary">
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="border-border hover:bg-secondary hover:border-primary">
                  <Linkedin className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="border-border hover:bg-secondary hover:border-primary">
                  <Instagram className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Hızlı Bağlantılar</h3>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-muted-foreground hover:text-primary transition-colors">Ana Sayfa</button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('services')} className="text-muted-foreground hover:text-primary transition-colors">Hizmetlerimiz</button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('technologies')} className="text-muted-foreground hover:text-primary transition-colors">Teknolojiler</button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('products')} className="text-muted-foreground hover:text-primary transition-colors">Ürünler</button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('sectors')} className="text-muted-foreground hover:text-primary transition-colors">Sektörler</button>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">Hizmetler</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Gear Hobbing</a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">CNC İşleme</a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Dişli Taşlama</a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Kalite Kontrol</a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Isıl İşlem</a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">İletişim</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Organize Sanayi Bölgesi, 12. Cadde No: 45, İstanbul</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">+90 212 345 67 89</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">info@precisiongear.com.tr</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-muted-foreground text-sm">
                © 2024 Precision Gear. Tüm hakları saklıdır.
              </p>
              <div className="flex gap-6">
                <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Gizlilik Politikası
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Kullanım Koşulları
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Çerez Politikası
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
