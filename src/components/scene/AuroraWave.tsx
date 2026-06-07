import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ThemeColors } from "../../theme/colors";

interface AuroraWaveProps {
  theme: ThemeColors;
  mode: "day" | "night";
}

export function AuroraWave({ theme, mode }: AuroraWaveProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(30, 15, 64, 32);
    return geo;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const pos = meshRef.current.geometry.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const wave =
        Math.sin(x * 0.3 + t * 0.5) * 0.4 +
        Math.sin(y * 0.5 + t * 0.3) * 0.3 +
        Math.cos(x * 0.2 + y * 0.3 + t * 0.4) * 0.2;
      pos.setZ(i, wave);
    }
    pos.needsUpdate = true;
    meshRef.current.rotation.x = -Math.PI * 0.35;
    meshRef.current.position.y = mode === "night" ? 2 : 4;
    meshRef.current.position.z = -8;
  });

  if (mode === "day") return null;

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color={theme.particleSecondary}
        emissive={theme.particlePrimary}
        emissiveIntensity={0.3}
        transparent
        opacity={0.08}
        side={THREE.DoubleSide}
        wireframe
      />
    </mesh>
  );
}
