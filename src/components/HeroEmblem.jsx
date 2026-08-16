function HeroEmblem() {
  return (
    <svg width="100%" viewBox="0 0 400 400" role="img" aria-label="AgroVault emblem" className="hero-emblem">
      <defs>
        <linearGradient id="leafGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#74C69D" />
          <stop offset="100%" stopColor="#2D6A4F" />
        </linearGradient>
      </defs>

      <g transform="translate(200,200)">
        <circle r="150" fill="none" stroke="#DCE5DC" strokeWidth="1" />
        <g className="emblem-ring">
          <circle r="120" fill="none" stroke="#52B788" strokeWidth="1" strokeDasharray="2 7" opacity="0.6" />
        </g>

        <g className="emblem-seeds">
          <circle cx="0" cy="-150" r="4" fill="#C9973A" />
          <circle cx="106" cy="-106" r="3.5" fill="#C9973A" style={{ animationDelay: "0.4s" }} />
          <circle cx="150" cy="0" r="4" fill="#C9973A" style={{ animationDelay: "0.8s" }} />
          <circle cx="106" cy="106" r="3.5" fill="#C9973A" style={{ animationDelay: "1.2s" }} />
          <circle cx="0" cy="150" r="4" fill="#C9973A" style={{ animationDelay: "1.6s" }} />
          <circle cx="-106" cy="106" r="3.5" fill="#C9973A" style={{ animationDelay: "2s" }} />
          <circle cx="-150" cy="0" r="4" fill="#C9973A" style={{ animationDelay: "2.4s" }} />
          <circle cx="-106" cy="-106" r="3.5" fill="#C9973A" style={{ animationDelay: "2.8s" }} />
        </g>

        <circle r="95" fill="#F7F9F5" stroke="#2D6A4F" strokeWidth="3" />

        <g className="emblem-leaf">
          <circle r="5" fill="#2D6A4F" />
          <line x1="0" y1="0" x2="0" y2="-70" stroke="#2D6A4F" strokeWidth="2.5" />
          <path d="M0,-70 C -42,-74 -54,-32 -19,-12 C -8,-35 -4,-55 0,-70 Z" fill="url(#leafGrad)" />
          <path d="M0,-70 C 42,-68 52,-24 17,-6 C 6,-33 2,-53 0,-70 Z" fill="url(#leafGrad)" opacity="0.9" />
          <path d="M0,-70 C -22,-82 -15,-105 4,-108 C 12,-90 8,-78 0,-70 Z" fill="url(#leafGrad)" opacity="0.95" />
        </g>

        <rect x="-38" y="16" width="76" height="48" rx="7" fill="none" stroke="#2D6A4F" strokeWidth="2" />
        <path d="M-38,16 C -17,-4 17,-4 38,16" fill="none" stroke="#2D6A4F" strokeWidth="2" />
        <circle cx="0" cy="40" r="5" fill="none" stroke="#C9973A" strokeWidth="2.5" />
        <line x1="0" y1="45" x2="0" y2="53" stroke="#C9973A" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export default HeroEmblem;