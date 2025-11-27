const WhatsAppButton = () => {
  const phoneNumber = "+905365837420";
  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\+/g, "")}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(37,211,102,0.6)]"
      aria-label="WhatsApp ile iletişime geç"
    >
      <svg 
  width="28" 
  height="28" 
  viewBox="0 0 24 24" 
  xmlns="http://www.w3.org/2000/svg"
  fill="white"
>
  <path d="M12.04 2C6.56 2 2.1 6.45 2.1 11.93c0 2.09.62 4.05 1.82 5.77L2 22l4.42-1.76c1.62.89 3.45 1.36 5.62 1.36 5.48 0 9.94-4.45 9.94-9.93C22 6.45 17.52 2 12.04 2zm5.16 12.65c-.25.7-1.43 1.34-1.96 1.42-.5.07-1.14.1-1.85-.11-.42-.14-1-.32-1.71-.68-3-1.47-4.95-4.8-5.1-5.02-.14-.22-1.21-1.6-1.21-3.07 0-1.47.76-2.2 1.03-2.5.28-.3.62-.37.83-.37h.6c.2 0 .44-.07.69.53.25.6.85 2.08.93 2.23.07.15.1.33.02.52-.09.19-.13.31-.27.48-.14.17-.3.38-.43.5-.14.12-.28.26-.12.52.17.26.75 1.22 1.61 1.99.95.88 1.7 1.16 1.97 1.3.28.13.44.11.6-.07.17-.19.69-.8.87-1.08.18-.28.37-.23.62-.14.25.09 1.58.75 1.85.89.27.14.45.2.52.31.08.12.08.74-.17 1.44z"/>
</svg>



    </a>
  );
};

export default WhatsAppButton;
