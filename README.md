# ♟️ Chess Tournament Platform

A modern full-stack chess tournament management platform built with React, Vite, Node.js, and PostgreSQL.  
The platform allows users to create tournaments, manage players, track matches, and view tournament standings in real time.

---

# 🚀 Features

- 🎯 Create and manage chess tournaments
- 👥 Player registration system
- 🏆 Tournament brackets and standings
- ♟️ Match scheduling and tracking
- 📊 Real-time tournament updates
- 🔐 Authentication system
- 🌐 REST API integration
- ⚡ Fast frontend using Vite + React
- 🗄️ PostgreSQL database support

---

# 🛠️ Tech Stack

## Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router

## Backend
- Node.js
- Express.js
- PostgreSQL
- Prisma / Sequelize (if using)

---

# 📁 Project Structure

```bash
CHESS_BOARD/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── vite.config.ts
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   └── server.js
│
├── dist/
├── package.json
└── README.md
```

---

# ⚙️ Installation

## 1️⃣ Clone Repository

```bash
git clone <your-repository-url>
cd CHESS_BOARD
```

---

## 2️⃣ Install Dependencies

### Frontend

```bash
npm install
```

### Backend

```bash
cd backend
npm install
```

---

# ▶️ Run Project

## Start Frontend

```bash
npm run dev
```

Frontend runs on:

```bash
http://localhost:3000
```

---

## Start Backend

```bash
cd backend
npm run dev
```

Backend runs on:

```bash
http://localhost:5000
```

---

# 🗄️ Database Setup

Create a PostgreSQL database.

Add environment variables:

```env
DATABASE_URL=your_postgresql_connection_url
PORT=5000
JWT_SECRET=your_secret_key
```

---

# 🧪 Build Project

```bash
npm run build
```

---

# 📡 API Routes

## Tournament Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tournaments | Get all tournaments |
| POST | /api/tournaments | Create tournament |
| GET | /api/tournaments/:id | Get tournament by ID |

---

# 📸 Screenshots

Add project screenshots here.

---

# 🔮 Future Improvements

- Live chess board integration
- Elo rating system
- Match analytics
- Admin dashboard
- Real-time multiplayer support
- WebSocket integration

---

# 👨‍💻 Author

Developed by Madhur Mehare

---

# 📄 License

This project is licensed under the MIT License.
