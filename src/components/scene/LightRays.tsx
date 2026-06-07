import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ThemeColors } from "../../theme/colors";

interface LightRaysProps {
  theme: ThemeColors;
  mode: "day" | "night";
}

export function LightRays({ theme, mode }: LightRaysProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialsRef = useRef<THREE.MeshBasicMaterial[]>([]);

  const rays = useMemo(() => {
    return Array.from({ length: mode === "day" ? 8 : 12 }, (_, i) => ({
      angle: (i / (mode === "day" ? 8 : 12)) * Math.PI * 2,
      length: 8 + Math.random() * 6,
      speed: 0.1 + Math.random() * 0.2,
      offset: Math.random() * Math.PI * 2,
    }));
  }, [mode]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.z = t * 0.02;

    materialsRef.current.forEach((mat, i) => {
      const ray = rays[i];
      const opacity = 0.03 + Math.sin(t * ray.speed + ray.offset) * 0.02;
      mat.opacity = mode === "day" ? opacity * 2 : opacity;
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, -5]}>
      {rays.map((ray, i) => (
        <mesh key={i} rotation={[0, 0, ray.angle]}>
          <planeGeometry args={[0.02, ray.length]} />
          <meshBasicMaterial
            ref={(el) => {
              if (el) materialsRef.current[i] = el;
            }}
            color={theme.particlePrimary}
            transparent
            opacity={mode === "day" ? 0.06 : 0.04}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
