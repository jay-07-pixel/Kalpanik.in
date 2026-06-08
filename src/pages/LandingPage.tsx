import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LivingScene } from "../components/scene/LivingScene";
import { ComingSoon } from "../components/ui/ComingSoon";
import { Logo } from "../components/ui/Logo";
import { ModeTransition } from "../components/ui/ModeTransition";
import { InteractionHint } from "../components/ui/InteractionHint";
import { EasterEggToast } from "../components/ui/EasterEggToast";
import { ImaginationCounter } from "../components/ui/ImaginationCounter";
import { CursorGlow } from "../components/ui/CursorGlow";
import { AdminLoginModal } from "../components/admin/AdminLoginModal";
import { useApp } from "../context/AppContext";
import { useSecretAdmin } from "../hooks/useSecretAdmin";
import { usePageTracking } from "../hooks/usePageTracking";
import { ADMIN_LOGIN_PATH } from "../constants/admin";

export function LandingPage() {
  const { theme } = useApp();
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);

  usePageTracking("/");

  const handleSecretUnlock = useSecretAdmin(() => setLoginOpen(true));

  return (
    <div
      className="app-shell"
      style={{
        color: theme.text,
        transition: "color 3s ease",
      }}
    >
      <LivingScene />
      <CursorGlow />
      <Logo onSecretClick={handleSecretUnlock} />
      <ModeTransition />
      <InteractionHint />
      <ImaginationCounter />
      <EasterEggToast />

      <main className="content-layer">
        <ComingSoon />
      </main>

      <AdminLoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => {
          setLoginOpen(false);
          navigate(ADMIN_LOGIN_PATH);
        }}
      />
    </div>
  );
}
