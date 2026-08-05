import { Link } from 'react-router';
import { MapPin, Phone, Mail, MessageCircle, Truck } from 'lucide-react';
import Logo from './Logo.jsx';

const SERVICES = ['Freight Forwarding', 'Warehousing', 'Supply Chain', 'Customs Clearance', 'Real-time Tracking'];
const PHONE = '+234 802 255 0250';
const PHONE_LINK = 'tel:+2348022550250';
const EMAIL = 'tpclogisticscompany@gmail.com';
const WHATSAPP = 'https://wa.me/2348022550250';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Logo />
            <p>
              Trusted partner for reliable and efficient logistics — freight forwarding, warehousing,
              supply chain and customs solutions across Nigeria and the world.
            </p>
          </div>

          <div>
            <h4>Quick Links</h4>
            <ul className="footer__links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/services">Our Services</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/tracking">Track Shipment</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4>Services</h4>
            <ul className="footer__links">
              {SERVICES.map((s) => (
                <li key={s}><Link to="/services">{s}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Get in Touch</h4>
            <ul className="footer__contact">
              <li>
                <MapPin size={17} />
                <span>9b, Atiba Close, Onipetesi Estate, Ikeja, Lagos.</span>
              </li>
              <li>
                <Phone size={17} />
                <a href={PHONE_LINK}>{PHONE}</a>
              </li>
              <li>
                <Mail size={17} />
                <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
              </li>
              <li>
                <MessageCircle size={17} />
                <a href={WHATSAPP} target="_blank" rel="noreferrer">Chat on WhatsApp</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© 2026 <b>TPC Logistics Company</b>. All rights reserved.</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Truck size={14} /> Delivering Excellence, every mile.
          </span>
        </div>
      </div>
    </footer>
  );
}
