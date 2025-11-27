import { Settings, Mail, Phone, MapPin, Linkedin, Facebook, Twitter, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/ContactForm";
import { useLanguage } from "@/contexts/LanguageContext";

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer id="contact" className="bg-navy border-t border-border scroll-mt-20">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* LEFT COLUMN - Company Info */}
          <div className="space-y-8">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Settings className="w-7 h-7 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">{t.footer.company}</span>
            </div>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed">
              {t.footer.companyDescription}
            </p>

            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Adres</h3>
                  <p className="text-muted-foreground text-sm">{t.footer.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{t.footer.phone}</h3>
                  <p className="text-muted-foreground text-sm">+90 262 123 45 67</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{t.footer.email}</h3>
                  <p className="text-muted-foreground text-sm">info@precisiongear.com</p>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex gap-3">
              <Button variant="outline" size="icon" className="border-border hover:bg-secondary hover:border-primary">
                <Linkedin className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="border-border hover:bg-secondary hover:border-primary">
                <Facebook className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="border-border hover:bg-secondary hover:border-primary">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="border-border hover:bg-secondary hover:border-primary">
                <Instagram className="w-4 h-4" />
              </Button>
            </div>

            {/* Copyright */}
            <p className="text-muted-foreground text-sm pt-4">
              © 2024 {t.footer.company}. {t.footer.allRightsReserved}
            </p>
          </div>

          {/* RIGHT COLUMN - Contact Form */}
          <div id="contact-form" className="scroll-mt-24">
            <h2 className="text-2xl font-bold mb-6 text-foreground">{t.contactForm.heading}</h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </footer>
  );
};
