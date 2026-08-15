import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, HeartHandshake, Compass, Eye, ShieldCheck } from 'lucide-react';
import Reveal from '../components/Reveal.jsx';
import { gsap } from '../lib/gsap.js';
import { useQuote } from '../context/QuoteContext.jsx';

const MVV = [
  {
    n: '01', icon: Compass, title: 'Our Mission',
    text: 'To deliver reliable, efficient and transparent logistics solutions that let our clients grow without friction.'
  },
  {
    n: '02', icon: Eye, title: 'Our Vision',
    text: 'To be West Africa\u2019s most trusted logistics partner — known for excellence at every touchpoint, every time.'
  },
  {
    n: '03', icon: ShieldCheck, title: 'Our Values',
    text: 'Integrity, precision, communication and care — the standards we hold for every shipment we touch.'
  }
];

export default function About() {
  const { openQuote } = useQuote();
  const imgRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !imgRef.current) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        imgRef.current,
        { yPercent: -12, scale: 1.15 },
        {
          yPercent: 12,
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: '.about-band-hero', start: 'top top', end: 'bottom top', scrub: true }
        }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* ----------------------- full-bleed parallax hero ----------------------- */}
      <section className="about-band-hero">
        <div className="about-band-hero__img" ref={imgRef} aria-hidden="true" />
        <div className="about-band-hero__shade" aria-hidden="true" />
        <div className="container about-band-hero__content">
          <Reveal>
            <span className="crumb">HOME <span>/</span> ABOUT</span>
            <h1>Delivering excellence, every single mile</h1>
            <p>
              TPC Logistics — The Parent Choice — is a trusted partner for businesses seeking reliable
              and efficient logistics solutions, from our base in Ikeja, Lagos to destinations worldwide.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------ story ------------------------------ */}
      <section className="section about-story">
        <div className="container about-story__grid">
          <Reveal>
            <div className="about-story__panel">
              <span className="about-story__kicker">HQ — 01</span>
              <h3>9b, Atiba Close, Onipetesi Estate, Ikeja, Lagos</h3>
              <p>At the heart of Nigeria's commercial capital — close to the ports, the airport and the markets that matter.</p>
              <div className="about-story__coords mono">6.5244° N · 3.3792° E</div>
            </div>
          </Reveal>
          <div>
            <Reveal delay={80}>
              <div className="section-head" style={{ marginBottom: 0 }}>
                <span className="eyebrow"><HeartHandshake size={14} /> OUR STORY</span>
                <h2>Reliability is our business model</h2>
              </div>
            </Reveal>
            <Reveal delay={140}>
              <p className="lead">
                We started TPC Logistics with a simple belief: businesses should never have to
                worry about whether their goods will arrive.
              </p>
              <p>
                With a strong foundation in transportation, warehousing and supply chain management,
                we empower our clients to focus on their core operations while we handle their
                logistics needs — from a single parcel to full container loads.
              </p>
              <p>
                Every shipment is backed by the same promise: clear communication, careful handling,
                on-time delivery, and a team that answers when you call.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------------------- mission / values ---------------------------- */}
      <section className="section about-mvv">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="eyebrow"><Compass size={14} /> WHAT DRIVES US</span>
              <h2>Mission, vision &amp; values</h2>
            </div>
          </Reveal>
          <div className="mvv">
            {MVV.map((m, i) => (
              <Reveal key={m.n} delay={i * 90}>
                <div className="mvv__row">
                  <span className="mvv__num">{m.n}</span>
                  <div className="mvv__body">
                    <h3>{m.title}</h3>
                    <p>{m.text}</p>
                  </div>
                  <span className="mvv__icon"><m.icon size={26} /></span>
                </div>
              </Reveal>
            ))}
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
                <h2>Let's handle the logistics. You handle the business.</h2>
                <p>Reach out today — we'll respond within one business day, usually much faster.</p>
              </div>
              <div className="actions">
                <button className="btn btn--yellow" onClick={openQuote}>Get a Quote <ArrowUpRight size={18} /></button>
                <Link to="/contact" className="btn btn--ghost">Contact Us</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
