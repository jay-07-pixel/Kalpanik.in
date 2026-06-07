import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ThemeColors } from "../../theme/colors";

interface EnergyWaveProps {
  theme: ThemeColors;
  mode: "day" | "night";
}

export function EnergyWave({ theme, mode }: EnergyWaveProps) {
  const ringRefs = useRef<THREE.Mesh[]>([]);

  const rings = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        radius: 3 + i * 2.5,
        speed: 0.4 + i * 0.1,
        offset: i * 1.2,
      })),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    ringRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const ring = rings[i];
      const pulse = (Math.sin(t * ring.speed + ring.offset) + 1) * 0.5;
      mesh.scale.setScalar(0.8 + pulse * 0.4);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = (mode === "day" ? 0.04 : 0.08) * (0.3 + pulse * 0.7);
    });
  });

  return (
    <group position={[0, -2, -3]} rotation={[Math.PI * 0.45, 0, 0]}>
      {rings.map((ring, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) ringRefs.current[i] = el;
          }}
        >
          <ringGeometry args={[ring.radius, ring.radius + 0.05, 64]} />
          <meshBasicMaterial
            color={theme.particlePrimary}
            transparent
            opacity={0.05}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}
