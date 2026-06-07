export function getTimeGreeting(mode: "day" | "night"): string {
  const hour = new Date().getHours();

  if (mode === "night") {
    if (hour >= 22 || hour < 5) return "Ideas run deeper after dark";
    return "Night mode — intelligence activated";
  }

  if (hour < 12) return "Good morning, dreamer";
  if (hour < 17) return "Good afternoon, innovator";
  return "Good evening, creator";
}
