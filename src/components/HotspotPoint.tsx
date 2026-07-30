import React from 'react';
import { Html } from '@react-three/drei';

interface HotspotPointProps {
  position: [number, number, number];
  partName: string;
  onClick: () => void;
}

export function HotspotPoint({ position, partName, onClick }: HotspotPointProps) {
  return (
    <Html position={position} center className="pointer-events-auto">
      <div 
        className="relative group cursor-none"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        data-hotspot="true"
      >
        <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="w-3 h-3 rounded-full bg-accent relative z-10 border border-black group-hover:scale-150 transition-transform duration-300" />
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[10px] font-mono whitespace-nowrap text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          [ {partName} ]
        </div>
      </div>
    </Html>
  );
}
