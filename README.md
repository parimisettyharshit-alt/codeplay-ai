# CodePlay AI – Learn Coding by Playing

CodePlay AI is a beginner-friendly coding platform for writing programs in multiple languages, running them safely, viewing real output, fixing errors, and turning the learning journey into mini-game challenges.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Monaco Editor
- Backend: Node.js + Express
- Execution: Secure child-process sandbox for supported languages
- Deployment: Vercel for frontend, hosted backend for execution

## Features

- Multi-language editor with language selector and starter samples
- Unified output console for stdout, stderr, and input
- Save/load/reset/download actions for programs
- Run Code and Convert Code to Game workflows
- AI Tutor-inspired panel and challenge cards
- XP, coins, streaks, and achievement-style dashboard
- Beginner-friendly, responsive interface

## Quick start

1. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Install backend dependencies:
   ```bash
   cd ../backend
   npm install
   ```

3. Start the backend:
   ```bash
   node server.js
   ```

4. Start the frontend:
   ```bash
   cd ../frontend
   npm run dev
   ```

5. Open the app at `http://localhost:5173`

## Environment

Copy the sample environment file and adjust values if needed:

```bash
cd backend
cp .env.example .env
```

## Security and reliability notes

- Code is executed in isolated child processes.
- Execution timeout, memory, and process controls are enforced.
- Unsupported languages are surfaced clearly instead of being silently misrepresented.
- Secrets remain in environment variables and are never exposed in the frontend.
