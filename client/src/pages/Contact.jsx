import { useState } from 'react';
import {
  ChevronRight, MapPin, Phone, Mail, MessageCircle, Send, CheckCircle2, Clock4
} from 'lucide-react';
import Reveal from '../components/Reveal.jsx';
import { sendContact } from '../api.js';

const PHONE = '+234 802 255 0250';
const PHONE_LINK = 'tel:+2348022550250';
const EMAIL = 'tpclogisticscompany@gmail.com';
const WHATSAPP = 'https://wa.me/2348022550250';

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
        <div className="container">
          <Reveal>
            <span className="crumb">Home <ChevronRight size={13} /> Contact</span>
            <h1>Get in touch with our team</h1>
            <p>
              Questions, quotes or a cargo to move — call, email, WhatsApp or send a message.
              We respond within one business day.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container contact-grid">
          <div className="contact-cards">
            <Reveal>
              <div className="card contact-card">
                <span className="ico"><MapPin size={22} /></span>
                <div>
                  <h3>Visit Us</h3>
                  <p>TPC Logistics Company<br />9b, Atiba Close, Onipetesi Estate,<br />Ikeja, Lagos.</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={70}>
              <div className="card contact-card">
                <span className="ico"><Phone size={22} /></span>
                <div>
                  <h3>Call Us</h3>
                  <a href={PHONE_LINK}>{PHONE}</a>
                  <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Mon–Sat, 8am–7pm</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={140}>
              <div className="card contact-card">
                <span className="ico"><Mail size={22} /></span>
                <div>
                  <h3>Email Us</h3>
                  <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
                </div>
              </div>
            </Reveal>
            <Reveal delay={210}>
              <div className="card contact-card contact-card--wa">
                <span className="ico"><MessageCircle size={22} /></span>
                <div>
                  <h3>WhatsApp</h3>
                  <a href={WHATSAPP} target="_blank" rel="noreferrer">Chat with us now</a>
                </div>
              </div>
            </Reveal>
            <Reveal delay={280}>
              <div className="card contact-card">
                <span className="ico"><Clock4 size={22} /></span>
                <div>
                  <h3>Response Time</h3>
                  <p>Quotes within 24 hours · Support 24/7 for active shipments</p>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120}>
            <div className="card form-card">
              {sent ? (
                <div className="form-success">
                  <span className="tick"><CheckCircle2 size={36} /></span>
                  <h4>Message sent!</h4>
                  <p>Thanks for reaching out — our team will reply within one business day.</p>
                  <button className="btn btn--dark" onClick={() => setSent(false)}>Send another message</button>
                </div>
              ) : (
                <>
                  <h3>Send us a message</h3>
                  <p>Tell us what you need — a quote, a question or support with an active shipment.</p>
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
                      {error && <p className="field--full" style={{ color: 'var(--red)', fontSize: '0.85rem', fontWeight: 600 }}>{error}</p>}
                      <div className="field--full">
                        <button className="btn btn--primary btn--block" disabled={sending}>
                          <Send size={17} /> {sending ? 'Sending...' : 'Send Message'}
                        </button>
                      </div>
                    </div>
                  </form>
                </>
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
