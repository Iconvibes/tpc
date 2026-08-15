import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Single registered GSAP instance shared by every component.
gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
