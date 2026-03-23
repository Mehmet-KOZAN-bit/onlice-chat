const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Keep an active store of waiting socket IDs
let waitlist = [];

app.use(cors());

// Rate limiting to prevent spam connections
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests, please try again later.',
});
app.use('/api', apiLimiter);

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // User decides they want to find a partner
  socket.on('start-matching', () => {
    // Prevent user from double queueing
    if (waitlist.includes(socket.id)) return;
    
    // Check if someone else is waiting
    if (waitlist.length > 0) {
      const partnerSocketId = waitlist.shift(); // take the first waiting person
      const roomId = `${socket.id}-${partnerSocketId}`; // Create unique room ID

      // Both sockets join the room
      socket.join(roomId);
      const partnerSocket = io.sockets.sockets.get(partnerSocketId);
      if (partnerSocket) {
        partnerSocket.join(roomId);
        // Let both users know they are matched, designate the current socket as initiator
        socket.emit('matched', { roomId, initiator: true });
        partnerSocket.emit('matched', { roomId, initiator: false });
      } else {
        // Fallback: Partner socket disconnected before we could match
        waitlist.push(socket.id);
      }
    } else {
      // No one waiting, add to queue
      waitlist.push(socket.id);
    }
  });

  // User clicks "Next" or leaves the current room
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('partner-disconnected'); // notify partner
  });

  // WebRTC Signaling
  socket.on('offer', (data) => {
    socket.to(data.roomId).emit('offer', { offer: data.offer });
  });

  socket.on('answer', (data) => {
    socket.to(data.roomId).emit('answer', { answer: data.answer });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.roomId).emit('ice-candidate', { candidate: data.candidate });
  });

  // Chat message relay
  socket.on('send-message', (data) => {
    socket.to(data.roomId).emit('receive-message', {
      sender: socket.id,
      text: data.text,
      timestamp: Date.now()
    });
  });

  socket.on('disconnect', () => {
    console.log(`User Disconnected: ${socket.id}`);
    waitlist = waitlist.filter(id => id !== socket.id); // remove from queue if waiting
    socket.broadcast.emit('partner-disconnected'); // basic broadcast (better implementation would track rooms explicitly)
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
