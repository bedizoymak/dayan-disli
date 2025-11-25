import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, PackageCheck } from "lucide-react";

export const CTA = () => {
  return (
    <section className="py-24 bg-navy-light">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Projeniz İçin Hemen Teklif Alın
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Uzman ekibimiz, dişli üretim ihtiyaçlarınız için size özel çözümler sunmaya hazır. 
            Teknik detayları paylaşın, size en uygun teklifi hazırlayalım.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground px-6 py-2">
              <FileText className="w-4 h-4 mr-2" />
              Ücretsiz Teknik Danışmanlık
            </Badge>
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground px-6 py-2">
              <Clock className="w-4 h-4 mr-2" />
              Hızlı Fiyat Teklifi
            </Badge>
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground px-6 py-2">
              <PackageCheck className="w-4 h-4 mr-2" />
              Numune Üretim
            </Badge>
          </div>
          
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6">
            Hemen İletişime Geçin
          </Button>
        </div>
      </div>
    </section>
  );
};
