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
  width="30"
  height="30"
  viewBox="0 0 32 32"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  stroke="white"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
>
  <circle cx="16" cy="16" r="15" fill="none" />
  <path d="M21.4 18.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.1-.2.1-.3.2-.6.1-.3-.2-1.2-.4-2.3-1.4-.9-.8-1.4-1.8-1.6-2.1-.2-.3 0-.4.1-.5.1-.1.3-.3.4-.4s.2-.2.3-.3c.1-.1.2-.2.3-.4.1-.2.1-.4 0-.5-.1-.2-.7-1.7-.9-2.3-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.3-.2.2-.9.8-.9 2s.9 2.4 1 2.6c.1.2 1.8 2.8 4.3 3.9 2.5 1.2 2.5.8 3-.1.3-.5.9-1.2 1.1-1.3.2-.1.5-.1.8 0 .3.1 1.9.9 2.3 1.1.3.2.5.2.6.3.1.1.1.8 0 1.4-.1.7-.7 1.3-.9 1.4-.2.1-.5.2-.8.2-1.1.1-2.8-.3-4.6-1.4-1.6-.9-2.8-2-4.2-3.7C11 15.6 10 13.4 10 11.5c0-1.9.7-3.7 1.5-4.7C12.3 5.7 14 5 16 5c2 0 3.7.8 4.6 1.7.9.9 2 2.5 2 4.6 0 2.1-.8 3.9-1.6 5-.8 1.1-.2 1.4.4 1.7.6.3 2.3 1.1 2.6 1.2.3.1.5.1.7-.2.2-.3.8-1.1 1-1.3.2-.2.2-.4-.1-.6-.2-.2-.8-.5-1.2-.7z" />
</svg>

    </a>
  );
};

export default WhatsAppButton;
