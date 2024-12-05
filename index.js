const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Frontend URL
    methods: ["GET", "POST"],
},
});

const rooms = {}; 
// Middleware
app.use(express.json());
app.use(cors());

// const socket = io('http://localhost:5000', { transports: ['websocket'] });
// Routes
app.use('/api/auth', require('./routes/auth'));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join room
  socket.on('join_room', ({ code, userName }) => {
      socket.join(code);
      console.log(`${userName} joined room: ${code}`);

      // Notify others in the room
      socket.to(code).emit('user_joined', { userName });
  });

  // Word selection
  socket.on('word_selected', ({ code, selectedWord }) => {
      io.to(code).emit('word_selected', { selectedWord });
  });

  // Handle disconnections
  socket.on('disconnect', (reason) => {
      console.log('A user disconnected:', socket.id, ' because', reason);
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => console.log(err));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`IO Server running on port ${PORT}`));
