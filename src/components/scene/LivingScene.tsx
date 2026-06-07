import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { EnergyParticles } from "./EnergyParticles";
import { OrbitingSpheres } from "./OrbitingSpheres";
import { AuroraWave } from "./AuroraWave";
import { LightRays } from "./LightRays";
import { FloatingGeometry } from "./FloatingGeometry";
import { EnergyWave } from "./EnergyWave";
import { InteractiveNetwork } from "./InteractiveNetwork";
import { CameraController } from "./CameraController";
import { useApp } from "../../context/AppContext";
import { useIsMobile } from "../../hooks/useMediaQuery";

function SceneContent() {
  const { mode, theme, mouse } = useApp();
  const isMobile = useIsMobile();
  const isNight = mode === "night";

  return (
    <>
      <color attach="background" args={[theme.bg]} />
      <fog attach="fog" args={[theme.fogColor, 15, 35]} />

      <ambientLight intensity={theme.ambientIntensity} />
      <pointLight
        position={[5, 5, 5]}
        intensity={isNight ? 0.5 : 1.2}
        color={theme.pointLightColor}
      />
      <pointLight
        position={[-5, -3, 3]}
        intensity={isNight ? 1.0 : 0.6}
        color={theme.particleSecondary}
      />
      {isNight && (
        <pointLight position={[0, 0, 2]} intensity={0.4} color={theme.accentSoft} distance={20} />
      )}

      <CameraController />

      <InteractiveNetwork
        key={`${mode}-${isMobile}`}
        theme={theme}
        mouseX={mouse.normalizedX}
        mouseY={mouse.normalizedY}
        mode={mode}
        isMobile={isMobile}
      />

      <EnergyParticles
        theme={theme}
        mouseX={mouse.normalizedX}
        mouseY={mouse.normalizedY}
        mode={mode}
        count={isMobile ? (isNight ? 500 : 350) : isNight ? 1200 : 800}
      />
      {!isMobile && (
        <>
          <OrbitingSpheres
            theme={theme}
            mouseX={mouse.normalizedX}
            mouseY={mouse.normalizedY}
            mode={mode}
          />
          <FloatingGeometry
            theme={theme}
            mouseX={mouse.normalizedX}
            mouseY={mouse.normalizedY}
            mode={mode}
          />
        </>
      )}

      {isNight ? (
        <>
          {!isMobile && <AuroraWave theme={theme} mode={mode} />}
          <Stars
            radius={80}
            depth={40}
            count={isMobile ? 2000 : 5000}
            factor={4}
            saturation={0.15}
            fade
            speed={0.3}
          />
        </>
      ) : (
        !isMobile && (
          <>
            <LightRays theme={theme} mode={mode} />
            <EnergyWave theme={theme} mode={mode} />
          </>
        )
      )}
    </>
  );
}

export function LivingScene() {
  const { theme } = useApp();
  const isMobile = useIsMobile();

  return (
    <div className="scene-layer scene-layer--interactive">
      <Canvas
        camera={{ position: [0, 0, 12], fov: isMobile ? 68 : 60 }}
        dpr={isMobile ? 1 : [1, 2]}
        gl={{ antialias: !isMobile, alpha: false, powerPreference: isMobile ? "low-power" : "high-performance" }}
        style={{
          width: "100%",
          height: "100%",
          background: theme.bg,
          transition: "background 3s ease",
          touchAction: "none",
        }}
        onPointerMissed={() => {
          document.body.style.cursor = "default";
        }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
