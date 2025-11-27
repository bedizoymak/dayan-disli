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
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12c0 2.08.63 4.02 1.71 5.64L2 22l4.47-1.64C8.08 21.37 10 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm5.16 13.16c-.22.63-1.29 1.23-1.78 1.3-.45.07-.99.1-1.6-.1-.37-.12-.83-.29-1.43-.56-2.5-1.1-4.11-3.73-4.23-3.9-.12-.17-1-1.33-1-2.55s.63-1.79.85-2.03c.22-.24.48-.3.64-.3.17 0 .32 0 .46.01.15.01.35-.05.55.42.2.47.68 1.63.74 1.75.06.12.09.26.02.42-.07.16-.11.26-.22.38-.11.12-.25.29-.35.39-.12.12-.24.24-.11.47.13.23.63.98 1.36 1.61.93.83 1.71 1.1 1.95 1.22.24.12.4.1.53-.07.13-.17.62-.73.78-.98.16-.25.33-.2.55-.12.22.08 1.43.66 1.68.77.26.12.43.18.49.29.06.11.06.59-.16 1.22z" />
      </svg>
    </a>
  );
};

export default WhatsAppButton;
