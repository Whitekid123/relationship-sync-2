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

// --- THE INFINITE QUESTION ENGINE ---

// 1. The Building Blocks
const ACTIONS = [
  "make a scene", "fall asleep", "drop their phone", "make friends", 
  "get arrested", "cry", "laugh uncontrollably", "forget their wallet",
  "start dancing", "trip over nothing", "sing loudly", "eat someone else's food",
  "talk to strangers", "get lost", "break something expensive", "adopt a stray animal",
  "send a risky text", "butt dial their ex", "spill a drink", "get kicked out"
];

const CONTEXTS = [
  "in a church", "during a serious meeting", "at a funeral", "on a first date",
  "while driving", "in the shower", "during a horror movie", "at a library",
  "when they are drunk", "when they are hungry", "in a foreign country",
  "if they met a celebrity", "during an exam", "at a wedding", "in an elevator"
];

const SKILLS = [
  "cooking", "lying", "saving money", "directions/navigation", "keeping secrets",
  "waking up early", "cleaning", "video games", "math", "driving", "arguing",
  "giving massages", "planning trips", "keeping plants alive", "bargaining"
];

const HABITS = [
  "on TikTok", "looking in the mirror", "getting ready", "on the toilet",
  "shopping online", "sleeping", "worrying about nothing", "taking selfies",
  "deciding what to eat", "stalking exes on Instagram", "complaining"
];

// 2. The Generator Function
function generateQuestion(round) {
  // If we are past round 50, let's make it extra chaotic (Chaos Mode)
  let isChaosMode = round > 50;
  
  // Pick a random template type (0-3)
  const type = Math.floor(Math.random() * 4); 
  
  let question = "";

  if (type === 0) {
    // TEMPLATE: "Who is more likely to [ACTION]?"
    const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    question = `Who is more likely to ${action}?`;
  } 
  else if (type === 1) {
    // TEMPLATE: "Who would [ACTION] [CONTEXT]?"
    const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    const context = CONTEXTS[Math.floor(Math.random() * CONTEXTS.length)];
    question = `Who would ${action} ${context}?`;
  }
  else if (type === 2) {
    // TEMPLATE: "Who is better at [SKILL]?"
    const skill = SKILLS[Math.floor(Math.random() * SKILLS.length)];
    question = `Who is better at ${skill}?`;
  }
  else {
    // TEMPLATE: "Who spends more time [HABIT]?"
    const habit = HABITS[Math.floor(Math.random() * HABITS.length)];
    question = `Who spends more time ${habit}?`;
  }

  // If Chaos Mode is on, add a spicy prefix sometimes
  if (isChaosMode && Math.random() > 0.7) {
    question = "🔥 CHAOS ROUND: " + question;
  }

  return question; 
}


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
      // We don't need 'currentQuestionIndex' anymore since we generate new ones!
      answers: {},
      round: 1
    });

    console.log(`🏠 Room Created: ${roomId}`);
    socket.emit('room_created', roomId);
  });

  // Join Room
  socket.on('join_room', (roomId) => {
    // SAFETY CHECK
    if (typeof roomId === 'object') roomId = roomId.roomId; 

    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    if (room.users.length >= 2) {
      socket.emit('error', 'Room is full');
      return;
    }

    room.users.push(socket.id);
    socket.join(roomId);
    console.log(`👤 User joined. Room count: ${room.users.length}`);

    if (room.users.length === 2) {
      console.log(`🚀 GAME STARTING IN ROOM ${roomId}`);
      
      // GENERATE RANDOM QUESTION
      const firstQuestion = generateQuestion(1);

      io.to(roomId).emit('game_started', {
        question: firstQuestion,
        round: room.round
      });
    } else {
      socket.emit('waiting_for_partner');
    }
  });

  // Submit Answer
  socket.on('submit_answer', ({ roomId, answer }) => {
    console.log(`📝 Answer received in ${roomId}: "${answer}"`);
    
    const room = rooms.get(roomId);
    if (!room) return;

    room.answers[socket.id] = answer;

    // Notify other user
    socket.to(roomId).emit('partner_answered');

    const answerCount = Object.keys(room.answers).length;

    // Check if both answered
    if (answerCount === 2) {
      const userIds = room.users;
      const answer1 = room.answers[userIds[0]];
      const answer2 = room.answers[userIds[1]];

      console.log("✨ Both answered! Revealing results...");
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
      console.log("⏭️ Next Question requested");
      const room = rooms.get(roomId);
      if (!room) return;

      room.answers = {};
      room.round += 1;

      // GENERATE NEXT RANDOM QUESTION
      const nextQ = generateQuestion(room.round);

      io.to(roomId).emit('next_round', {
        question: nextQ,
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

const PORT = process.env.PORT || 3001; 
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});