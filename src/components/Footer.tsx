import { Settings, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/ContactForm";
import { useLanguage } from "@/contexts/LanguageContext";

export const Footer = () => {
  const { t } = useLanguage();
  
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
          <h2 className="text-3xl font-bold mb-4 text-center">{t.contactForm.heading}</h2>
          <p className="text-muted-foreground text-center mb-8">
            {t.contactForm.description}
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
                <span className="text-xl font-bold text-foreground">{t.footer.company}</span>
              </div>
              <p className="text-muted-foreground mb-4">
                {t.footer.companyDescription}
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
              <h3 className="text-lg font-bold mb-4">{t.footer.quickLinks}</h3>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-muted-foreground hover:text-primary transition-colors">{t.nav.home}</button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('services')} className="text-muted-foreground hover:text-primary transition-colors">{t.nav.services}</button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('technologies')} className="text-muted-foreground hover:text-primary transition-colors">{t.nav.technologies}</button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('products')} className="text-muted-foreground hover:text-primary transition-colors">{t.nav.products}</button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('sectors')} className="text-muted-foreground hover:text-primary transition-colors">{t.nav.sectors}</button>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">{t.footer.servicesMenu}</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">{t.footer.gearHobbing}</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">{t.footer.cncMachining}</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">{t.footer.gearGrinding}</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">{t.footer.qualityControl}</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">{t.footer.contactInfo}</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{t.footer.address}</span>
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
                © 2024 {t.footer.company}. {t.footer.allRightsReserved}
              </p>
              <div className="flex gap-6">
                <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">{t.footer.privacyPolicy}</a>
                <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">{t.footer.termsOfService}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
