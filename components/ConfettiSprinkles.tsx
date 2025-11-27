"use client";
import React from "react";

export default function ConfettiSprinkles() {
  const pieces = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 6 + Math.random() * 8,
    delay: Math.random() * 5,
    color: [
      "#FF3B30", "#FF9500", "#FFCC00",
      "#4CD964", "#5AC8FA", "#007AFF", "#5856D6"
    ][Math.floor(Math.random() * 7)]
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map(p => (
        <span
          key={p.id}
          className="confetti-loop"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`
          }}
        />
      ))}
    </div>
  );
}
