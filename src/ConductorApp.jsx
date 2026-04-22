import { useState, useRef, useEffect } from "react"
import { db } from "./firebase"
import { doc, setDoc } from "firebase/firestore"

const routes = [
  "Route : Vzm Complex to Vizag Complex",
  "Route : Vizag Complex to Vzm Complex"
]

const busNumbers = [
  "111", "222", "211", "411"
]

// GPS coordinates of each stop
const stopCoords = {
  "Vzm Complex": { lat: 18.1135, lng: 83.4116 },
  "Vizag Complex": { lat: 17.7214, lng: 83.3087 }
}

function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function getDestination(route) {
  const parts = route.split("to")
  if (parts.length >= 2) return parts[1].trim()
  return null
}

// ─── TIME-OF-DAY THEME SYSTEM ───
// Returns: "morning" | "afternoon" | "sunset" | "night"
function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return "morning"
  if (hour >= 12 && hour < 17) return "afternoon"
  if (hour >= 17 && hour < 20) return "sunset"
  return "night"
}

const themes = {
  morning: {
    pageBg: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 40%, #7dd3fc 100%)",
    cardBg: "rgba(255,255,255,0.65)",
    cardBorder: "rgba(255,255,255,0.8)",
    cardShadow: "0 25px 80px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)",
    textColor: "#1e293b",
    subtitleColor: "rgba(30,41,59,0.5)",
    labelColor: "rgba(30,41,59,0.6)",
    selectBg: "rgba(0,0,0,0.05)",
    selectBorder: "rgba(0,0,0,0.12)",
    selectColor: "#1e293b",
    optionBg: "#f0f9ff",
    skyGradient: "linear-gradient(180deg, #7dd3fc 0%, #bae6fd 40%, #e0f7fa 100%)",
    roadColor: "#9ca3af",
    roadBorder: "#d1d5db",
    laneColor: "#fbbf24",
    particleBg: "rgba(59,130,246,0.08)",
    footerColor: "rgba(30,41,59,0.2)",
    celestial: "sun",
    coordsBg: "rgba(0,0,0,0.06)",
    coordsColor: "rgba(30,41,59,0.5)",
    activeBg: "rgba(34,197,94,0.1)",
    activeBorder: "rgba(34,197,94,0.3)",
    statBg: "rgba(0,0,0,0.04)",
    sendingColor: "rgba(30,41,59,0.5)",
  },
  afternoon: {
    pageBg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 40%, #fbbf24 100%)",
    cardBg: "rgba(255,255,255,0.6)",
    cardBorder: "rgba(255,255,255,0.7)",
    cardShadow: "0 25px 80px rgba(120,80,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9)",
    textColor: "#78350f",
    subtitleColor: "rgba(120,53,15,0.5)",
    labelColor: "rgba(120,53,15,0.6)",
    selectBg: "rgba(0,0,0,0.05)",
    selectBorder: "rgba(120,53,15,0.15)",
    selectColor: "#78350f",
    optionBg: "#fffbeb",
    skyGradient: "linear-gradient(180deg, #93c5fd 0%, #bfdbfe 30%, #fef3c7 100%)",
    roadColor: "#a8a29e",
    roadBorder: "#d6d3d1",
    laneColor: "#fbbf24",
    particleBg: "rgba(251,191,36,0.1)",
    footerColor: "rgba(120,53,15,0.2)",
    celestial: "sun-hot",
    coordsBg: "rgba(0,0,0,0.06)",
    coordsColor: "rgba(120,53,15,0.5)",
    activeBg: "rgba(34,197,94,0.1)",
    activeBorder: "rgba(34,197,94,0.3)",
    statBg: "rgba(0,0,0,0.04)",
    sendingColor: "rgba(120,53,15,0.5)",
  },
  sunset: {
    pageBg: "linear-gradient(135deg, #1e1b4b 0%, #581c87 30%, #f97316 70%, #fbbf24 100%)",
    cardBg: "rgba(30,20,60,0.65)",
    cardBorder: "rgba(255,255,255,0.1)",
    cardShadow: "0 25px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
    textColor: "white",
    subtitleColor: "rgba(255,255,255,0.45)",
    labelColor: "rgba(255,255,255,0.6)",
    selectBg: "rgba(255,255,255,0.08)",
    selectBorder: "rgba(255,255,255,0.15)",
    selectColor: "white",
    optionBg: "#1e1b4b",
    skyGradient: "linear-gradient(180deg, #312e81 0%, #7c3aed 25%, #f97316 60%, #fbbf24 100%)",
    roadColor: "#44403c",
    roadBorder: "#78716c",
    laneColor: "#fbbf24",
    particleBg: "rgba(249,115,22,0.12)",
    footerColor: "rgba(255,255,255,0.15)",
    celestial: "sun-setting",
    coordsBg: "rgba(0,0,0,0.25)",
    coordsColor: "rgba(255,255,255,0.4)",
    activeBg: "rgba(34,197,94,0.12)",
    activeBorder: "rgba(34,197,94,0.35)",
    statBg: "rgba(255,255,255,0.06)",
    sendingColor: "rgba(255,255,255,0.4)",
  },
  night: {
    pageBg: "linear-gradient(135deg, #0a0a1a 0%, #111827 40%, #0f172a 100%)",
    cardBg: "rgba(255,255,255,0.03)",
    cardBorder: "rgba(255,255,255,0.08)",
    cardShadow: "0 25px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
    textColor: "white",
    subtitleColor: "rgba(255,255,255,0.4)",
    labelColor: "rgba(255,255,255,0.6)",
    selectBg: "rgba(255,255,255,0.06)",
    selectBorder: "rgba(255,255,255,0.12)",
    selectColor: "white",
    optionBg: "#111827",
    skyGradient: "linear-gradient(180deg, #0f172a 0%, #1e1b4b 40%, #1e293b 100%)",
    roadColor: "#2a2a3e",
    roadBorder: "#444",
    laneColor: "#fbbf24",
    particleBg: "rgba(59,130,246,0.1)",
    footerColor: "rgba(255,255,255,0.15)",
    celestial: "moon",
    coordsBg: "rgba(0,0,0,0.3)",
    coordsColor: "rgba(255,255,255,0.4)",
    activeBg: "rgba(34,197,94,0.1)",
    activeBorder: "rgba(34,197,94,0.3)",
    statBg: "rgba(255,255,255,0.06)",
    sendingColor: "rgba(255,255,255,0.4)",
  }
}

// Inject CSS animations
const styleTag = document.createElement("style")
styleTag.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { font-family: 'Inter', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
  body { overflow: hidden; }

  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes pulse-green { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)} 50%{box-shadow:0 0 30px 10px rgba(34,197,94,0.15)} }
  @keyframes pulse-red { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)} 50%{box-shadow:0 0 30px 10px rgba(239,68,68,0.15)} }
  @keyframes radar-ring { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(3);opacity:0} }
  @keyframes radar-ring-delay { 0%{transform:scale(1);opacity:0.4} 100%{transform:scale(2.5);opacity:0} }
  @keyframes bus-drive { 0%{transform:translateX(-200px) rotate(-2deg);opacity:0} 40%{opacity:1} 100%{transform:translateX(0) rotate(0deg);opacity:1} }
  @keyframes bus-brake { 0%{transform:translateX(0) rotate(0)} 30%{transform:translateX(15px) rotate(3deg)} 60%{transform:translateX(-5px) rotate(-1deg)} 100%{transform:translateX(0) rotate(0)} }
  @keyframes dust-left { 0%{transform:translate(0,0) scale(1);opacity:0.8} 100%{transform:translate(-60px,20px) scale(2.5);opacity:0} }
  @keyframes dust-right { 0%{transform:translate(0,0) scale(1);opacity:0.6} 100%{transform:translate(-40px,-10px) scale(2);opacity:0} }
  @keyframes dust-center { 0%{transform:translate(0,0) scale(1);opacity:0.7} 100%{transform:translate(-50px,10px) scale(3);opacity:0} }
  @keyframes smoke-up { 0%{transform:translate(0,0) scale(1);opacity:0.9} 100%{transform:translate(0,-40px) scale(2.5);opacity:0} }
  @keyframes smoke-side { 0%{transform:translate(0,0) scale(1);opacity:0.7} 100%{transform:translate(30px,-20px) scale(2);opacity:0} }
  @keyframes brake-glow { 0%,100%{opacity:0.4} 50%{opacity:1} }
  @keyframes road-move { 0%{background-position:0 0} 100%{background-position:-200px 0} }
  @keyframes road-stop { 0%{background-position:0 0} 100%{background-position:-20px 0} }
  @keyframes status-card-in { from{transform:translateY(30px) scale(0.95);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
  @keyframes glow-border { 0%,100%{border-color:rgba(34,197,94,0.3)} 50%{border-color:rgba(34,197,94,0.7)} }
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-2px)} 40%{transform:translateX(2px)} 60%{transform:translateX(-1px)} 80%{transform:translateX(1px)} }
  @keyframes timeline-fill { from{width:0%} to{width:100%} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes wheel-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
  @keyframes sparkle { 0%,100%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1)} }
  @keyframes sun-glow { 0%,100%{box-shadow:0 0 20px 8px rgba(251,191,36,0.4)} 50%{box-shadow:0 0 35px 15px rgba(251,191,36,0.6)} }
  @keyframes sun-rays { from{transform:rotate(0)} to{transform:rotate(360deg)} }
  @keyframes moon-glow { 0%,100%{box-shadow:0 0 15px 5px rgba(226,232,240,0.3)} 50%{box-shadow:0 0 25px 10px rgba(226,232,240,0.5)} }
  @keyframes cloud-move { 0%{transform:translateX(-30px)} 100%{transform:translateX(30px)} }
  @keyframes cloud-move2 { 0%{transform:translateX(20px)} 100%{transform:translateX(-20px)} }
  @keyframes bird-fly { 0%{transform:translateX(-40px) translateY(0)} 50%{transform:translateX(0px) translateY(-8px)} 100%{transform:translateX(40px) translateY(0)} }
  @keyframes sun-setting-glow { 0%,100%{box-shadow:0 0 30px 12px rgba(249,115,22,0.4)} 50%{box-shadow:0 0 50px 20px rgba(249,115,22,0.6)} }

  .btn-start:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 30px rgba(34,197,94,0.5) !important; }
  .btn-start:active { transform: translateY(0) scale(0.98) !important; }
  .btn-end:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 30px rgba(239,68,68,0.5) !important; }
  .btn-end:active { transform: translateY(0) scale(0.98) !important; }
  .select-styled:focus { border-color: rgba(59,130,246,0.6) !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important; }
`
document.head.appendChild(styleTag)

// ─── Celestial bodies ───
function Sun({ type }) {
  if (type === "sun") {
    return (
      <div style={{ position: "absolute", top: "12px", right: "25px", zIndex: 5 }}>
        {/* Sun rays */}
        <div style={{
          position: "absolute", top: "-10px", left: "-10px",
          width: "44px", height: "44px",
          borderRadius: "50%",
          border: "2px dashed rgba(251,191,36,0.3)",
          animation: "sun-rays 20s linear infinite"
        }} />
        {/* Sun body */}
        <div style={{
          width: "24px", height: "24px",
          borderRadius: "50%",
          background: "radial-gradient(circle, #fef08a 30%, #fbbf24 70%, #f59e0b 100%)",
          animation: "sun-glow 3s infinite ease-in-out",
        }} />
      </div>
    )
  }
  if (type === "sun-hot") {
    return (
      <div style={{ position: "absolute", top: "8px", right: "28px", zIndex: 5 }}>
        <div style={{
          position: "absolute", top: "-14px", left: "-14px",
          width: "56px", height: "56px",
          borderRadius: "50%",
          border: "2px dashed rgba(251,191,36,0.25)",
          animation: "sun-rays 15s linear infinite"
        }} />
        <div style={{
          width: "28px", height: "28px",
          borderRadius: "50%",
          background: "radial-gradient(circle, #fff 20%, #fef08a 40%, #fbbf24 70%, #f59e0b 100%)",
          animation: "sun-glow 2.5s infinite ease-in-out",
        }} />
      </div>
    )
  }
  if (type === "sun-setting") {
    return (
      <div style={{ position: "absolute", bottom: "38px", right: "30px", zIndex: 5 }}>
        <div style={{
          width: "28px", height: "28px",
          borderRadius: "50%",
          background: "radial-gradient(circle, #fbbf24 30%, #f97316 60%, #ef4444 100%)",
          animation: "sun-setting-glow 3s infinite ease-in-out",
          clipPath: "inset(0 0 30% 0)"
        }} />
      </div>
    )
  }
  if (type === "moon") {
    return (
      <div style={{ position: "absolute", top: "10px", right: "22px", zIndex: 5 }}>
        <div style={{
          width: "22px", height: "22px",
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)",
          animation: "moon-glow 4s infinite ease-in-out",
          boxShadow: "0 0 15px 5px rgba(226,232,240,0.3)",
          position: "relative"
        }}>
          {/* Moon craters */}
          <div style={{ position: "absolute", top: "5px", left: "4px", width: "4px", height: "4px", borderRadius: "50%", background: "rgba(148,163,184,0.4)" }} />
          <div style={{ position: "absolute", top: "12px", left: "10px", width: "3px", height: "3px", borderRadius: "50%", background: "rgba(148,163,184,0.3)" }} />
          <div style={{ position: "absolute", top: "7px", left: "13px", width: "2px", height: "2px", borderRadius: "50%", background: "rgba(148,163,184,0.2)" }} />
        </div>
      </div>
    )
  }
  return null
}

// ─── Clouds ───
function Clouds({ timeOfDay }) {
  if (timeOfDay === "night") return null
  const cloudColor = timeOfDay === "sunset"
    ? "rgba(249,115,22,0.25)"
    : "rgba(255,255,255,0.7)"
  const cloudColor2 = timeOfDay === "sunset"
    ? "rgba(251,191,36,0.2)"
    : "rgba(255,255,255,0.5)"
  return (
    <>
      <div style={{
        position: "absolute", top: "15px", left: "15px", zIndex: 3,
        display: "flex", gap: "2px",
        animation: "cloud-move 8s ease-in-out infinite alternate"
      }}>
        <div style={{ width: "18px", height: "10px", background: cloudColor, borderRadius: "10px" }} />
        <div style={{ width: "24px", height: "14px", background: cloudColor, borderRadius: "14px", marginTop: "-4px" }} />
        <div style={{ width: "16px", height: "10px", background: cloudColor, borderRadius: "10px" }} />
      </div>
      <div style={{
        position: "absolute", top: "25px", left: "55%", zIndex: 3,
        display: "flex", gap: "2px",
        animation: "cloud-move2 10s ease-in-out infinite alternate"
      }}>
        <div style={{ width: "14px", height: "8px", background: cloudColor2, borderRadius: "8px" }} />
        <div style={{ width: "20px", height: "12px", background: cloudColor2, borderRadius: "12px", marginTop: "-3px" }} />
        <div style={{ width: "12px", height: "8px", background: cloudColor2, borderRadius: "8px" }} />
      </div>
    </>
  )
}

// ─── Birds (daytime only) ───
function Birds({ timeOfDay }) {
  if (timeOfDay === "night" || timeOfDay === "sunset") return null
  return (
    <>
      <div style={{
        position: "absolute", top: "20px", left: "35%", zIndex: 4,
        fontSize: "8px", color: "rgba(0,0,0,0.3)",
        animation: "bird-fly 6s ease-in-out infinite"
      }}>𓅛</div>
      <div style={{
        position: "absolute", top: "14px", left: "42%", zIndex: 4,
        fontSize: "6px", color: "rgba(0,0,0,0.2)",
        animation: "bird-fly 8s 1s ease-in-out infinite"
      }}>𓅛</div>
    </>
  )
}

// ─── Trees (sidebar scenery) ───
function Trees({ timeOfDay }) {
  const trunkColor = timeOfDay === "night" ? "#3f3f46" : "#92400e"
  const leafColor = timeOfDay === "night" ? "#166534" : timeOfDay === "sunset" ? "#365314" : "#22c55e"
  const leafColor2 = timeOfDay === "night" ? "#14532d" : timeOfDay === "sunset" ? "#3f6212" : "#16a34a"
  return (
    <>
      {/* Left tree */}
      <div style={{ position: "absolute", bottom: "35px", left: "12px", zIndex: 6 }}>
        <div style={{ width: "4px", height: "14px", background: trunkColor, margin: "0 auto" }} />
        <div style={{ width: "18px", height: "18px", background: leafColor, borderRadius: "50% 50% 50% 50%", marginTop: "-6px", marginLeft: "-7px" }} />
        <div style={{ width: "14px", height: "14px", background: leafColor2, borderRadius: "50%", marginTop: "-10px", marginLeft: "-2px" }} />
      </div>
      {/* Right tree */}
      <div style={{ position: "absolute", bottom: "35px", right: "16px", zIndex: 6 }}>
        <div style={{ width: "4px", height: "12px", background: trunkColor, margin: "0 auto" }} />
        <div style={{ width: "16px", height: "16px", background: leafColor2, borderRadius: "50%", marginTop: "-5px", marginLeft: "-6px" }} />
        <div style={{ width: "12px", height: "12px", background: leafColor, borderRadius: "50%", marginTop: "-8px", marginLeft: "-1px" }} />
      </div>
    </>
  )
}

function BusAnimation({ active, stopping, theme, timeOfDay }) {
  if (!active && !stopping) return null

  return (
    <div style={{
      position: "relative",
      height: "95px",
      margin: "0 -28px",
      overflow: "hidden",
      borderRadius: "14px",
      background: theme.skyGradient,
      transition: "background 1s ease"
    }}>
      {/* Celestial body */}
      <Sun type={theme.celestial} />

      {/* Clouds */}
      <Clouds timeOfDay={timeOfDay} />

      {/* Birds */}
      <Birds timeOfDay={timeOfDay} />

      {/* Stars (night only) */}
      {timeOfDay === "night" && [...Array(10)].map((_, i) => (
        <div key={`star-${i}`} style={{
          position: "absolute",
          width: "2px", height: "2px",
          background: "white",
          borderRadius: "50%",
          top: `${8 + Math.random() * 35}%`,
          left: `${5 + Math.random() * 90}%`,
          opacity: 0.3 + Math.random() * 0.5,
          animation: `sparkle ${2 + Math.random() * 3}s ${Math.random() * 2}s infinite`
        }} />
      ))}

      {/* Trees */}
      <Trees timeOfDay={timeOfDay} />

      {/* Ground/Grass strip */}
      <div style={{
        position: "absolute", bottom: "35px", left: 0, right: 0, height: "6px",
        background: timeOfDay === "night" ? "#1a3a1a" : timeOfDay === "sunset" ? "#365314" : "#4ade80",
        opacity: 0.5
      }} />

      {/* Road */}
      <div style={{
        position: "absolute", bottom: "0", left: "0", right: "0", height: "35px",
        background: theme.roadColor,
        borderTop: `2px solid ${theme.roadBorder}`,
      }}>
        <div style={{
          position: "absolute", top: "50%", left: "0", right: "0", height: "3px",
          background: `repeating-linear-gradient(90deg, ${theme.laneColor} 0px, ${theme.laneColor} 20px, transparent 20px, transparent 40px)`,
          transform: "translateY(-50%)",
          animation: active ? "road-move 0.8s linear infinite" : stopping ? "road-stop 2s ease-out forwards" : "none"
        }} />
      </div>

      {/* Bus */}
      <div style={{
        position: "absolute", bottom: "28px", left: "50%",
        transform: "translateX(-50%)",
        animation: active && !stopping ? "bus-drive 0.8s ease-out forwards" : stopping ? "bus-brake 0.5s ease-out forwards, shake 0.3s 0.2s ease" : "none",
        zIndex: 10
      }}>
        <div style={{ position: "relative", width: "70px", height: "40px" }}>
          <div style={{
            width: "70px", height: "35px",
            background: "linear-gradient(180deg, #ef4444 0%, #dc2626 40%, #b91c1c 100%)",
            borderRadius: "6px 6px 2px 2px",
            position: "relative",
            boxShadow: "0 4px 15px rgba(0,0,0,0.4)"
          }}>
            <div style={{ position: "absolute", top: "5px", left: "4px", right: "4px", height: "14px", display: "flex", gap: "3px" }}>
              {[...Array(4)].map((_, i) => (
                <div key={`w-${i}`} style={{ flex: 1, background: "linear-gradient(180deg, #93c5fd 0%, #60a5fa 100%)", borderRadius: "2px", border: "1px solid rgba(0,0,0,0.2)" }} />
              ))}
            </div>
            <div style={{ position: "absolute", bottom: "3px", left: "3px", right: "3px", height: "4px", background: "linear-gradient(90deg, #fbbf24, #f59e0b)", borderRadius: "1px" }} />
          </div>
          {/* Wheels */}
          <div style={{ position: "absolute", bottom: "-5px", left: "8px", width: "12px", height: "12px", background: "radial-gradient(circle, #555 40%, #333 60%, #111 100%)", borderRadius: "50%", border: "2px solid #666", animation: active ? "wheel-spin 0.3s linear infinite" : "none" }} />
          <div style={{ position: "absolute", bottom: "-5px", right: "8px", width: "12px", height: "12px", background: "radial-gradient(circle, #555 40%, #333 60%, #111 100%)", borderRadius: "50%", border: "2px solid #666", animation: active ? "wheel-spin 0.3s linear infinite" : "none" }} />
          {stopping && (
            <>
              <div style={{ position: "absolute", top: "22px", left: "-2px", width: "4px", height: "6px", background: "#ff0000", borderRadius: "2px", boxShadow: "0 0 12px #ff0000, 0 0 25px rgba(255,0,0,0.5)", animation: "brake-glow 0.3s infinite" }} />
              <div style={{ position: "absolute", top: "22px", right: "-2px", width: "4px", height: "6px", background: "#ff0000", borderRadius: "2px", boxShadow: "0 0 12px #ff0000, 0 0 25px rgba(255,0,0,0.5)", animation: "brake-glow 0.3s infinite" }} />
            </>
          )}
          {active && !stopping && (
            <div style={{ position: "absolute", top: "22px", right: "-3px", width: "5px", height: "5px", background: "#fef08a", borderRadius: "50%", boxShadow: "0 0 10px #fef08a, 10px 0 20px rgba(254,240,138,0.3)" }} />
          )}
        </div>
      </div>

      {/* Dust particles */}
      {active && !stopping && (
        <>
          <div style={{ position: "absolute", bottom: "30px", left: "calc(50% - 55px)", width: "10px", height: "10px", borderRadius: "50%", background: "rgba(200,180,150,0.6)", animation: "dust-left 1s infinite" }} />
          <div style={{ position: "absolute", bottom: "35px", left: "calc(50% - 50px)", width: "8px", height: "8px", borderRadius: "50%", background: "rgba(200,180,150,0.4)", animation: "dust-right 1.2s 0.2s infinite" }} />
          <div style={{ position: "absolute", bottom: "32px", left: "calc(50% - 48px)", width: "12px", height: "12px", borderRadius: "50%", background: "rgba(200,180,150,0.5)", animation: "dust-center 0.9s 0.1s infinite" }} />
        </>
      )}

      {/* Smoke when braking */}
      {stopping && (
        <>
          <div style={{ position: "absolute", bottom: "30px", left: "calc(50% - 40px)", width: "14px", height: "14px", borderRadius: "50%", background: "rgba(150,150,160,0.8)", animation: "smoke-up 0.8s ease-out forwards" }} />
          <div style={{ position: "absolute", bottom: "28px", left: "calc(50% - 35px)", width: "10px", height: "10px", borderRadius: "50%", background: "rgba(150,150,160,0.6)", animation: "smoke-side 0.9s 0.1s ease-out forwards" }} />
          <div style={{ position: "absolute", bottom: "32px", left: "calc(50% - 45px)", width: "16px", height: "16px", borderRadius: "50%", background: "rgba(130,130,140,0.7)", animation: "smoke-up 1s 0.15s ease-out forwards" }} />
        </>
      )}

      {/* Radar rings */}
      {active && !stopping && (
        <>
          <div style={{ position: "absolute", bottom: "40px", left: "50%", transform: "translate(-50%, 0)", width: "20px", height: "20px", borderRadius: "50%", border: "2px solid rgba(34,197,94,0.4)", animation: "radar-ring 2s infinite" }} />
          <div style={{ position: "absolute", bottom: "40px", left: "50%", transform: "translate(-50%, 0)", width: "20px", height: "20px", borderRadius: "50%", border: "2px solid rgba(34,197,94,0.3)", animation: "radar-ring-delay 2s 0.7s infinite" }} />
        </>
      )}
    </div>
  )
}

// ─── Helper to save/clear trip in localStorage ───
function saveTripToStorage(bus, route) {
  localStorage.setItem("activeTrip", JSON.stringify({ bus, route, startedAt: Date.now() }))
}
function clearTripFromStorage() {
  localStorage.removeItem("activeTrip")
}
function getSavedTrip() {
  try {
    const raw = localStorage.getItem("activeTrip")
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function ConductorApp({ onBack }) {
  const [selectedRoute, setSelectedRoute] = useState("")
  const [selectedBus, setSelectedBus] = useState("")
  const [tripActive, setTripActive] = useState(false)
  const [coords, setCoords] = useState(null)
  const [autoEnded, setAutoEnded] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [tripDuration, setTripDuration] = useState(0)
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay())
  const watchIdRef = useRef(null)
  const timerRef = useRef(null)
  const hasResumed = useRef(false)

  // Update time of day every minute
  useEffect(() => {
    const interval = setInterval(() => setTimeOfDay(getTimeOfDay()), 60000)
    return () => clearInterval(interval)
  }, [])

  // ─── RESUME TRIP ON PAGE LOAD ───
  useEffect(() => {
    if (hasResumed.current) return
    hasResumed.current = true

    const saved = getSavedTrip()
    if (!saved) return

    // Restore state
    setSelectedBus(saved.bus)
    setSelectedRoute(saved.route)
    setTripActive(true)
    setAutoEnded(false)

    // Restore approximate duration
    const elapsed = Math.floor((Date.now() - saved.startedAt) / 1000)
    setTripDuration(elapsed)

    // Resume GPS tracking
    const destName = getDestination(saved.route)
    const destCoords = destName ? stopCoords[destName] : null

    watchIdRef.current = navigator.geolocation.watchPosition(async (position) => {
      const { latitude, longitude } = position.coords
      setCoords({ lat: latitude, lng: longitude })

      await setDoc(doc(db, "buses", saved.bus), {
        route: saved.route,
        busNumber: saved.bus,
        lat: latitude,
        lng: longitude,
        isActive: true,
        timestamp: new Date()
      })

      if (destCoords) {
        const distance = getDistanceMeters(latitude, longitude, destCoords.lat, destCoords.lng)
        console.log("Distance to destination:", Math.round(distance), "meters")
        if (distance <= 100) {
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current)
            watchIdRef.current = null
          }
          setIsStopping(true)
          clearTripFromStorage()
          await setDoc(doc(db, "buses", saved.bus), { isActive: false })
          setTimeout(() => {
            setTripActive(false)
            setCoords(null)
            setAutoEnded(true)
            setIsStopping(false)
          }, 1500)
        }
      }
    })
  }, [])

  const theme = themes[timeOfDay]

  // Trip duration timer
  useEffect(() => {
    if (tripActive) {
      timerRef.current = setInterval(() => setTripDuration(d => d + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [tripActive])

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const startTrip = async () => {
    if (!selectedRoute || !selectedBus) {
      alert("Please select both bus number and route")
      return
    }
    setTripActive(true)
    setAutoEnded(false)
    setTripDuration(0)
    saveTripToStorage(selectedBus, selectedRoute)

    const destName = getDestination(selectedRoute)
    const destCoords = destName ? stopCoords[destName] : null

    watchIdRef.current = navigator.geolocation.watchPosition(async (position) => {
      const { latitude, longitude } = position.coords
      setCoords({ lat: latitude, lng: longitude })

      await setDoc(doc(db, "buses", selectedBus), {
        route: selectedRoute,
        busNumber: selectedBus,
        lat: latitude,
        lng: longitude,
        isActive: true,
        timestamp: new Date()
      })

      if (destCoords) {
        const distance = getDistanceMeters(latitude, longitude, destCoords.lat, destCoords.lng)
        console.log("Distance to destination:", Math.round(distance), "meters")
        if (distance <= 100) {
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current)
            watchIdRef.current = null
          }
          setIsStopping(true)
          clearTripFromStorage()
          await setDoc(doc(db, "buses", selectedBus), { isActive: false })
          setTimeout(() => {
            setTripActive(false)
            setCoords(null)
            setAutoEnded(true)
            setIsStopping(false)
          }, 1500)
        }
      }
    })
  }

  const endTrip = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsStopping(true)
    clearTripFromStorage()
    await setDoc(doc(db, "buses", selectedBus), { isActive: false })
    setTimeout(() => {
      setTripActive(false)
      setCoords(null)
      setIsStopping(false)
    }, 1500)
  }

  // Current time label
  const timeLabel = { morning: "☀️ Good Morning", afternoon: "🌤️ Good Afternoon", sunset: "🌅 Good Evening", night: "🌙 Good Night" }[timeOfDay]

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.pageBg,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "20px",
      position: "relative", overflow: "hidden",
      transition: "background 1s ease"
    }}>
      {/* Background ambient particles */}
      {[...Array(12)].map((_, i) => (
        <div key={`bg-${i}`} style={{
          position: "absolute",
          width: `${2 + Math.random() * 3}px`,
          height: `${2 + Math.random() * 3}px`,
          background: theme.particleBg,
          borderRadius: "50%",
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animation: `float ${3 + Math.random() * 4}s ${Math.random() * 2}s infinite ease-in-out`
        }} />
      ))}

      <div style={{
        background: theme.cardBg,
        backdropFilter: "blur(20px)",
        borderRadius: "28px",
        padding: "36px 28px",
        width: "100%", maxWidth: "400px",
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: theme.cardShadow,
        animation: "fadeIn 0.5s ease-out",
        transition: "background 0.8s, border-color 0.8s, box-shadow 0.8s"
      }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{
            fontSize: "44px", marginBottom: "8px",
            animation: tripActive ? "float 2s infinite ease-in-out" : "none",
            filter: tripActive ? "drop-shadow(0 0 10px rgba(34,197,94,0.4))" : "none",
            transition: "filter 0.5s"
          }}>🚌</div>
          <h1 style={{
            color: theme.textColor, margin: "0 0 4px",
            fontSize: "22px", fontWeight: "800", letterSpacing: "1px",
            transition: "color 0.5s"
          }}>
            RTC Conductor
          </h1>
          <p style={{ color: theme.subtitleColor, margin: "0 0 8px", fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", transition: "color 0.5s" }}>
            Vizianagaram Bus Tracking
          </p>
          {/* Time greeting */}
          <div style={{
            display: "inline-block",
            background: theme.selectBg,
            border: `1px solid ${theme.selectBorder}`,
            borderRadius: "99px",
            padding: "4px 14px",
            fontSize: "11px",
            color: theme.labelColor,
            fontWeight: "600",
            transition: "all 0.5s"
          }}>
            {timeLabel}
          </div>
        </div>

        {/* Bus Animation */}
        <BusAnimation active={tripActive} stopping={isStopping} theme={theme} timeOfDay={timeOfDay} />

        {/* Trip Timeline */}
        {tripActive && (
          <div style={{ margin: "16px 0", animation: "fadeIn 0.5s ease-out" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "10px", color: theme.subtitleColor, letterSpacing: "1px", textTransform: "uppercase" }}>Trip Timeline</span>
              <span style={{ fontSize: "13px", color: "#22c55e", fontWeight: "700", fontVariantNumeric: "tabular-nums" }}>{formatTime(tripDuration)}</span>
            </div>
            <div style={{ height: "4px", background: theme.selectBg, borderRadius: "99px", overflow: "hidden" }}>
              <div style={{ height: "100%", background: "linear-gradient(90deg, #22c55e, #3b82f6)", borderRadius: "99px", animation: "timeline-fill 60s linear infinite", boxShadow: "0 0 10px rgba(34,197,94,0.5)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
              <span style={{ fontSize: "10px", color: theme.subtitleColor }}>🟢 Started</span>
              <span style={{ fontSize: "10px", color: theme.subtitleColor }}>🔴 {getDestination(selectedRoute) || "Destination"}</span>
            </div>
          </div>
        )}

        {/* Auto-ended notification */}
        {autoEnded && (
          <div onClick={() => setAutoEnded(false)} style={{
            background: theme.activeBg, border: `1px solid ${theme.activeBorder}`,
            borderRadius: "14px", padding: "16px", margin: "16px 0",
            textAlign: "center", cursor: "pointer",
            animation: "fadeIn 0.5s ease-out, glow-border 2s infinite"
          }}>
            <p style={{ color: "#22c55e", fontWeight: "700", fontSize: "15px", margin: "0 0 4px" }}>✅ Trip Completed</p>
            <p style={{ color: theme.subtitleColor, fontSize: "12px", margin: 0 }}>Bus reached the destination • Tap to dismiss</p>
          </div>
        )}

        {/* Form / Active Trip */}
        {!tripActive ? (
          <div style={{ animation: "fadeIn 0.4s ease-out", marginTop: "20px" }}>
            <label style={{ display: "block", color: theme.labelColor, fontSize: "11px", fontWeight: "700", marginBottom: "8px", letterSpacing: "1.5px", textTransform: "uppercase" }}>
              Bus Number
            </label>
            <select className="select-styled" value={selectedBus} onChange={(e) => setSelectedBus(e.target.value)}
              style={{ width: "100%", padding: "14px", borderRadius: "14px", border: `1px solid ${theme.selectBorder}`, fontSize: "14px", marginBottom: "16px", background: theme.selectBg, color: theme.selectColor, outline: "none", cursor: "pointer", transition: "all 0.3s ease" }}>
              <option value="" style={{ background: theme.optionBg }}>-- Select bus number --</option>
              {busNumbers.map(bus => (<option key={bus} value={bus} style={{ background: theme.optionBg }}>{bus}</option>))}
            </select>

            <label style={{ display: "block", color: theme.labelColor, fontSize: "11px", fontWeight: "700", marginBottom: "8px", letterSpacing: "1.5px", textTransform: "uppercase" }}>
              Route
            </label>
            <select className="select-styled" value={selectedRoute} onChange={(e) => setSelectedRoute(e.target.value)}
              style={{ width: "100%", padding: "14px", borderRadius: "14px", border: `1px solid ${theme.selectBorder}`, fontSize: "14px", marginBottom: "28px", background: theme.selectBg, color: theme.selectColor, outline: "none", cursor: "pointer", transition: "all 0.3s ease" }}>
              <option value="" style={{ background: theme.optionBg }}>-- Select your route --</option>
              {routes.map(route => (<option key={route} value={route} style={{ background: theme.optionBg }}>{route}</option>))}
            </select>

            <button className="btn-start" onClick={startTrip}
              style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", color: "white", border: "none", borderRadius: "16px", fontSize: "15px", fontWeight: "800", cursor: "pointer", letterSpacing: "2px", textTransform: "uppercase", boxShadow: "0 6px 25px rgba(34,197,94,0.35)", transition: "all 0.25s ease", animation: "pulse-green 3s infinite" }}>
              ▶ START TRIP
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center", animation: "status-card-in 0.5s ease-out", marginTop: "16px" }}>
            <div style={{ background: theme.activeBg, border: `1px solid ${theme.activeBorder}`, borderRadius: "18px", padding: "20px", marginBottom: "16px", animation: "glow-border 3s infinite" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "10px" }}>
                <div style={{ width: "10px", height: "10px", background: "#22c55e", borderRadius: "50%", boxShadow: "0 0 8px #22c55e" }} />
                <span style={{ color: "#22c55e", fontWeight: "800", fontSize: "13px", letterSpacing: "2px", textTransform: "uppercase" }}>Trip Active</span>
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "12px" }}>
                <div style={{ background: theme.statBg, borderRadius: "10px", padding: "8px 14px" }}>
                  <div style={{ fontSize: "10px", color: theme.subtitleColor, marginBottom: "2px" }}>BUS</div>
                  <div style={{ fontSize: "16px", fontWeight: "800", color: theme.textColor }}>{selectedBus}</div>
                </div>
                <div style={{ background: theme.statBg, borderRadius: "10px", padding: "8px 14px" }}>
                  <div style={{ fontSize: "10px", color: theme.subtitleColor, marginBottom: "2px" }}>DEST</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: theme.textColor }}>{getDestination(selectedRoute) || "--"}</div>
                </div>
              </div>
              {coords && (
                <div style={{ background: theme.coordsBg, borderRadius: "10px", padding: "8px 12px", fontSize: "11px", color: theme.coordsColor, fontVariantNumeric: "tabular-nums", display: "flex", justifyContent: "center", gap: "16px" }}>
                  <span>LAT {coords.lat.toFixed(5)}</span>
                  <span>LNG {coords.lng.toFixed(5)}</span>
                </div>
              )}
            </div>
            <p style={{ color: theme.sendingColor, fontSize: "12px", marginBottom: "16px", letterSpacing: "0.5px" }}>📡 Sending live location to passengers...</p>
            <button className="btn-end" onClick={endTrip} disabled={isStopping}
              style={{ width: "100%", padding: "16px", background: isStopping ? "linear-gradient(135deg, #9ca3af, #6b7280)" : "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", border: "none", borderRadius: "16px", fontSize: "15px", fontWeight: "800", cursor: isStopping ? "not-allowed" : "pointer", letterSpacing: "2px", textTransform: "uppercase", boxShadow: "0 6px 25px rgba(239,68,68,0.35)", transition: "all 0.25s ease", animation: isStopping ? "none" : "pulse-red 3s infinite" }}>
              {isStopping ? "⏳ ENDING..." : "⏹ END TRIP"}
            </button>
          </div>
        )}
      </div>

      {onBack && !tripActive && (
        <button onClick={onBack} style={{
          marginTop: "16px", background: "none", border: `1px solid ${theme.selectBorder}`,
          color: theme.subtitleColor, padding: "10px 24px", borderRadius: "99px",
          fontSize: "12px", fontWeight: "600", cursor: "pointer",
          letterSpacing: "0.5px", transition: "all 0.3s"
        }}>
          ← Switch Role
        </button>
      )}

      <p style={{ color: theme.footerColor, fontSize: "10px", marginTop: "12px", letterSpacing: "1px", transition: "color 0.5s" }}>
        RTC BUS TRACKER v1.0 • VIZIANAGARAM
      </p>
    </div>
  )
}

export default ConductorApp