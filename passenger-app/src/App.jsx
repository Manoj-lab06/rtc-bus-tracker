import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import { db } from "./firebase"
import { doc, onSnapshot } from "firebase/firestore"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

const busIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png",
  iconSize: [40, 40],
})

function App() {
  const [busLocation, setBusLocation] = useState(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "buses", "bus-1"), (doc) => {
      const data = doc.data()
      if (data && data.isActive) {
        setBusLocation({ lat: data.lat, lng: data.lng })
        setIsActive(true)
      } else {
        setIsActive(false)
      }
    })

    return () => unsub()
  }, [])

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <h2 style={{ textAlign: "center", padding: "10px" }}>
        {isActive ? "Bus is Active" : "No Active Bus"}
      </h2>

      <MapContainer
        center={[18.0857, 83.3909]}
        zoom={13}
        style={{ height: "90vh", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {busLocation && (
          <Marker position={[busLocation.lat, busLocation.lng]} icon={busIcon}>
            <Popup>Bus is here</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}

export default App