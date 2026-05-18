const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const supabase = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const swipeRoutes = require('./routes/swipeRoutes');
const matchRoutes = require('./routes/matchRoutes');
const messageRoutes = require('./routes/messageRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Load env vars
dotenv.config({ override: true });
console.log("STARTUP: CLOUDINARY_CLOUD_NAME =", JSON.stringify(process.env.CLOUDINARY_CLOUD_NAME));
console.log("STARTUP: CLOUDINARY_API_KEY =", JSON.stringify(process.env.CLOUDINARY_API_KEY));
console.log("STARTUP: CLOUDINARY_API_SECRET =", JSON.stringify(process.env.CLOUDINARY_API_SECRET));
console.log("STARTUP: CLOUDINARY_URL =", JSON.stringify(process.env.CLOUDINARY_URL));

// Connect to database (Supabase client loaded dynamically)

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Auto-create local uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
// Static folder serving for local fallback uploads
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/swipe', swipeRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ai', aiRoutes);

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  socket.on('setup', (userData) => {
    socket.join(userData._id);
    socket.emit('connected');
  });

  socket.on('join chat', (room) => {
    socket.join(room);
    console.log('User Joined Room: ' + room);
  });

  socket.on('new message', (newMessageReceived) => {
    let receiver = newMessageReceived.receiver;
    if (!receiver) return console.log('Message receiver not defined');

    socket.in(receiver).emit('message received', newMessageReceived);
  });

  socket.on('typing', (room) => {
    socket.in(room).emit('typing');
  });

  socket.on('stop typing', (room) => {
    socket.in(room).emit('stop typing');
  });

  // WebRTC Voice Calling Relays
  socket.on('call-user', (data) => {
    socket.in(data.userToCall).emit('incoming-call', {
      offer: data.offer,
      from: data.from
    });
  });

  socket.on('answer-call', (data) => {
    socket.in(data.to).emit('call-accepted', {
      answer: data.answer
    });
  });

  socket.on('ice-candidate', (data) => {
    socket.in(data.to).emit('ice-candidate', {
      candidate: data.candidate
    });
  });

  socket.on('reject-call', (data) => {
    socket.in(data.to).emit('call-rejected');
  });

  socket.on('end-call', (data) => {
    socket.in(data.to).emit('call-ended');
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Basic Route
app.get('/', (req, res) => {
  res.send('Flame API is running...');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
