import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import techHobbing from "@/assets/tech-hobbing.jpg";
import techCnc from "@/assets/tech-cnc.jpg";
import techGrinding from "@/assets/tech-grinding.jpg";
import techCmm from "@/assets/tech-cmm.jpg";

const technologies = [
  {
    image: techHobbing,
    title: "Gear Hobbing Makineleri",
    specs: ["Liebherr LC 500", "Modül: 0.5-12", "Çap: Ø500mm", "DIN 4 kalite"]
  },
  {
    image: techCnc,
    title: "5 Eksen CNC İşleme",
    specs: ["DMG MORI NTX 2000", "5 eksen eş zamanlı", "Hassasiyet: ±0.002mm", "Otomasyon sistemi"]
  },
  {
    image: techGrinding,
    title: "Dişli Taşlama",
    specs: ["Kapp VAS 532", "DIN 5-6 kalite", "Profil taşlama", "Otomatik ölçüm"]
  },
  {
    image: techCmm,
    title: "CMM Ölçüm Sistemi",
    specs: ["Zeiss Contura G2", "3D ölçüm", "Hassasiyet: 0.001mm", "Tam raporlama"]
  }
];

export const Technologies = () => {
  return (
    <section id="technologies" className="py-24 bg-navy">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">TEKNOLOJİLERİMİZ</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Son Teknoloji Makine Parkuru</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Dünya çapında tanınmış markaların en gelişmiş makineleriyle donatılmış üretim tesisimiz
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {technologies.map((tech, index) => (
            <Card key={index} className="bg-card border-border overflow-hidden hover:border-primary/50 transition-all duration-300 group">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={tech.image} 
                  alt={tech.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-4">{tech.title}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {tech.specs.map((spec, i) => (
                    <Badge key={i} variant="secondary" className="bg-secondary/50 text-secondary-foreground justify-start">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
