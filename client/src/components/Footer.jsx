import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useQuote } from '../context/QuoteContext.jsx';

const PHONE = '+234 802 255 0250';
const PHONE_LINK = 'tel:+2348022550250';
const EMAIL = 'tpclogisticscompany@gmail.com';
const WHATSAPP = 'https://wa.me/2348022550250';

export default function Footer() {
  const { openQuote } = useQuote();

  return (
    <footer className="footer">
      <div className="container footer__cta">
        <span className="eyebrow">READY WHEN YOU ARE</span>
        <h2 className="footer__big">
          Let's <em>Ship.</em>
        </h2>
        <div className="footer__cta-actions">
          <button className="btn btn--yellow" onClick={openQuote}>
            Get a Quote <ArrowUpRight size={18} />
          </button>
          <Link to="/tracking" className="btn btn--ghost">Track a Shipment</Link>
        </div>
      </div>

      <div className="container footer__rows">
        <a href={PHONE_LINK} className="footer__row">
          <span className="footer__row-label">PHONE</span>
          <span className="footer__row-value">{PHONE}</span>
          <ArrowUpRight size={20} />
        </a>
        <a href={`mailto:${EMAIL}`} className="footer__row">
          <span className="footer__row-label">EMAIL</span>
          <span className="footer__row-value">{EMAIL}</span>
          <ArrowUpRight size={20} />
        </a>
        <a href={WHATSAPP} target="_blank" rel="noreferrer" className="footer__row">
          <span className="footer__row-label">WHATSAPP</span>
          <span className="footer__row-value">Chat with our team now</span>
          <ArrowUpRight size={20} />
        </a>
        <div className="footer__row">
          <span className="footer__row-label">ADDRESS</span>
          <span className="footer__row-value">9b Atiba Close, Onipetesi Estate, Ikeja, Lagos</span>
        </div>
      </div>

      <div className="container footer__bottom">
        <span>© 2026 TPC Logistics Company. All rights reserved.</span>
        <nav className="footer__nav">
          <Link to="/services">Services</Link>
          <Link to="/about">About</Link>
          <Link to="/tracking">Tracking</Link>
          <Link to="/contact">Contact</Link>
        </nav>
        <span className="footer__tagline">Ship Smarter. Deliver Faster.</span>
      </div>
    </footer>
  );
}
