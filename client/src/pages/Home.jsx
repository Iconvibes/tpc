import { lazy, Suspense, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import JourneyHUD from '../components/hero3d/JourneyHUD.jsx';
import {
  Radar, Headset, ShieldCheck, Clock4, ArrowUpRight, ArrowRightLeft, Search, ArrowRight
} from 'lucide-react';
import Reveal from '../components/Reveal.jsx';
import Counter from '../components/Counter.jsx';
import ServiceRail from '../components/ServiceRail.jsx';
import LiveMap from '../components/LiveMap.jsx';
import Tilt from '../components/Tilt.jsx';
import { SERVICES } from '../data/services.js';
import { useQuote } from '../context/QuoteContext.jsx';

const Journey3D = lazy(() => import('../components/hero3d/Journey3D.jsx'));

const LANES = ['Lagos → Shanghai', 'Ikeja → London', 'Lagos → Dubai', 'Tema → Kigali', 'Lagos → Accra', 'Ibadan → Guangzhou'];
const SAMPLE_IDS = ['TPC-2026-1077', 'TPC-2026-1081', 'TPC-2026-1055', 'TPC-2026-1090'];

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

const heroStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } }
};

const heroLine = {
  hidden: { opacity: 0, y: 90, rotate: 2, filter: 'blur(12px)' },
  show: { opacity: 1, y: 0, rotate: 0, filter: 'blur(0px)', transition: { duration: 1.05, ease: [0.16, 1, 0.3, 1] } }
};

const heroFade = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

/* ---------------------------- why-us 3D rig ---------------------------- */

function CargoRig() {
  return (
    <div className="rig">
      <div className="rig__glow" aria-hidden="true" />
      <Tilt max={16} scale={1.04} className="rig__tilt">
        <div className="cube">
          <div className="cube__face cube__face--front">
            <span className="cube__logo">TPC</span>
            <i className="cube__stripe" />
            <b>40FT · IKEJA → LHR</b>
          </div>
          <div className="cube__face cube__face--back" />
          <div className="cube__face cube__face--right" />
          <div className="cube__face cube__face--left" />
          <div className="cube__face cube__face--top" />
          <div className="cube__face cube__face--bottom" />
        </div>
      </Tilt>
      <div className="rig__chip rig__chip--1"><b>24/7</b><span>OPERATIONS</span></div>
      <div className="rig__chip rig__chip--2"><b>99%</b><span>ON-TIME</span></div>
      <div className="rig__chip rig__chip--3"><b>LIVE</b><span>VISIBILITY</span></div>
    </div>
  );
}

/* -------------------------------- page -------------------------------- */

export default function Home() {
  const navigate = useNavigate();
  const { openQuote } = useQuote();
  const reduce = useReducedMotion();
  const [trackId, setTrackId] = useState('');
  // the journey store lives in Journey3D; share it up for the HUD overlay
  const journeyStore = useRef(null);

  const onTrack = (e) => {
    e.preventDefault();
    navigate(trackId.trim() ? `/tracking?q=${encodeURIComponent(trackId.trim())}` : '/tracking');
  };

  return (
    <>
      {/* ============================== HERO ============================== */}
      <section className="hero">
        <div className="container hero__inner">
          <motion.div variants={heroStagger} initial={reduce ? false : 'hidden'} animate={reduce ? false : 'show'} className="hero__text">
            <motion.span variants={heroFade} className="hero__eyebrow">
              <i /> THE PARENT CHOICE · GLOBAL LOGISTICS · IKEJA, LAGOS
            </motion.span>
            <motion.h1 variants={heroLine} className="hero__title">
              <motion.span variants={heroLine} className="hero__line">TPC</motion.span>
              <motion.span variants={heroLine} className="hero__line hero__line--outline">LOGISTICS</motion.span>
            </motion.h1>
            <motion.p variants={heroFade} className="hero__tag">
              Ship Smarter. Deliver Faster<span className="hero__caret" />
            </motion.p>
            <motion.div variants={heroFade} className="hero__actions">
              <Link to="/tracking" className="btn btn--yellow">
                <Search size={18} /> Track Shipment
              </Link>
              <button className="btn btn--ghost" onClick={openQuote}>
                Get Quote <ArrowUpRight size={18} />
              </button>
            </motion.div>
          </motion.div>

          <motion.div
            className="hero__stats"
            initial={reduce ? false : { opacity: 0, y: 30 }}
            animate={reduce ? false : { opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="hero__stat"><Counter end={500} suffix="+" /><span>Shipments handled</span></div>
            <div className="hero__stat"><Counter end={5} /><span>Core services</span></div>
            <div className="hero__stat"><Counter end={99} suffix="%" /><span>On-time delivery</span></div>
            <div className="hero__stat"><Counter end={24} suffix="/7" /><span>Support</span></div>
          </motion.div>
        </div>

        <Suspense fallback={null}>
          <Journey3D storeRef={journeyStore} />
        </Suspense>

        <div className="hero__meta" aria-hidden="true">
          <span>SCROLL</span>
          <span className="hero__meta-line" />
          <span>6.5244° N / 3.3792° E</span>
        </div>
      </section>

      {/* dispatcher feed — page-level overlay so it follows the whole journey */}
      {!reduce && <JourneyHUD storeRef={journeyStore} reduced={reduce} />}

      {/* ============================ MARQUEE ============================ */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          {[...LANES, ...LANES].map((lane, i) => (
            <span key={i} className="marquee__lane">
              {lane} <ArrowRightLeft size={20} />
            </span>
          ))}
        </div>
      </div>

      {/* ============================ SERVICES ============================ */}
      <ServiceRail items={SERVICES} />

      {/* ========================== LIVE TRACK ========================== */}
      <section className="section track-section" id="track">
        <div className="container">
          <Reveal>
            <div className="section-head section-head--center">
              <span className="eyebrow">TRACK-03 · LIVE</span>
              <h2>Know where your cargo is. Always.</h2>
              <p>One tracking ID gives you every milestone — from registration to final delivery.</p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <form className="track-search-big" onSubmit={onTrack}>
              <input
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                placeholder="Enter tracking ID — e.g. TPC-2026-1042"
                aria-label="Tracking ID"
                spellCheck="false"
              />
              <button className="btn btn--yellow" type="submit">
                <Search size={18} /> Track
              </button>
            </form>
          </Reveal>

          <Reveal delay={150}>
            <div className="track-hints">
              {SAMPLE_IDS.map((id) => (
                <button key={id} className="track-hint" onClick={() => { setTrackId(id); navigate(`/tracking?q=${id}`); }}>
                  {id}
                </button>
              ))}
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="map-frame">
              <div className="map-frame__top">
                <span><i className="map-frame__live-dot" /> LIVE NETWORK</span>
                <span className="mono">AUTO-REFRESH · 30S</span>
              </div>
              <LiveMap height={460} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================= WHY US ============================= */}
      <section className="section why">
        <div className="container why__grid">
          <div className="why__copy">
            <Reveal>
              <div className="section-head">
                <span className="eyebrow">WHY-04 · THE EDGE</span>
                <h2>The partner you can trust with your cargo</h2>
              </div>
            </Reveal>
            <ul className="why__list">
              {WHY_US.map((w, i) => (
                <Reveal key={w.title} delay={i * 90}>
                  <li className="why__row">
                    <span className="why__num">0{i + 1}</span>
                    <div>
                      <b>{w.title}</b>
                      <p>{w.desc}</p>
                    </div>
                    <ArrowUpRight size={20} />
                  </li>
                </Reveal>
              ))}
            </ul>
            <Reveal delay={360}>
              <Link to="/about" className="btn btn--ghost">Why TPC <ArrowRight size={17} /></Link>
            </Reveal>
          </div>

          <div className="why__visual">
            <CargoRig />
          </div>
        </div>
      </section>

      {/* ============================ ABOUT BAND ============================ */}
      <section className="about-band">
        <div className="about-band__img" aria-hidden="true" />
        <div className="about-band__panel">
          <Reveal>
            <span className="eyebrow">ABOUT-05 · THE PARENT CHOICE</span>
            <h2>We move what matters.</h2>
            <p>
              From a single carton to full container loads — reliable, transparent logistics
              from the heart of Lagos to the world.
            </p>
            <Link to="/about" className="btn btn--yellow">Our Story <ArrowUpRight size={18} /></Link>
          </Reveal>
        </div>
      </section>

      {/* ========================== TESTIMONIALS ========================== */}
      <section className="section quotes">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="eyebrow">REF-06 · CLIENT STORIES</span>
              <h2>Trusted by shippers across the continent</h2>
            </div>
          </Reveal>
          <div className="quotes__list">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 100}>
                <blockquote className="quotes__row">
                  <p className="quotes__mark">“</p>
                  <p className="quotes__text">{t.text}</p>
                  <footer>
                    <span className="quotes__name">{t.name}</span>
                    <span className="quotes__role">{t.role}</span>
                  </footer>
                </blockquote>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
