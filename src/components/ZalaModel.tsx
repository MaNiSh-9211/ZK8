import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Target size: longest axis of bounding box will equal this value
const TARGET_SIZE = 12;

export function ZalaModel({ scale = 1, ...props }: { scale?: number; [key: string]: any }) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/zala-421.glb');

  const cloned = React.useMemo(() => scene.clone(true), [scene]);

  // Normalise scale so the model fills TARGET_SIZE units regardless of export scale
  const normScale = React.useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxAxis = Math.max(size.x, size.y, size.z);
    return maxAxis > 0 ? (TARGET_SIZE / maxAxis) * scale : scale;
  }, [cloned, scale]);

  // Slow idle rotation
  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={group} {...props} scale={normScale}>
      <primitive object={cloned} />
    </group>
  );
}

// Preload so it's ready when the section mounts
useGLTF.preload('/models/zala-421.glb');
