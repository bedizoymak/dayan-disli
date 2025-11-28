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
                  <p className="text-muted-foreground text-sm">+90 212 *** ** **</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{t.footer.email}</h3>
                  <p className="text-muted-foreground text-sm">info@dayandisli.com</p>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex gap-3 hidden">
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

            {/* Google Maps */}
            <div className="w-full">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3007.8073756721014!2d28.793301900000003!3d41.073203!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14caa5e0e900f119%3A0x9c66a5c0ec8f0b5d!2sİkitelli%20organize%20Sanayi%20Bölgesi!5e0!3m2!1str!2str!4v1764314980280!5m2!1str!2str"
                width="100%"
                className="h-[160px] md:h-[220px] rounded-xl border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Dayan Dişli Location"
              />
            </div>

            {/* Copyright */}
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} {t.footer.company}. {t.footer.allRightsReserved}
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
