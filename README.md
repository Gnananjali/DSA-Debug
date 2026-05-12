# DSADebug

An AI-powered coding interview preparation platform inspired by LeetCode, built with a scalable full-stack architecture.

---

# 🚀 Live Demo

## Frontend
https://dsa-debug-zpum.vercel.app/login

## Backend
https://dsa-debug.onrender.com

---

# ✨ Features

- 🔐 JWT Authentication System
- 💻 Monaco Code Editor
- ⚡ JavaScript & Python Code Execution
- 🧠 AI-Powered Code Analysis
- 📊 Complexity Analysis
- 📈 User Profile Dashboard
- 📝 Submission Tracking
- 📚 DSA Problem Library
- 🎯 Difficulty-Based Problems
- 🔄 Redis + BullMQ Queue System
- 🌐 Fully Responsive UI
- 🎨 Modern LeetCode-Inspired Design
- 📡 Real-Time Updates with Socket.IO

---

# 🏗️ Architecture

```text
Frontend (React + Vite)
        ↓
Backend API (Node.js + Express)
        ↓
Redis Queue (BullMQ)
        ↓
Execution Engine
        ↓
MongoDB Atlas Database
```

---

# 🛠️ Tech Stack

## Frontend

- React
- Vite
- Tailwind CSS
- Monaco Editor
- Axios
- React Router DOM
- Framer Motion

## Backend

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- Redis Cloud
- BullMQ
- JWT Authentication
- Socket.IO

## Deployment

- Frontend → Vercel
- Backend → Render
- Database → MongoDB Atlas
- Redis → Redis Cloud

---

# 📸 Screenshots

## Problems Page

<img width="1919" height="907" alt="Screenshot 2026-05-12 141714" src="https://github.com/user-attachments/assets/38c60e09-10e9-4adf-a7d7-9f1222cf08a7" />

---

## Problem Workspace

<img width="1915" height="915" alt="Screenshot 2026-05-12 141742" src="https://github.com/user-attachments/assets/c81dc26b-01b2-4406-9440-42936efee0ab" />

---

## Profile Dashboard

<img width="1919" height="906" alt="Screenshot 2026-05-12 141751" src="https://github.com/user-attachments/assets/5f0714f8-c52c-46ff-8821-723400c78aca" />

---

## Submission Results

<img width="1901" height="912" alt="Screenshot 2026-05-12 141701" src="https://github.com/user-attachments/assets/c13750b3-02da-45e6-9d7e-785be536e13b" />

<img width="1919" height="906" alt="Screenshot 2026-05-12 141731" src="https://github.com/user-attachments/assets/ec6050bf-3aec-4ff7-abcf-110496a2885c" />

---

# 🔥 Core Functionalities

## Code Execution

Users can write and execute JavaScript and Python code with real-time output and runtime analysis.

## AI Code Analysis

The platform provides:

- AI-generated debugging explanations
- Complexity analysis
- Optimization suggestions
- Execution insights

## Queue-Based Processing

Implemented Redis + BullMQ for scalable and asynchronous code execution.

## User Dashboard

Users can:

- Track solved problems
- View submission history
- Analyze acceptance rate
- Monitor coding activity

---

# 📂 Project Structure

```text
DSADebug/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── services/
│
├── backend/
│   ├── models/
│   ├── middleware/
│   ├── config/
│   ├── routes/
│   ├── temp/
│   └── server.js
│
└── README.md
```

---

# ⚙️ Environment Variables

## Backend `.env`

```env
PORT=4000

MONGO_URI=your_mongodb_uri

JWT_SECRET=your_jwt_secret

REDIS_URL=your_redis_url
```

---

# 🧪 Local Setup

## Clone Repository

```bash
git clone https://github.com/gnananjali/DSA-Debug.git
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Backend Setup

```bash
cd backend
npm install
npm start
```

---

# 📌 Future Improvements

- 🏆 Global Leaderboard
- 🎯 Contest Mode
- 🤝 Collaborative Coding Rooms
- 📱 Mobile Optimization
- 🌙 Dark/Light Theme Toggle
- 🧠 AI Hint System
- 📊 Advanced Analytics
- 🔔 Notifications System
- 💻 Additional Language Support (C++, Java)

---

# 💡 Key Learnings

Through this project, I learned:

- Full-stack application architecture
- Real-time communication using Socket.IO
- Queue-based backend systems with BullMQ
- Redis integration
- Authentication & authorization
- Cloud deployment workflows
- API design and scalability concepts
- Dynamic code execution pipelines

---

# 👨‍💻 Author

## Gnananjali Kavali

GitHub: https://github.com/gnananjali

LinkedIn: https://www.linkedin.com/in/kavali-gnananjali-b26896278/

---

# ⭐ Support

If you like this project, consider giving it a star on GitHub.
