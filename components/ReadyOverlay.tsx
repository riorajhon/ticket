"use client";

import { useEffect, useState } from "react";

type Props = {
  seconds: number;
  matchName: string;
};

export function ReadyOverlay({ seconds, matchName }: Props) {
  const [pulseKey, setPulseKey] = useState(0);
  const [showGo, setShowGo] = useState(false);

  useEffect(() => {
    setPulseKey((k) => k + 1);
  }, [seconds]);

  useEffect(() => {
    if (seconds !== 0) return;
    setShowGo(true);
    const timer = window.setTimeout(() => setShowGo(false), 900);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  if (seconds <= 0 && !showGo) return null;

  return (
    <div className="ready-overlay" role="dialog" aria-live="assertive">
      <div className="ready-overlay-bg" />
      <div className="ready-particles" aria-hidden="true">
        <span className="ready-float f1">⚽</span>
        <span className="ready-float f2">🏐</span>
        <span className="ready-float f3">🧤</span>
        <span className="ready-float f4">🎫</span>
        <span className="ready-float f5">⚽</span>
        <span className="ready-float f6">🏐</span>
      </div>

      <div className="ready-content">
        <p className="ready-label">Get ready</p>
        <p className="ready-match">{matchName}</p>

        {showGo && seconds <= 0 ? (
          <div className="ready-go" key="go">
            GO!
          </div>
        ) : (
          <div className="ready-ring" key={pulseKey}>
            <div className="ready-ring-spin" />
            <div className="ready-number">{seconds}</div>
          </div>
        )}

        <p className="ready-hint">
          {showGo && seconds <= 0
            ? "Pick your ticket now"
            : "Tickets open when the timer hits 0"}
        </p>
      </div>
    </div>
  );
}
