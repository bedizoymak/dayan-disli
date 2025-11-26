import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => {
  const phoneNumber = "+905365837420";
  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\+/g, "")}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 bg-whatsapp text-white rounded-full shadow-lg transition-all duration-300 hover:bg-whatsapp-hover hover:shadow-[0_0_20px_rgba(37,211,102,0.6)] hover:scale-110"
      aria-label="WhatsApp ile iletişime geç"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
};

export default WhatsAppButton;
