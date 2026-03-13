"use client";

import { useState, useEffect } from "react";

interface EtaTimerProps {
  etaMinutes: number;
  etaUpdatedAt: string;
  paused?: boolean;
}

export function EtaTimer({ etaMinutes, etaUpdatedAt, paused = false }: EtaTimerProps) {
  const [secondsElapsed, setSecondsElapsed] = useState<number>(() => {
    return (Date.now() - new Date(etaUpdatedAt).getTime()) / 1000;
  });

  useEffect(() => {
    if (paused) return;

    setSecondsElapsed((Date.now() - new Date(etaUpdatedAt).getTime()) / 1000);

    const interval = setInterval(() => {
      setSecondsElapsed((Date.now() - new Date(etaUpdatedAt).getTime()) / 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, [etaMinutes, etaUpdatedAt, paused]);

  const secondsLeft = etaMinutes * 60 - secondsElapsed;
  const isOverdue = secondsLeft < 0;
  const abs = Math.abs(secondsLeft);
  const mins = Math.floor(abs / 60);
  const secs = Math.floor(abs % 60);
  const display = `${isOverdue ? "-" : ""}${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <span className="flex items-center gap-1.5 text-xs font-medium tabular-nums">
      <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        {etaMinutes} min
      </span>
      <span className="text-zinc-400">→</span>
      <span
        className={[
          "rounded-md px-2 py-0.5",
          isOverdue
            ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        ].join(" ")}
      >
        ⏱ {display}
      </span>
    </span>
  );
}
