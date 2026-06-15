# QuizBlitz — Live Guessing Game

A real-time multiplayer quiz game where players join, answer questions, 
and track live scores together.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS v4, Zustand, Socket.io-client
- **Backend:** Node.js, Express, Socket.io

## How to Play
1. One player creates a session and becomes Game Master
2. Share the room code with friends
3. Game Master sets a question + answer
4. Start the game — players have 60 seconds and 3 attempts to guess
5. First correct answer wins 10 points
6. Next player becomes Game Master for the next round

## Run Locally
```bash
# Server
cd server && npm install && npm run dev

# Client  
cd client && npm install && npm run dev
```

## Live Demo
live-quiz-game.vercel.app