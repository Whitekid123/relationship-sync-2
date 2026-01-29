const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Game State
const rooms = new Map();

// Constants
const QUESTIONS = [
  "Who is the better cook?",
  "Who is more likely to get lost?",
  "What is Player 1's dream destination?",
  "What is Player 2's favorite food?",
  "Who takes longer to get ready?",
  "Who said 'I love you' first?",
  "What is Player 1's biggest pet peeve?",
  "Who is the funnier one?",
  "What is Player 2's favorite movie?",
  "Who is more organized?"
];

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Create Room
  socket.on('create_room', () => {
    let roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    while (rooms.has(roomId)) {
      roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    }

    rooms.set(roomId, {
      users: [],
      currentQuestionIndex: 0,
      answers: {},
      round: 1
    });

    console.log(`🏠 Room Created: ${roomId}`); // DEBUG LOG
    socket.emit('room_created', roomId);
  });

  // Join Room
  socket.on('join_room', (roomId) => {
    console.log(`📩 Join Request received for Room: ${roomId} from ${socket.id}`); // DEBUG LOG

    // SAFETY CHECK: If roomId is an object, fix it (Common Frontend Bug)
    if (typeof roomId === 'object') {
        console.log("⚠️ WARNING: Frontend sent an object instead of a string for Room ID");
        roomId = roomId.roomId; 
    }

    const room = rooms.get(roomId);

    if (!room) {
      console.log(`❌ Room not found: ${roomId}`); // DEBUG LOG
      socket.emit('error', 'Room not found');
      return;
    }

    if (room.users.length >= 2) {
      console.log(`❌ Room full: ${roomId}`); // DEBUG LOG
      socket.emit('error', 'Room is full');
      return;
    }

    room.users.push(socket.id);
    socket.join(roomId);
    console.log(`👤 User joined. Room count: ${room.users.length}`); // DEBUG LOG

    if (room.users.length === 2) {
      console.log(`🚀 GAME STARTING IN ROOM ${roomId}`); // DEBUG LOG
      io.to(roomId).emit('game_started', {
        question: QUESTIONS[room.currentQuestionIndex],
        round: room.round
      });
    } else {
      socket.emit('waiting_for_partner');
    }
  });

  // Submit Answer
  socket.on('submit_answer', ({ roomId, answer }) => {
    console.log(`📝 Answer received in ${roomId}: "${answer}"`); // DEBUG LOG
    
    const room = rooms.get(roomId);
    if (!room) {
        console.log("❌ Error: Room does not exist when submitting answer");
        return;
    }

    room.answers[socket.id] = answer;

    // Notify other user that partner has answered
    socket.to(roomId).emit('partner_answered');

    const answerCount = Object.keys(room.answers).length;
    console.log(`📊 Answers collected: ${answerCount}/2`); // DEBUG LOG

    // Check if both answered
    if (answerCount === 2) {
      const userIds = room.users;
      const answer1 = room.answers[userIds[0]];
      const answer2 = room.answers[userIds[1]];

      console.log("✨ Both answered! Revealing results..."); // DEBUG LOG
      io.to(roomId).emit('round_results', {
        answers: [
          { userId: userIds[0], answer: answer1 },
          { userId: userIds[1], answer: answer2 }
        ],
        match: answer1.trim().toLowerCase() === answer2.trim().toLowerCase()
      });
    }
  });

  // Next Question
  socket.on('next_question', (roomId) => {
      console.log("⏭️ Next Question requested"); // DEBUG LOG
      const room = rooms.get(roomId);
      if (!room) return;

      room.answers = {};
      room.currentQuestionIndex = (room.currentQuestionIndex + 1) % QUESTIONS.length;
      room.round += 1;

      io.to(roomId).emit('next_round', {
        question: QUESTIONS[room.currentQuestionIndex],
        round: room.round
      });
  });

  socket.on('disconnect', () => {
    console.log(`⚠️ User disconnected: ${socket.id}`);
    rooms.forEach((room, roomId) => {
      if (room.users.includes(socket.id)) {
        room.users = room.users.filter(id => id !== socket.id);
        io.to(roomId).emit('partner_disconnected');
        if (room.users.length === 0) {
          rooms.delete(roomId);
        }
      }
    });
  });
});

// CHANGED TO PORT 3001 TO AVOID CONFLICTS
const PORT = process.env.PORT || 3001; 
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});