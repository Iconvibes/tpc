import { useState } from 'react';
import {
  MapPin, Phone, Mail, MessageCircle, Send, CheckCircle2, Clock4, ArrowUpRight
} from 'lucide-react';
import Reveal from '../components/Reveal.jsx';
import { sendContact } from '../api.js';

const PHONE = '+234 802 255 0250';
const PHONE_LINK = 'tel:+2348022550250';
const EMAIL = 'tpclogisticscompany@gmail.com';
const WHATSAPP = 'https://wa.me/2348022550250';

const INFO = [
  { n: '01', icon: MapPin, label: 'VISIT US', value: '9b, Atiba Close, Onipetesi Estate, Ikeja, Lagos.', href: null },
  { n: '02', icon: Phone, label: 'CALL US', value: PHONE, sub: 'Mon–Sat, 8am–7pm', href: PHONE_LINK },
  { n: '03', icon: Mail, label: 'EMAIL US', value: EMAIL, href: `mailto:${EMAIL}` },
  { n: '04', icon: MessageCircle, label: 'WHATSAPP', value: 'Chat with us now', href: WHATSAPP },
  { n: '05', icon: Clock4, label: 'RESPONSE TIME', value: 'Quotes within 24 hours · Support 24/7 for active shipments', href: null }
];

const initial = { name: '', email: '', phone: '', subject: '', message: '' };

export default function Contact() {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in your name, email and message.');
      return;
    }
    setSending(true);
    try {
      await sendContact(form);
      setSent(true);
      setForm(initial);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <section className="page-hero">
        <div className="container page-hero__inner">
          <Reveal>
            <span className="crumb">HOME <span>/</span> CONTACT</span>
            <h1>
              GET IN TOUCH<span className="hero__caret" />
            </h1>
            <p className="page-hero__sub">
              Questions, quotes or a cargo to move — call, email, WhatsApp or send a message.
              We respond within one business day.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container contact-grid">
          <div className="contact-cards">
            {INFO.map((c, i) => {
              const Icon = c.icon;
              const inner = (
                <>
                  <span className="contact-card__num">{c.n}</span>
                  <span className="contact-card__ico"><Icon size={22} /></span>
                  <div>
                    <span className="contact-card__label">{c.label}</span>
                    <p>{c.value}</p>
                    {c.sub && <em>{c.sub}</em>}
                  </div>
                  {c.href && <ArrowUpRight size={18} className="contact-card__arrow" />}
                </>
              );
              return (
                <Reveal key={c.n} delay={i * 60}>
                  {c.href ? (
                    <a className="contact-card" href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                      {inner}
                    </a>
                  ) : (
                    <div className="contact-card">{inner}</div>
                  )}
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={120}>
            <div className="form-card">
              <span className="form-card__kicker">MESSAGE-01</span>
              <h3>Send us a message</h3>
              <p>Tell us what you need — a quote, a question or support with an active shipment.</p>
              {sent ? (
                <div className="form-success">
                  <span className="tick"><CheckCircle2 size={36} /></span>
                  <h4>Message sent!</h4>
                  <p>Thanks for reaching out — our team will reply within one business day.</p>
                  <button className="btn btn--yellow" onClick={() => setSent(false)}>Send another message <ArrowUpRight size={16} /></button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <div className="form-grid">
                    <div className="field">
                      <label htmlFor="c-name">Full name *</label>
                      <input id="c-name" value={form.name} onChange={set('name')} placeholder="Your name" />
                    </div>
                    <div className="field">
                      <label htmlFor="c-email">Email *</label>
                      <input id="c-email" type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" />
                    </div>
                    <div className="field">
                      <label htmlFor="c-phone">Phone</label>
                      <input id="c-phone" value={form.phone} onChange={set('phone')} placeholder="+234 ..." />
                    </div>
                    <div className="field">
                      <label htmlFor="c-subject">Subject</label>
                      <input id="c-subject" value={form.subject} onChange={set('subject')} placeholder="e.g. Freight quote" />
                    </div>
                    <div className="field field--full">
                      <label htmlFor="c-message">Message *</label>
                      <textarea id="c-message" value={form.message} onChange={set('message')} placeholder="How can we help?" />
                    </div>
                    {error && <p className="err field--full">{error}</p>}
                    <div className="field--full">
                      <button className="btn btn--yellow btn--block" disabled={sending}>
                        <Send size={17} /> {sending ? 'Sending...' : 'Send Message'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </Reveal>
        </div>

        <div className="container">
          <Reveal>
            <div className="map-wrap">
              <iframe
                title="TPC Logistics location — Ikeja, Lagos"
                src="https://www.google.com/maps?q=Onipetesi+Estate,+Ikeja,+Lagos,+Nigeria&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
