import React, { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { Lock } from 'lucide-react';

// ── Social SVGs ───────────────────────────────────────────────────────────
function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.741-8.853L2.025 2.25H8.08l4.261 5.636 5.903-5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}
function IconLinkedIn() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}
function IconInstagram() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

const SOCIALS = [
  { label: 'X', href: '#', Icon: IconX },
  { label: 'LinkedIn', href: '#', Icon: IconLinkedIn },
  { label: 'Instagram', href: '#', Icon: IconInstagram },
];

const NAV_COLS = [
  {
    heading: 'Systems',
    links: [
      { label: 'ZALA 421-16E2', href: '#systems' },
      { label: 'IF1200A', href: '#systems' },
      { label: 'MQ-8 Fire Scout', href: '#systems' },
    ],
  },
  {
    heading: 'Programs',
    links: [
      { label: 'Project WRAITH', href: '#' },
      { label: 'Program Beta ██', href: '#' },
      { label: 'Program Omega ███', href: '#', locked: true },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'Procurement', href: '#' },
      { label: 'Press', href: '#' },
      { label: 'Request Access', href: '#' },
    ],
  },
];

// ── Abstract animated canvas ──────────────────────────────────────────────
function AbstractCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Particles
    const PARTICLE_COUNT = 90;
    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      r: number; alpha: number;
      pulse: number; pulseSpeed: number;
    };

    const pts: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.6 + 0.4,
      alpha: Math.random() * 0.5 + 0.15,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.008 + Math.random() * 0.012,
    }));

    // ── Floating hex rings
    type Ring = { x: number; y: number; size: number; rot: number; rotSpeed: number; alpha: number; drift: number; driftT: number; sides: number };
    const RINGS: Ring[] = Array.from({ length: 7 }, (_, i) => ({
      x: (i / 6) * canvas.width * 1.1 - canvas.width * 0.05,
      y: Math.random() * canvas.height,
      size: 40 + Math.random() * 120,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.003,
      alpha: 0.04 + Math.random() * 0.06,
      drift: Math.random() * Math.PI * 2,
      driftT: 0.003 + Math.random() * 0.004,
      sides: [5, 6, 8][Math.floor(Math.random() * 3)],
    }));

    // ── Flowing lines
    type FlowLine = { points: Array<{ x: number; y: number }>; t: number; speed: number; alpha: number; width: number };
    const FLOW_LINES: FlowLine[] = Array.from({ length: 5 }, (_, i) => ({
      points: [],
      t: (i / 4) * Math.PI * 2,
      speed: 0.004 + Math.random() * 0.003,
      alpha: 0.06 + Math.random() * 0.07,
      width: 0.5 + Math.random() * 1,
    }));

    const getFlowPoint = (t: number, lineIdx: number, w: number, h: number) => {
      const xPhase = lineIdx * 1.2;
      const yPhase = lineIdx * 0.9;
      return {
        x: w * (0.5 + 0.48 * Math.sin(t * 0.7 + xPhase) * Math.cos(t * 0.3)),
        y: h * (0.5 + 0.48 * Math.sin(t * 0.5 + yPhase) * Math.sin(t * 0.4 + 1)),
      };
    };

    // Build flow trails
    FLOW_LINES.forEach((fl, i) => {
      fl.points = [];
      for (let k = 0; k < 80; k++) {
        fl.points.push(getFlowPoint(fl.t - k * 0.03, i, canvas.width, canvas.height));
      }
    });

    const AMBER = { r: 255, g: 255, b: 255 };

    let tick = 0;

    const draw = () => {
      tick++;
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // ── Flow lines
      FLOW_LINES.forEach((fl, lineIdx) => {
        fl.t += fl.speed;
        fl.points.unshift(getFlowPoint(fl.t, lineIdx, W, H));
        if (fl.points.length > 80) fl.points.pop();

        ctx.beginPath();
        fl.points.forEach((p, k) => {
          if (k === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        const grad = ctx.createLinearGradient(fl.points[0].x, fl.points[0].y, fl.points[fl.points.length - 1].x, fl.points[fl.points.length - 1].y);
        grad.addColorStop(0, `rgba(${AMBER.r},${AMBER.g},${AMBER.b},${fl.alpha})`);
        grad.addColorStop(1, `rgba(${AMBER.r},${AMBER.g},${AMBER.b},0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = fl.width;
        ctx.stroke();
      });

      // ── Polygon rings — removed
      // (kept particles + connections only)

      // ── Particles + connections
      pts.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        p.pulse += p.pulseSpeed;
        const a = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${AMBER.r},${AMBER.g},${AMBER.b},${a})`;
        ctx.fill();
      });

      // connections
      const CONN_DIST = 90;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONN_DIST) {
            const a = (1 - dist / CONN_DIST) * 0.08;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(${AMBER.r},${AMBER.g},${AMBER.b},${a})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      }

      // ── Horizontal scan beam
      const scanY = ((tick * 0.4) % (H + 40)) - 20;
      const scanGrad = ctx.createLinearGradient(0, scanY - 10, 0, scanY + 10);
      scanGrad.addColorStop(0, 'rgba(255,255,255,0)');
      scanGrad.addColorStop(0.5, 'rgba(255,255,255,0.025)');
      scanGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 10, W, 20);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.85 }}
    />
  );
}

// ── Footer ────────────────────────────────────────────────────────────────
export function Footer() {
  const year = new Date().getFullYear();
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // No parallax — content stays stable
  }, []);

  return (
    <footer ref={footerRef} className="relative overflow-hidden bg-background">

      <div className="relative z-0 w-full pointer-events-none select-none">
        <img
          src="/footer-drone.png"
          alt=""
          aria-hidden="true"
          className="w-full object-cover object-bottom"
        />
      </div>

      {/* All content sits over the image via absolute positioning */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center">

        {/* Abstract animated canvas */}
        <AbstractCanvas />

      {/* Ticker — helicopter hides before this */}
      <div id="helicopter-end-trigger" />
      <div className="relative z-10 overflow-hidden py-2 border-b border-border/10">
        <div className="ticker-track flex whitespace-nowrap">
          {[0, 1].map((n) => (
            <div key={n} className="ticker-half flex shrink-0 gap-10 pr-10 font-mono text-[9px] uppercase tracking-[0.4em]">
              {['ZK8 SYSTEMS', '◆', 'AUTONOMOUS PLATFORMS', '◆', 'DEFENSE GRADE', '◆', 'OPERATIONAL READY', '◆',
                'ISR · EW · STRIKE', '◆', 'INDIA MADE', '◆'].map((t, i) => (
                <span key={i} style={{ color: t === '◆' ? '#C17A3A' : '#D4955A' }}>{t}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Main body — pinned to bottom over the drone image */}
      <div className="relative z-10 container mx-auto px-6 pt-12 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-10">

          {/* ── Brand ── */}
          <div className="col-span-1 md:col-span-5">
            <div className="inline-block">
              <div className="flex items-center gap-3 mb-5">
                <div className="relative w-10 h-10 shrink-0">
                  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <polygon points="20,2 38,11 38,29 20,38 2,29 2,11" stroke="rgba(255,255,255,0.5)" strokeWidth="1" fill="none"/>
                    <polygon points="20,8 32,14 32,26 20,32 8,26 8,14" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6" fill="none"/>
                    <line x1="20" y1="2"  x2="20" y2="38" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5"/>
                    <line x1="2"  y1="11" x2="38" y2="29" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5"/>
                    <line x1="38" y1="11" x2="2"  y2="29" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5"/>
                    <circle cx="20" cy="20" r="3" fill="rgba(255,255,255,0.9)"/>
                  </svg>
                </div>
                <div>
                  <h2 className="font-sans font-bold text-xl tracking-[0.2em] leading-none">ZK8 SYSTEMS</h2>
                  <p className="font-mono text-[9px] tracking-[0.35em] text-foreground/60 mt-0.5">ZEN KINEMATICS 8</p>
                </div>
              </div>

              <p className="font-mono text-foreground/70 text-[11px] leading-relaxed mb-6 max-w-[280px]">
                Aerospace precision. Battlefield intelligence.<br/>
                Built for environments where failure is not an option.
              </p>

              <div className="flex items-center gap-2 mb-5 font-mono text-[9px] uppercase tracking-widest">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground opacity-50" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-foreground/80" />
                </span>
                <span className="text-foreground/70">Systems Operational</span>
              </div>

              <div className="flex items-center gap-2">
                {SOCIALS.map(({ label, href, Icon }) => (
                  <a key={label} href={href} aria-label={label}
                    className="w-8 h-8 flex items-center justify-center border border-border/50 text-foreground/60
                               hover:border-foreground hover:text-foreground transition-all duration-300">
                    <Icon />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── Nav cols ── */}
          <div className="col-span-1 md:col-span-5 grid grid-cols-3 gap-6">
            {NAV_COLS.map((col) => (
              <div key={col.heading}>
                <h3 className="font-mono font-bold text-[9px] text-foreground/60 mb-4 uppercase tracking-[0.3em]">
                  {col.heading}
                </h3>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href}
                        className="flex items-center gap-2 font-mono text-[11px] text-foreground/65 hover:text-foreground transition-colors duration-200 group">
                        {link.locked
                          ? <Lock className="w-2.5 h-2.5 text-foreground/25 shrink-0" strokeWidth={1.5} />
                          : <span className="w-1 h-1 bg-foreground/30 group-hover:bg-foreground transition-colors shrink-0" />
                        }
                        <span className={link.locked ? 'text-foreground/25' : ''}>{link.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* ── CTA ── */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-mono font-bold text-[9px] text-foreground/60 mb-4 uppercase tracking-[0.3em]">
              Clearance
            </h3>
            <a href="#"
              className="group relative inline-flex items-center justify-center w-full font-mono text-[9px] uppercase
                         tracking-[0.3em] px-4 py-3 border border-foreground/30 text-foreground/80
                         hover:border-foreground hover:text-foreground
                         transition-all duration-300 overflow-hidden">
              <span className="relative z-10">Request Access</span>
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-foreground/5 transition-transform duration-300" />
            </a>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-5 border-t border-border/15 gap-3">
          <div className="flex items-center gap-2.5">
            <svg width="22" height="15" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50 shrink-0">
              <rect width="24" height="5.33" fill="#FF9933"/>
              <rect y="5.33" width="24" height="5.34" fill="#FFFFFF"/>
              <rect y="10.67" width="24" height="5.33" fill="#138808"/>
              <circle cx="12" cy="8" r="2.2" fill="none" stroke="#000080" strokeWidth="0.45"/>
              {Array.from({ length: 24 }).map((_, i) => {
                const a = (i * 15 * Math.PI) / 180;
                return <line key={i} x1={12 + Math.cos(a) * 0.85} y1={8 + Math.sin(a) * 0.85}
                  x2={12 + Math.cos(a) * 2.05} y2={8 + Math.sin(a) * 2.05}
                  stroke="#000080" strokeWidth="0.3"/>;
              })}
              <circle cx="12" cy="8" r="0.38" fill="#000080"/>
            </svg>
            <p className="font-mono text-[9px] text-foreground/55">
              © {year} Zen Kinematics 8 Systems Pvt. Ltd.
            </p>
          </div>
          <span className="font-mono text-[9px] text-foreground/35">zk8.systems</span>
        </div>
      </div>

      </div>{/* end absolute overlay */}

    </footer>
  );
}
