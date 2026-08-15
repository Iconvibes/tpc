import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Ship, Boxes, GitBranch, ShieldCheck, Radar, ArrowUpRight } from 'lucide-react';
import { gsap } from '../lib/gsap.js';
import Tilt from './Tilt.jsx';
import Reveal from './Reveal.jsx';

export const SERVICE_ICONS = {
  freight: Ship,
  warehousing: Boxes,
  'supply-chain': GitBranch,
  customs: ShieldCheck,
  tracking: Radar
};

/**
 * ServiceRail — the horizontal gallery. Pinned + scrubbed on desktop,
 * a native swipe carousel on mobile. No boxes: type, index and a 3D
 * icon that tilts on hover are the whole composition.
 */
export default function ServiceRail({ items, eyebrow = 'SVC-02 · Capabilities', title = 'Five services. One network.', sub = 'Drag through the rail.' }) {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const barRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;

    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      const track = trackRef.current;
      if (!track) return;
      const amount = () => Math.max(track.scrollWidth - window.innerWidth, 0);
      const tween = gsap.to(track, {
        x: () => -amount(),
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${amount()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`;
          }
        }
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section className="rail" ref={sectionRef}>
      <div className="container rail__head">
        <Reveal>
          <div className="section-head">
            <span className="eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
            <p className="rail__hint"><i /> {sub}</p>
          </div>
        </Reveal>
        <div className="rail__progress" aria-hidden="true"><span ref={barRef} /></div>
      </div>

      <div className="rail__viewport">
        <div className="rail__track" ref={trackRef}>
          {items.map((s, i) => {
            const Icon = SERVICE_ICONS[s.id] || Ship;
            return (
              <article className="rail__item" key={s.id}>
                <span className="rail__num">0{i + 1}</span>
                <Tilt max={14} className="rail__tilt">
                  <span className="rail__icon"><Icon size={54} strokeWidth={1.15} /></span>
                </Tilt>
                <h3>{s.title}</h3>
                <p>{s.short}</p>
                <div className="chips">
                  {s.chips.map((c) => <span key={c} className="chip">{c}</span>)}
                </div>
                <Link to="/services" className="rail__link">
                  Explore <ArrowUpRight size={18} />
                </Link>
              </article>
            );
          })}

          <div className="rail__end">
            <span>+1,800</span>
            <b>shipments<br />moved</b>
            <Link to="/services" className="btn btn--primary">All Services <ArrowUpRight size={18} /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
