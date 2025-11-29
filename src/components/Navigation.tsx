import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">

          {/* LOGO */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center cursor-pointer gap-3"
          >
            <img
              src="/logo-header.png"
              alt="Dayan Dişli"
              className="h-14 w-auto object-contain"
            />
            
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-foreground hover:text-primary transition-colors"
            >
              {t.nav.home}
            </button>

            <button
              onClick={() => scrollToSection("services")}
              className="text-foreground hover:text-primary transition-colors"
            >
              {t.nav.services}
            </button>

            <button
              onClick={() => scrollToSection("technologies")}
              className="text-foreground hover:text-primary transition-colors"
            >
              {t.nav.technologies}
            </button>

            <button
              onClick={() => scrollToSection("products")}
              className="text-foreground hover:text-primary transition-colors"
            >
              {t.nav.products}
            </button>

            <button
              onClick={() => scrollToSection("sectors")}
              className="text-foreground hover:text-primary transition-colors"
            >
              {t.nav.sectors}
            </button>

            <LanguageSelector />

            <Button
              onClick={() => scrollToSection("contact")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {t.nav.contact}
            </Button>
          </div>

          {/* MOBILE: Hamburger + Dil Seçici */}
          <div className="md:hidden flex items-center gap-0">

            {/* Hamburger */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-[70%] bg-navy border-border"
              >
                <nav className="flex flex-col gap-6 mt-8">
                  <button
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      setIsOpen(false);
                    }}
                    className="text-lg text-foreground hover:text-primary transition-colors text-left"
                  >
                    {t.nav.home}
                  </button>

                  <button
                    onClick={() => scrollToSection("services")}
                    className="text-lg text-foreground hover:text-primary transition-colors text-left"
                  >
                    {t.nav.services}
                  </button>

                  <button
                    onClick={() => scrollToSection("technologies")}
                    className="text-lg text-foreground hover:text-primary transition-colors text-left"
                  >
                    {t.nav.technologies}
                  </button>

                  <button
                    onClick={() => scrollToSection("products")}
                    className="text-lg text-foreground hover:text-primary transition-colors text-left"
                  >
                    {t.nav.products}
                  </button>

                  <button
                    onClick={() => scrollToSection("sectors")}
                    className="text-lg text-foreground hover:text-primary transition-colors text-left"
                  >
                    {t.nav.sectors}
                  </button>

                  <Button
                    onClick={() => scrollToSection("contact-form")}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
                  >
                    {t.nav.contact}
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>

            {/* Küçültülmüş Dil Seçici */}
            <div className="scale-[0.7] flex items-center">
              <LanguageSelector />
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
};
