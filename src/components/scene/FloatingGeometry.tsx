import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ThemeColors } from "../../theme/colors";

interface FloatingGeometryProps {
  theme: ThemeColors;
  mouseX: number;
  mouseY: number;
  mode: "day" | "night";
}

const SHAPES = ["box", "octa", "tetra", "torus"] as const;

export function FloatingGeometry({ theme, mouseX, mode }: FloatingGeometryProps) {
  const groupRef = useRef<THREE.Group>(null);

  const objects = useMemo(() => {
    const count = mode === "day" ? 6 : 10;
    return Array.from({ length: count }, (_, i) => ({
      shape: SHAPES[i % SHAPES.length],
      position: [
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8 - 2,
      ] as [number, number, number],
      rotationSpeed: [
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.3,
      ] as [number, number, number],
      floatOffset: Math.random() * Math.PI * 2,
      scale: 0.15 + Math.random() * 0.25,
    }));
  }, [mode]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    groupRef.current.children.forEach((child, i) => {
      const obj = objects[i];
      child.rotation.x += obj.rotationSpeed[0] * 0.01;
      child.rotation.y += obj.rotationSpeed[1] * 0.01;
      child.rotation.z += obj.rotationSpeed[2] * 0.01;
      child.position.y =
        obj.position[1] + Math.sin(t * 0.4 + obj.floatOffset) * 0.5;
      child.position.x =
        obj.position[0] + mouseX * 0.3 + Math.cos(t * 0.3 + obj.floatOffset) * 0.2;
    });
  });

  return (
    <group ref={groupRef}>
      {objects.map((obj, i) => (
        <mesh key={i} position={obj.position} scale={obj.scale}>
          {obj.shape === "box" && <boxGeometry args={[1, 1, 1]} />}
          {obj.shape === "octa" && <octahedronGeometry args={[0.7, 0]} />}
          {obj.shape === "tetra" && <tetrahedronGeometry args={[0.8, 0]} />}
          {obj.shape === "torus" && <torusGeometry args={[0.5, 0.2, 8, 16]} />}
          <meshStandardMaterial
            color={i % 2 === 0 ? theme.particlePrimary : theme.particleSecondary}
            emissive={theme.particlePrimary}
            emissiveIntensity={mode === "night" ? 0.5 : 0.2}
            transparent
            opacity={0.25}
            wireframe={mode === "night"}
          />
        </mesh>
      ))}
    </group>
  );
}
