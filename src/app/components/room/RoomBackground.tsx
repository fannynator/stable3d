export function RoomBackground() {
  return (
    <svg
      viewBox="0 0 400 700"
      className="absolute inset-0 w-full h-full opacity-80"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0a3e" />
          <stop offset="60%" stopColor="#2d1566" />
          <stop offset="100%" stopColor="#3a1d70" />
        </linearGradient>
        <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6b4526" />
          <stop offset="40%" stopColor="#7a5230" />
          <stop offset="100%" stopColor="#5a3a1a" />
        </linearGradient>
        <linearGradient id="floorShine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <linearGradient id="bedGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a3080" />
          <stop offset="100%" stopColor="#362060" />
        </linearGradient>
        <linearGradient id="blanketGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6a4fc0" />
          <stop offset="100%" stopColor="#5535a0" />
        </linearGradient>
        <radialGradient id="lampGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(255,220,150,0.4)" />
          <stop offset="60%" stopColor="rgba(255,200,100,0.15)" />
          <stop offset="100%" stopColor="rgba(255,200,100,0)" />
        </radialGradient>
        <radialGradient id="windowGlow" cx="0.5" cy="0.3" r="0.6">
          <stop offset="0%" stopColor="rgba(100,120,200,0.3)" />
          <stop offset="100%" stopColor="rgba(60,60,120,0.05)" />
        </radialGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.3)" />
        </filter>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Back wall */}
      <rect x="0" y="0" width="400" height="380" fill="url(#wallGrad)" />

      {/* Wall texture lines */}
      <g opacity="0.03">
        {Array.from({ length: 20 }, (_, i) => (
          <line key={`hl${i}`} x1="0" y1={i * 20} x2="400" y2={i * 20} stroke="white" strokeWidth="0.5" />
        ))}
      </g>

      {/* Floor */}
      <rect x="0" y="380" width="400" height="320" fill="url(#floorGrad)" />

      {/* Floor shine */}
      <rect x="0" y="380" width="400" height="80" fill="url(#floorShine)" />

      {/* Floor planks */}
      <g opacity="0.15" stroke="#4a2a10" strokeWidth="0.8">
        <line x1="0" y1="420" x2="400" y2="420" />
        <line x1="0" y1="460" x2="400" y2="460" />
        <line x1="0" y1="500" x2="400" y2="500" />
        <line x1="0" y1="540" x2="400" y2="540" />
        <line x1="0" y1="580" x2="400" y2="580" />
        <line x1="0" y1="620" x2="400" y2="620" />
        <line x1="0" y1="660" x2="400" y2="660" />
      </g>

      {/* Floor plank seams (vertical) */}
      <g opacity="0.08" stroke="#4a2a10" strokeWidth="0.5">
        <line x1="80" y1="380" x2="80" y2="700" />
        <line x1="200" y1="380" x2="200" y2="700" />
        <line x1="320" y1="380" x2="320" y2="700" />
      </g>

      {/* Wall-floor border */}
      <rect x="0" y="376" width="400" height="8" fill="#3a1d70" />
      <rect x="0" y="374" width="400" height="3" fill="rgba(255,255,255,0.05)" />

      {/* Window */}
      <g filter="url(#softGlow)">
        <rect x="130" y="40" width="140" height="160" rx="8" fill="#1a2050" stroke="#4a3080" strokeWidth="3" />
        <rect x="138" y="48" width="55" height="70" rx="2" fill="url(#windowGlow)" />
        <rect x="198" y="48" width="55" height="70" rx="2" fill="url(#windowGlow)" />
        <rect x="138" y="122" width="55" height="70" rx="2" fill="url(#windowGlow)" />
        <rect x="198" y="122" width="55" height="70" rx="2" fill="url(#windowGlow)" />
        {/* Window frame */}
        <line x1="200" y1="48" x2="200" y2="192" stroke="#4a3080" strokeWidth="3" />
        <line x1="138" y1="120" x2="262" y2="120" stroke="#4a3080" strokeWidth="3" />
        {/* Stars through window */}
        <circle cx="155" cy="65" r="1.5" fill="rgba(255,255,200,0.7)" />
        <circle cx="180" cy="80" r="1" fill="rgba(255,255,200,0.5)" />
        <circle cx="220" cy="60" r="1.2" fill="rgba(255,255,200,0.6)" />
        <circle cx="245" cy="85" r="1" fill="rgba(255,255,200,0.4)" />
        <circle cx="165" cy="150" r="1.5" fill="rgba(255,255,200,0.5)" />
        <circle cx="235" cy="145" r="1.2" fill="rgba(255,255,200,0.6)" />
      </g>

      {/* Curtains */}
      <path d="M115 30 Q125 120, 130 200 L130 30 Z" fill="#5530a0" opacity="0.7" />
      <path d="M285 30 Q275 120, 270 200 L270 30 Z" fill="#5530a0" opacity="0.7" />
      <path d="M120 30 Q128 80, 130 130 L130 30 Z" fill="#6a40c0" opacity="0.5" />
      <path d="M280 30 Q272 80, 270 130 L270 30 Z" fill="#6a40c0" opacity="0.5" />

      {/* Curtain rod */}
      <line x1="110" y1="32" x2="290" y2="32" stroke="#8a6040" strokeWidth="3" strokeLinecap="round" />
      <circle cx="110" cy="32" r="4" fill="#9a7050" />
      <circle cx="290" cy="32" r="4" fill="#9a7050" />

      {/* Shelf on left wall */}
      <rect x="20" y="140" width="80" height="6" rx="2" fill="#7a5a30" filter="url(#shadow)" />
      <rect x="22" y="146" width="3" height="20" fill="#6a4a20" />
      <rect x="95" y="146" width="3" height="20" fill="#6a4a20" />

      {/* Books on shelf */}
      <rect x="30" y="118" width="10" height="22" rx="1" fill="#e06050" />
      <rect x="42" y="120" width="8" height="20" rx="1" fill="#50a0e0" />
      <rect x="52" y="116" width="11" height="24" rx="1" fill="#e0a040" />
      <rect x="65" y="119" width="9" height="21" rx="1" fill="#60c060" />
      <rect x="76" y="117" width="10" height="23" rx="1" fill="#c060c0" />

      {/* Lamp on wall (left) */}
      <g>
        <rect x="35" y="210" width="4" height="40" rx="2" fill="#6a4a20" />
        <ellipse cx="37" cy="210" rx="18" ry="12" fill="#f0d070" opacity="0.9" />
        <ellipse cx="37" cy="210" rx="18" ry="12" fill="url(#lampGlow)" />
        <ellipse cx="37" cy="208" rx="14" ry="8" fill="#ffe890" />
        <circle cx="37" cy="210" r="40" fill="url(#lampGlow)" opacity="0.5" />
      </g>

      {/* String lights across top */}
      <g opacity="0.9">
        <path d="M20 50 Q100 70, 200 55 Q300 40, 380 60" fill="none" stroke="#8a6a30" strokeWidth="1.5" />
        {[40, 90, 140, 190, 240, 290, 340].map((x, i) => {
          const y = i < 3 ? 52 + i * 3 : 55 - (i - 3) * 4;
          return (
            <g key={`light${i}`}>
              <circle cx={x} cy={y} r="5" fill={i % 2 === 0 ? "#ffe060" : "#ff9050"} opacity="0.8" />
              <circle cx={x} cy={y} r="12" fill={i % 2 === 0 ? "rgba(255,224,96,0.15)" : "rgba(255,144,80,0.12)"} />
            </g>
          );
        })}
      </g>

      {/* Bed frame (left side) */}
      <g filter="url(#shadow)">
        {/* Bed base */}
        <rect x="30" y="330" width="150" height="15" rx="4" fill="#5a3a1a" />
        {/* Mattress */}
        <rect x="35" y="300" width="140" height="35" rx="8" fill="#e8e0d0" />
        {/* Pillow */}
        <ellipse cx="60" cy="305" rx="25" ry="12" fill="white" opacity="0.9" />
        <ellipse cx="60" cy="305" rx="22" ry="10" fill="#f5f0e8" />
        {/* Blanket */}
        <rect x="65" y="310" width="105" height="22" rx="6" fill="url(#blanketGrad)" />
        {/* Headboard */}
        <rect x="25" y="270" width="8" height="75" rx="3" fill="#5a3a1a" />
        <rect x="25" y="265" width="30" height="10" rx="4" fill="#6a4a2a" />
      </g>

      {/* Plant (right side) */}
      <g>
        <rect x="340" y="345" width="25" height="30" rx="3" fill="#8a5a30" />
        <rect x="343" y="340" width="19" height="8" rx="2" fill="#9a6a40" />
        <ellipse cx="352" cy="335" rx="18" ry="14" fill="#3a8a3a" />
        <ellipse cx="345" cy="328" rx="12" ry="10" fill="#4a9a4a" />
        <ellipse cx="358" cy="325" rx="10" ry="8" fill="#2a7a2a" />
        <ellipse cx="352" cy="320" rx="8" ry="6" fill="#5aaa5a" />
      </g>

      {/* Computer desk (right side) */}
      <g filter="url(#shadow)">
        <rect x="310" y="260" width="80" height="6" rx="2" fill="#6a4a20" />
        <rect x="315" y="266" width="4" height="90" fill="#5a3a15" />
        <rect x="382" y="266" width="4" height="90" fill="#5a3a15" />
        {/* Monitor */}
        <rect x="325" y="220" width="50" height="35" rx="3" fill="#222" stroke="#444" strokeWidth="1" />
        <rect x="328" y="223" width="44" height="28" rx="1" fill="#1a2a5a" />
        <rect x="345" y="255" width="10" height="5" fill="#333" />
        {/* Screen glow */}
        <circle cx="350" cy="237" r="15" fill="rgba(100,150,255,0.08)" />
      </g>

      {/* Cat shadow on floor */}
      <ellipse cx="200" cy="590" rx="30" ry="5" fill="rgba(0,0,0,0.15)" />

      {/* Subtle vignette */}
      <rect x="0" y="0" width="400" height="700" fill="url(#vignetteGrad)" opacity="0.3" />
    </svg>
  );
}
