import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import prodSpur from "@/assets/prod-spur.jpg";
import prodHelical from "@/assets/prod-helical.jpg";
import prodBevel from "@/assets/prod-bevel.jpg";
import prodWorm from "@/assets/prod-worm.jpg";
import prodInternal from "@/assets/prod-internal.jpg";
import prodRack from "@/assets/prod-rack.jpg";

const products = [
  {
    image: prodSpur,
    quality: "DIN 5-7",
    title: "Düz Dişli (Spur Gear)",
    specs: "Modül 1-10, Çap Ø20-500mm",
    applications: "Redüktörler, şanzımanlar, endüstriyel makineler"
  },
  {
    image: prodHelical,
    quality: "DIN 5-7",
    title: "Helisel Dişli (Helical Gear)",
    specs: "Modül 1.5-12, Helis açısı 15-45°",
    applications: "Yüksek tork uygulamaları, otomotiv şanzımanları"
  },
  {
    image: prodBevel,
    quality: "DIN 6-8",
    title: "Konik Dişli (Bevel Gear)",
    specs: "Modül 2-8, Açı 90°",
    applications: "Diferansiyel sistemler, dik açı güç aktarımı"
  },
  {
    image: prodWorm,
    quality: "DIN 6-8",
    title: "Sonsuz Vida (Worm Gear)",
    specs: "Modül 1-6, Redüksiyon 1:10-1:100",
    applications: "Yüksek redüksiyon oranları, konveyör sistemleri"
  },
  {
    image: prodInternal,
    quality: "DIN 5-7",
    title: "İç Dişli (Internal Gear)",
    specs: "Modül 2-10, İç çap Ø100-600mm",
    applications: "Planetary dişli sistemleri, kompakt tasarımlar"
  },
  {
    image: prodRack,
    quality: "DIN 6-8",
    title: "Kremayer (Rack)",
    specs: "Modül 1-12, Uzunluk 500-3000mm",
    applications: "Lineer hareket sistemleri, CNC makineleri"
  }
];

export const Products = () => {
  return (
    <section id="products" className="py-24 bg-navy-light">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">ÜRÜNLERİMİZ</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Geniş Ürün Yelpazesi</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Her türlü endüstriyel uygulamaya uygun, yüksek kaliteli dişli çözümleri
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <Card key={index} className="bg-card border-border hover:border-primary/50 transition-all duration-300 group overflow-hidden">
              <div className="relative h-64 bg-muted overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                  {product.quality}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-xl">{product.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-primary font-semibold mb-1">Teknik Özellikler</p>
                  <p className="text-muted-foreground text-sm">{product.specs}</p>
                </div>
                <div>
                  <p className="text-sm text-primary font-semibold mb-1">Uygulama Alanları</p>
                  <p className="text-muted-foreground text-sm">{product.applications}</p>
                </div>
                <Button variant="outline" className="w-full border-border hover:bg-secondary">
                  Detaylı Bilgi
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
