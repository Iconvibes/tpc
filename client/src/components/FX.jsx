import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from '../lib/gsap.js';

const PACKAGE_ICON = (
  <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <rect x="10" y="12" width="44" height="40" rx="6" fill="#0A0A0A" />
    <path d="M10 24h44" stroke="#FFB800" strokeWidth="3" />
    <path d="M32 24v28" stroke="#FFB800" strokeWidth="3" opacity="0.35" />
    <path d="M22 12v12M42 12v12" stroke="#FFB800" strokeWidth="3" />
  </svg>
);

/**
 * FX — the site's atmosphere layer. Mounted once in App:
 *  · Lenis smooth scrolling wired into GSAP's ticker + ScrollTrigger
 *  · animated film grain
 *  · a liquid-mesh light field that shifts with scroll
 *  · a custom cursor that becomes a "package" over interactive elements
 *  · liquid ripple on every .btn click
 */
export default function FX() {
  const cursorRef = useRef(null);

  /* ------------------------------ lenis ------------------------------ */
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;

    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', () => gsap.ticker.lagSmoothing(0));
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  /* --------------------------- liquid mesh --------------------------- */
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mesh = document.querySelector('.fx-mesh');
    const driftA = document.querySelector('.fx-mesh__a');
    const driftB = document.querySelector('.fx-mesh__b');
    if (!mesh || reduced) return undefined;

    const st = gsap.to(mesh, {
      backgroundPosition: '120% 140%',
      ease: 'none',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.8
      }
    });

    const tweenA = gsap.to(driftA, { yPercent: 30, xPercent: -20, duration: 14, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    const tweenB = gsap.to(driftB, { yPercent: -26, xPercent: 24, duration: 18, yoyo: true, repeat: -1, ease: 'sine.inOut' });

    return () => {
      st.scrollTrigger?.kill();
      st.kill();
      tweenA.kill();
      tweenB.kill();
    };
  }, []);

  /* --------------------------- custom cursor --------------------------- */
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return undefined;
    document.body.classList.add('custom-cursor');

    const root = cursorRef.current;
    const dot = root.querySelector('.cursor__dot');
    const ring = root.querySelector('.cursor__ring');
    const badge = root.querySelector('.cursor__badge');

    // gsap owns every transform on the cursor (x/y for tracking, scale for
    // state), so class-based transforms never fight inline styles.
    gsap.set(root, { xPercent: -50, yPercent: -50, opacity: 1 });
    gsap.set(dot, { xPercent: -50, yPercent: -50 });
    gsap.set(ring, { xPercent: -50, yPercent: -50, scale: 1 });
    gsap.set(badge, { xPercent: -50, yPercent: -50, scale: 0.35, opacity: 0 });

    const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3.out' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });
    const badX = gsap.quickTo(badge, 'x', { duration: 0.25, ease: 'power3.out' });
    const badY = gsap.quickTo(badge, 'y', { duration: 0.25, ease: 'power3.out' });

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let state = null;

    const setState = (s) => {
      if (state === s) return;
      state = s;
      root.classList.toggle('is-active', s === 'active');
      if (s === 'active') {
        gsap.to(ring, { scale: 1.9, duration: 0.32, ease: 'power3.out', overwrite: true });
        gsap.to(badge, { scale: 1, rotate: 0, opacity: 1, duration: 0.32, ease: 'power3.out', overwrite: true });
        gsap.to(dot, { opacity: 0, duration: 0.18, overwrite: true });
      } else if (s === 'input') {
        gsap.to(ring, { scale: 0.45, opacity: 0.45, duration: 0.25, ease: 'power3.out', overwrite: true });
        gsap.to(dot, { scale: 1.7, opacity: 1, duration: 0.2, overwrite: true });
      } else {
        gsap.to(ring, { scale: 1, opacity: 1, duration: 0.32, ease: 'power3.out', overwrite: true });
        gsap.to(badge, { scale: 0.35, opacity: 0, duration: 0.25, ease: 'power3.out', overwrite: true });
        gsap.to(dot, { scale: 1, opacity: 1, duration: 0.2, overwrite: true });
      }
    };

    const move = (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      dotX(pos.x); dotY(pos.y); ringX(pos.x); ringY(pos.y); badX(pos.x); badY(pos.y);
    };

    const over = (e) => {
      if (e.target.closest('input, textarea')) setState('input');
      else if (e.target.closest('a, button, [role="button"], .cursorable, label, summary, select, .tilt')) setState('active');
      else setState(null);
    };

    const leave = () => gsap.to(root, { opacity: 0, duration: 0.3 });
    const enter = () => gsap.to(root, { opacity: 1, duration: 0.3 });
    const down = () => gsap.to(ring, { scale: state === 'active' ? 1.5 : 0.8, duration: 0.18, overwrite: true });
    const up = () => setState(state); // restore the resting scale for the current state

    window.addEventListener('mousemove', move);
    document.addEventListener('mouseover', over);
    document.documentElement.addEventListener('mouseleave', leave);
    document.documentElement.addEventListener('mouseenter', enter);
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);

    return () => {
      document.body.classList.remove('custom-cursor');
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseover', over);
      document.documentElement.removeEventListener('mouseleave', leave);
      document.documentElement.removeEventListener('mouseenter', enter);
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
    };
  }, []);

  /* ---------------------------- btn ripple ---------------------------- */
  useEffect(() => {
    const onClick = (e) => {
      const el = e.target.closest('.btn');
      if (!el || e.button !== 0) return;
      const rect = el.getBoundingClientRect();
      const d = Math.max(rect.width, rect.height) * 1.6;
      const span = document.createElement('span');
      span.className = 'btn-ripple';
      span.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - rect.left - d / 2}px;top:${e.clientY - rect.top - d / 2}px`;
      el.appendChild(span);
      span.addEventListener('animationend', () => span.remove());
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <>
      <div className="fx-grain" aria-hidden="true" />
      <div className="fx-mesh" aria-hidden="true">
        <div className="fx-mesh__a" />
        <div className="fx-mesh__b" />
      </div>
      <div className="cursor" ref={cursorRef} aria-hidden="true">
        <div className="cursor__dot" />
        <div className="cursor__ring">
          <span className="cursor__badge">{PACKAGE_ICON}</span>
        </div>
      </div>
    </>
  );
}
