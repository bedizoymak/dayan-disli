import { Award, Clock, Users, DollarSign, HeadphonesIcon, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const reasons = [
  {
    icon: Award,
    title: "Yüksek Kalite Standartları",
    description: "ISO 9001:2015 sertifikalı üretim süreçlerimiz ve DIN standartlarına uygun kalite kontrol sistemlerimizle, her üründe mükemmelliği garanti ediyoruz."
  },
  {
    icon: Clock,
    title: "Hızlı Teslimat",
    description: "Optimize edilmiş üretim süreçlerimiz ve geniş stok kapasitemiz sayesinde, acil siparişlerinizi bile zamanında teslim ediyoruz."
  },
  {
    icon: Users,
    title: "Uzman Kadro",
    description: "25 yılı aşkın deneyime sahip makine mühendisleri ve teknisyenlerimiz, en karmaşık projelerde bile size rehberlik ediyor."
  },
  {
    icon: DollarSign,
    title: "Rekabetçi Fiyatlar",
    description: "Yüksek kaliteden ödün vermeden, sektörün en rekabetçi fiyatlarını sunuyoruz. Toplu siparişlerde özel indirimler mevcuttur."
  },
  {
    icon: HeadphonesIcon,
    title: "Satış Sonrası Destek",
    description: "Ürün teslimatından sonra da yanınızdayız. Teknik destek, bakım ve onarım hizmetlerimizle sürekli destek sağlıyoruz."
  },
  {
    icon: Globe,
    title: "Uluslararası Deneyim",
    description: "Avrupa, Orta Doğu ve Asya'ya ihracat deneyimimizle, global standartlarda üretim ve hizmet kalitesi sunuyoruz."
  }
];

export const WhyUs = () => {
  return (
    <section className="py-24 bg-navy">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">NEDEN BİZ?</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Precision Gear'ı Tercih Etme Nedenleri</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Sektörde fark yaratan özelliklerimiz ve müşteri odaklı yaklaşımımız
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <Card key={index} className="bg-card border-border hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{reason.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">{reason.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
