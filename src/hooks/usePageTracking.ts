import { useEffect, useRef } from "react";
import { analyticsApi } from "../constants/admin";
import { getVisitorId } from "../utils/visitorId";

export function usePageTracking(path = "/") {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const visitorId = getVisitorId();

    fetch(analyticsApi("/track"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId,
        path,
        referrer: document.referrer || null,
      }),
    }).catch(() => {
      // Silent fail — analytics must not affect UX
    });
  }, [path]);
}
