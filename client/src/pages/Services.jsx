import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowUpRight, Plus, Radar } from 'lucide-react';
import Reveal from '../components/Reveal.jsx';
import ServiceRail, { SERVICE_ICONS } from '../components/ServiceRail.jsx';
import { SERVICES } from '../data/services.js';
import { useQuote } from '../context/QuoteContext.jsx';

export default function Services() {
  const { openQuote } = useQuote();
  const [openId, setOpenId] = useState(SERVICES[0].id);

  return (
    <>
      <section className="page-hero">
        <div className="container page-hero__inner">
          <Reveal>
            <span className="crumb">HOME <span>/</span> SERVICES</span>
            <h1>
              SERVICES<span className="hero__caret" />
            </h1>
            <p className="page-hero__sub">
              Transportation, warehousing, supply chain, customs and tracking — five specialist
              services that work together to move your business forward.
            </p>
          </Reveal>
        </div>
      </section>

      <ServiceRail
        items={SERVICES}
        eyebrow="SVC-01 · THE NETWORK"
        title="One partner. Every mile."
        sub="Scroll to move through the rail."
      />

      {/* ---------------------------- details ---------------------------- */}
      <section className="section svc-details">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="eyebrow">SVC-02 · DETAILS</span>
              <h2>What each service covers</h2>
            </div>
          </Reveal>

          <div className="svc-accordion">
            {SERVICES.map((s, i) => {
              const Icon = SERVICE_ICONS[s.id];
              const open = openId === s.id;
              return (
                <Reveal key={s.id} delay={i * 60}>
                  <div className={`svc-item ${open ? 'svc-item--open' : ''}`}>
                    <button className="svc-item__head" onClick={() => setOpenId(open ? null : s.id)} aria-expanded={open}>
                      <span className="svc-item__num">0{i + 1}</span>
                      <span className="svc-item__icon"><Icon size={26} /></span>
                      <h3>{s.title}</h3>
                      <motion.span
                        className="svc-item__plus"
                        animate={{ rotate: open ? 45 : 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <Plus size={20} />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          className="svc-item__body"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <p className="svc-item__lead">{s.lead}</p>
                          <ul className="features">
                            {s.features.map((f) => (
                              <li key={f}><CheckCircle2 size={17} /> {f}</li>
                            ))}
                          </ul>
                          <div className="cta-row">
                            <button className="btn btn--yellow" onClick={openQuote}>Get a Quote <ArrowUpRight size={17} /></button>
                            <Link to="/tracking" className="btn btn--ghost"><Radar size={17} /> Track a Shipment</Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------ CTA ------------------------------ */}
      <section className="section cta-band-section">
        <div className="container">
          <Reveal>
            <div className="cta-band">
              <div>
                <span className="eyebrow">NEXT STEP</span>
                <h2>Not sure which service you need?</h2>
                <p>Tell us what you're shipping and our team will design the right solution — with one clear quote.</p>
              </div>
              <div className="actions">
                <button className="btn btn--yellow" onClick={openQuote}>Talk to an Expert <ArrowUpRight size={18} /></button>
                <a className="btn btn--ghost" href="https://wa.me/2348022550250" target="_blank" rel="noreferrer">WhatsApp</a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
