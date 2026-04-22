import { useState, useEffect } from "react"
import ConductorApp from "./ConductorApp"
import PassengerApp from "./PassengerApp"

// ─── TIME-OF-DAY ───
function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return "morning"
  if (hour >= 12 && hour < 17) return "afternoon"
  if (hour >= 17 && hour < 20) return "sunset"
  return "night"
}

const homeBg = {
  morning: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 40%, #7dd3fc 100%)",
  afternoon: "linear-gradient(135deg, #fef3c7 0%, #fde68a 40%, #fbbf24 100%)",
  sunset: "linear-gradient(135deg, #1e1b4b 0%, #581c87 30%, #f97316 70%, #fbbf24 100%)",
  night: "linear-gradient(135deg, #0a0a1a 0%, #111827 40%, #0f172a 100%)"
}

const homeText = {
  morning: { primary: "#1e293b", secondary: "rgba(30,41,59,0.5)", cardBg: "rgba(255,255,255,0.6)", cardBorder: "rgba(0,0,0,0.08)" },
  afternoon: { primary: "#78350f", secondary: "rgba(120,53,15,0.5)", cardBg: "rgba(255,255,255,0.55)", cardBorder: "rgba(120,53,15,0.1)" },
  sunset: { primary: "white", secondary: "rgba(255,255,255,0.45)", cardBg: "rgba(255,255,255,0.08)", cardBorder: "rgba(255,255,255,0.12)" },
  night: { primary: "white", secondary: "rgba(255,255,255,0.4)", cardBg: "rgba(255,255,255,0.05)", cardBorder: "rgba(255,255,255,0.1)" }
}

const greetings = {
  morning: "☀️ Good Morning",
  afternoon: "🌤️ Good Afternoon",
  sunset: "🌅 Good Evening",
  night: "🌙 Good Night"
}

// Inject home screen styles
const style = document.createElement("style")
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { font-family: 'Inter', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
  body { overflow: hidden; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes pulse-glow { 0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,0.3)} 50%{box-shadow:0 0 20px 8px rgba(59,130,246,0.1)} }
  @keyframes sparkle { 0%,100%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1)} }
  @keyframes road-scroll { 0%{background-position:0 0} 100%{background-position:-200px 0} }
  .role-card:hover { transform: translateY(-4px) !important; }
  .role-card:active { transform: scale(0.97) !important; }
`
document.head.appendChild(style)

function HomeScreen({ onSelect }) {
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay())

  useEffect(() => {
    const i = setInterval(() => setTimeOfDay(getTimeOfDay()), 60000)
    return () => clearInterval(i)
  }, [])

  const t = homeText[timeOfDay]

  return (
    <div style={{
      minHeight: "100vh",
      background: homeBg[timeOfDay],
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px",
      position: "relative", overflow: "hidden",
      transition: "background 1s ease"
    }}>
      {/* Background particles */}
      {[...Array(12)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: `${2 + Math.random() * 3}px`, height: `${2 + Math.random() * 3}px`,
          background: timeOfDay === "night" || timeOfDay === "sunset" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
          borderRadius: "50%",
          top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
          animation: `float ${3 + Math.random() * 4}s ${Math.random() * 2}s infinite ease-in-out`
        }} />
      ))}

      {/* Main Card */}
      <div style={{
        background: t.cardBg,
        backdropFilter: "blur(24px)",
        borderRadius: "32px",
        padding: "40px 28px",
        width: "100%", maxWidth: "400px",
        border: `1px solid ${t.cardBorder}`,
        boxShadow: "0 25px 80px rgba(0,0,0,0.15)",
        animation: "fadeUp 0.6s ease-out"
      }}>
        {/* Logo Area */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            fontSize: "56px", marginBottom: "12px",
            animation: "float 3s infinite ease-in-out",
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))"
          }}>🚌</div>
          <h1 style={{
            color: t.primary, margin: "0 0 4px",
            fontSize: "26px", fontWeight: "900", letterSpacing: "0.5px"
          }}>
            RTC Bus Tracker
          </h1>
          <p style={{ color: t.secondary, margin: "0 0 12px", fontSize: "13px", letterSpacing: "1.5px", textTransform: "uppercase" }}>
            Vizianagaram
          </p>
          <div style={{
            display: "inline-block",
            background: timeOfDay === "night" || timeOfDay === "sunset" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
            borderRadius: "99px", padding: "5px 16px",
            fontSize: "12px", color: t.secondary, fontWeight: "600"
          }}>
            {greetings[timeOfDay]}
          </div>
        </div>

        {/* Animated mini road */}
        <div style={{
          height: "40px", margin: "0 -28px 28px",
          background: timeOfDay === "night" ? "#1e293b" : timeOfDay === "sunset" ? "#2d2040" : "#e2e8f0",
          position: "relative", overflow: "hidden"
        }}>
          <div style={{
            position: "absolute", top: "50%", left: 0, right: 0, height: "3px",
            background: `repeating-linear-gradient(90deg, #fbbf24 0px, #fbbf24 20px, transparent 20px, transparent 40px)`,
            transform: "translateY(-50%)",
            animation: "road-scroll 1.5s linear infinite"
          }} />
          {/* Mini bus driving */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -70%)",
            fontSize: "20px",
            animation: "float 1.5s infinite ease-in-out"
          }}>🚌</div>
        </div>

        {/* Role Selection */}
        <p style={{
          textAlign: "center", fontSize: "11px", fontWeight: "700",
          color: t.secondary, letterSpacing: "2px", textTransform: "uppercase",
          marginBottom: "16px"
        }}>
          SELECT YOUR ROLE
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Conductor Button */}
          <div
            className="role-card"
            onClick={() => onSelect("conductor")}
            style={{
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              borderRadius: "18px", padding: "18px 20px",
              display: "flex", alignItems: "center", gap: "14px",
              cursor: "pointer",
              boxShadow: "0 6px 25px rgba(34,197,94,0.3)",
              transition: "all 0.25s ease",
              animation: "pulse-glow 3s infinite"
            }}
          >
            <div style={{
              width: "48px", height: "48px",
              background: "rgba(255,255,255,0.2)",
              borderRadius: "14px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "22px", flexShrink: 0
            }}>🎫</div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "white", marginBottom: "2px" }}>
                I'm a Conductor
              </div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)" }}>
                Start trip & share live location
              </div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: "18px", color: "rgba(255,255,255,0.6)" }}>→</div>
          </div>

          {/* Passenger Button */}
          <div
            className="role-card"
            onClick={() => onSelect("passenger")}
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              borderRadius: "18px", padding: "18px 20px",
              display: "flex", alignItems: "center", gap: "14px",
              cursor: "pointer",
              boxShadow: "0 6px 25px rgba(59,130,246,0.3)",
              transition: "all 0.25s ease"
            }}
          >
            <div style={{
              width: "48px", height: "48px",
              background: "rgba(255,255,255,0.2)",
              borderRadius: "14px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "22px", flexShrink: 0
            }}>🗺️</div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "white", marginBottom: "2px" }}>
                I'm a Passenger
              </div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)" }}>
                Track buses on live map
              </div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: "18px", color: "rgba(255,255,255,0.6)" }}>→</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p style={{
        color: t.secondary, fontSize: "10px", marginTop: "24px",
        letterSpacing: "1px", textAlign: "center"
      }}>
        RTC BUS TRACKER v1.0 • VIZIANAGARAM
      </p>
    </div>
  )
}

function App() {
  const [page, setPage] = useState(localStorage.getItem("rtcRole") || "home")

  const selectRole = (role) => {
    localStorage.setItem("rtcRole", role)
    setPage(role)
  }

  const goHome = () => {
    localStorage.removeItem("rtcRole")
    setPage("home")
  }

  if (page === "conductor") return <ConductorApp onBack={goHome} />
  if (page === "passenger") return <PassengerApp onBack={goHome} />
  return <HomeScreen onSelect={selectRole} />
}

export default App