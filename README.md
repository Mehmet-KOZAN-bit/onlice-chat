# Onlice Chat

A production-ready WebRTC random video and text chat application.

## Technologies Used
- Frontend: React (Vite) + Tailwind CSS + `socket.io-client` + `lucide-react`
- Backend: Node.js + Express + `socket.io` + `express-rate-limit`

## Setup Instructions

### 1. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd server
   ```
2. The dependencies are already configured. Ensure you've run `npm install`.
3. Start the Node.js server:
   ```bash
   npm start
   ```
   *The server runs on port 3001 by default.*

### 2. Frontend Setup
1. Open another terminal window and navigate to the frontend directory:
   ```bash
   cd client
   ```
2. Ensure you've run `npm install`.
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The client runs on http://localhost:5173 by default.*

## Usage
- Open `http://localhost:5173` in your browser.
- Allow camera and microphone permissions when prompted.
- Click **Start Waitlist** to find a random partner.
- Open another incognito tab or a different browser to act as the second user.
- Click **Start Waitlist** on the second tab to instantly connect the two peers!
- Use the **Next** button to skip the current connection and instantly find a new user.

## System Architecture
- **In-Memory Queue**: The backend tracks waiting sockets and pops pairs to group them into a private socket room.
- **Signaling**: STUN servers handle NAT traversal, while `Socket.io` relays offers, answers, and ICE candidates between peers securely.
- **WebRTC Custom Hook**: React manages `RTCPeerConnection` state through the `useWebRTC` hook for clean logic separation.
