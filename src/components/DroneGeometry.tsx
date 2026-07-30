import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ══════════════════════════════════════════════════════════════════════════════
// MATERIALS  (module-level singletons – shared across all meshes)
// ══════════════════════════════════════════════════════════════════════════════
const M = {
  // Deep matte carbon-fibre body panels
  carbon:   new THREE.MeshStandardMaterial({ color: '#0e1018', metalness: 0.28, roughness: 0.74 }),
  carbonB:  new THREE.MeshStandardMaterial({ color: '#191d2c', metalness: 0.22, roughness: 0.80 }),
  // Anodised aluminium — machined structural parts
  alum:     new THREE.MeshStandardMaterial({ color: '#1e2438', metalness: 0.92, roughness: 0.20 }),
  alumB:    new THREE.MeshStandardMaterial({ color: '#28304a', metalness: 0.86, roughness: 0.28 }),
  alumC:    new THREE.MeshStandardMaterial({ color: '#38445e', metalness: 0.78, roughness: 0.36 }),
  // Motor bell — dark anodised
  bell:     new THREE.MeshStandardMaterial({ color: '#14182a', metalness: 0.92, roughness: 0.18 }),
  // Stator copper windings
  copper:   new THREE.MeshStandardMaterial({ color: '#6a3410', metalness: 0.78, roughness: 0.50 }),
  // Propeller blade — very dark semi-translucent composite
  prop:     new THREE.MeshStandardMaterial({ color: '#09090e', metalness: 0.08, roughness: 0.62, side: THREE.DoubleSide }),
  // ABS plastic shell covers
  abs:      new THREE.MeshStandardMaterial({ color: '#121520', metalness: 0.03, roughness: 0.90 }),
  // PCB
  pcb:      new THREE.MeshStandardMaterial({ color: '#060d06', metalness: 0.22, roughness: 0.70 }),
  // Camera lens glass
  lens:     new THREE.MeshStandardMaterial({ color: '#020305', metalness: 0.94, roughness: 0.03, envMapIntensity: 2.8 }),
  // Rubber dampers / boots
  rubber:   new THREE.MeshStandardMaterial({ color: '#0c0c0c', metalness: 0, roughness: 1.00 }),
  // Semi-clear dome / canopy
  glass:    new THREE.MeshStandardMaterial({ color: '#182030', metalness: 0.55, roughness: 0.06, transparent: true, opacity: 0.72 }),
  // Wing / control surface composite
  wing:     new THREE.MeshStandardMaterial({ color: '#131620', metalness: 0.26, roughness: 0.70, side: THREE.DoubleSide }),
  // Status LEDs
  ledAmber: new THREE.MeshStandardMaterial({ color: '#ffaa00', emissive: '#ffaa00', emissiveIntensity: 6 }),
  ledRed:   new THREE.MeshStandardMaterial({ color: '#ff1100', emissive: '#ff1100', emissiveIntensity: 5 }),
  ledGreen: new THREE.MeshStandardMaterial({ color: '#00ee44', emissive: '#00ee44', emissiveIntensity: 4 }),
  ledBlue:  new THREE.MeshStandardMaterial({ color: '#0088ff', emissive: '#0088ff', emissiveIntensity: 4 }),
  // Wire / cable run
  wire:     new THREE.MeshStandardMaterial({ color: '#880000', metalness: 0.2, roughness: 0.7 }),
};

// ══════════════════════════════════════════════════════════════════════════════
// GEOMETRY FACTORIES
// ══════════════════════════════════════════════════════════════════════════════

/** Realistic propeller blade: NACA-like plan form, extruded + aerodynamic twist */
function makePropBlade(span: number, maxChord: number, pitchTwist: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const c = maxChord;
  shape.moveTo(0, 0);
  // Leading edge sweep + chord distribution
  shape.bezierCurveTo(span * 0.06, c * 0.60, span * 0.28, c * 0.95, span * 0.48, c * 0.88);
  shape.bezierCurveTo(span * 0.66, c * 0.76, span * 0.88, c * 0.46, span, 0);
  // Trailing edge camber line
  shape.bezierCurveTo(span * 0.82, -c * 0.12, span * 0.38, -c * 0.20, span * 0.06, -c * 0.07);
  shape.lineTo(0, 0);

  const geo = new THREE.ExtrudeGeometry(shape, {
    steps: 10, depth: 0.011,
    bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.003, bevelSegments: 2,
  });

  // Apply aerodynamic pitch twist along span
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const t = Math.max(0, Math.min(1, pos.getX(i) / span));
    const a = t * pitchTwist;
    const y = pos.getY(i), z = pos.getZ(i);
    pos.setY(i, y * Math.cos(a) - z * Math.sin(a));
    pos.setZ(i, y * Math.sin(a) + z * Math.cos(a));
  }
  geo.computeVertexNormals();
  return geo;
}

/** NACA 0012 wing cross-section, extruded along span */
function makeWingSection(chord: number, span: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const N = 32;
  const naca = (x: number) => {
    const t = 0.12;
    const s = Math.sqrt(Math.max(0, x));
    return 5 * t * (0.2969 * s - 0.1260 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1015 * x ** 4);
  };
  // Upper surface
  for (let i = 0; i <= N; i++) {
    const x = i / N;
    const y = naca(x);
    if (i === 0) shape.moveTo(x * chord - chord * 0.28, y * chord);
    else shape.lineTo(x * chord - chord * 0.28, y * chord);
  }
  // Lower surface
  for (let i = N; i >= 0; i--) {
    const x = i / N;
    shape.lineTo(x * chord - chord * 0.28, -naca(x) * chord * 0.94);
  }
  const geo = new THREE.ExtrudeGeometry(shape, { steps: 6, depth: span, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  geo.rotateZ(-Math.PI / 2);
  return geo;
}

// Pre-build blade geometries at module level (avoid per-frame recreation)
const heroBlade  = makePropBlade(0.94, 0.084, 0.30);
const quadBlade  = makePropBlade(0.88, 0.079, 0.30);
const fwBlade    = makePropBlade(0.50, 0.062, 0.26);

// ══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

/** Realistic brushless motor: stator + copper poles + anodised bell + prop hub */
interface MotorProps {
  r?: number; h?: number; blades?: number;
  bladeGeo?: THREE.BufferGeometry;
  animated?: boolean;
}
function Motor({ r = 0.18, h = 0.24, blades = 2, bladeGeo = heroBlade, animated = true }: MotorProps) {
  const hubRef = useRef<THREE.Group>(null!);
  useFrame((_, dt) => { if (animated && hubRef.current) hubRef.current.rotation.y += dt * 22; });

  return (
    <group>
      {/* Stator body */}
      <mesh material={M.alum} castShadow>
        <cylinderGeometry args={[r * 0.70, r * 0.72, h * 0.52, 24]} />
      </mesh>
      {/* Copper winding poles × 12 */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} material={M.copper} rotation={[0, (i * Math.PI) / 6, 0]}>
          <cylinderGeometry args={[r * 0.73, r * 0.73, h * 0.36, 3, 1, true, 0.02, 0.24]} />
        </mesh>
      ))}
      {/* Motor bell (slides over stator) */}
      <mesh position={[0, h * 0.06, 0]} material={M.bell} castShadow>
        <cylinderGeometry args={[r, r * 0.97, h * 0.44, 24, 1, true]} />
      </mesh>
      {/* Bell top cap */}
      <mesh position={[0, h * 0.27, 0]} material={M.bell} castShadow>
        <cylinderGeometry args={[r, r, h * 0.10, 24]} />
      </mesh>
      {/* 6 cooling ribs on bell */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`rb${i}`} material={M.alum} rotation={[0, (i * Math.PI) / 3, 0]} position={[r * 0.98, h * 0.14, 0]}>
          <boxGeometry args={[r * 0.06, h * 0.32, r * 0.04]} />
        </mesh>
      ))}
      {/* Shaft */}
      <mesh position={[0, h * 0.36, 0]} material={M.alumC}>
        <cylinderGeometry args={[0.020, 0.020, h * 0.18, 10]} />
      </mesh>
      {/* Base flange */}
      <mesh position={[0, -h * 0.30, 0]} material={M.alumB} castShadow>
        <cylinderGeometry args={[r * 0.88, r * 0.88, h * 0.10, 24]} />
      </mesh>
      {/* 4 mount bolts */}
      {Array.from({ length: 4 }).map((_, i) => {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        return (
          <group key={`bl${i}`} position={[Math.cos(a) * r * 0.63, -h * 0.25, Math.sin(a) * r * 0.63]}>
            <mesh material={M.alumC}><cylinderGeometry args={[0.013, 0.013, 0.028, 6]} /></mesh>
            <mesh position={[0, 0.016, 0]} material={M.alumC}><cylinderGeometry args={[0.020, 0.020, 0.008, 6]} /></mesh>
          </group>
        );
      })}
      {/* Green status LED */}
      <mesh position={[r + 0.008, 0, 0]} material={M.ledGreen}>
        <sphereGeometry args={[0.016, 8, 6]} />
      </mesh>

      {/* Propeller hub + blades */}
      <group ref={hubRef} position={[0, h * 0.45, 0]}>
        <mesh material={M.alumB}><cylinderGeometry args={[0.048, 0.040, 0.032, 16]} /></mesh>
        <mesh position={[0, 0.024, 0]} material={M.alum}><cylinderGeometry args={[0.034, 0.034, 0.018, 6]} /></mesh>
        {Array.from({ length: blades }).map((_, i) => (
          <group key={i} rotation={[0, (i * Math.PI * 2) / blades, 0]}>
            <mesh geometry={bladeGeo} material={M.prop} position={[0.040, 0, 0]} castShadow />
          </group>
        ))}
      </group>
    </group>
  );
}

/** 3-axis gimbal payload  */
function Gimbal() {
  return (
    <group>
      {/* Isolation plate */}
      <mesh material={M.carbonB} castShadow><boxGeometry args={[0.52, 0.038, 0.52]} /></mesh>
      {/* 4 rubber damper balls */}
      {[[-0.20, -0.18], [0.20, -0.18], [-0.20, 0.18], [0.20, 0.18]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0, z]} material={M.rubber}><sphereGeometry args={[0.038, 8, 6]} /></mesh>
      ))}
      {/* Yaw ring */}
      <mesh position={[0, -0.10, 0]} material={M.alum} castShadow>
        <torusGeometry args={[0.24, 0.024, 10, 28]} />
      </mesh>
      {/* Roll arm */}
      <mesh position={[0, -0.22, 0]} rotation={[0, 0, Math.PI / 2]} material={M.alumB} castShadow>
        <cylinderGeometry args={[0.024, 0.024, 0.56, 10]} />
      </mesh>
      {/* Roll pivot motors */}
      {[-0.28, 0.28].map((x, i) => (
        <mesh key={i} position={[x, -0.22, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.bell} castShadow>
          <cylinderGeometry args={[0.044, 0.044, 0.058, 16]} />
        </mesh>
      ))}
      {/* Pitch arm */}
      <mesh position={[0, -0.36, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.alumB} castShadow>
        <cylinderGeometry args={[0.020, 0.020, 0.46, 10]} />
      </mesh>
      {/* Pitch pivots */}
      {[-0.23, 0.23].map((z, i) => (
        <mesh key={i} position={[0, -0.36, z]} material={M.bell} castShadow>
          <cylinderGeometry args={[0.036, 0.036, 0.050, 12]} />
        </mesh>
      ))}
      {/* Camera body */}
      <mesh position={[0, -0.48, 0]} material={M.abs} castShadow>
        <boxGeometry args={[0.22, 0.19, 0.21]} />
      </mesh>
      {/* Lens barrel */}
      <mesh position={[0, -0.48, 0.125]} rotation={[Math.PI / 2, 0, 0]} material={M.carbon} castShadow>
        <cylinderGeometry args={[0.072, 0.082, 0.21, 22]} />
      </mesh>
      {/* Front lens glass */}
      <mesh position={[0, -0.48, 0.232]} rotation={[Math.PI / 2, 0, 0]} material={M.lens}>
        <cylinderGeometry args={[0.060, 0.060, 0.022, 22]} />
      </mesh>
      {/* IR LED ring around lens */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.076, -0.48 + Math.sin(a) * 0.076, 0.240]} material={M.ledRed}>
            <sphereGeometry args={[0.008, 6, 4]} />
          </mesh>
        );
      })}
      {/* Thermal imager beside main camera */}
      <mesh position={[0.140, -0.476, 0.085]} material={M.carbon} castShadow>
        <boxGeometry args={[0.068, 0.068, 0.110]} />
      </mesh>
      <mesh position={[0.140, -0.476, 0.145]} rotation={[Math.PI / 2, 0, 0]} material={M.lens}>
        <cylinderGeometry args={[0.024, 0.024, 0.014, 12]} />
      </mesh>
    </group>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HERO DRONE — detailed 8-arm octocopter
// ══════════════════════════════════════════════════════════════════════════════
export function HeroDroneMesh(props: JSX.IntrinsicElements['group']) {
  const rootRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!rootRef.current) return;
    rootRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.78) * 0.18;
    rootRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.52) * 0.038;
    rootRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.41) * 0.032;
  });

  const ARM = 8;
  const ARM_R = 2.62;
  const TUBE_R = 0.088;

  return (
    <group ref={rootRef} {...props}>

      {/* ── Top octagonal plate ── */}
      <mesh position={[0, 0.22, 0]} material={M.carbon} castShadow receiveShadow>
        <cylinderGeometry args={[1.44, 1.48, 0.038, 8]} />
      </mesh>
      {/* Top plate chamfer ring */}
      <mesh position={[0, 0.20, 0]} material={M.alum}>
        <cylinderGeometry args={[1.49, 1.44, 0.018, 8]} />
      </mesh>

      {/* ── Bottom octagonal plate ── */}
      <mesh position={[0, -0.12, 0]} material={M.carbon} castShadow receiveShadow>
        <cylinderGeometry args={[1.34, 1.38, 0.038, 8]} />
      </mesh>

      {/* ── Electronics column / stack ── */}
      <mesh position={[0, 0.06, 0]} material={M.carbonB} castShadow>
        <cylinderGeometry args={[0.76, 0.82, 0.38, 18]} />
      </mesh>
      {/* Ventilation slots */}
      {Array.from({ length: 14 }).map((_, i) => {
        const a = (i * Math.PI * 2) / 14;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.79, 0.04 + (i % 2) * 0.09, Math.sin(a) * 0.79]} rotation={[0, -a, 0]} material={M.abs}>
            <boxGeometry args={[0.030, 0.058, 0.095]} />
          </mesh>
        );
      })}

      {/* ── Flight controller PCB ── */}
      <mesh position={[0, 0.26, 0]} material={M.pcb} castShadow>
        <boxGeometry args={[0.58, 0.018, 0.58]} />
      </mesh>
      {/* FC chip */}
      <mesh position={[0, 0.28, 0]} material={M.abs}><boxGeometry args={[0.11, 0.018, 0.11]} /></mesh>
      {/* Vibration damper balls × 4 */}
      {[[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.262, z]} material={M.rubber}><sphereGeometry args={[0.034, 8, 6]} /></mesh>
      ))}
      {/* Status LED bar */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`sl${i}`} position={[-0.16 + i * 0.08, 0.275, 0.3]} material={i < 3 ? M.ledGreen : M.ledAmber}>
          <boxGeometry args={[0.022, 0.010, 0.012]} />
        </mesh>
      ))}

      {/* ── GPS / telemetry mast ── */}
      <mesh position={[0, 0.72, 0]} material={M.alumB} castShadow>
        <cylinderGeometry args={[0.024, 0.028, 0.52, 10]} />
      </mesh>
      {/* GPS puck */}
      <mesh position={[0, 0.98, 0]} material={M.abs} castShadow>
        <cylinderGeometry args={[0.120, 0.100, 0.040, 18]} />
      </mesh>
      <mesh position={[0, 1.000, 0]} material={M.carbon}>
        <cylinderGeometry args={[0.090, 0.090, 0.014, 18]} />
      </mesh>

      {/* ── Telemetry radio + antenna ── */}
      <mesh position={[0.56, 0.32, 0]} material={M.abs} castShadow>
        <boxGeometry args={[0.14, 0.06, 0.08]} />
      </mesh>
      <mesh position={[0.66, 0.50, 0]} rotation={[0, 0, 0.32]} material={M.abs} castShadow>
        <cylinderGeometry args={[0.013, 0.009, 0.44, 8]} />
      </mesh>
      <mesh position={[0.80, 0.68, 0]} material={M.ledAmber}>
        <sphereGeometry args={[0.024, 8, 6]} />
      </mesh>

      {/* ── 8 Arms ── */}
      {Array.from({ length: ARM }).map((_, i) => {
        const angle = (i * Math.PI * 2) / ARM;
        const len = ARM_R;

        return (
          <group key={i} rotation={[0, -angle, 0]}>
            {/* Main carbon arm tube */}
            <mesh position={[len / 2, 0.038, 0]} rotation={[0, 0, Math.PI / 2]} material={M.carbonB} castShadow receiveShadow>
              <cylinderGeometry args={[TUBE_R, TUBE_R, len, 12]} />
            </mesh>
            {/* Inner lighter tube (hollow suggestion) */}
            <mesh position={[len / 2, 0.038, 0]} rotation={[0, 0, Math.PI / 2]} material={M.carbon}>
              <cylinderGeometry args={[TUBE_R * 0.76, TUBE_R * 0.76, len - 0.08, 8]} />
            </mesh>
            {/* Arm root reinforcement clamp */}
            <mesh position={[0.30, 0.038, 0]} material={M.alum} castShadow>
              <cylinderGeometry args={[TUBE_R * 1.38, TUBE_R * 1.38, 0.16, 10]} />
            </mesh>
            {/* ESC module at ~58% span */}
            <mesh position={[len * 0.60, 0.052, 0]} material={M.abs} castShadow>
              <boxGeometry args={[0.22, 0.054, 0.14]} />
            </mesh>
            {/* ESC heatsink fins */}
            {Array.from({ length: 5 }).map((_, j) => (
              <mesh key={j} position={[len * 0.60, 0.086, -0.044 + j * 0.022]} material={M.alumC}>
                <boxGeometry args={[0.19, 0.024, 0.006]} />
              </mesh>
            ))}
            {/* ESC power wire (red cable) along bottom of arm */}
            <mesh position={[len * 0.45, -0.038, 0.014]} rotation={[0, 0, Math.PI / 2]} material={M.wire}>
              <cylinderGeometry args={[0.008, 0.008, len * 0.6, 6]} />
            </mesh>
            {/* Navigation LEDs underside of arm */}
            {Array.from({ length: 4 }).map((_, j) => (
              <mesh key={`led${j}`} position={[len * 0.22 + j * 0.26, -0.052, 0]} material={i % 2 === 0 ? M.ledRed : M.ledGreen}>
                <boxGeometry args={[0.040, 0.009, 0.016]} />
              </mesh>
            ))}
            {/* Motor mount plate */}
            <mesh position={[len, 0.038, 0]} material={M.alumB} castShadow>
              <boxGeometry args={[0.180, 0.060, 0.180]} />
            </mesh>
            {/* Motor assembly */}
            <group position={[len, 0.118, 0]}>
              <Motor r={0.172} h={0.220} blades={2} bladeGeo={heroBlade} />
            </group>
          </group>
        );
      })}

      {/* ── 3-axis payload gimbal ── */}
      <group position={[0, -0.34, 0]}>
        <Gimbal />
      </group>

      {/* ── Landing gear – 4 diagonal legs ── */}
      {Array.from({ length: 4 }).map((_, i) => {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        const gx = Math.cos(a) * 0.88;
        const gz = Math.sin(a) * 0.88;
        return (
          <group key={i} position={[gx, -0.09, gz]}>
            {/* Main diagonal leg tube */}
            <mesh rotation={[gz * 0.18, -a, gx * 0.18]} position={[0, -0.38, 0]} material={M.carbon} castShadow>
              <cylinderGeometry args={[0.034, 0.028, 0.80, 10]} />
            </mesh>
            {/* Ankle joint */}
            <mesh position={[0, -0.80, 0]} material={M.alum} castShadow>
              <cylinderGeometry args={[0.040, 0.040, 0.075, 10]} />
            </mesh>
            {/* Rubber foot */}
            <mesh position={[0, -0.86, 0]} material={M.rubber}>
              <sphereGeometry args={[0.052, 8, 6]} />
            </mesh>
          </group>
        );
      })}
      {/* Cross skid bars */}
      {[[-0.64, 0, 0], [0.64, 0, 0], [0, 0, -0.64], [0, 0, 0.64]].map(([x, , z], i) => (
        <mesh key={`sk${i}`} position={[x * 0.82, -0.88, z * 0.82]} rotation={[i > 1 ? Math.PI / 2 : 0, 0, 0]} material={M.carbon} castShadow>
          <cylinderGeometry args={[0.026, 0.024, 1.06, 8]} />
        </mesh>
      ))}

    </group>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MULTIMOTOR QUAD — M-84 compact tactical quadcopter
// ══════════════════════════════════════════════════════════════════════════════
export function MultimotorMesh(props: JSX.IntrinsicElements['group']) {
  return (
    <group {...props}>

      {/* ── Main X-frame top plate ── */}
      <mesh position={[0, 0.175, 0]} material={M.carbon} castShadow receiveShadow>
        <boxGeometry args={[1.05, 0.038, 1.05]} />
      </mesh>
      {/* ── Bottom plate ── */}
      <mesh position={[0, -0.040, 0]} material={M.carbon} castShadow>
        <boxGeometry args={[0.88, 0.034, 0.88]} />
      </mesh>

      {/* ── Side chassis walls ── */}
      {[[0, 0.42], [0, -0.42], [0.42, 0], [-0.42, 0]].map(([x, z], i) => (
        <mesh key={i} position={[x * 0.72, 0.068, z * 0.72]} rotation={[0, i > 1 ? Math.PI / 2 : 0, 0]} material={M.carbonB} castShadow>
          <boxGeometry args={[0.62, 0.22, 0.034]} />
        </mesh>
      ))}

      {/* ── Standoff pillars × 4 ── */}
      {[[-0.29, -0.29], [0.29, -0.29], [-0.29, 0.29], [0.29, 0.29]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.068, z]} material={M.alumB} castShadow>
          <cylinderGeometry args={[0.026, 0.026, 0.23, 8]} />
        </mesh>
      ))}

      {/* ── FC + power distribution stack ── */}
      {/* PDB layer */}
      <mesh position={[0, 0.21, 0]} material={M.pcb} castShadow>
        <boxGeometry args={[0.36, 0.018, 0.36]} />
      </mesh>
      {/* FC board */}
      <mesh position={[0, 0.235, 0]} material={M.pcb} castShadow>
        <boxGeometry args={[0.30, 0.016, 0.30]} />
      </mesh>
      {/* FC chip */}
      <mesh position={[0, 0.251, 0]} material={M.abs}><boxGeometry args={[0.10, 0.018, 0.10]} /></mesh>
      {/* Capacitors */}
      {[[-0.10, 0.09], [0.10, 0.09], [0.10, -0.09]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.254, z]} material={M.alumC} castShadow>
          <cylinderGeometry args={[0.026, 0.026, 0.052, 12]} />
        </mesh>
      ))}
      {/* Vibration isolators */}
      {[[-0.13, -0.13], [0.13, -0.13], [-0.13, 0.13], [0.13, 0.13]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.227, z]} material={M.rubber}>
          <sphereGeometry args={[0.020, 8, 6]} />
        </mesh>
      ))}

      {/* ── FPV camera at front ── */}
      <mesh position={[0, 0.225, 0.485]} rotation={[0.26, 0, 0]} material={M.abs} castShadow>
        <boxGeometry args={[0.130, 0.110, 0.095]} />
      </mesh>
      {/* Lens barrel */}
      <mesh position={[0, 0.225, 0.536]} rotation={[0.26, Math.PI / 2, 0]} material={M.carbon} castShadow>
        <cylinderGeometry args={[0.034, 0.038, 0.065, 16]} />
      </mesh>
      <mesh position={[0, 0.222, 0.572]} rotation={[0.26, Math.PI / 2, 0]} material={M.lens}>
        <cylinderGeometry args={[0.030, 0.030, 0.018, 16]} />
      </mesh>

      {/* ── VTX antenna ── */}
      <mesh position={[-0.42, 0.28, 0.12]} rotation={[0, 0, 0.38]} material={M.abs} castShadow>
        <cylinderGeometry args={[0.011, 0.008, 0.36, 8]} />
      </mesh>
      <mesh position={[-0.56, 0.465, 0.12]} material={M.ledAmber}>
        <sphereGeometry args={[0.022, 8, 6]} />
      </mesh>

      {/* ── GPS puck on top ── */}
      <mesh position={[0, 0.26, -0.28]} material={M.abs} castShadow>
        <cylinderGeometry args={[0.080, 0.068, 0.026, 16]} />
      </mesh>

      {/* ── Battery sled below ── */}
      <mesh position={[0, -0.100, 0.02]} material={M.abs} castShadow>
        <boxGeometry args={[0.60, 0.096, 1.02]} />
      </mesh>
      {/* Battery contact strip */}
      <mesh position={[0, -0.056, 0.56]} material={M.alum}>
        <boxGeometry args={[0.38, 0.010, 0.024]} />
      </mesh>
      {/* Retention strap */}
      <mesh position={[0, -0.055, 0.02]} material={M.rubber} castShadow>
        <boxGeometry args={[0.66, 0.018, 0.060]} />
      </mesh>
      {/* Battery indicator LEDs */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[-0.14 + i * 0.07, -0.048, 0.53]} material={i < 4 ? M.ledGreen : M.ledAmber}>
          <boxGeometry args={[0.024, 0.010, 0.011]} />
        </mesh>
      ))}

      {/* ── 4 Arms at 45° ── */}
      {Array.from({ length: 4 }).map((_, i) => {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        const len = 1.52;
        return (
          <group key={i} rotation={[0, -angle, 0]}>
            {/* Carbon square-section arm */}
            <mesh position={[len / 2, 0.068, 0]} rotation={[0, 0, Math.PI / 2]} material={M.carbon} castShadow>
              <cylinderGeometry args={[0.068, 0.063, len, 8]} />
            </mesh>
            {/* Arm root gusset */}
            <mesh position={[0.32, 0.068, 0]} material={M.alum} castShadow>
              <cylinderGeometry args={[0.080, 0.080, 0.150, 10]} />
            </mesh>
            {/* Motor mount */}
            <mesh position={[len + 0.024, 0.068, 0]} material={M.alumB} castShadow>
              <boxGeometry args={[0.150, 0.050, 0.150]} />
            </mesh>
            <group position={[len + 0.024, 0.118, 0]}>
              <Motor r={0.150} h={0.195} blades={2} bladeGeo={quadBlade} />
            </group>
            {/* Arm tip navigation LED */}
            <mesh position={[len + 0.11, 0.068, 0]} material={i < 2 ? M.ledRed : M.ledGreen}>
              <sphereGeometry args={[0.020, 8, 6]} />
            </mesh>
          </group>
        );
      })}

    </group>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MONOCOPTER — S-19 single asymmetric rotor
// ══════════════════════════════════════════════════════════════════════════════
export function MonocopterMesh(props: JSX.IntrinsicElements['group']) {
  const rotorRef = useRef<THREE.Group>(null!);

  const bladeGeo = useMemo(() => {
    const shape = new THREE.Shape();
    const span = 3.0, chord = 0.20;
    shape.moveTo(0, 0);
    shape.bezierCurveTo(span * 0.04, chord * 0.65, span * 0.26, chord * 0.98, span * 0.46, chord * 0.90);
    shape.bezierCurveTo(span * 0.64, chord * 0.78, span * 0.86, chord * 0.44, span, 0);
    shape.bezierCurveTo(span * 0.80, -chord * 0.14, span * 0.35, -chord * 0.22, span * 0.04, -chord * 0.09);
    shape.lineTo(0, 0);
    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 12, depth: 0.013,
      bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.003, bevelSegments: 2,
    });
    // Apply twist
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const t = Math.max(0, Math.min(1, pos.getX(i) / span));
      const a = t * 0.42;
      const y = pos.getY(i), z = pos.getZ(i);
      pos.setY(i, y * Math.cos(a) - z * Math.sin(a));
      pos.setZ(i, y * Math.sin(a) + z * Math.cos(a));
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((_, dt) => { if (rotorRef.current) rotorRef.current.rotation.y += dt * 7.5; });

  return (
    <group {...props}>

      {/* ── Main fuselage body ── */}
      <mesh material={M.carbon} castShadow receiveShadow>
        <cylinderGeometry args={[0.220, 0.285, 1.02, 22]} />
      </mesh>
      {/* Structural ribs × 6 */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[0, -0.38 + i * 0.16, 0]} material={M.alum}>
          <torusGeometry args={[0.248, 0.012, 8, 26]} />
        </mesh>
      ))}
      {/* Forward avionics bay face */}
      <mesh position={[0.225, 0.12, 0]} rotation={[0, 0, 0.10]} material={M.carbonB} castShadow>
        <boxGeometry args={[0.038, 0.52, 0.30]} />
      </mesh>
      {/* Pressure port */}
      <mesh position={[0.268, 0.0, 0]} material={M.abs}>
        <boxGeometry args={[0.038, 0.058, 0.115]} />
      </mesh>
      {/* Telemetry port cover */}
      <mesh position={[-0.270, 0.14, 0]} material={M.abs} castShadow>
        <boxGeometry args={[0.036, 0.10, 0.12]} />
      </mesh>
      {/* Status LEDs strip */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[0.268, 0.22 + i * 0.055, 0]} material={i === 0 ? M.ledAmber : M.ledGreen}>
          <boxGeometry args={[0.020, 0.014, 0.014]} />
        </mesh>
      ))}

      {/* ── Rotor head ── */}
      <group ref={rotorRef} position={[0, 0.64, 0]}>
        {/* Hub body */}
        <mesh material={M.alumB} castShadow>
          <cylinderGeometry args={[0.092, 0.082, 0.105, 22]} />
        </mesh>
        {/* Hub cap dome */}
        <mesh position={[0, 0.066, 0]} material={M.alum}>
          <sphereGeometry args={[0.072, 18, 12]} />
        </mesh>
        {/* Pitch link bearings */}
        {[0, Math.PI].map((a, i) => (
          <mesh key={i} position={[Math.cos(a) * 0.108, 0, Math.sin(a) * 0.108]} material={M.alumC}>
            <torusGeometry args={[0.028, 0.010, 8, 18]} />
          </mesh>
        ))}
        {/* Main blade — NACA extruded airfoil */}
        <mesh geometry={bladeGeo} material={M.prop} position={[0.13, 0, 0]} castShadow />
        {/* Counterweight arm */}
        <mesh position={[-0.38, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.alumB} castShadow>
          <cylinderGeometry args={[0.030, 0.026, 0.62, 10]} />
        </mesh>
        {/* Counterweight mass */}
        <mesh position={[-0.70, 0, 0]} material={M.alum} castShadow>
          <cylinderGeometry args={[0.078, 0.065, 0.22, 16]} />
        </mesh>
        {/* CW tip bolt */}
        <mesh position={[-0.82, 0, 0]} material={M.alumC}>
          <sphereGeometry args={[0.040, 10, 8]} />
        </mesh>
      </group>

      {/* ── Tail boom ── */}
      <mesh position={[0, -0.096, -1.14]} rotation={[Math.PI / 2, 0, 0]} material={M.carbon} castShadow>
        <cylinderGeometry args={[0.058, 0.038, 2.28, 10]} />
      </mesh>
      {/* Boom-to-body fairing */}
      <mesh position={[0, -0.080, -0.14]} rotation={[Math.PI / 2.4, 0, 0]} material={M.carbonB} castShadow>
        <cylinderGeometry args={[0.092, 0.058, 0.42, 12]} />
      </mesh>

      {/* ── V-tail fins ── */}
      {[-1, 1].map((side, i) => (
        <group key={i} position={[0, -0.090, -2.26]}>
          <mesh rotation={[side * 0.62, 0, 0]} position={[0, side * 0.16, 0]} material={M.wing} castShadow>
            <boxGeometry args={[0.52, 0.014, 0.30]} />
          </mesh>
          {/* Leading edge strip */}
          <mesh rotation={[side * 0.62, 0, 0]} position={[0, side * 0.16, 0.145]} material={M.alum}>
            <boxGeometry args={[0.52, 0.018, 0.012]} />
          </mesh>
        </group>
      ))}

      {/* ── Payload sensor pod ── */}
      <group position={[0, -0.74, 0]}>
        <mesh material={M.abs} castShadow>
          <sphereGeometry args={[0.282, 26, 20]} />
        </mesh>
        {/* Main sensor window */}
        <mesh position={[0, -0.155, 0.20]} rotation={[Math.PI / 2, 0, 0]} material={M.lens}>
          <cylinderGeometry args={[0.105, 0.105, 0.020, 20]} />
        </mesh>
        {/* Thermal window */}
        <mesh position={[0.158, -0.11, 0.20]} rotation={[Math.PI / 2, 0, 0]} material={M.glass}>
          <boxGeometry args={[0.082, 0.064, 0.018]} />
        </mesh>
        {/* Status LED */}
        <mesh position={[0.268, 0, 0]} material={M.ledAmber}>
          <sphereGeometry args={[0.018, 8, 6]} />
        </mesh>
        {/* Mount stem */}
        <mesh position={[0, 0.292, 0]} material={M.alum}>
          <cylinderGeometry args={[0.044, 0.044, 0.060, 12]} />
        </mesh>
      </group>

    </group>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FIXED WING — F-22 long-endurance twin boom
// ══════════════════════════════════════════════════════════════════════════════
export function FixedWingMesh(props: JSX.IntrinsicElements['group']) {
  const propsRefs = useRef<(THREE.Group | null)[]>([]);
  const rootRef = useRef<THREE.Group>(null!);

  const wingR = useMemo(() => makeWingSection(0.56, 2.16), []);

  useFrame((state, dt) => {
    propsRefs.current.forEach((p) => { if (p) p.rotation.z += dt * 30; });
    if (rootRef.current) {
      rootRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.38) * 0.22;
      rootRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.27) * 0.075;
    }
  });

  return (
    <group ref={rootRef} {...props}>

      {/* ── Fuselage ── */}
      {/* Nose section */}
      <mesh position={[0, 0, 1.60]} rotation={[Math.PI / 2, 0, 0]} material={M.carbon} castShadow>
        <cylinderGeometry args={[0.012, 0.320, 0.74, 22]} />
      </mesh>
      {/* Main cylindrical body */}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={M.carbon} castShadow receiveShadow>
        <cylinderGeometry args={[0.320, 0.285, 2.24, 22]} />
      </mesh>
      {/* Tail taper section */}
      <mesh position={[0, 0, -1.36]} rotation={[Math.PI / 2, 0, 0]} material={M.carbonB} castShadow>
        <cylinderGeometry args={[0.100, 0.285, 0.62, 22]} />
      </mesh>
      {/* Pitot tube */}
      <mesh position={[0.090, 0, 1.98]} rotation={[Math.PI / 2, 0, 0]} material={M.alumC}>
        <cylinderGeometry args={[0.008, 0.006, 0.40, 8]} />
      </mesh>
      {/* Pitot static port */}
      <mesh position={[0.090, 0.006, 2.20]} material={M.alum}>
        <sphereGeometry args={[0.012, 8, 6]} />
      </mesh>
      {/* Dorsal spine strip */}
      <mesh position={[0, 0.326, -0.18]} rotation={[0.12, 0, 0]} material={M.alum}>
        <boxGeometry args={[0.022, 0.016, 1.90]} />
      </mesh>
      {/* Dorsal VHF antenna */}
      <mesh position={[0, 0.338, 0.30]} rotation={[0, 0, 0.04]} material={M.abs} castShadow>
        <cylinderGeometry args={[0.012, 0.008, 0.360, 8]} />
      </mesh>
      {/* Fuselage panel lines (very thin boxes) */}
      {[-0.25, 0.25].map((x, i) => (
        <mesh key={i} position={[x, 0, -0.10]} rotation={[0, 0, 0]} material={M.alum}>
          <boxGeometry args={[0.006, 0.620, 1.80]} />
        </mesh>
      ))}

      {/* ── Wings (NACA 0012 airfoil extrusion) ── */}
      {/* Right wing */}
      <mesh geometry={wingR} material={M.wing} position={[0.285, 0, 0.16]} castShadow receiveShadow />
      {/* Left wing (mirrored) */}
      <mesh geometry={wingR} material={M.wing} position={[-0.285, 0, 0.16]} scale={[-1, 1, 1]} castShadow receiveShadow />

      {/* Wing root fairings */}
      {[-1, 1].map((s, i) => (
        <mesh key={i} position={[s * 0.26, 0, 0.24]} material={M.carbonB} castShadow>
          <cylinderGeometry args={[0.098, 0.320, 0.40, 14]} />
        </mesh>
      ))}
      {/* Aileron panels */}
      {[-1, 1].map((s, i) => (
        <mesh key={i} position={[s * 1.52, 0.016, -0.82]} rotation={[0, s * -0.16, 0]} material={M.alumC} castShadow>
          <boxGeometry args={[0.88, 0.018, 0.140]} />
        </mesh>
      ))}
      {/* Wing tip nav lights */}
      {[-1, 1].map((s, i) => (
        <mesh key={i} position={[s * 2.50, 0.018, -1.96]} material={i === 0 ? M.ledRed : M.ledGreen}>
          <sphereGeometry args={[0.030, 8, 6]} />
        </mesh>
      ))}

      {/* ── Twin boom tail ── */}
      {[-1, 1].map((side, i) => (
        <group key={i} position={[side * 0.92, 0, -0.22]}>
          {/* Boom tube */}
          <mesh rotation={[Math.PI / 2, 0, 0]} material={M.carbon} castShadow>
            <cylinderGeometry args={[0.038, 0.032, 2.42, 10]} />
          </mesh>
          {/* Nacelle fairing */}
          <mesh position={[0, 0, -1.36]} material={M.carbonB} castShadow>
            <cylinderGeometry args={[0.076, 0.038, 0.24, 16]} />
          </mesh>
          {/* Motor bell */}
          <mesh position={[0, 0, -1.50]} material={M.bell} castShadow>
            <cylinderGeometry args={[0.068, 0.064, 0.105, 18, 1, true]} />
          </mesh>
          {/* Stator */}
          <mesh position={[0, 0, -1.50]} material={M.alum} castShadow>
            <cylinderGeometry args={[0.050, 0.052, 0.080, 18]} />
          </mesh>
          {/* Copper poles */}
          {Array.from({ length: 9 }).map((_, j) => (
            <mesh key={j} position={[0, 0, -1.50]} rotation={[0, 0, (j * Math.PI) / 4.5]} material={M.copper}>
              <cylinderGeometry args={[0.052, 0.052, 0.065, 3, 1, true, 0.02, 0.20]} />
            </mesh>
          ))}
          {/* Pusher prop */}
          <group position={[0, 0, -1.60]} ref={(el) => { propsRefs.current[i] = el; }}>
            {[0, 1].map((b) => (
              <group key={b} rotation={[0, 0, b * Math.PI]}>
                <mesh geometry={fwBlade} material={M.prop} position={[0.032, 0, 0]} castShadow />
              </group>
            ))}
          </group>
          {/* Vertical fin */}
          <mesh position={[0, 0.220, -1.48]} rotation={[0.04, 0, 0]} material={M.wing} castShadow>
            <boxGeometry args={[0.014, 0.460, 0.320]} />
          </mesh>
          {/* Fin leading edge strip */}
          <mesh position={[0, 0.220, -1.32]} rotation={[0.04, 0, 0]} material={M.alum}>
            <boxGeometry args={[0.016, 0.460, 0.014]} />
          </mesh>
        </group>
      ))}

      {/* Horizontal stabiliser */}
      <mesh position={[0, 0, -1.48]} material={M.wing} castShadow receiveShadow>
        <boxGeometry args={[2.02, 0.016, 0.295]} />
      </mesh>
      {/* H-stab leading edge */}
      <mesh position={[0, 0, -1.335]} material={M.alum} castShadow>
        <boxGeometry args={[2.02, 0.020, 0.018]} />
      </mesh>
      {/* Tail centre fairing */}
      <mesh position={[0, 0, -1.44]} material={M.carbonB} castShadow>
        <boxGeometry args={[0.18, 0.08, 0.22]} />
      </mesh>

      {/* ── Belly sensor ball turret ── */}
      <group position={[0, -0.298, 0.42]}>
        <mesh material={M.abs} castShadow>
          <sphereGeometry args={[0.192, 22, 16]} />
        </mesh>
        {/* EO/IR sensor window */}
        <mesh position={[0, -0.130, 0.114]} rotation={[0.60, 0, 0]} material={M.lens}>
          <cylinderGeometry args={[0.082, 0.082, 0.020, 18]} />
        </mesh>
        {/* SAR aperture (flat panel) */}
        <mesh position={[0, -0.088, 0.175]} rotation={[0.62, 0, 0]} material={M.glass}>
          <boxGeometry args={[0.140, 0.022, 0.088]} />
        </mesh>
        {/* Turret mount collar */}
        <mesh position={[0, 0.185, 0]} material={M.alum}>
          <cylinderGeometry args={[0.044, 0.044, 0.065, 12]} />
        </mesh>
      </group>

      {/* ── Forward avionics bay ── */}
      <mesh position={[0, 0.048, 0.62]} material={M.carbonB} castShadow>
        <boxGeometry args={[0.270, 0.135, 0.40]} />
      </mesh>
      {/* Data port */}
      <mesh position={[0.148, 0.045, 0.58]} material={M.abs}>
        <boxGeometry args={[0.020, 0.040, 0.042]} />
      </mesh>
      {/* Strobe light belly */}
      <mesh position={[0, -0.320, -0.40]} material={M.ledAmber}>
        <sphereGeometry args={[0.024, 8, 6]} />
      </mesh>

    </group>
  );
}
