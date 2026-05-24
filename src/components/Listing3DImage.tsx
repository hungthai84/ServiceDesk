import React from "react";

interface Listing3DImageProps {
  type: "chair_orange" | "camera" | "boots" | "chair_red" | "pyramid" | "house_prism" | "car_blue" | "toy_green";
  className?: string;
  hover?: boolean;
}

export const Listing3DImage: React.FC<Listing3DImageProps> = ({ type, className = "w-48 h-48", hover = false }) => {
  const hoverClass = hover ? "scale-105 rotate-1 transition-all duration-300" : "transition-all duration-300";

  return (
    <div className={`relative flex items-center justify-center select-none overflow-visible ${className} ${hoverClass}`}>
      {/* Dynamic Ambient Backlight Glow */}
      <div className="absolute inset-0 rounded-full bg-radial from-white/30 to-transparent blur-xl pointer-events-none" />

      {type === "chair_orange" && (
        <svg viewBox="0 0 200 200" className="w-[85%] h-[85%] drop-shadow-xl animate-float">
          <defs>
            <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff7c54" />
              <stop offset="60%" stopColor="#ff5733" />
              <stop offset="100%" stopColor="#c73210" />
            </linearGradient>
            <linearGradient id="legGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d7ccc8" />
              <stop offset="100%" stopColor="#8d6e63" />
            </linearGradient>
          </defs>
          {/* Shadow */}
          <ellipse cx="100" cy="175" rx="55" ry="12" fill="rgba(80, 20, 0, 0.25)" filter="blur(4px)" />
          
          {/* Legs */}
          <line x1="100" y1="130" x2="65" y2="175" stroke="url(#legGrad)" strokeWidth="9" strokeLinecap="round" />
          <line x1="100" y1="130" x2="135" y2="175" stroke="url(#legGrad)" strokeWidth="9" strokeLinecap="round" />
          <line x1="100" y1="130" x2="100" y2="172" stroke="url(#legGrad)" strokeWidth="7" strokeLinecap="round" />
          
          {/* Wooden leg hubs */}
          <circle cx="100" cy="130" r="10" fill="#5d4037" />

          {/* Seat Cushion Inner Layer */}
          <path d="M55 105 C55 130, 145 130, 145 105 C145 92, 55 92, 55 105 Z" fill="url(#orangeGrad)" />
          
          {/* Rounded Backrest */}
          <path d="M 50 100 C 45 60, 155 60, 150 100 C 145 110, 55 110, 50 100 Z" fill="url(#orangeGrad)" />
          
          {/* Armrests Curved Overlay */}
          <path d="M 45 95 C 45 90, 70 82, 100 85 C 130 82, 155 90, 155 95 C 155 108, 145 112, 100 112 C 55 112, 45 108, 45 95 Z" fill="#ff8d6d" opacity="0.9" />
          <path d="M60 102 Q100 106 140 102" stroke="#ffbca7" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.4" />

          {/* Golden aesthetic button stitchings */}
          <circle cx="85" cy="80" r="5" fill="#fdd835" />
          <circle cx="115" cy="80" r="5" fill="#fdd835" />
        </svg>
      )}

      {type === "camera" && (
        <svg viewBox="0 0 200 200" className="w-[85%] h-[85%] drop-shadow-xl animate-float-slow">
          <defs>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#f3e5f5" />
              <stop offset="100%" stopColor="#cb9bcf" />
            </linearGradient>
            <linearGradient id="lensOuter" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#424242" />
              <stop offset="100%" stopColor="#1a1a1a" />
            </linearGradient>
            <linearGradient id="lensReflect" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00e5ff" />
              <stop offset="60%" stopColor="#006064" />
              <stop offset="100%" stopColor="#011a27" />
            </linearGradient>
          </defs>
          {/* Ground Shadow */}
          <ellipse cx="100" cy="170" rx="65" ry="10" fill="rgba(60, 30, 60, 0.2)" filter="blur(4px)" />

          {/* Camera Base Chassis */}
          <rect x="42" y="75" width="116" height="80" rx="16" fill="url(#bodyGrad)" />
          <rect x="42" y="75" width="116" height="24" rx="4" fill="#6d4c41" opacity="0.15" />

          {/* Grip Texture Pads */}
          <rect x="48" y="90" width="28" height="58" rx="6" fill="#4a148c" opacity="0.8" />
          <rect x="124" y="90" width="28" height="58" rx="6" fill="#4a148c" opacity="0.8" />

          {/* Metal Top Housing & Mode Dials */}
          <path d="M 52 75 L 148 75 L 140 60 L 60 60 Z" fill="#e0e0e0" stroke="#b0bec5" strokeWidth="1" />
          <rect x="65" y="52" width="16" height="8" rx="2" fill="#757575" />
          <rect x="115" y="48" width="22" height="12" rx="3" fill="#ff4081" />
          <ellipse cx="126" cy="48" rx="6" ry="3" fill="#ffffff" />

          {/* Big Glass Prime Lens */}
          <circle cx="100" cy="118" r="32" fill="url(#lensOuter)" stroke="#e0e0e0" strokeWidth="3" />
          <circle cx="100" cy="118" r="23" fill="url(#lensReflect)" />
          
          {/* Aperture blades & reflection glares */}
          <line x1="88" y1="106" x2="112" y2="130" stroke="#00e5ff" strokeWidth="1" opacity="0.5" />
          <path d="M 85 110 Q 100 100 115 110" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
          <circle cx="92" cy="110" r="3" fill="#ffffff" opacity="0.8" />

          {/* Red LED Status Dot */}
          <circle cx="58" cy="85" r="4" fill="#ff1744" />
        </svg>
      )}

      {type === "boots" && (
        <svg viewBox="0 0 200 200" className="w-[85%] h-[85%] drop-shadow-xl animate-float">
          <defs>
            <linearGradient id="bootGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#424242" />
              <stop offset="50%" stopColor="#212121" />
              <stop offset="100%" stopColor="#0d0d0d" />
            </linearGradient>
            <linearGradient id="accentTrim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00e5ff" />
              <stop offset="100%" stopColor="#2979ff" />
            </linearGradient>
          </defs>
          {/* Shadow */}
          <ellipse cx="105" cy="172" rx="60" ry="11" fill="rgba(0, 20, 40, 0.22)" filter="blur(4px)" />

          {/* Ankle sleeve and tongue */}
          <path d="M 75 55 C70 55, 68 70, 68 85 L 75 125 L 125 125 L 115 75 C115 65, 110 55, 95 55 Z" fill="url(#bootGrad)" />
          
          {/* Main Leather Shoe Body */}
          <path d="M 66 120 C 66 100, 92 90, 110 95 C 130 100, 158 115, 158 135 C 158 162, 125 162, 70 162 C 64 150, 66 130, 66 120 Z" fill="url(#bootGrad)" />

          {/* Sole (Heavy-duty combat tread) */}
          <path d="M 64 155 L 160 155 C164 155, 164 165, 160 165 L 64 165 C60 165, 60 155, 64 155 Z" fill="#131313" />
          <rect x="75" y="165" width="10" height="4" fill="#000" />
          <rect x="95" y="165" width="10" height="4" fill="#000" />
          <rect x="115" y="165" width="10" height="4" fill="#000" />
          <rect x="135" y="165" width="10" height="4" fill="#000" />

          {/* Neon Lacing & Eyelets */}
          <circle cx="82" cy="78" r="3" fill="url(#accentTrim)" />
          <circle cx="84" cy="94" r="3" fill="url(#accentTrim)" />
          <circle cx="88" cy="110" r="3" fill="url(#accentTrim)" />
          <circle cx="94" cy="126" r="3" fill="url(#accentTrim)" />

          <path d="M 82 78 L 102 85" stroke="#40c4ff" strokeWidth="2" opacity="0.8" />
          <path d="M 84 94 L 108 100" stroke="#40c4ff" strokeWidth="2" opacity="0.8" />
          <path d="M 88 110 L 114 116" stroke="#40c4ff" strokeWidth="2" opacity="0.8" />
          
          {/* Double Stitching outline lines */}
          <path d="M 68 135 C 80 120, 124 135, 148 142" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="3,3" fill="none" />
        </svg>
      )}

      {type === "chair_red" && (
        <svg viewBox="0 0 200 200" className="w-[85%] h-[85%] drop-shadow-xl animate-float-slow">
          <defs>
            <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff5252" />
              <stop offset="50%" stopColor="#ff1744" />
              <stop offset="100%" stopColor="#b71c1c" />
            </linearGradient>
            <linearGradient id="basePlate" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#cfd8dc" />
              <stop offset="100%" stopColor="#78909c" />
            </linearGradient>
          </defs>
          {/* Ground shadow */}
          <ellipse cx="100" cy="174" rx="55" ry="9" fill="rgba(100, 0, 10, 0.22)" filter="blur(4px)" />

          {/* Central Swivel Stand & Leg */}
          <line x1="100" y1="125" x2="100" y2="162" stroke="url(#basePlate)" strokeWidth="12" strokeLinecap="round" />
          <ellipse cx="100" cy="162" rx="35" ry="10" fill="url(#basePlate)" />
          <ellipse cx="100" cy="160" rx="20" ry="5" fill="#455a64" opacity="0.5" />

          {/* Organic Red Tulip Chair Scoop Body */}
          <path d="M 50 85 C 44 45, 156 45, 150 85 C 146 122, 132 138, 100 138 C 68 138, 54 122, 50 85 Z" fill="url(#redGrad)" />
          
          {/* Inside Shell Upholstery Glow */}
          <path d="M 58 90 C 58 126, 142 126, 142 90 C 142 78, 58 78, 58 90 Z" fill="#ff8a80" opacity="0.5" />
          
          {/* Specular curved gloss reflection high quality line */}
          <path d="M 56 68 C 68 55, 132 55, 144 68" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.32" />
        </svg>
      )}

      {type === "pyramid" && (
        <svg viewBox="0 0 200 200" className="w-[85%] h-[85%] drop-shadow-xl animate-float">
          <defs>
            <linearGradient id="pym1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(213, 0, 249, 0.85)" />
              <stop offset="100%" stopColor="rgba(74, 20, 140, 0.9)" />
            </linearGradient>
            <linearGradient id="pym2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(0, 229, 255, 0.8)" />
              <stop offset="100%" stopColor="rgba(0, 96, 100, 0.9)" />
            </linearGradient>
            <linearGradient id="pym3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 145, 0, 0.75)" />
              <stop offset="100%" stopColor="rgba(221, 44, 0, 0.85)" />
            </linearGradient>
          </defs>
          {/* Ground Prism shadow refraction */}
          <ellipse cx="100" cy="172" rx="45" ry="12" fill="rgba(124, 77, 255, 0.18)" filter="blur(3px)" />
          {/* Inner purple glow glow */}
          <polygon points="100,56 138,154 62,154" fill="rgba(255, 0, 128, 0.1)" blur="8" />

          {/* Left Slice of Prism */}
          <polygon points="100,42 60,152 100,165" fill="url(#pym1)" />
          
          {/* Right Slice of Prism */}
          <polygon points="100,42 100,165 140,152" fill="url(#pym2)" />

          {/* Floating layered ring */}
          <ellipse cx="100" cy="115" rx="55" ry="14" fill="none" stroke="url(#pym3)" strokeWidth="8" opacity="0.75" transform="rotate(-15, 100, 115)" />
          
          {/* Specular high points */}
          <line x1="100" y1="42" x2="100" y2="165" stroke="#ffffff" strokeWidth="2" opacity="0.6" />
          <circle cx="100" cy="42" r="4" fill="#ffffff" />
        </svg>
      )}

      {type === "house_prism" && (
        <svg viewBox="0 0 200 200" className="w-[85%] h-[85%] drop-shadow-xl animate-float-slow">
          <defs>
            <linearGradient id="cyberGlass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#80deea" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#006064" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <ellipse cx="100" cy="170" rx="60" ry="10" fill="rgba(0, 172, 193, 0.2)" filter="blur(4px)" />

          {/* Architectural structural platform base */}
          <polygon points="45,150 100,172 155,150 100,128" fill="#e0f7fa" stroke="#00acc1" strokeWidth="2" />
          <polygon points="45,150 100,172 100,180 45,158" fill="#b2ebf2" />
          <polygon points="155,150 100,172 100,180 155,158" fill="#80deea" />

          {/* Central Dome Structures */}
          <path d="M 60 135 C 60 85, 140 85, 140 135 Z" fill="url(#cyberGlass)" stroke="#ffffff" strokeWidth="1.5" />
          
          {/* Space geodesic grid struts */}
          <path d="M 100 90 L 100 135" stroke="#e0f7fa" strokeWidth="1" strokeDasharray="1,2" />
          <path d="M 68 112 Q 100 120 132 112" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.5" />
          <path d="M 60 135 L 140 135" stroke="#ffffff" strokeWidth="2" />

          {/* Stylized trees/plants in eco dome */}
          <circle cx="90" cy="130" r="8" fill="#00e676" opacity="0.7" />
          <circle cx="112" cy="126" r="10" fill="#00e676" opacity="0.7" />
        </svg>
      )}

      {type === "car_blue" && (
        <svg viewBox="0 0 200 200" className="w-[85%] h-[85%] drop-shadow-xl animate-float">
          <defs>
            <linearGradient id="bodyBlue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4fc3f7" />
              <stop offset="50%" stopColor="#0288d1" />
              <stop offset="100%" stopColor="#01579b" />
            </linearGradient>
            <linearGradient id="metalChrome" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#b0bec5" />
              <stop offset="100%" stopColor="#37474f" />
            </linearGradient>
          </defs>
          <ellipse cx="100" cy="168" rx="60" ry="8" fill="rgba(1, 87, 155, 0.18)" filter="blur(3px)" />

          {/* Wheels background (back tires) */}
          <circle cx="68" cy="148" r="18" fill="#212121" />
          <circle cx="132" cy="148" r="18" fill="#212121" />
          <circle cx="68" cy="148" r="9" fill="#cfd8dc" stroke="#90a4ae" strokeWidth="2" />
          <circle cx="132" cy="148" r="9" fill="#cfd8dc" stroke="#90a4ae" strokeWidth="2" />

          {/* Sleek retro car frame */}
          <path d="M 45 136 C 45 110, 60 102, 100 102 C 140 102, 155 110, 155 136 L 150 148 L 50 148 Z" fill="url(#bodyBlue)" />

          {/* Seat details */}
          <path d="M 70 102 C 70 85, 95 85, 95 102 Z" fill="#ffffff" stroke="#b0bec5" strokeWidth="2" />

          {/* Chrome Steering wheel stem */}
          <line x1="112" y1="102" x2="124" y2="82" stroke="url(#metalChrome)" strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="124" cy="80" rx="14" ry="6" fill="none" stroke="#263238" strokeWidth="4" transform="rotate(-20, 124, 80)" />

          {/* Yellow glossy round headlight */}
          <circle cx="54" cy="120" r="8" fill="#ffd54f" stroke="#ffb300" strokeWidth="1" />
          <circle cx="52" cy="118" r="3" fill="#ffffff" />
        </svg>
      )}

      {type === "toy_green" && (
        <svg viewBox="0 0 200 200" className="w-[85%] h-[85%] drop-shadow-xl animate-float-slow">
          <defs>
            <linearGradient id="mintGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a7ffeb" />
              <stop offset="60%" stopColor="#1de9b6" />
              <stop offset="100%" stopColor="#00bfa5" />
            </linearGradient>
            <linearGradient id="stepsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffecb3" />
              <stop offset="100%" stopColor="#ffe082" />
            </linearGradient>
          </defs>
          <ellipse cx="100" cy="172" rx="55" ry="9" fill="rgba(0, 150, 136, 0.18)" filter="blur(3px)" />

          {/* Mint green modern structural slide */}
          <path d="M 55 90 C 72 90, 85 105, 95 125 C 105 145, 122 156, 145 156 C 150 156, 155 152, 155 146 C 155 134, 135 126, 125 105 C 115 84, 98 72, 80 72 Z" fill="url(#mintGrad)" />
          
          {/* Aesthetic railings */}
          <path d="M 52 90 Q 75 90 95 110" fill="none" stroke="#00acc1" strokeWidth="3" opacity="0.6" />

          {/* Supporting stairs */}
          <rect x="52" y="90" width="12" height="66" fill="url(#stepsGrad)" rx="2" stroke="#ffb300" strokeWidth="1" />
          <line x1="52" y1="102" x2="64" y2="102" stroke="#ffb300" strokeWidth="2" />
          <line x1="52" y1="114" x2="64" y2="114" stroke="#ffb300" strokeWidth="2" />
          <line x1="52" y1="126" x2="64" y2="126" stroke="#ffb300" strokeWidth="2" />
          <line x1="52" y1="138" x2="64" y2="138" stroke="#ffb300" strokeWidth="2" />
          <line x1="52" y1="150" x2="64" y2="150" stroke="#ffb300" strokeWidth="2" />
        </svg>
      )}
    </div>
  );
};
