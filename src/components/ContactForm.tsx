import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Send } from "lucide-react";

const formSchema = z.object({
  name: z.string()
    .trim()
    .min(2, { message: "Ad en az 2 karakter olmalıdır" })
    .max(100, { message: "Ad en fazla 100 karakter olabilir" }),
  email: z.string()
    .trim()
    .email({ message: "Geçerli bir e-posta adresi giriniz" })
    .max(255, { message: "E-posta en fazla 255 karakter olabilir" }),
  phone: z.string()
    .trim()
    .min(10, { message: "Telefon numarası en az 10 karakter olmalıdır" })
    .max(20, { message: "Telefon numarası en fazla 20 karakter olabilir" }),
  company: z.string()
    .trim()
    .min(2, { message: "Şirket adı en az 2 karakter olmalıdır" })
    .max(100, { message: "Şirket adı en fazla 100 karakter olabilir" }),
  message: z.string()
    .trim()
    .min(10, { message: "Mesaj en az 10 karakter olmalıdır" })
    .max(1000, { message: "Mesaj en fazla 1000 karakter olabilir" }),
});

export const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      message: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Mesajınız gönderildi!",
        description: "En kısa sürede size dönüş yapacağız.",
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Mesajınız gönderilemedi. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ad Soyad *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Adınız Soyadınız" 
                    className="bg-navy-lighter border-border"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-posta *</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="ornek@email.com" 
                    className="bg-navy-lighter border-border"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="+90 5XX XXX XX XX" 
                    className="bg-navy-lighter border-border"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Şirket *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Şirket Adı" 
                    className="bg-navy-lighter border-border"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mesajınız *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Projeniz hakkında detaylı bilgi veriniz..." 
                  className="bg-navy-lighter border-border min-h-[120px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Gönderiliyor..." : "Mesaj Gönder"}
          <Send className="ml-2 w-4 h-4" />
        </Button>
      </form>
    </Form>
  );
};
