import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ThemeColors } from "../../theme/colors";

interface OrbitingSpheresProps {
  theme: ThemeColors;
  mouseX: number;
  mouseY: number;
  mode: "day" | "night";
}

const ORBITS = [
  { radius: 6, speed: 0.3, size: 0.15, offset: 0, tilt: 0.3 },
  { radius: 8, speed: -0.2, size: 0.12, offset: 2, tilt: -0.5 },
  { radius: 10, speed: 0.15, size: 0.18, offset: 4, tilt: 0.8 },
  { radius: 7, speed: -0.25, size: 0.1, offset: 1, tilt: -0.2 },
  { radius: 9, speed: 0.18, size: 0.14, offset: 3.5, tilt: 0.6 },
];

export function OrbitingSpheres({ theme, mouseX, mouseY, mode }: OrbitingSpheresProps) {
  const groupRef = useRef<THREE.Group>(null);
  const spheresRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.rotation.x = mouseY * 0.1 + Math.sin(t * 0.1) * 0.05;
      groupRef.current.rotation.z = mouseX * 0.05;
    }

    if (spheresRef.current) {
      spheresRef.current.children.forEach((child, i) => {
        const orbit = ORBITS[i % ORBITS.length];
        const angle = t * orbit.speed + orbit.offset;
        child.position.x = Math.cos(angle) * orbit.radius;
        child.position.y = Math.sin(angle * 0.7) * orbit.radius * 0.4 + Math.sin(t + i) * 0.3;
        child.position.z = Math.sin(angle) * orbit.radius * Math.cos(orbit.tilt);
        const pulse = 1 + Math.sin(t * 2 + i) * 0.15;
        child.scale.setScalar(orbit.size * pulse);
      });
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={spheresRef}>
        {ORBITS.map((_orbit, i) => (
          <mesh key={i}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? theme.particlePrimary : theme.particleSecondary}
              emissive={i % 2 === 0 ? theme.particlePrimary : theme.particleSecondary}
              emissiveIntensity={mode === "night" ? 0.8 : 0.4}
              transparent
              opacity={0.7}
              wireframe={mode === "night" && i % 3 === 0}
            />
          </mesh>
        ))}
      </group>

      {ORBITS.map((orbit, i) => (
        <mesh key={`ring-${i}`} rotation={[orbit.tilt, 0, 0]}>
          <torusGeometry args={[orbit.radius, 0.008, 8, 100]} />
          <meshBasicMaterial
            color={theme.lineColor}
            transparent
            opacity={mode === "day" ? 0.06 : 0.12}
          />
        </mesh>
      ))}
    </group>
  );
}
