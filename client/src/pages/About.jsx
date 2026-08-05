import { Link } from 'react-router-dom';
import { ChevronRight, Compass, Eye, HeartHandshake, ArrowRight, ShieldCheck } from 'lucide-react';
import Reveal from '../components/Reveal.jsx';
import Counter from '../components/Counter.jsx';
import { useQuote } from '../context/QuoteContext.jsx';

export default function About() {
  const { openQuote } = useQuote();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Reveal>
            <span className="crumb">Home <ChevronRight size={13} /> About</span>
            <h1>Delivering excellence, every single mile</h1>
            <p>
              TPC Logistics is a trusted partner for businesses seeking reliable and efficient
              logistics solutions — from our base in Ikeja, Lagos to destinations worldwide.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container about-story">
          <Reveal>
            <div className="about-story__panel">
              <span className="emoji-big">🚚</span>
              <h3>9b, Atiba Close, Onipetesi Estate, Ikeja, Lagos</h3>
              <p>At the heart of Nigeria's commercial capital — close to the ports, the airport and the markets that matter.</p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="section-head" style={{ marginBottom: 0 }}>
              <span className="eyebrow"><HeartHandshake size={14} /> Our Story</span>
              <h2>Reliability is our business model</h2>
            </div>
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
      </section>

      <section className="section section--tint" style={{ paddingTop: 72 }}>
        <div className="container">
          <Reveal>
            <div className="section-head section-head--center">
              <span className="eyebrow"><Compass size={14} /> What Drives Us</span>
              <h2>Mission, vision & values</h2>
            </div>
          </Reveal>
          <div className="mvv">
            <Reveal>
              <div className="card">
                <span className="ico"><Compass size={24} /></span>
                <h3>Our Mission</h3>
                <p>To deliver reliable, efficient and transparent logistics solutions that let our clients grow without friction.</p>
              </div>
            </Reveal>
            <Reveal delay={90}>
              <div className="card">
                <span className="ico"><Eye size={24} /></span>
                <h3>Our Vision</h3>
                <p>To be West Africa's most trusted logistics partner — known for excellence at every touchpoint, every time.</p>
              </div>
            </Reveal>
            <Reveal delay={180}>
              <div className="card">
                <span className="ico"><ShieldCheck size={24} /></span>
                <h3>Our Values</h3>
                <p>Integrity, precision, communication and care — the standards we hold for every shipment we touch.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="cta-band">
              <div>
                <h2>Let's handle the logistics. You handle the business.</h2>
                <p>Reach out today — we'll respond within one business day, usually much faster.</p>
              </div>
              <div className="actions">
                <button className="btn btn--primary" onClick={openQuote}>Get a Quote <ArrowRight size={18} /></button>
                <Link to="/contact" className="btn btn--ghost">Contact Us</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
