import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { CatalogSection } from '@/components/CatalogSection';
import { Shield, Target, Radio, Lock } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);


function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obj = { n: 0 };
    const t = gsap.to(obj, {
      n: to, duration: 2.2, ease: 'power2.out',
      scrollTrigger: { trigger: ref.current!, start: 'top 85%', once: true },
      onUpdate: () => setVal(Math.round(obj.n)),
    });
    return () => { t.kill(); };
  }, [to]);
  return <span ref={ref}>{val}{suffix}</span>;
}


function ScrollDriven3D({ scrollY }: { scrollY: React.MutableRefObject<number> }) {
  const { scene } = useGLTF('/models/mq-8-fire-scout.glb');
  const groupRef = useRef<THREE.Group>(null!);
  const cloned = React.useMemo(() => scene.clone(true), [scene]);
  const internalScroll = useRef(0);
  const scale = React.useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const max = Math.max(size.x, size.y, size.z);
    return max > 0 ? 2.8 / max : 1;
  }, [cloned]);

  useEffect(() => {
    const onScroll = () => { internalScroll.current = window.scrollY; };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    const s = scrollY.current || internalScroll.current;
    groupRef.current.rotation.y = s * 0.004;
    groupRef.current.position.y = Math.sin(Date.now() * 0.0008) * 0.08;
  });
  return <group ref={groupRef} scale={scale}><primitive object={cloned} /></group>;
}
useGLTF.preload('/models/mq-8-fire-scout.glb');

const PROGRAMS = [
  {
    num: '01',
    tag: 'Program Alpha',
    left: {
      accent: true,
      title: 'Project WRAITH',
      body: 'Low-observable autonomous platform. Sub-sonic terrain-following, all-weather penetration into denied airspace. Acoustic signature below ambient noise floor.',
      specs: [
        { k: 'Airframe', v: 'Stealth Composite' },
        { k: 'Navigation', v: 'AI Terrain Mapping' },
        { k: 'Endurance', v: '24hr+' },
      ],
    },
    right: {
      label: 'Mission Profile',
      stats: [
        { k: 'Class', v: 'MALE UAS' },
        { k: 'Signature', v: '< Ambient' },
        { k: 'Range', v: '800+ km' },
        { k: 'Payload', v: 'Multi-role' },
        { k: 'Status', v: 'Phase II Dev' },
      ],
      date: 'Q3 2026',
      badge: 'NDA REQUIRED',
      dim: false,
    },
  },
  {
    num: '02',
    tag: 'Program Beta',
    left: {
      accent: false,
      title: 'Project ███████',
      body: 'Multi-domain swarm coordination platform. Autonomous mesh networking enables persistent area denial with minimal logistics footprint.',
      specs: [
        { k: 'Architecture', v: 'Swarm / Mesh' },
        { k: 'Units', v: '████████' },
        { k: 'C2 Link', v: 'Encrypted P2P' },
      ],
    },
    right: {
      label: 'Capability Matrix',
      stats: [
        { k: 'Nodes', v: '██████' },
        { k: 'Latency', v: '< 12ms' },
        { k: 'Freq', v: '████ GHz' },
        { k: 'EW Res.', v: 'Class IV' },
        { k: 'Status', v: '████████' },
      ],
      date: '██████ ████',
      badge: null,
      dim: true,
    },
  },
  {
    num: '03',
    tag: 'Program Omega',
    left: {
      accent: false,
      title: '██████ — ███████████',
      body: null as string | null,
      specs: [] as { k: string; v: string }[],
    },
    right: {
      label: '████████',
      stats: [
        { k: '██████', v: '████████' },
        { k: '████', v: '████ ██' },
        { k: '██████', v: '████████' },
        { k: '████████', v: '████' },
        { k: 'Status', v: '████████' },
      ],
      date: '██ / ██ / ████',
      badge: null,
      dim: true,
    },
  },
];

function ClassifiedPrograms() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRefs   = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardRefs.current.forEach((card, i) => {
        if (!card) return;

        // Card slides up + fades in staggered
        gsap.fromTo(card,
          { opacity: 0, y: 60, rotateX: 8, filter: 'blur(4px)' },
          {
            opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)',
            duration: 0.9, ease: 'power3.out',
            delay: i * 0.12,
            scrollTrigger: {
              trigger: card,
              start: 'top 88%',
              toggleActions: 'play none none reverse',
            }
          }
        );

        // Subtle parallax on scroll — each card moves at slightly different rate
        gsap.to(card, {
          y: -20 - i * 8,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          }
        });
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="relative z-30 bg-background py-10 md:py-16 px-4 md:px-8 lg:px-14" style={{ perspective: '1000px' }}>
      {/* Grid bg */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div className="relative z-10 container mx-auto">
        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROGRAMS.map((prog, i) => (
            <div
              key={i}
              ref={el => { cardRefs.current[i] = el; }}
              className="relative overflow-hidden p-6 md:p-8"
              style={{
                background: i === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.015)',
                border: i === 0 ? '1px solid rgba(212,149,90,0.25)' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* Top accent line for program 01 */}
              {i === 0 && (
                <div className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: 'linear-gradient(to right, #C17A3A, #D4955A, transparent)' }} />
              )}

              {/* Number watermark */}
              <div className="font-sans font-bold leading-none select-none mb-4"
                style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', color: i === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)' }}>
                {prog.num}
              </div>

              {/* Tag */}
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] block mb-2"
                style={{ color: i === 0 ? '#D4955A' : 'rgba(255,255,255,0.3)' }}>
                {prog.tag}
              </span>

              {/* Title */}
              <h3 className="font-sans font-bold uppercase tracking-tight leading-tight mb-4"
                style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)', color: i === 0 ? '#ffffff' : 'rgba(255,255,255,0.25)' }}>
                {prog.left.accent
                  ? <>Project <span style={{ color: '#D4955A', textShadow: '0 0 24px rgba(212,149,90,0.35)' }}>WRAITH</span></>
                  : prog.left.title}
              </h3>

              {/* Body */}
              {prog.left.body && (
                <p className="font-mono text-sm leading-relaxed mb-5"
                  style={{ color: i === 0 ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.2)' }}>
                  {prog.left.body}
                </p>
              )}
              {i === 2 && (
                <div className="space-y-2 mb-5">
                  {[100, 75, 90, 55].map((w, j) => (
                    <div key={j} className="h-1.5" style={{ width: `${w}%`, background: 'rgba(255,255,255,0.05)' }} />
                  ))}
                </div>
              )}

              {/* Specs */}
              {prog.left.specs.length > 0 && (
                <div className="mb-4">
                  {prog.left.specs.map((s, j) => (
                    <div key={j} className="flex items-center justify-between py-2"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      <span className="font-mono text-xs uppercase"
                        style={{ color: i === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }}>{s.k}</span>
                      <span className="font-mono text-xs font-bold"
                        style={{ color: i === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.18)' }}>{s.v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="mt-auto">
                <span className="font-mono text-[10px] uppercase tracking-[0.4em] block mb-3"
                  style={{ color: i === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.18)' }}>
                  {prog.right.label}
                </span>
                {prog.right.stats.map((stat, j) => (
                  <div key={j} className="flex items-center justify-between py-1.5"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="font-mono text-xs uppercase"
                      style={{ color: prog.right.dim ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)' }}>
                      {stat.k}
                    </span>
                    <span className="font-mono text-xs font-bold"
                      style={{ color: prog.right.dim ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.88)' }}>
                      {stat.v}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between mt-3 pt-2"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="font-mono text-[10px]"
                    style={{ color: prog.right.dim ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)' }}>
                    {prog.right.date}
                  </span>
                  {prog.right.badge
                    ? <span className="font-mono text-[10px]" style={{ color: '#D4955A' }}>{prog.right.badge}</span>
                    : <Lock className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} strokeWidth={1.5} />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-end mt-10">
          <a href="#" className="font-mono text-xs uppercase tracking-[0.3em] px-6 py-3 border border-white/20 text-white/60 hover:border-white/50 hover:text-white transition-all duration-300">
            Request Clearance
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Fixed background 3D helicopter ───────────────────────────────────────
function FixedHelicopter() {
  const [visible, setVisible] = useState(false);
  const triggerRef  = useRef<HTMLDivElement>(null);
  const scrollVal   = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      scrollVal.current = window.scrollY;
      if (!triggerRef.current) return;
      const start = triggerRef.current.getBoundingClientRect();
      const endEl = document.getElementById('helicopter-end-trigger');
      const started = start.top < window.innerHeight;
      const ended   = endEl ? endEl.getBoundingClientRect().top <= window.innerHeight * 0.5 : false;
      setVisible(started && !ended);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* Start trigger */}
      <div ref={triggerRef} style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 1, pointerEvents: 'none' }} />

      {/* Fixed canvas */}
      {visible && (
        <div className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: 0.55 }}>
          <Canvas shadows>
            <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
            <ambientLight intensity={0.3} />
            <directionalLight position={[5, 5, 5]} intensity={1.5} />
            <pointLight position={[-5, -5, -3]} intensity={0.4} color="#333344" />
            <spotLight position={[0, 8, 0]} intensity={2} angle={0.4} penumbra={1} />
            <ScrollDriven3D scrollY={scrollVal} />
            <Environment preset="city" background={false} />
          </Canvas>
        </div>
      )}

      {/* End trigger — placed at footer ticker level by parent */}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function Home() {
  const heroRef    = useRef<HTMLElement>(null);
  const missionRef = useRef<HTMLElement>(null);
  const opsRef     = useRef<HTMLElement>(null);
  const specsRef   = useRef<HTMLElement>(null);
  const statsRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(heroRef.current.querySelectorAll('.hero-anim'),
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, stagger: 0.12, duration: 1, ease: 'power3.out', delay: 0.3 }
      );
    }
    if (missionRef.current) {
      gsap.fromTo(missionRef.current.querySelectorAll('.char'),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, stagger: 0.04, duration: 0.6, ease: 'power2.out',
          scrollTrigger: { trigger: missionRef.current, start: 'top 70%' } }
      );
      gsap.fromTo(missionRef.current.querySelectorAll('.animated-line'),
        { scaleX: 0 },
        { scaleX: 1, duration: 1.5, ease: 'power3.inOut',
          scrollTrigger: { trigger: missionRef.current, start: 'top 70%' } }
      );
    }
    if (specsRef.current) {
      gsap.fromTo(specsRef.current.querySelectorAll('tbody tr'),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.5,
          scrollTrigger: { trigger: specsRef.current, start: 'top 80%' } }
      );
    }
    if (opsRef.current) {
      gsap.fromTo(opsRef.current.querySelectorAll('.ops-card'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, stagger: 0.2, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: opsRef.current, start: 'top 75%' } }
      );
    }
  }, []);

  const splitText = (text: string) =>
    text.split('').map((c, i) => (
      <span key={i} className="char inline-block">{c === ' ' ? '\u00A0' : c}</span>
    ));

  return (
    <div className="bg-background text-foreground min-h-screen selection:bg-accent selection:text-background">
      <Navigation />

      {/* ── HERO ── */}
      <section ref={heroRef} className="hero-section relative w-full h-[100dvh] overflow-hidden">

        {/* ── Full-bleed background image ── */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-drone.png"
            alt="Autonomous drone over mountainous terrain at dawn"
            className="w-full h-full object-cover object-center"
            style={{ filter: 'brightness(0.72) contrast(1.08)' }}
          />
        </div>

        {/* ── Gradient overlays ── */}
        {/* Bottom fade to site background — starts late so mountains stay visible */}
        <div className="absolute inset-0 z-1 pointer-events-none" style={{
          background: 'linear-gradient(to bottom, rgba(8,8,8,0.25) 0%, rgba(8,8,8,0.05) 30%, rgba(8,8,8,0.05) 60%, rgba(8,8,8,0.85) 80%, #080808 95%, #080808 100%)',
        }} />
        {/* Left fade for text legibility */}
        <div className="absolute inset-0 z-1 pointer-events-none" style={{
          background: 'linear-gradient(to right, rgba(8,8,8,0.75) 0%, rgba(8,8,8,0.4) 45%, transparent 75%)',
        }} />

        {/* ── Scanline ── */}
        <div className="absolute inset-0 z-2 pointer-events-none overflow-hidden">
          <div className="scanline" />
        </div>

        {/* ── MAIN CONTENT — bottom-left anchored ── */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-8 md:px-14 lg:px-20 pb-28 md:pb-36">

          {/* Eyebrow */}
          <div className="hero-anim flex items-center gap-3 mb-6">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-50" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white/80" />
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/50">
              Zen Kinematics 8 Systems — Est. 2019
            </span>
          </div>

          {/* Headline */}
          <div className="hero-anim mb-5">
            <h1
              className="font-sans font-bold leading-[0.88] tracking-[-0.03em] text-white select-none"
              style={{ fontSize: 'clamp(3rem, 8.5vw, 7.5rem)' }}
            >
              <span className="block">AUTONOMOUS</span>
              <span className="block text-white/40">DOMINANCE.</span>
            </h1>
          </div>

          {/* Body + CTAs in a row */}
          <div className="hero-anim flex flex-col md:flex-row md:items-end gap-8 md:gap-16">

            {/* Descriptor */}
            <div className="max-w-sm">
              <p className="font-sans text-sm md:text-base text-white/50 leading-relaxed">
                Unmanned aerial platforms engineered for contested airspace —
                where <span className="text-white/80">failure is not an option</span>.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-4 shrink-0">
              <a href="#systems"
                className="group relative overflow-hidden font-mono text-[10px] uppercase tracking-[0.3em]
                           px-7 py-3.5 bg-white text-black font-bold
                           hover:bg-white/90 transition-all duration-200">
                View Systems
              </a>
              <a href="#mission"
                className="font-mono text-[10px] uppercase tracking-[0.3em] px-7 py-3.5
                           border border-white/20 text-white/60
                           hover:border-white/50 hover:text-white/90
                           transition-all duration-200">
                Our Mission
              </a>
            </div>
          </div>
        </div>

        {/* ── Scroll cue ── */}
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 hidden md:flex flex-col items-center gap-2 pointer-events-none hero-anim">
          <div className="w-[1px] h-10 bg-gradient-to-b from-white/30 to-transparent" />
        </div>

      </section>

      {/* ── MISSION ── */}
      <section ref={missionRef} id="mission" className="py-32 px-6 bg-background relative z-30">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="animated-line w-full h-[1px] bg-border mb-16 origin-center" />
          <h2 className="font-sans font-medium text-3xl md:text-5xl leading-tight tracking-tight text-primary">
            {("We build autonomous platforms that operate where human presence is impossible, and failure is not an option.").split(' ').map((word, i) => (
              <span key={i} className="char inline-block mr-[0.28em]">{word}</span>
            ))}
          </h2>
          <div className="animated-line w-full h-[1px] bg-border mt-16 origin-center" />
        </div>
      </section>

      {/* ── CATALOG heading ── */}
      <div className="relative z-30 bg-background border-t border-border px-8 md:px-16 py-16">
        <div className="container mx-auto">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px w-8 bg-foreground/30" />
              <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-foreground/40">ZK8 / Platform Systems</span>
            </div>
            <h2 className="font-sans font-bold uppercase tracking-tighter text-foreground leading-none"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5.5rem)' }}>
              Our Systems
            </h2>
          </div>
        </div>
      </div>

      {/* ── CATALOG ── */}
      <div id="systems" className="relative z-30"><CatalogSection /></div>

      {/* ── OPERATIONAL READY ── */}
      <section ref={opsRef} className="relative z-30 overflow-hidden" style={{ minHeight: '680px' }}>

        {/* Bottom fade — dissolves into section below */}
        <div className="absolute bottom-0 left-0 right-0 h-32 z-20 pointer-events-none"
          style={{ background: 'linear-gradient(to top, hsl(var(--background)) 0%, transparent 100%)' }} />

        {/* ── Aerial map background — blurred ── */}
        <div className="absolute inset-0 z-0">
          <img
            src="/aerial-map.jpg"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center"
            style={{ filter: 'brightness(0.35) saturate(0.4) contrast(1.1)', transform: 'scale(1.05)' }}
          />
        </div>

        {/* Dark overlay for depth */}
        <div className="absolute inset-0 z-1 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(8,8,8,0.55) 0%, rgba(8,8,8,0.35) 50%, rgba(8,8,8,0.7) 100%)' }} />

        {/* Content */}
        <div className="relative z-10 py-28 px-6">
          <div className="container mx-auto">

            {/* Header */}
            <div className="mb-14">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-white/30" />
                <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/40">Multi-Domain Capabilities</span>
              </div>
              <h2 className="font-sans font-bold text-4xl md:text-5xl uppercase tracking-tighter text-white">
                Operational Ready
              </h2>
            </div>

            {/* Glassmorphism cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { icon: Radio, title: 'ISR Operations', body: 'Persistent Intelligence, Surveillance, and Reconnaissance. Real-time encrypted datalinks providing actionable battlefield oversight.' },
                { icon: Target, title: 'Payload Delivery', body: 'Precision kinetic and non-kinetic payload deployment. Centimeter-accurate targeting using localized GPS-denied navigation.' },
                { icon: Shield, title: 'Electronic Warfare', body: 'Distributed jamming and signal intelligence gathering. Swarm capabilities to overwhelm and neutralize adversary communication networks.' },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title}
                  className="ops-card group relative overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '2rem',
                  }}>
                  {/* Top accent line on hover */}
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-white/0 group-hover:bg-white/30 transition-all duration-500" />

                  {/* Icon */}
                  <div className="mb-6 w-12 h-12 flex items-center justify-center"
                    style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}>
                    <Icon className="w-5 h-5 text-white/70" strokeWidth={1.2} />
                  </div>

                  <h3 className="font-mono font-bold text-sm uppercase tracking-widest mb-3 text-white/90">{title}</h3>
                  <p className="font-sans text-sm text-white/45 leading-relaxed">{body}</p>

                  {/* Corner bracket */}
                  <div className="absolute bottom-4 right-4 w-5 h-5 border-b border-r border-white/10 group-hover:border-white/25 transition-colors duration-300" />
                </div>
              ))}
            </div>

          </div>
        </div>

      </section>

      {/* ── NEXT-GEN PROGRAMS (scroll-driven 3D) ── */}
      {/* ── FUTURE PROJECTS heading ── */}
      <div className="relative z-30 bg-background border-t border-border px-8 md:px-16 py-16">
        <div className="container mx-auto flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px w-8 bg-foreground/30" />
              <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-foreground/40">ZK8 / R&D Division</span>
            </div>
            <h2 className="font-sans font-bold uppercase tracking-tighter text-foreground leading-none"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5.5rem)' }}>
              Future Projects
            </h2>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-foreground/25 pb-1">R&D</span>
        </div>
      </div>

      <ClassifiedPrograms />

      {/* ── 3D MODEL SHOWCASE — fixed background, stops before footer ticker ── */}
      <div className="relative z-10" id="helicopter-zone">
        <FixedHelicopter />
        {/* Spacer so sections scroll over the fixed helicopter */}
        <div className="h-[15vh]" />
      </div>

      {/* ── SPECS TABLE ── */}
      <section ref={specsRef} id="specs" className="relative z-10 py-10 md:py-16 px-4 md:px-6">
        <div className="container mx-auto">
          {/* Glassmorphism wrapper */}
          <div style={{
            background: 'rgba(8,8,8,0.08)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.04)',
            padding: 'clamp(1.5rem, 4vw, 3rem)',
          }}>
          <div className="mb-8 md:mb-12">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px w-8 bg-foreground/30" />
              <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-foreground/40">Cross-Platform Analysis</span>
            </div>
            <h2 className="font-sans font-bold uppercase tracking-tighter mb-2"
              style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)' }}>
              Platform Specifications
            </h2>
          </div>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-left font-mono text-xs md:text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-white/10 text-muted-foreground">
                  <th className="py-3 px-3 md:py-4 md:px-4 font-normal uppercase tracking-wider">Parameter</th>
                  <th className="py-3 px-3 md:py-4 md:px-4 font-normal uppercase tracking-wider text-primary">ZALA 421</th>
                  <th className="py-3 px-3 md:py-4 md:px-4 font-normal uppercase tracking-wider text-primary">IF1200A</th>
                  <th className="py-3 px-3 md:py-4 md:px-4 font-normal uppercase tracking-wider text-primary">MQ-8 Fire Scout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ['One-Way Range', '90 km', '15 km', '150+ NM'],
                  ['Endurance', '90 min', '40 min', '8+ hrs'],
                  ['Payload', '0.8 kg', '4 kg', '272 kg'],
                  ['AGL Max', '3,600 m', '400 m', '6,100 m'],
                  ['Cruise Speed', '130 km/h', '60 km/h', '213 km/h'],
                  ['Max Speed', '130 km/h', '80 km/h', '213 km/h'],
                  ['Launch', 'Hand / Catapult', 'VTOL', 'VTOL (Ship deck)'],
                ].map(([param, ...vals]) => (
                  <tr key={param} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-3 md:py-4 md:px-4 text-muted-foreground text-xs md:text-sm">{param}</td>
                    {vals.map((v, i) => (
                      <td key={i} className="py-3 px-3 md:py-4 md:px-4 font-bold text-xs md:text-sm text-foreground/90">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>{/* end glass */}
        </div>
      </section>

      {/* ── CORE DOCTRINE — glassmorphism, above footer ── */}
      <section className="relative z-10 py-20 md:py-32 px-4 md:px-8">
        <div className="container mx-auto max-w-3xl">
          <div style={{
            background: 'rgba(8,8,8,0.22)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.07)',
            padding: 'clamp(2rem, 5vw, 4rem)',
          }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-8 bg-foreground/25" />
              <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-foreground/40">ZK8 / Core Doctrine</span>
            </div>
            <h2 className="font-sans font-bold uppercase tracking-tighter text-foreground leading-[0.9] mb-6"
              style={{ fontSize: 'clamp(2.2rem, 5.5vw, 4.5rem)' }}>
              Precision.<br />Persistence.<br />Superiority.
            </h2>
            <p className="font-mono text-sm md:text-base text-foreground/55 leading-relaxed max-w-xl">
              Every platform we build is engineered for one purpose — to give operators an unfair advantage in contested environments. No compromises. No failure modes.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
