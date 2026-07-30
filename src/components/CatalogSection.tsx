import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'framer-motion';
import { DroneScene } from './DroneScene';
import { SpecsPanel } from './SpecsPanel';
import { ZalaModel } from './ZalaModel';
import { InspiredFlightModel } from './InspiredFlightModel';
import { MQ8FireScoutModel } from './MQ8FireScoutModel';

gsap.registerPlugin(ScrollTrigger);

const catalogData = [
  {
    id: 'zala-421',
    name: 'ZALA 421',
    type: 'Fixed-Wing VTOL',
    description: 'Compact electric reconnaissance drone with vertical take-off and landing capability. Designed for covert ISR missions with a low acoustic and thermal signature.',
    Component: ZalaModel,
    hotspots: [
      {
        id: 'wing',
        position: [1.2, 0.1, 0] as [number, number, number],
        cameraPos: [2.5, 1.2, 1.0] as [number, number, number],
        lookAt: [1.2, 0.1, 0] as [number, number, number],
        name: 'Fixed Wing Structure',
        description: 'High-efficiency composite wing with optimised aerofoil profile for extended loiter time in contested environments.',
        specs: { Wingspan: '1.65m', Material: 'Carbon-Glass Composite', Endurance: '90 min' }
      },
      {
        id: 'payload',
        position: [0, -0.15, 0.2] as [number, number, number],
        cameraPos: [1.0, -1.2, 1.5] as [number, number, number],
        lookAt: [0, -0.15, 0.2] as [number, number, number],
        name: 'Sensor Payload',
        description: 'Swappable EO/IR sensor module with real-time downlink. Day/night capability with stabilised gimbal platform.',
        specs: { Thermal: '640x512 VOx', Optical: '1080p 30fps', Stabilisation: '2-Axis' }
      },
      {
        id: 'propulsion',
        position: [-0.8, 0, 0] as [number, number, number],
        cameraPos: [-2.0, 0.8, 1.5] as [number, number, number],
        lookAt: [-0.8, 0, 0] as [number, number, number],
        name: 'Electric Propulsion',
        description: 'Brushless pusher motor with folding propeller. Silent operation below 55 dB at 100m AGL.',
        specs: { Type: 'Brushless Pusher', Acoustic: '< 55dB @ 100m', MaxSpeed: '130 km/h' }
      }
    ]
  },
  {
    id: 'inspired-flight-if1200a',
    name: 'Inspired Flight IF1200A',
    type: 'Heavy-Lift Multirotor',
    description: 'Professional-grade hexacopter built for demanding ISR and payload delivery missions. Redundant motor architecture ensures continued flight in the event of a single motor failure.',
    Component: InspiredFlightModel,
    hotspots: [
      {
        id: 'frame',
        position: [0, 0, 0] as [number, number, number],
        cameraPos: [2.5, 1.5, 2.5] as [number, number, number],
        lookAt: [0, 0, 0] as [number, number, number],
        name: 'Carbon Fibre Frame',
        description: 'Lightweight folding carbon fibre airframe with vibration-isolated payload bay. Engineered for rapid deployment in field conditions.',
        specs: { Diameter: '1.2m', Weight: '4.9 kg', Material: 'Carbon Fibre' }
      },
      {
        id: 'payload',
        position: [0, -0.4, 0] as [number, number, number],
        cameraPos: [1.5, -1.2, 1.5] as [number, number, number],
        lookAt: [0, -0.4, 0] as [number, number, number],
        name: 'Payload Bay',
        description: 'Quick-release payload interface supporting EO/IR gimbals, LiDAR, and custom mission modules up to 4 kg.',
        specs: { Capacity: '4 kg', Interface: 'Quick-Release', Endurance: '40 min' }
      },
      {
        id: 'motors',
        position: [0.6, 0, 0] as [number, number, number],
        cameraPos: [2.0, 0.8, 1.5] as [number, number, number],
        lookAt: [0.6, 0, 0] as [number, number, number],
        name: 'Redundant Motors',
        description: 'Six brushless motors with ESC redundancy. Continues stable flight and safe landing after single motor failure.',
        specs: { Config: 'Hexacopter', Redundancy: 'Single-Motor Fault Tolerant', MaxSpeed: '18 m/s' }
      }
    ]
  },
  {
    id: 'mq-8-fire-scout',
    name: 'MQ-8 Fire Scout',
    type: 'Autonomous VTOL',
    description: 'Naval unmanned helicopter optimised for persistent maritime surveillance, targeting, and armed overwatch. Operates autonomously from ship decks without a runway.',
    Component: MQ8FireScoutModel,
    hotspots: [
      {
        id: 'rotor',
        position: [0, 0.5, 0] as [number, number, number],
        cameraPos: [2, 1.5, 2] as [number, number, number],
        lookAt: [0, 0.5, 0] as [number, number, number],
        name: 'Main Rotor System',
        description: 'Three-blade semi-rigid rotor with full autonomous flight control. Capable of deck landing on vessels up to Sea State 5.',
        specs: { Diameter: '8.4m', Blades: '3', SeaState: 'Up to SS5' }
      },
      {
        id: 'sensor',
        position: [0.2, -0.3, 0.8] as [number, number, number],
        cameraPos: [1.5, -1.0, 2.0] as [number, number, number],
        lookAt: [0.2, -0.3, 0.8] as [number, number, number],
        name: 'Multi-Mode Sensor Suite',
        description: 'Electro-optical/infrared turret with laser rangefinder and maritime radar. Provides all-weather, day/night persistent overwatch.',
        specs: { EO: 'FLIR Star SAFIRE', Radar: 'AN/ZPY-4', Laser: 'Class 3B Rangefinder' }
      },
      {
        id: 'endurance',
        position: [0, 0, -0.5] as [number, number, number],
        cameraPos: [2, 0.5, -2] as [number, number, number],
        lookAt: [0, 0, -0.5] as [number, number, number],
        name: 'Propulsion & Endurance',
        description: 'Rolls-Royce 250-C20W turboshaft engine providing over 8 hours of on-station endurance at a range of 150+ nautical miles.',
        specs: { Engine: 'RR 250-C20W', Endurance: '8+ hrs', Range: '150+ NM' }
      }
    ]
  }
];

// Per-slide hotspot state — each slide manages its own active hotspot
function CatalogSlide({
  drone,
  index,
}: {
  drone: (typeof catalogData)[0];
  index: number;
}) {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const currentHotspotData = drone.hotspots.find((h) => h.id === activeHotspot);
  const detailOpen = !!activeHotspot;

  return (
    <div
      className="catalog-slide h-full w-[100vw] flex items-center shrink-0 relative px-12 md:px-24 overflow-hidden"
    >
      {/* Large background number */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[400px] font-sans font-bold text-white/5 whitespace-nowrap pointer-events-none select-none z-0">
        0{index + 1}
      </div>

      {/* Main row */}
      <div className="w-full h-full flex flex-row items-center z-10 relative">

        {/* ── Left: drone info text ── slides out left when detail opens */}
        <AnimatePresence>
          {!detailOpen && (
            <motion.div
              key="info-panel"
              initial={{ x: 0, opacity: 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-110%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 220 }}
              className="w-1/3 flex flex-col justify-center h-full shrink-0 pr-8"
            >
              <div className="slide-text mb-4">
                <span className="font-mono text-accent text-sm tracking-[0.3em] uppercase border border-accent/30 px-3 py-1 bg-accent/10">
                  {drone.type}
                </span>
              </div>
              <h2 className="slide-text font-sans text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-6">
                {drone.name}
              </h2>
              <p className="slide-text font-mono text-muted-foreground text-sm leading-relaxed mb-8 max-w-md border-l-2 border-border pl-4">
                {drone.description}
              </p>
              <div className="slide-text">
                <div className="font-mono text-xs text-foreground uppercase tracking-widest mb-4">
                  Interact with model to view component analysis
                </div>
                <div className="flex gap-2">
                  <div className="w-12 h-1 bg-accent" />
                  <div className="w-4 h-1 bg-accent/50" />
                  <div className="w-2 h-1 bg-accent/30" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Centre: drone canvas — shifts left when detail opens ── */}
        <motion.div
          layout
          animate={{ x: detailOpen ? '-16.5%' : 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 220 }}
          className="h-[60vh] md:h-full relative border border-border/30 bg-card/20 backdrop-blur-sm flex-1"
        >
          <DroneScene
            DroneComponent={drone.Component}
            hotspots={drone.hotspots}
            activeHotspot={activeHotspot}
            onHotspotClick={setActiveHotspot}
            detailOpen={detailOpen}
          />
        </motion.div>

        {/* ── Right: specs panel — slides in from right ── */}
        <AnimatePresence>
          {detailOpen && (
            <motion.div
              key="specs-panel-wrapper"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '33%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 220 }}
              className="h-[60vh] md:h-full shrink-0 overflow-hidden"
            >
              <SpecsPanel
                isOpen={detailOpen}
                onClose={() => setActiveHotspot(null)}
                title={currentHotspotData?.name || ''}
                description={currentHotspotData?.description || ''}
                specs={currentHotspotData?.specs || {}}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export function CatalogSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !slidesRef.current) return;

    const sections = gsap.utils.toArray('.catalog-slide');

    const tl = gsap.to(sections, {
      xPercent: -100 * (sections.length - 1),
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        pin: true,
        scrub: 1,
        snap: 1 / (sections.length - 1),
        end: () => `+=${(containerRef.current?.offsetWidth || 1000) * sections.length}`,
      },
    });

    sections.forEach((section: any) => {
      const textEls = section.querySelectorAll('.slide-text');
      gsap.fromTo(
        textEls,
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          scrollTrigger: {
            trigger: section,
            containerAnimation: tl,
            start: 'left center',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="h-screen w-full bg-background overflow-hidden relative"
    >
      <div ref={slidesRef} className="h-full w-[300vw] flex relative">
        {catalogData.map((drone, i) => (
          <CatalogSlide key={drone.id} drone={drone} index={i} />
        ))}
      </div>
    </section>
  );
}
