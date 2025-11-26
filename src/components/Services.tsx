import { Settings, Box, Wrench, CheckCircle, Flame, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

export const Services = () => {
  const { t } = useLanguage();
  
  const services = [
    {
      icon: Settings,
      title: t.services.gearHobbing.title,
      description: t.services.gearHobbing.description,
      badges: t.services.gearHobbing.badges
    },
    {
      icon: Box,
      title: t.services.cncMachining.title,
      description: t.services.cncMachining.description,
      badges: t.services.cncMachining.badges
    },
    {
      icon: Wrench,
      title: t.services.gearGrinding.title,
      description: t.services.gearGrinding.description,
      badges: t.services.gearGrinding.badges
    },
    {
      icon: CheckCircle,
      title: t.services.qualityControl.title,
      description: t.services.qualityControl.description,
      badges: t.services.qualityControl.badges
    },
    {
      icon: Flame,
      title: t.services.heatTreatment.title,
      description: t.services.heatTreatment.description,
      badges: t.services.heatTreatment.badges
    },
    {
      icon: Sparkles,
      title: t.services.customSolutions.title,
      description: t.services.customSolutions.description,
      badges: t.services.customSolutions.badges
    }
  ];

  return (
    <section id="services" className="py-24 bg-navy-light">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-3">{t.services.title}</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.services.heading}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t.services.description}
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
