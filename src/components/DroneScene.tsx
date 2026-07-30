import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { RotateCcw, Maximize2 } from 'lucide-react';
import { HotspotPoint } from './HotspotPoint';

interface Hotspot {
  id: string;
  position: [number, number, number];
  cameraPos: [number, number, number];
  lookAt: [number, number, number];
  name: string;
  description: string;
  specs: Record<string, string | undefined>;
}

interface DroneSceneProps {
  DroneComponent: React.FC<any>;
  hotspots: Hotspot[];
  activeHotspot: string | null;
  onHotspotClick: (id: string) => void;
  detailOpen?: boolean;
}

// ── Handles camera animation for hotspot focus & parallax ──────────────────
function SceneControls({
  activeHotspot,
  defaultCameraPos = [5, 3, 5],
  hotspots,
  isParallaxEnabled,
}: {
  activeHotspot: string | null;
  defaultCameraPos?: [number, number, number];
  hotspots: Hotspot[];
  isParallaxEnabled: boolean;
}) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (activeHotspot) {
      const hs = hotspots.find((h) => h.id === activeHotspot);
      if (hs) {
        gsap.to(camera.position, {
          x: hs.cameraPos[0], y: hs.cameraPos[1], z: hs.cameraPos[2],
          duration: 1.2, ease: 'power3.inOut',
        });
        gsap.to(target.current, {
          x: hs.lookAt[0], y: hs.lookAt[1], z: hs.lookAt[2],
          duration: 1.2, ease: 'power3.inOut',
        });
      }
    } else {
      gsap.to(camera.position, {
        x: defaultCameraPos[0], y: defaultCameraPos[1], z: defaultCameraPos[2],
        duration: 1.2, ease: 'power3.inOut',
      });
      gsap.to(target.current, {
        x: 0, y: 0, z: 0,
        duration: 1.2, ease: 'power3.inOut',
      });
    }
  }, [activeHotspot, camera, hotspots, defaultCameraPos]);

  useFrame((state) => {
    if (!activeHotspot && isParallaxEnabled) {
      const x = state.pointer.x * 2 * (Math.PI / 180) * 5;
      const y = state.pointer.y * 2 * (Math.PI / 180) * 5;
      camera.position.lerp(
        new THREE.Vector3(defaultCameraPos[0] + x, defaultCameraPos[1] + y, defaultCameraPos[2]),
        0.05
      );
    }
    camera.lookAt(target.current);
  });

  return null;
}

// ── Auto-spin group when 360 mode is on ────────────────────────────────────
function AutoSpin({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (active && groupRef.current) {
      groupRef.current.rotation.y += dt * 0.4;
    }
  });
  return <group ref={groupRef} />;
}

// ── Main component ─────────────────────────────────────────────────────────
export function DroneScene({ DroneComponent, hotspots, activeHotspot, onHotspotClick, detailOpen = false }: DroneSceneProps) {
  const [orbitMode, setOrbitMode] = useState(false);

  // Exit orbit mode when a hotspot is selected
  useEffect(() => {
    if (activeHotspot) setOrbitMode(false);
  }, [activeHotspot]);

  const toggleOrbit = () => setOrbitMode((v) => !v);

  return (
    <div className="w-full h-full relative">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[5, 3, 5]} fov={45} />

        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#445566" />
        <spotLight position={[0, 10, 0]} intensity={2} angle={0.3} penumbra={1} castShadow />

        {/* Orbit controls — enabled only in 360 mode, no hotspot active */}
        {orbitMode && !activeHotspot && (
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            minDistance={3}
            maxDistance={14}
            autoRotate={true}
            autoRotateSpeed={1.2}
            makeDefault
          />
        )}

        {/* Parallax / hotspot camera — disabled while OrbitControls is in charge */}
        {!orbitMode && (
          <SceneControls
            activeHotspot={activeHotspot}
            hotspots={hotspots}
            isParallaxEnabled={!activeHotspot}
          />
        )}

        <group>
          <DroneComponent scale={0.8} />
          {hotspots.map((hs) => (
            <HotspotPoint
              key={hs.id}
              position={hs.position}
              partName={hs.name}
              onClick={() => onHotspotClick(hs.id)}
            />
          ))}
        </group>

        <Environment preset="city" background={false} />
      </Canvas>

      {/* ── 360 toggle button — hidden when detail panel is open ── */}
      {!detailOpen && (
        <button
          onClick={toggleOrbit}
          title={orbitMode ? 'Exit 360° view' : 'Enter 360° view'}
          className={`
            absolute bottom-4 right-4 z-20
            flex items-center gap-2 px-3 py-2
            font-mono text-[10px] uppercase tracking-widest
            border transition-all duration-300
            ${orbitMode
              ? 'border-[#C17A3A] text-[#D4955A] bg-[#C17A3A]/10'
              : 'border-white/20 text-white/40 hover:border-[#C17A3A]/60 hover:text-[#D4955A]'}
          `}
        >
          <RotateCcw className={`w-3 h-3 ${orbitMode ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
          360°
        </button>
      )}

      {/* ── Drag hint — shown when orbit mode is active ── */}
      {orbitMode && !activeHotspot && !detailOpen && (
        <div className="absolute bottom-14 right-4 z-20 font-mono text-[9px] uppercase tracking-widest pointer-events-none animate-pulse"
          style={{ color: '#D4955A' }}>
          drag to rotate · scroll to zoom
        </div>
      )}

      {/* Crosshair corners */}
      <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-accent/50 pointer-events-none" />
      <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-accent/50 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-accent/50 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-accent/50 pointer-events-none" />
    </div>
  );
}
