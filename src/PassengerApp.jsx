import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, CircleMarker } from "react-leaflet"
import { db } from "./firebase"
import { collection, onSnapshot } from "firebase/firestore"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// ─── STOP COORDINATES ───
const stops = {
  "Vzm Complex": { lat: 18.1135, lng: 83.4116 },
  "Vizag Complex": { lat: 17.7214, lng: 83.3087 }
}

// ─── TIME-OF-DAY SYSTEM ───
function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return "morning"
  if (hour >= 12 && hour < 17) return "afternoon"
  if (hour >= 17 && hour < 20) return "sunset"
  return "night"
}

const mapTiles = {
  morning: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  afternoon: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  sunset: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  night: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
}

const uiThemes = {
  morning: {
    headerBg: "rgba(255,255,255,0.85)",
    headerBorder: "rgba(0,0,0,0.08)",
    headerShadow: "0 8px 32px rgba(0,0,0,0.1)",
    titleColor: "#1e293b",
    subColor: "rgba(30,41,59,0.5)",
    panelBg: "rgba(255,255,255,0.92)",
    panelBorder: "rgba(0,0,0,0.06)",
    panelShadow: "0 -8px 40px rgba(0,0,0,0.1)",
    cardBg: "rgba(0,0,0,0.04)",
    cardBorder: "rgba(0,0,0,0.06)",
    textPrimary: "#1e293b",
    textSecondary: "rgba(30,41,59,0.5)",
    iconBg: "rgba(59,130,246,0.1)",
    routeLineColor: "#3b82f6",
    greeting: "☀️",
  },
  afternoon: {
    headerBg: "rgba(255,255,255,0.8)",
    headerBorder: "rgba(120,53,15,0.08)",
    headerShadow: "0 8px 32px rgba(100,60,0,0.12)",
    titleColor: "#78350f",
    subColor: "rgba(120,53,15,0.5)",
    panelBg: "rgba(255,255,255,0.9)",
    panelBorder: "rgba(120,53,15,0.06)",
    panelShadow: "0 -8px 40px rgba(100,60,0,0.12)",
    cardBg: "rgba(120,53,15,0.05)",
    cardBorder: "rgba(120,53,15,0.08)",
    textPrimary: "#78350f",
    textSecondary: "rgba(120,53,15,0.5)",
    iconBg: "rgba(251,191,36,0.15)",
    routeLineColor: "#f59e0b",
    greeting: "🌤️",
  },
  sunset: {
    headerBg: "rgba(20,10,40,0.8)",
    headerBorder: "rgba(255,255,255,0.1)",
    headerShadow: "0 8px 32px rgba(0,0,0,0.4)",
    titleColor: "white",
    subColor: "rgba(255,255,255,0.45)",
    panelBg: "rgba(15,10,35,0.88)",
    panelBorder: "rgba(255,255,255,0.08)",
    panelShadow: "0 -8px 40px rgba(0,0,0,0.5)",
    cardBg: "rgba(255,255,255,0.06)",
    cardBorder: "rgba(255,255,255,0.09)",
    textPrimary: "white",
    textSecondary: "rgba(255,255,255,0.45)",
    iconBg: "rgba(249,115,22,0.2)",
    routeLineColor: "#f97316",
    greeting: "🌅",
  },
  night: {
    headerBg: "rgba(10,15,35,0.8)",
    headerBorder: "rgba(255,255,255,0.1)",
    headerShadow: "0 8px 32px rgba(0,0,0,0.5)",
    titleColor: "white",
    subColor: "rgba(255,255,255,0.45)",
    panelBg: "rgba(8,12,30,0.9)",
    panelBorder: "rgba(255,255,255,0.08)",
    panelShadow: "0 -8px 40px rgba(0,0,0,0.6)",
    cardBg: "rgba(255,255,255,0.06)",
    cardBorder: "rgba(255,255,255,0.09)",
    textPrimary: "white",
    textSecondary: "rgba(255,255,255,0.45)",
    iconBg: "rgba(59,130,246,0.2)",
    routeLineColor: "#60a5fa",
    greeting: "🌙",
  }
}

// ─── Animated bus icon with pulse ring ───
const createBusIcon = (busNumber) => new L.DivIcon({
  className: "",
  html: `
    <div style="position:relative;width:52px;height:52px;">
      <div style="position:absolute;inset:0;border-radius:50%;border:2px solid rgba(59,130,246,0.4);animation:marker-ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="position:absolute;inset:4px;border-radius:50%;border:1.5px solid rgba(59,130,246,0.25);animation:marker-ping 2s 0.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-60%) rotate(-45deg);
        width:36px;height:36px;
        background:linear-gradient(135deg,#3b82f6,#1d4ed8);
        border-radius:50% 50% 50% 4px;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 4px 20px rgba(59,130,246,0.5);
        border:2px solid rgba(255,255,255,0.4);
      ">
        <span style="transform:rotate(45deg);font-size:12px;color:white;font-weight:800;letter-spacing:0.5px;">${busNumber}</span>
      </div>
    </div>`,
  iconSize: [52, 52],
  iconAnchor: [26, 35],
})

// ─── User location marker icon (person symbol) ───
const userLocationIcon = new L.DivIcon({
  className: "",
  html: `
    <div style="position:relative;width:48px;height:56px;">
      <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:20px;height:6px;background:rgba(16,185,129,0.25);border-radius:50%;filter:blur(2px);animation:user-loc-ring 2s ease-out infinite;"></div>
      <div style="position:absolute;inset:2px 6px;border-radius:50%;border:2px solid rgba(16,185,129,0.3);animation:user-loc-ring 2s ease-out infinite;"></div>
      <div style="
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-60%) rotate(-45deg);
        width:38px;height:38px;
        background:linear-gradient(135deg,#10b981,#059669);
        border-radius:50% 50% 50% 4px;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 4px 20px rgba(16,185,129,0.5);
        border:2px solid rgba(255,255,255,0.5);
      ">
        <span style="transform:rotate(45deg);font-size:18px;line-height:1;">🧑</span>
      </div>
    </div>`,
  iconSize: [48, 56],
  iconAnchor: [24, 45],
})

// Stop marker icon
const createStopIcon = (label) => new L.DivIcon({
  className: "",
  html: `
    <div style="
      width:16px;height:16px;
      background:white;
      border:3px solid #3b82f6;
      border-radius:50%;
      box-shadow:0 2px 8px rgba(59,130,246,0.4);
    "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

// ─── Map auto-follower ───
function MapFollower({ buses }) {
  const map = useMap()
  const hasFollowed = useRef(false)

  useEffect(() => {
    if (buses.length > 0 && !hasFollowed.current) {
      const bus = buses[0]
      map.flyTo([bus.lat, bus.lng], 14, { duration: 1.5 })
      hasFollowed.current = true
    }
  }, [buses])

  return null
}

// ─── Component to fly to a position on demand ───
function FlyToLocation({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 1.2 })
    }
  }, [position])
  return null
}

// ─── Route line between stops ───
function RouteLine({ route, color }) {
  const getRouteStops = (routeName) => {
    if (!routeName) return null
    const from = routeName.includes("Vzm Complex to") ? stops["Vzm Complex"] : stops["Vizag Complex"]
    const to = routeName.includes("to Vizag Complex") ? stops["Vizag Complex"] : stops["Vzm Complex"]
    return { from, to }
  }

  const routeStops = getRouteStops(route)
  if (!routeStops) return null

  const positions = [
    [routeStops.from.lat, routeStops.from.lng],
    [routeStops.to.lat, routeStops.to.lng]
  ]

  return (
    <>
      <Polyline
        positions={positions}
        pathOptions={{ color: color, weight: 4, opacity: 0.6, dashArray: "10, 8", lineCap: "round" }}
      />
      {/* Glow line underneath */}
      <Polyline
        positions={positions}
        pathOptions={{ color: color, weight: 8, opacity: 0.15, lineCap: "round" }}
      />
      {/* Start stop marker */}
      <Marker position={positions[0]} icon={createStopIcon()}>
        <Popup><b>Start:</b> {route.split("to")[0].replace("Route :", "").trim()}</Popup>
      </Marker>
      {/* End stop marker */}
      <Marker position={positions[1]} icon={createStopIcon()}>
        <Popup><b>End:</b> {route.split("to")[1]?.trim()}</Popup>
      </Marker>
    </>
  )
}

// ─── Inject CSS ───
const styleTag = document.createElement("style")
styleTag.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { font-family: 'Inter', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
  body { overflow: hidden; }

  @keyframes marker-ping { 0%{transform:scale(1);opacity:0.7} 75%,100%{transform:scale(2.2);opacity:0} }
  @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes pulse-ring { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.8);opacity:0} }
  @keyframes slide-up { from{transform:translateY(80px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes fade-in { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
  @keyframes card-hover { 0%,100%{transform:scale(1)} 50%{transform:scale(1.01)} }
  @keyframes glow-live { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.4)} 50%{box-shadow:0 0 12px 4px rgba(34,197,94,0.15)} }
  @keyframes bus-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes user-loc-ring { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.5);opacity:0} }
  @keyframes locate-btn-pulse { 0%,100%{box-shadow:0 4px 16px rgba(59,130,246,0.3)} 50%{box-shadow:0 4px 24px rgba(59,130,246,0.5)} }

  .pulse-dot { width:8px;height:8px;background:#22c55e;border-radius:50%;position:relative;display:inline-block;animation:pulse-dot 2s infinite; }
  .pulse-dot::after { content:'';position:absolute;inset:-3px;border-radius:50%;border:2px solid #22c55e;animation:pulse-ring 2s infinite; }
  .slide-up { animation: slide-up .7s cubic-bezier(.34,1.4,.64,1) forwards; }
  .fade-in { animation: fade-in .5s ease-out forwards; }

  .bus-card { transition: all 0.25s ease; cursor: pointer; }
  .bus-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(59,130,246,0.15) !important; }
  .bus-card:active { transform: scale(0.98); }

  .leaflet-container { background: #1a1a2e !important; }
  .leaflet-popup-content-wrapper { border-radius: 12px !important; }
  .leaflet-popup-content { margin: 10px 14px !important; font-family: 'Inter', sans-serif !important; }
`
document.head.appendChild(styleTag)

function PassengerApp({ onBack }) {
  const [buses, setBuses] = useState([])
  const [selectedBus, setSelectedBus] = useState(null)
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay())
  const [panelExpanded, setPanelExpanded] = useState(true)

  // ─── Passenger's own location state ───
  const [userLocation, setUserLocation] = useState(null)
  const [locError, setLocError] = useState(null)
  const [flyTarget, setFlyTarget] = useState(null) // triggers FlyToLocation

  // ─── Watch passenger's GPS position ───
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser")
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocError(null)
      },
      (err) => {
        console.warn("Geolocation error:", err.message)
        setLocError(err.message)
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  // ─── "Locate Me" handler ───
  const handleLocateMe = useCallback(() => {
    if (userLocation) {
      // Use a new object reference each time to re-trigger FlyToLocation
      setFlyTarget([userLocation.lat, userLocation.lng])
    } else {
      // Try getting a fresh position
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setUserLocation(loc)
          setFlyTarget([loc.lat, loc.lng])
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }, [userLocation])

  // Update time of day
  useEffect(() => {
    const interval = setInterval(() => setTimeOfDay(getTimeOfDay()), 60000)
    return () => clearInterval(interval)
  }, [])

  const theme = uiThemes[timeOfDay]
  const tileUrl = mapTiles[timeOfDay]

  // Listen to Firebase
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "buses"), (snapshot) => {
      const activeBuses = []
      const now = Date.now()
      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        if (data && data.isActive) {
          // Check if the bus updated within the last 2 minutes
          let lastUpdate = 0
          if (data.timestamp) {
            // Firebase Timestamp has .toMillis(), plain Date has .getTime()
            lastUpdate = data.timestamp.toMillis ? data.timestamp.toMillis() : new Date(data.timestamp).getTime()
          }
          const staleMs = 30 * 60 * 1000 // 2 minutes
          if (now - lastUpdate < staleMs) {
            activeBuses.push({
              id: docSnap.id,
              lat: data.lat,
              lng: data.lng,
              route: data.route,
              busNumber: data.busNumber
            })
          }
        }
      })
      setBuses(activeBuses)
      // Auto-select first bus if none selected
      if (activeBuses.length > 0 && !selectedBus) {
        setSelectedBus(activeBuses[0].id)
      }
      // Deselect if selected bus is no longer active
      if (selectedBus && !activeBuses.find(b => b.id === selectedBus)) {
        setSelectedBus(activeBuses.length > 0 ? activeBuses[0].id : null)
      }
    })
    return () => unsub()
  }, [selectedBus])

  const isActive = buses.length > 0
  const activeBus = buses.find(b => b.id === selectedBus)

  // Get destination from route
  const getDestination = (route) => {
    if (!route) return "--"
    const parts = route.split("to")
    return parts.length >= 2 ? parts[1].trim() : "--"
  }

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative", overflow: "hidden" }}>

      {/* ─── MAP ─── */}
      <MapContainer
        center={[17.9, 83.35]}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer url={tileUrl} attribution="&copy; CARTO" />
        <MapFollower buses={buses} />
        {flyTarget && <FlyToLocation position={flyTarget} />}

        {/* Route lines for all buses */}
        {buses.map(bus => (
          <RouteLine key={`route-${bus.id}`} route={bus.route} color={bus.id === selectedBus ? theme.routeLineColor : "rgba(150,150,150,0.4)"} />
        ))}

        {/* Bus markers */}
        {buses.map(bus => (
          <Marker key={bus.id} position={[bus.lat, bus.lng]} icon={createBusIcon(bus.busNumber)}>
            <Popup>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", marginBottom: "4px" }}>Bus {bus.busNumber}</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>{bus.route}</div>
                <div style={{ fontSize: "11px", color: "#22c55e", fontWeight: "600", marginTop: "6px" }}>● LIVE TRACKING</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* ─── PASSENGER'S OWN LOCATION MARKER ─── */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
            <Popup>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: "800", color: "#1e293b", marginBottom: "2px" }}>📍 Your Location</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* ─── TOP HEADER ─── */}
      <div className="fade-in" style={{
        position: "absolute", top: "16px", left: "16px", right: "16px", zIndex: 1000,
        background: theme.headerBg,
        backdropFilter: "blur(24px)",
        border: `1px solid ${theme.headerBorder}`,
        borderRadius: "18px", padding: "12px 16px",
        display: "flex", alignItems: "center", gap: "12px",
        boxShadow: theme.headerShadow,
        transition: "all 0.5s ease"
      }}>
        {onBack && (
          <div onClick={onBack} style={{
            width: "38px", height: "38px",
            background: theme.iconBg,
            borderRadius: "11px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px", flexShrink: 0,
            cursor: "pointer", transition: "all 0.3s"
          }}>←</div>
        )}
        <div style={{
          width: "38px", height: "38px",
          background: theme.iconBg,
          borderRadius: "11px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "20px", flexShrink: 0,
          animation: isActive ? "bus-bounce 2s infinite ease-in-out" : "none"
        }}>🚌</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "14px", fontWeight: "800", color: theme.titleColor, transition: "color 0.5s" }}>
            RTC Bus Tracker
          </div>
          <div style={{ fontSize: "11px", color: theme.subColor, marginTop: "1px", transition: "color 0.5s" }}>
            {theme.greeting} Vizianagaram
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: isActive ? "rgba(34,197,94,0.12)" : "rgba(120,120,120,0.1)",
          border: `1px solid ${isActive ? "rgba(34,197,94,0.3)" : "rgba(120,120,120,0.2)"}`,
          borderRadius: "99px", padding: "5px 12px",
          animation: isActive ? "glow-live 3s infinite" : "none",
          transition: "all 0.5s"
        }}>
          <span className="pulse-dot" style={{ background: isActive ? "#22c55e" : "#999" }}></span>
          <span style={{
            fontSize: "11px", fontWeight: "700",
            color: isActive ? "#22c55e" : "#999"
          }}>
            {isActive ? `${buses.length} Live` : "Offline"}
          </span>
        </div>
      </div>

      {/* ─── LOCATE ME BUTTON ─── */}
      <div
        onClick={handleLocateMe}
        title={locError ? `Location error: ${locError}` : "Go to my location"}
        style={{
          position: "absolute",
          bottom: panelExpanded ? "calc(42vh + 16px)" : "calc(60px + 16px)",
          right: "16px",
          zIndex: 1001,
          width: "46px", height: "46px",
          background: userLocation
            ? "linear-gradient(135deg, #3b82f6, #2563eb)"
            : "linear-gradient(135deg, #94a3b8, #64748b)",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          boxShadow: userLocation
            ? "0 4px 16px rgba(59,130,246,0.4)"
            : "0 4px 12px rgba(0,0,0,0.2)",
          border: "2px solid rgba(255,255,255,0.3)",
          transition: "all 0.4s ease",
          animation: userLocation ? "locate-btn-pulse 3s infinite" : "none",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
      </div>

      {/* ─── BOTTOM PANEL ─── */}
      <div className="slide-up" style={{
        position: "absolute", bottom: "0", left: "0", right: "0", zIndex: 1000,
        background: theme.panelBg,
        backdropFilter: "blur(28px)",
        borderTop: `1px solid ${theme.panelBorder}`,
        borderRadius: "22px 22px 0 0",
        padding: panelExpanded ? "18px 18px 26px" : "14px 18px",
        boxShadow: theme.panelShadow,
        maxHeight: "42vh",
        overflowY: "auto",
        transition: "all 0.5s ease"
      }}>
        {/* Drag handle */}
        <div onClick={() => setPanelExpanded(!panelExpanded)} style={{
          width: "36px", height: "4px",
          background: "rgba(120,120,120,0.3)",
          borderRadius: "99px",
          margin: "0 auto 14px",
          cursor: "pointer"
        }} />

        {/* Active buses count */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "6px", height: "6px", background: theme.routeLineColor, borderRadius: "50%" }} />
            <span style={{ fontSize: "11px", color: theme.textSecondary, letterSpacing: "1px", textTransform: "uppercase", fontWeight: "700" }}>
              {buses.length} Active {buses.length === 1 ? "Bus" : "Buses"}
            </span>
          </div>
          {activeBus && (
            <span style={{ fontSize: "10px", color: theme.textSecondary, letterSpacing: "0.5px" }}>
              → {getDestination(activeBus.route)}
            </span>
          )}
        </div>

        {panelExpanded && (
          <>
            {/* No buses */}
            {buses.length === 0 && (
              <div style={{
                textAlign: "center", padding: "30px 10px",
                animation: "fade-in 0.5s ease-out"
              }}>
                <div style={{ fontSize: "40px", marginBottom: "10px", opacity: 0.5 }}>🚌</div>
                <div style={{ fontSize: "15px", fontWeight: "700", color: theme.textPrimary, marginBottom: "4px" }}>
                  No active buses
                </div>
                <div style={{ fontSize: "12px", color: theme.textSecondary }}>
                  Buses will appear here when conductors start their trips
                </div>
              </div>
            )}

            {/* Bus list */}
            {buses.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {buses.map(bus => {
                  const isSelected = bus.id === selectedBus
                  return (
                    <div
                      key={bus.id}
                      className="bus-card"
                      onClick={() => setSelectedBus(bus.id)}
                      style={{
                        background: isSelected
                          ? `linear-gradient(135deg, ${theme.routeLineColor}15, ${theme.routeLineColor}08)`
                          : theme.cardBg,
                        border: `1.5px solid ${isSelected ? `${theme.routeLineColor}40` : theme.cardBorder}`,
                        borderRadius: "14px", padding: "12px 14px",
                        display: "flex", alignItems: "center", gap: "12px",
                        position: "relative", overflow: "hidden"
                      }}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <div style={{
                          position: "absolute", left: "0", top: "0", bottom: "0",
                          width: "3px", background: theme.routeLineColor,
                          borderRadius: "0 3px 3px 0"
                        }} />
                      )}

                      {/* Bus number badge */}
                      <div style={{
                        width: "42px", height: "42px",
                        background: isSelected
                          ? `linear-gradient(135deg, #3b82f6, #1d4ed8)`
                          : `linear-gradient(135deg, #64748b, #475569)`,
                        borderRadius: "12px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "13px", fontWeight: "800", color: "white",
                        flexShrink: 0,
                        boxShadow: isSelected ? "0 4px 12px rgba(59,130,246,0.3)" : "none",
                        transition: "all 0.3s"
                      }}>
                        {bus.busNumber}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: theme.textPrimary, marginBottom: "2px" }}>
                          Bus {bus.busNumber}
                        </div>
                        <div style={{
                          fontSize: "11px", color: theme.textSecondary,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                        }}>
                          → {getDestination(bus.route)}
                        </div>
                      </div>

                      {/* Live indicator */}
                      <div style={{
                        display: "flex", alignItems: "center", gap: "5px",
                        background: "rgba(34,197,94,0.1)",
                        border: "1px solid rgba(34,197,94,0.25)",
                        borderRadius: "99px", padding: "3px 10px", flexShrink: 0
                      }}>
                        <div style={{
                          width: "6px", height: "6px",
                          background: "#22c55e", borderRadius: "50%",
                          boxShadow: "0 0 6px #22c55e"
                        }} />
                        <span style={{ fontSize: "10px", color: "#22c55e", fontWeight: "700" }}>LIVE</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default PassengerApp