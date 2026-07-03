# RTC Bus Tracker

A real-time bus tracking web app built to solve a problem I faced with my college friends every day — not knowing when our RTC bus would arrive.

Live Demo: [rtc-bus-tracker.web.app](https://rtc-bus-tracker-3f89c.web.app)

## The Problem

My college friends and I travel by RTC bus between Vizianagaram and our college. We'd often wait for long periods without knowing where the bus was — sometimes we'd give up and take an auto instead, costing extra time and money. Before this app, we relied on a WhatsApp group where someone would manually message when the bus started, but it wasn't reliable or fast.

## The Solution

I built a web app with two simple roles:

- **Conductor** — whoever boards the bus selects this option and shares their live location.
- **Passenger** — students waiting for the bus select this option and see the bus's live location on a map in real time.

No more guessing, no more relying on WhatsApp messages — just an accurate, live view of where the bus actually is.

## Features

- Real-time location sharing from conductor to passengers
- Live map view showing bus location
- Simple two-role system (Conductor / Passenger)
- Works as a Progressive Web App (PWA)

## Tech Stack

- **Frontend:** React (Vite)
- **Database:** Firebase Firestore (for real-time location updates)
- **Maps:** Leaflet.js with OpenStreetMap
- **Hosting:** Firebase Hosting

## How It Works

1. The conductor opens the app, selects "Conductor," and starts sharing live GPS location.
2. Location updates are sent to Firebase Firestore in real time.
3. Passengers open the app, select "Passenger," and the app fetches the latest location from Firestore.
4. Leaflet renders the bus's live position on an OpenStreetMap-based map, updating as the bus moves.

## Author

Built by [Manoj](https://github.com/Manoj-lab06).
