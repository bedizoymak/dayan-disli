import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const ContactForm = () => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const formSchema = z.object({
    name: z.string().trim().min(2, { message: t.contactForm.validation.nameMin }).max(50, { message: t.contactForm.validation.nameMax }),
    email: z.string().trim().email({ message: t.contactForm.validation.emailInvalid }),
    phone: z.string().trim().min(10, { message: t.contactForm.validation.phoneMin }).max(20, { message: t.contactForm.validation.phoneMax }),
    company: z.string().trim().max(100, { message: t.contactForm.validation.companyMax }).optional(),
    message: z.string().trim().min(10, { message: t.contactForm.validation.messageMin }).max(1000, { message: t.contactForm.validation.messageMax }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", phone: "", company: "", message: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: values.name,
          email: values.email,
          phone: values.phone,
          company: values.company || "",
          message: values.message,
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message);
      }

      if (data?.error) {
        console.error("Email sending error:", data.error);
        throw new Error(data.error);
      }

      toast({ title: t.contactForm.successTitle, description: t.contactForm.successDescription });
      form.reset();
    } catch (error: any) {
      console.error("Contact form submission error:", error);
      toast({ 
        title: t.contactForm.errorTitle, 
        description: t.contactForm.errorDescription, 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>{t.contactForm.name}</FormLabel>
              <FormControl><Input placeholder={t.contactForm.namePlaceholder} className="bg-navy-lighter border-border" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>{t.contactForm.email}</FormLabel>
              <FormControl><Input type="email" placeholder={t.contactForm.emailPlaceholder} className="bg-navy-lighter border-border" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>{t.contactForm.phone}</FormLabel>
              <FormControl><Input placeholder={t.contactForm.phonePlaceholder} className="bg-navy-lighter border-border" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="company" render={({ field }) => (
            <FormItem>
              <FormLabel>{t.contactForm.company}</FormLabel>
              <FormControl><Input placeholder={t.contactForm.companyPlaceholder} className="bg-navy-lighter border-border" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="message" render={({ field }) => (
          <FormItem>
            <FormLabel>{t.contactForm.message}</FormLabel>
            <FormControl><Textarea placeholder={t.contactForm.messagePlaceholder} className="bg-navy-lighter border-border min-h-[120px]" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              {t.contactForm.sending}
            </>
          ) : (
            <>
              {t.contactForm.send}
              <Send className="ml-2 w-4 h-4" />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};
