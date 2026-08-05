import { Link } from 'react-router-dom';
import {
  Ship, Boxes, GitBranch, ShieldCheck, Radar, CheckCircle2, ArrowRight,
  ChevronRight, Package
} from 'lucide-react';
import Reveal from '../components/Reveal.jsx';
import { SERVICES } from '../data/services.js';
import { useQuote } from '../context/QuoteContext.jsx';

const ICONS = { freight: Ship, warehousing: Boxes, 'supply-chain': GitBranch, customs: ShieldCheck, tracking: Radar };
const BG = {
  freight: 'linear-gradient(135deg, #fde68a, #fdba74)',
  warehousing: 'linear-gradient(135deg, #bfdbfe, #93c5fd)',
  'supply-chain': 'linear-gradient(135deg, #c7d2fe, #a5b4fc)',
  customs: 'linear-gradient(135deg, #a7f3d0, #6ee7b7)',
  tracking: 'linear-gradient(135deg, #fed7aa, #fdba74)'
};

export default function Services() {
  const { openQuote } = useQuote();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Reveal>
            <span className="crumb">Home <ChevronRight size={13} /> Services</span>
            <h1>Logistics services, engineered for reliability</h1>
            <p>
              Transportation, warehousing, supply chain, customs and tracking — five specialist
              services that work together to move your business forward.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          {SERVICES.map((s, i) => {
            const Icon = ICONS[s.id];
            return (
              <div key={s.id} className="service-row">
                <Reveal delay={80}>
                  <div className="service-row__visual" style={{ background: BG[s.id] }}>
                    <span className="num">0{i + 1}</span>
                    <Icon className="big" size={120} strokeWidth={1.2} />
                  </div>
                </Reveal>
                <Reveal>
                  <h2>{s.title}</h2>
                  <p className="lead">{s.lead}</p>
                  <ul className="features">
                    {s.features.map((f) => (
                      <li key={f}><CheckCircle2 size={17} /> {f}</li>
                    ))}
                  </ul>
                  <div className="cta-row">
                    <button className="btn btn--primary" onClick={openQuote}>Get a Quote <ArrowRight size={17} /></button>
                    <Link to="/tracking" className="btn btn--outline"><Radar size={17} /> Track a Shipment</Link>
                  </div>
                </Reveal>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section section--tint" style={{ paddingTop: 72 }}>
        <div className="container">
          <Reveal>
            <div className="cta-band">
              <div>
                <h2>Not sure which service you need?</h2>
                <p>Tell us what you're shipping and our team will design the right solution — with one clear quote.</p>
              </div>
              <div className="actions">
                <button className="btn btn--primary" onClick={openQuote}>Talk to an Expert <ArrowRight size={18} /></button>
                <a className="btn btn--ghost" href="https://wa.me/2348022550250" target="_blank" rel="noreferrer">WhatsApp</a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
