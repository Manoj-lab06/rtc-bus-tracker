import { useState, useEffect } from "react"
import { db } from "./firebase"
import { doc, setDoc } from "firebase/firestore"

const routes = [
  "Route 14A: Vzm Complex to Vizag Complex",
  "Route 7B: Vizag complex to Vzm Complex"
]

function App() {
  const [selectedRoute, setSelectedRoute] = useState("")
  const [tripActive, setTripActive] = useState(false)

  const startTrip = async () => {
    if (!selectedRoute) {
      alert("Please select a route first")
      return
    }
    setTripActive(true)

    navigator.geolocation.watchPosition(async (position) => {
      const { latitude, longitude } = position.coords

      await setDoc(doc(db, "buses", "bus-1"), {
        route: selectedRoute,
        lat: latitude,
        lng: longitude,
        isActive: true,
        timestamp: new Date()
      })

      console.log("Location sent:", latitude, longitude)
    })
  }

  const endTrip = async () => {
    setTripActive(false)

    await setDoc(doc(db, "buses", "bus-1"), {
      isActive: false
    })

    console.log("Trip ended")
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Conductor App</h1>

      <select
        value={selectedRoute}
        onChange={(e) => setSelectedRoute(e.target.value)}
      >
        <option value="">-- Select your route --</option>
        {routes.map(route => (
          <option key={route} value={route}>{route}</option>
        ))}
      </select>

      <br /><br />

      {!tripActive ? (
        <button onClick={startTrip} style={{ background: "green", color: "white", padding: "10px 20px" }}>
          START TRIP
        </button>
      ) : (
        <div>
          <p>Trip active: {selectedRoute}</p>
          <button onClick={endTrip} style={{ background: "red", color: "white", padding: "10px 20px" }}>
            END TRIP
          </button>
        </div>
      )}
    </div>
  )
}

export default App