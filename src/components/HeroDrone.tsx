import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { HeroDroneMesh } from './DroneGeometry';

function HeroSceneControls() {
  const mouse = useRef({ x: 0, y: 0 });
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    // Parallax rotation based on mouse
    mouse.current.x = THREE.MathUtils.lerp(mouse.current.x, (state.pointer.x * Math.PI) / 6, 0.05);
    mouse.current.y = THREE.MathUtils.lerp(mouse.current.y, (state.pointer.y * Math.PI) / 6, 0.05);

    if (group.current) {
      group.current.rotation.y = mouse.current.x;
      group.current.rotation.x = -mouse.current.y;
    }
  });

  return (
    <group ref={group}>
      <HeroDroneMesh scale={1.5} />
    </group>
  );
}

function OrbitingLights() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <pointLight position={[4, 2, 0]} intensity={2} color="#ffffff" distance={10} />
      <pointLight position={[-4, 0, 4]} intensity={1} color="#445566" distance={10} />
      <pointLight position={[0, -3, -4]} intensity={1.5} color="#ffffff" distance={10} />
    </group>
  );
}

export function HeroDroneScene() {
  return (
    <div className="w-full h-full absolute inset-0 pointer-events-none">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
        
        <ambientLight intensity={0.1} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <spotLight position={[0, 10, 0]} intensity={2} angle={0.5} penumbra={1} castShadow />
        
        <OrbitingLights />
        <HeroSceneControls />
        
        <Environment preset="night" background={false} />
      </Canvas>
    </div>
  );
}
