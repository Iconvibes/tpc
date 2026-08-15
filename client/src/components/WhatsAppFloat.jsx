import { MessageCircle } from 'lucide-react';

export default function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/2348022550250"
      target="_blank"
      rel="noreferrer"
      className="wa-float"
      aria-label="Chat with TPC Logistics on WhatsApp"
      title="Chat with us on WhatsApp"
    >
      <span className="wa-float__pulse" aria-hidden="true" />
      <MessageCircle size={26} />
    </a>
  );
}
