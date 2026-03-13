"use client";

import { useState, useEffect } from "react";

interface EtaTimerProps {
  etaMinutes: number;
  etaUpdatedAt: string;
}

export function EtaTimer({ etaMinutes, etaUpdatedAt }: EtaTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const elapsed = (Date.now() - new Date(etaUpdatedAt).getTime()) / 1000;
    return Math.max(0, etaMinutes * 60 - elapsed);
  });

  useEffect(() => {
    const elapsed = (Date.now() - new Date(etaUpdatedAt).getTime()) / 1000;
    const initial = Math.max(0, etaMinutes * 60 - elapsed);
    setSecondsLeft(initial);

    if (initial <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [etaMinutes, etaUpdatedAt]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = Math.floor(secondsLeft % 60);
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const isExpired = secondsLeft === 0;

  return (
    <span
      className={[
        "flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium tabular-nums",
        isExpired
          ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      ].join(" ")}
    >
      ⏱ {display}
    </span>
  );
}
