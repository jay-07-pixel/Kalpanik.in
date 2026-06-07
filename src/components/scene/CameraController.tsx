import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useApp } from "../../context/AppContext";

export function CameraController() {
  const { mouse, scroll } = useApp();
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 12));

  useFrame(() => {
    targetPos.current.set(
      mouse.normalizedX * 1.5,
      mouse.normalizedY * 0.8 + scroll.scrollProgress * -2,
      12 - scroll.scrollProgress * 3
    );
    camera.position.lerp(targetPos.current, 0.03);
    camera.lookAt(0, scroll.scrollProgress * -1, 0);
  });

  return null;
}
