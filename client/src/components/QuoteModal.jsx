import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Send, ArrowUpRight } from 'lucide-react';
import { useQuote } from '../context/QuoteContext.jsx';
import { sendQuote } from '../api.js';

const SERVICES = [
  'Freight Forwarding & Transportation',
  'Warehousing & Storage',
  'Supply Chain Management',
  'Customs Clearance',
  'Real-time Tracking & Delivery'
];

const initial = {
  name: '',
  company: '',
  email: '',
  phone: '',
  service: SERVICES[0],
  origin: '',
  destination: '',
  weight: '',
  note: ''
};

export default function QuoteModal() {
  const { open, closeQuote } = useQuote();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setError('');
      setSent(false);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && closeQuote();
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeQuote]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim()) {
      setError('Please fill in your name and email.');
      return;
    }
    setSending(true);
    try {
      await sendQuote(form);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          onClick={closeQuote}
          role="dialog"
          aria-modal="true"
          aria-label="Request a quote"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 36, scale: 0.97, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 24, scale: 0.98, filter: 'blur(6px)' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="modal__glow" aria-hidden="true" />
            <div className="modal__head">
              <div>
                <span className="modal__kicker">QUOTE-01 · 24H RESPONSE</span>
                <h3>Request a Quote</h3>
                <p>Tell us about your shipment — we respond within 24 hours.</p>
              </div>
              <button className="modal__close" onClick={closeQuote} aria-label="Close">
                <X size={19} />
              </button>
            </div>

            <div className="modal__body">
              {sent ? (
                <div className="form-success">
                  <span className="tick"><CheckCircle2 size={36} /></span>
                  <h4>Quote request received!</h4>
                  <p>Our team will get back to you with a tailored quote within one business day.</p>
                  <button className="btn btn--yellow" onClick={closeQuote}>Done <ArrowUpRight size={16} /></button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <div className="form-grid">
                    <div className="field">
                      <label htmlFor="q-name">Full name *</label>
                      <input id="q-name" value={form.name} onChange={set('name')} placeholder="e.g. Ade Bello" />
                    </div>
                    <div className="field">
                      <label htmlFor="q-company">Company</label>
                      <input id="q-company" value={form.company} onChange={set('company')} placeholder="Company name" />
                    </div>
                    <div className="field">
                      <label htmlFor="q-email">Email *</label>
                      <input id="q-email" type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" />
                    </div>
                    <div className="field">
                      <label htmlFor="q-phone">Phone</label>
                      <input id="q-phone" value={form.phone} onChange={set('phone')} placeholder="+234 ..." />
                    </div>
                    <div className="field field--full">
                      <label htmlFor="q-service">Service</label>
                      <select id="q-service" value={form.service} onChange={set('service')}>
                        {SERVICES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="q-origin">Origin</label>
                      <input id="q-origin" value={form.origin} onChange={set('origin')} placeholder="City / country" />
                    </div>
                    <div className="field">
                      <label htmlFor="q-dest">Destination</label>
                      <input id="q-dest" value={form.destination} onChange={set('destination')} placeholder="City / country" />
                    </div>
                    <div className="field field--full">
                      <label htmlFor="q-weight">Approx. weight / volume</label>
                      <input id="q-weight" value={form.weight} onChange={set('weight')} placeholder="e.g. 2,000 kg or 10 CBM" />
                    </div>
                    <div className="field field--full">
                      <label htmlFor="q-note">Additional details</label>
                      <textarea id="q-note" value={form.note} onChange={set('note')} placeholder="Cargo type, timing, special handling..." />
                    </div>
                    {error && <p className="err field--full">{error}</p>}
                    <div className="field--full">
                      <button className="btn btn--yellow btn--block" disabled={sending}>
                        <Send size={17} /> {sending ? 'Sending...' : 'Submit Quote Request'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
