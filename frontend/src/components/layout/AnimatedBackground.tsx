import React from "react";

export function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#090710]"
    >
      {/* Orb 1: Electric Violet / Indigo (Top-Left) */}
      <div className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] rounded-full bg-gradient-to-br from-[#7c3aed]/45 via-[#4f46e5]/35 to-transparent blur-[120px] animate-orb-1" />

      {/* Orb 2: Vivid Cyan / Teal / Sky (Top-Right) */}
      <div className="absolute top-[10%] -right-[15%] w-[50vw] h-[50vw] max-w-[650px] max-h-[650px] rounded-full bg-gradient-to-bl from-[#06b6d4]/35 via-[#3b82f6]/25 to-transparent blur-[130px] animate-orb-2" />

      {/* Orb 3: Hot Magenta / Fuchsia / Violet (Bottom-Left) */}
      <div className="absolute -bottom-[15%] left-[8%] w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] rounded-full bg-gradient-to-tr from-[#d946ef]/30 via-[#8b5cf6]/35 to-transparent blur-[130px] animate-orb-3" />

      {/* Orb 4: Deep Cosmic Purple / Indigo (Bottom-Right) */}
      <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] max-w-[750px] max-h-[750px] rounded-full bg-gradient-to-tl from-[#6366f1]/30 via-[#2e1065]/45 to-transparent blur-[140px] animate-orb-4" />

      {/* Center Subtle Vignette / Contrast Balancer */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(9,7,16,0.5)_85%)]" />

      {/* Subtle Noise / Film-Grain Texture Overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.038] mix-blend-overlay pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="rag-bg-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#rag-bg-noise)" />
      </svg>
    </div>
  );
}
