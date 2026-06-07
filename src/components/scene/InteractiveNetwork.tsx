import { useRef, useMemo, useState, useCallback, useEffect } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { ThemeColors } from "../../theme/colors";
import { useApp } from "../../context/AppContext";

interface InteractiveNetworkProps {
  theme: ThemeColors;
  mouseX: number;
  mouseY: number;
  mode: "day" | "night";
  isMobile?: boolean;
}

interface NodeData {
  base: THREE.Vector3;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  phase: number;
  size: number;
}

const CONFIG = {
  day: { count: 55, connectDist: 4.5, mouseInfluence: 5.5, emissiveHot: 1.4, emissiveNormal: 0.9, lineBase: 0.28 },
  night: { count: 65, connectDist: 4.2, mouseInfluence: 5, emissiveHot: 2.5, emissiveNormal: 1.4, lineBase: 0.18 },
  dayMobile: { count: 40, connectDist: 4.8, mouseInfluence: 6.5, emissiveHot: 1.4, emissiveNormal: 0.9, lineBase: 0.32 },
  nightMobile: { count: 45, connectDist: 4.5, mouseInfluence: 6, emissiveHot: 2.5, emissiveNormal: 1.4, lineBase: 0.22 },
};

function getConfig(mode: "day" | "night", isMobile: boolean) {
  if (isMobile) return mode === "day" ? CONFIG.dayMobile : CONFIG.nightMobile;
  return CONFIG[mode];
}

function createNodes(count: number): NodeData[] {
  return Array.from({ length: count }, () => {
    const base = new THREE.Vector3(
      (Math.random() - 0.5) * 18,
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 8
    );
    return {
      base,
      position: base.clone(),
      velocity: new THREE.Vector3(),
      phase: Math.random() * Math.PI * 2,
      size: 0.028 + Math.random() * 0.032,
    };
  });
}

export function InteractiveNetwork({ theme, mouseX, mouseY, mode, isMobile = false }: InteractiveNetworkProps) {
  const cfg = getConfig(mode, isMobile);
  const { registerInteraction } = useApp();
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const lineGeoRef = useRef<THREE.BufferGeometry>(null);
  const nodesRef = useRef<NodeData[]>(createNodes(cfg.count));
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const { camera, gl } = useThree();

  const [grabbed, setGrabbed] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [pulseNode, setPulseNode] = useState<number | null>(null);
  const pulseTime = useRef(0);

  const mouseWorld = useRef(new THREE.Vector3());
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);

  const triggerPulse = useCallback((index: number) => {
    setPulseNode(index);
    pulseTime.current = 0;
  }, []);

  useEffect(() => {
    nodesRef.current = createNodes(cfg.count);
    meshRefs.current = [];
  }, [mode, isMobile, cfg.count]);

  useEffect(() => {
    const release = () => {
      setGrabbed(null);
      document.body.style.cursor = "crosshair";
    };
    window.addEventListener("pointerup", release);
    return () => window.removeEventListener("pointerup", release);
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const nodes = nodesRef.current;

    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
    raycaster.ray.intersectPlane(plane, mouseWorld.current);

    if (pulseNode !== null) {
      pulseTime.current += delta;
      if (pulseTime.current > 2) setPulseNode(null);
    }

    nodes.forEach((node, i) => {
      if (grabbed === i) {
        node.position.lerp(mouseWorld.current, 0.18);
        node.velocity.set(0, 0, 0);
      } else {
        const target = node.base.clone();
        target.x += Math.sin(t * 0.25 + node.phase) * 0.35;
        target.y += Math.cos(t * 0.2 + node.phase * 1.3) * 0.3;
        target.z += Math.sin(t * 0.15 + node.phase * 0.7) * 0.2;

        const toMouse = mouseWorld.current.clone().sub(node.position);
        const dist = toMouse.length();
        if (dist < cfg.mouseInfluence && grabbed === null) {
          const force = (1 - dist / cfg.mouseInfluence) * 0.04;
          node.velocity.add(toMouse.normalize().multiplyScalar(force));
        }

        if (pulseNode === i) {
          const pulse = Math.sin(pulseTime.current * 8) * 0.3;
          if (dist > 0.01) node.velocity.add(toMouse.normalize().multiplyScalar(pulse * 0.05));
        }

        node.velocity.multiplyScalar(0.92);
        node.position.lerp(target, 0.025).add(node.velocity);
      }

      const mesh = meshRefs.current[i];
      if (mesh) {
        mesh.position.copy(node.position);
        const isHot = hovered === i || grabbed === i || pulseNode === i;
        const scale = node.size * (isHot ? 1.8 : 1) * (1 + Math.sin(t * 2 + node.phase) * 0.12);
        mesh.scale.setScalar(scale);
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = isHot ? cfg.emissiveHot : cfg.emissiveNormal;
      }
    });

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.008 + mouseX * 0.06;
      groupRef.current.rotation.x = mouseY * 0.04;
    }

    const connections: number[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].position.distanceTo(nodes[j].position) < cfg.connectDist) {
          connections.push(
            nodes[i].position.x, nodes[i].position.y, nodes[i].position.z,
            nodes[j].position.x, nodes[j].position.y, nodes[j].position.z
          );
        }
      }
    }

    if (lineGeoRef.current) {
      lineGeoRef.current.setAttribute("position", new THREE.BufferAttribute(new Float32Array(connections), 3));
      lineGeoRef.current.attributes.position.needsUpdate = true;
      lineGeoRef.current.computeBoundingSphere();
    }

    if (linesRef.current) {
      const mat = linesRef.current.material as THREE.LineBasicMaterial;
      const base = hovered !== null || grabbed !== null ? cfg.lineBase + 0.12 : cfg.lineBase;
      mat.opacity = base + Math.sin(t * 0.6) * 0.06;
    }
  });

  const handlePointerDown = (i: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setGrabbed(i);
    triggerPulse(i);
    registerInteraction();
    gl.domElement.setPointerCapture(e.pointerId);
    document.body.style.cursor = "grabbing";
  };

  return (
    <group ref={groupRef}>
      <lineSegments ref={linesRef}>
        <bufferGeometry ref={lineGeoRef}>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(0), 3]} count={0} />
        </bufferGeometry>
        <lineBasicMaterial
          color={theme.lineColor}
          transparent
          opacity={cfg.lineBase}
          blending={mode === "night" ? THREE.AdditiveBlending : THREE.NormalBlending}
        />
      </lineSegments>

      {nodesRef.current.map((_node, i) => (
        <group key={`${mode}-${i}`}>
          <mesh ref={(el) => { meshRefs.current[i] = el; }}>
            <sphereGeometry args={[1, mode === "day" ? 14 : 10, mode === "day" ? 14 : 10]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? theme.particleSecondary : theme.particlePrimary}
              emissive={i % 3 === 0 ? theme.particleSecondary : theme.particlePrimary}
              emissiveIntensity={cfg.emissiveNormal}
              transparent
              opacity={mode === "day" ? 0.95 : 0.9}
            />
          </mesh>
          <mesh
            visible={false}
            onPointerDown={handlePointerDown(i)}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHovered(i);
              document.body.style.cursor = "grab";
            }}
            onPointerOut={() => {
              setHovered(null);
              if (grabbed === null) document.body.style.cursor = "crosshair";
            }}
            onClick={(e) => {
              e.stopPropagation();
              triggerPulse(i);
            }}
            scale={isMobile ? 3.5 : 2.5}
          >
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
