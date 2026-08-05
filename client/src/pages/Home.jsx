import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Ship, Boxes, GitBranch, ShieldCheck, Radar, ArrowRight, Search,
  CheckCircle2, Headset, Clock4, Star, ArrowRightLeft, ChevronRight
} from 'lucide-react';
import Reveal from '../components/Reveal.jsx';
import Counter from '../components/Counter.jsx';
import WaybillCard from '../components/WaybillCard.jsx';
import { SERVICES } from '../data/services.js';
import { useQuote } from '../context/QuoteContext.jsx';

const SERVICE_ICONS = { freight: Ship, warehousing: Boxes, 'supply-chain': GitBranch, customs: ShieldCheck, tracking: Radar };
const LANES = ['Lagos → Shanghai', 'Ikeja → London', 'Lagos → Dubai', 'Tema → Kigali', 'Lagos → Accra', 'Ibadan → Guangzhou'];

const WHY_US = [
  { title: 'Real-time visibility', desc: 'Track every shipment live, from pickup to proof of delivery.', icon: Radar },
  { title: '24/7 dedicated support', desc: 'A real team on the phone and on WhatsApp whenever you need us.', icon: Headset },
  { title: 'Customs & compliance experts', desc: 'We clear the paperwork so your cargo never sits in a yard.', icon: ShieldCheck },
  { title: 'Built around your business', desc: 'Flexible, scalable solutions for SMEs and large shippers alike.', icon: Clock4 }
];

const TESTIMONIALS = [
  {
    name: 'Adeola Fashola', role: 'Operations Lead, Adeola Textiles',
    text: 'TPC Logistics has handled our container shipments for years. Communication is sharp, delivery is on time, and the real-time tracking keeps everyone calm.'
  },
  {
    name: 'Chinedu Okoro', role: 'Procurement, Chukwu Engineering',
    text: 'Customs clearance used to be our biggest headache. TPC sorted the paperwork and our spare parts clear within a day. Genuinely dependable people.'
  },
  {
    name: 'Fatima Bello', role: 'Founder, Bello & Sons Trading',
    text: 'From warehouse storage to air freight, everything runs smoothly. They quote fairly, answer quickly, and always deliver as promised.'
  }
];

export default function Home() {
  const navigate = useNavigate();
  const { openQuote } = useQuote();
  const [heroTrack, setHeroTrack] = useState('');

  const onTrack = (e) => {
    e.preventDefault();
    navigate(heroTrack.trim() ? `/tracking?q=${encodeURIComponent(heroTrack.trim())}` : '/tracking');
  };

  return (
    <>
      {/* ============================== HERO ============================== */}
      <section className="hero">
        <div className="container hero__inner">
          <div>
            <Reveal>
              <span className="hero__eyebrow"><span className="dot" /> Trusted Logistics Partner — Ikeja, Lagos</span>
              <h1>
                Delivering <span className="grad">Excellence</span> Across Borders
              </h1>
              <p className="hero__copy">
                TPC Logistics handles your freight, warehousing, supply chain and customs —
                so you can focus on your core operations while we move what matters.
              </p>
              <div className="hero__actions">
                <button className="btn btn--primary" onClick={openQuote}>
                  Get a Free Quote <ArrowRight size={18} />
                </button>
                <Link to="/tracking" className="btn btn--ghost">
                  <Search size={18} /> Track Shipment
                </Link>
              </div>
              <div className="hero__stats">
                <div className="hero__stat"><Counter end={500} suffix="+" /><span>Shipments handled</span></div>
                <div className="hero__stat"><Counter end={5} /><span>Core services</span></div>
                <div className="hero__stat"><Counter end={99} suffix="%" /><span>On-time delivery</span></div>
                <div className="hero__stat"><Counter end={24} suffix="/7" /><span>Support</span></div>
              </div>
            </Reveal>
          </div>

          <div className="hero__visual">
            <Reveal delay={150}>
              <WaybillCard />
              <span className="hero__chip hero__chip--1">Air · Sea · Road</span>
              <span className="hero__chip hero__chip--2">9b Atiba Close, Ikeja</span>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================ MARQUEE ============================ */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          {[...LANES, ...LANES].map((lane, i) => (
            <span key={i} className="marquee__lane">
              <ArrowRightLeft size={18} /> {lane}
            </span>
          ))}
        </div>
      </div>

      {/* ============================ SERVICES ============================ */}
      <section className="section" id="services">
        <div className="container">
          <Reveal>
            <div className="section-head section-head--center">
              <span className="eyebrow">SVC-01 · What We Do</span>
              <h2>Logistics services that keep your business moving</h2>
              <p>
                Five core services, one dependable partner — engineered so you can focus on
                core operations while we handle everything in between.
              </p>
            </div>
          </Reveal>

          <div className="services-grid">
            {SERVICES.map((s, i) => {
              const Icon = SERVICE_ICONS[s.id];
              return (
                <Reveal key={s.id} delay={i * 70} className={s.id === 'tracking' ? 'service-card service-card--wide track-tile' : `service-card ${s.id === 'customs' ? 'service-card--wide' : ''}`}>
                  <div className="ico"><Icon size={26} /></div>
                  <h3>{s.title}</h3>
                  <p>{s.short}</p>
                  {s.id === 'tracking' ? (
                    <>
                      <form className="track-search" onSubmit={onTrack}>
                        <input
                          value={heroTrack}
                          onChange={(e) => setHeroTrack(e.target.value)}
                          placeholder="Enter tracking ID — e.g. TPC-2026-1042"
                          aria-label="Tracking ID"
                        />
                        <button className="btn btn--primary" type="submit"><Search size={16} /></button>
                      </form>
                      <div className="track-meta">
                        <div><b>Live</b><span>Status updates</span></div>
                        <div><b>24/7</b><span>Tracking access</span></div>
                        <div><b>100%</b><span>Delivery alerts</span></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="chips">{s.chips.map((c) => <span key={c} className="chip">{c}</span>)}</div>
                      <Link to="/services" className="service-card__link">Learn more <ChevronRight size={16} /></Link>
                    </>
                  )}
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================ HOW IT WORKS ============================ */}
      <section className="section section--tint">
        <div className="container">
          <Reveal>
            <div className="section-head section-head--center">
              <span className="eyebrow">OPS-02 · How It Works</span>
              <h2>From request to delivery in four simple steps</h2>
            </div>
          </Reveal>
          <div className="steps">
            {[
              ['Request & Plan', 'Tell us what you are shipping and where — we build the plan and quote.'],
              ['We Collect & Pack', 'We pick up your cargo and handle packing, labelling and documents.'],
              ['In Transit', 'Your shipment moves via air, sea or road with live tracking at every stop.'],
              ['Customs & Delivery', 'We clear customs and deliver to the door with proof of delivery.']
            ].map(([title, desc], i) => (
              <Reveal key={title} delay={i * 90}>
                <div className="card step">
                  <span className="step__num">{i + 1}</span>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ WHY US ============================ */}
      <section className="section">
        <div className="container why">
          <Reveal>
            <div className="why__visual">
              <div className="why__panel">
                <div className="why__badge"><b>24/7</b><span>Operations</span></div>
                <svg className="bg-map" viewBox="0 0 400 300" fill="none" aria-hidden="true">
                  <circle cx="80" cy="80" r="4" fill="#f5a623" /><circle cx="310" cy="60" r="4" fill="#f5a623" />
                  <circle cx="120" cy="230" r="4" fill="#f5a623" /><circle cx="330" cy="220" r="4" fill="#f5a623" />
                  <path d="M80 80 C 150 120, 200 60, 310 60" stroke="#f5a623" strokeWidth="1.5" strokeDasharray="5 7" />
                  <path d="M80 80 C 110 160, 150 210, 120 230" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="5 7" />
                  <path d="M310 60 C 320 130, 300 180, 330 220" stroke="#ff7a1a" strokeWidth="1.5" strokeDasharray="5 7" />
                  <path d="M120 230 C 200 210, 260 230, 330 220" stroke="#7dd3fc" strokeWidth="1.5" strokeDasharray="5 7" opacity="0.7" />
                </svg>
                <h3>Nigeria's gateway to the world</h3>
                <p>Based in Ikeja, Lagos — at the heart of West Africa's busiest trade corridor.</p>
              </div>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <div className="section-head">
                <span className="eyebrow">SVC-03 · Why TPC Logistics</span>
                <h2>The partner you can trust with your cargo</h2>
              </div>
            </Reveal>
            <ul className="why__list">
              {WHY_US.map((w, i) => (
                <Reveal key={w.title} delay={i * 80}>
                  <li>
                    <span className="tick"><CheckCircle2 size={19} /></span>
                    <div><b>{w.title}</b><p>{w.desc}</p></div>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ============================ CTA BAND ============================ */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <div className="cta-band">
              <div>
                <h2>Ready to move your cargo?</h2>
                <p>Request a free quote in under two minutes, or talk to a real person on WhatsApp — we reply fast.</p>
              </div>
              <div className="actions">
                <button className="btn btn--primary" onClick={openQuote}>Get a Quote <ArrowRight size={18} /></button>
                <a className="btn btn--ghost" href="https://wa.me/2348022550250" target="_blank" rel="noreferrer">WhatsApp Us</a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================ TESTIMONIALS ============================ */}
      <section className="section section--tint">
        <div className="container">
          <Reveal>
            <div className="section-head section-head--center">
              <span className="eyebrow">REF-04 · Client Stories</span>
              <h2>Trusted by shippers across the continent</h2>
            </div>
          </Reveal>
          <div className="testimonials">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 90}>
                <div className="card testimonial">
                  <span className="stars">
                    {[...Array(5)].map((_, s) => <Star key={s} size={16} fill="currentColor" />)}
                  </span>
                  <p className="quote">“{t.text}”</p>
                  <div className="person">
                    <span className="avatar">{t.name.split(' ').map((n) => n[0]).join('')}</span>
                    <div><b>{t.name}</b><span>{t.role}</span></div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ FINAL BAND ============================ */}
      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-head section-head--center" style={{ marginBottom: 0 }}>
              <span className="eyebrow">NET-05 · Global Reach</span>
              <h2>Wherever your business ships, we're on the route</h2>
              <p>
                Serving businesses from Lagos to London, Shanghai to Dubai — with one standard: delivered excellence.
              </p>
              <div style={{ marginTop: 30 }}>
                <Link to="/contact" className="btn btn--dark">Talk to Our Team <ArrowRight size={18} /></Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
