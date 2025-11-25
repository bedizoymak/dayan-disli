import { Settings, Box, Wrench, CheckCircle, Flame, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const services = [
  {
    icon: Settings,
    title: "Gear Hobbing",
    description: "Yüksek hassasiyetli gear hobbing makinelerimizle, düz ve helisel dişlilerin üretiminde mükemmel sonuçlar elde ediyoruz. Modül 0.5'ten 12'ye kadar geniş bir yelpazede üretim kapasitemiz bulunmaktadır.",
    badges: ["Modül 0.5-12 arası", "Yüksek hassasiyet", "Hızlı üretim"]
  },
  {
    icon: Box,
    title: "CNC İşleme",
    description: "Son teknoloji CNC torna ve freze makinelerimizle, karmaşık geometrilere sahip dişli ve mekanik parçaların hassas işlenmesini gerçekleştiriyoruz. 5 eksen işleme kapasitemiz mevcuttur.",
    badges: ["5 eksen işleme", "Mikron hassasiyet", "Karmaşık geometriler"]
  },
  {
    icon: Wrench,
    title: "Dişli Taşlama",
    description: "Hassas dişli taşlama makinelerimizle, DIN 5-6 kalite sınıfında yüzey kalitesi ve boyutsal hassasiyet sağlıyoruz. Sertleştirilmiş malzemelerde bile mükemmel sonuçlar elde ediyoruz.",
    badges: ["DIN 5-6 kalite", "Sertleştirilmiş malzeme", "Yüzey kalitesi"]
  },
  {
    icon: CheckCircle,
    title: "Kalite Kontrol",
    description: "CMM ölçüm cihazları, dişli test makineleri ve yüzey pürüzlülük ölçüm sistemlerimizle, üretilen her parçanın kalite standartlarına uygunluğunu garanti ediyoruz.",
    badges: ["CMM ölçüm", "Dişli testi", "Tam dokümantasyon"]
  },
  {
    icon: Flame,
    title: "Isıl İşlem",
    description: "Kendi bünyemizdeki ısıl işlem ünitelerimizde, sementasyon, su verme ve temperleme işlemleriyle dişlilerinizin mekanik özelliklerini optimize ediyoruz.",
    badges: ["Sementasyon", "Su verme", "Temperleme"]
  },
  {
    icon: Sparkles,
    title: "Özel Çözümler",
    description: "Müşteri ihtiyaçlarına özel tasarım ve üretim hizmetleri sunuyoruz. Prototipten seri üretime kadar tüm süreçlerde yanınızdayız.",
    badges: ["Özel tasarım", "Prototip üretim", "Teknik destek"]
  }
];

export const Services = () => {
  return (
    <section id="services" className="py-24 bg-navy-light">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">HİZMETLERİMİZ</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Kapsamlı Üretim Çözümleri</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Modern makine parkurumuz ve uzman ekibimizle, dişli üretiminin her aşamasında profesyonel hizmet sunuyoruz
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card key={index} className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:transform hover:scale-105">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {service.badges.map((badge, i) => (
                      <Badge key={i} variant="secondary" className="bg-secondary text-secondary-foreground">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
