"use client";

import { useEffect, useState, useCallback } from "react";

type Politeness = "polite" | "assertive" | "off";

interface AnnounceProps {
  message: string;
  politeness?: Politeness;
  clearOnUnmount?: boolean;
}

export function Announce({
  message,
  politeness = "polite",
  clearOnUnmount = true,
}: AnnounceProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// Hook for programmatic announcements
export function useAnnounce() {
  const [announcement, setAnnouncement] = useState<{
    message: string;
    politeness: Politeness;
  } | null>(null);

  const announce = useCallback(
    (message: string, politeness: Politeness = "polite") => {
      // Clear first to ensure re-announcement of same message
      setAnnouncement(null);
      requestAnimationFrame(() => {
        setAnnouncement({ message, politeness });
      });
    },
    []
  );

  const clear = useCallback(() => {
    setAnnouncement(null);
  }, []);

  const Announcer = useCallback(() => {
    if (!announcement) return null;
    return (
      <Announce
        message={announcement.message}
        politeness={announcement.politeness}
      />
    );
  }, [announcement]);

  return { announce, clear, Announcer };
}

// Global announcer component
let globalAnnounce: ((message: string, politeness?: Politeness) => void) | null =
  null;

export function GlobalAnnouncer() {
  const { announce, Announcer } = useAnnounce();

  useEffect(() => {
    globalAnnounce = announce;
    return () => {
      globalAnnounce = null;
    };
  }, [announce]);

  return <Announcer />;
}

export function announceToScreenReader(
  message: string,
  politeness: Politeness = "polite"
) {
  if (globalAnnounce) {
    globalAnnounce(message, politeness);
  }
}
