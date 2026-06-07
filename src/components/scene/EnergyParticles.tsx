import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ThemeColors } from "../../theme/colors";

interface EnergyParticlesProps {
  theme: ThemeColors;
  mouseX: number;
  mouseY: number;
  count?: number;
  mode: "day" | "night";
}

export function EnergyParticles({
  theme,
  mouseX,
  mouseY,
  count = 800,
  mode,
}: EnergyParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const mouseTarget = useRef(new THREE.Vector2());

  const { positions, velocities, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const spread = mode === "day" ? 20 : 25;

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.6;
      vel[i * 3] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
      sz[i] = Math.random() * 2 + 0.5;
    }
    return { positions: pos, velocities: vel, sizes: sz };
  }, [count, mode]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.elapsedTime;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    mouseTarget.current.lerp(
      new THREE.Vector2(mouseX * 3, mouseY * 2),
      0.05
    );

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      arr[ix] += velocities[ix] + mouseTarget.current.x * 0.001;
      arr[ix + 1] +=
        velocities[ix + 1] +
        Math.sin(t + i * 0.1) * 0.003 +
        mouseTarget.current.y * 0.001;
      arr[ix + 2] += velocities[ix + 2];

      const limit = 12;
      if (Math.abs(arr[ix]) > limit) velocities[ix] *= -1;
      if (Math.abs(arr[ix + 1]) > limit) velocities[ix + 1] *= -1;
      if (Math.abs(arr[ix + 2]) > limit) velocities[ix + 2] *= -1;
    }
    posAttr.needsUpdate = true;

    pointsRef.current.rotation.y = t * 0.015;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} count={count} />
      </bufferGeometry>
      <pointsMaterial
        size={mode === "day" ? 0.04 : 0.06}
        color={theme.particleSecondary}
        transparent
        opacity={mode === "day" ? 0.5 : 0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
