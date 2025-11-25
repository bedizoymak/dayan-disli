import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import sectorAutomotive from "@/assets/sector-automotive.jpg";
import sectorDefense from "@/assets/sector-defense.jpg";
import sectorConstruction from "@/assets/sector-construction.jpg";
import sectorMarine from "@/assets/sector-marine.jpg";
import sectorEnergy from "@/assets/sector-energy.jpg";
import sectorAutomation from "@/assets/sector-automation.jpg";

const sectors = [
  {
    image: sectorAutomotive,
    title: "Otomotiv",
    description: "Şanzıman dişlileri, diferansiyel sistemleri ve motor komponentleri için yüksek hassasiyetli üretim"
  },
  {
    image: sectorDefense,
    title: "Savunma Sanayi",
    description: "Askeri araçlar ve sistemler için özel tasarım, yüksek dayanıklılık ve güvenilirlik standartlarında üretim"
  },
  {
    image: sectorConstruction,
    title: "İnşaat Makineleri",
    description: "Ekskavatör, vinç ve iş makineleri için ağır hizmet tipi dişli sistemleri"
  },
  {
    image: sectorMarine,
    title: "Denizcilik",
    description: "Gemi tahrik sistemleri, vinç mekanizmaları ve deniz araçları için korozyona dayanıklı dişliler"
  },
  {
    image: sectorEnergy,
    title: "Enerji",
    description: "Rüzgar türbinleri, hidroelektrik santraller ve enerji üretim sistemleri için özel çözümler"
  },
  {
    image: sectorAutomation,
    title: "Endüstriyel Otomasyon",
    description: "Konveyör sistemleri, robotik uygulamalar ve üretim hatları için hassas dişli çözümleri"
  }
];

export const Sectors = () => {
  return (
    <section id="sectors" className="py-24 bg-navy">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">SEKTÖRLER</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Hizmet Verdiğimiz Sektörler</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Farklı endüstrilerin özel ihtiyaçlarına yönelik uzman çözümler sunuyoruz
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sectors.map((sector, index) => (
            <Card key={index} className="bg-card border-border overflow-hidden hover:border-primary/50 transition-all duration-300 group">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={sector.image} 
                  alt={sector.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">{sector.title}</CardTitle>
                <CardDescription className="text-muted-foreground">{sector.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
