# 🎵 Music App

A full-stack music streaming application built with **React** (frontend) and **Laravel** (backend), featuring YouTube-powered audio playback, Google OAuth, playlist management, and a beautiful dark-mode UI.

## ✨ Features

- 🔐 **Authentication** — Email/password & Google OAuth login
- 🎶 **Music Playback** — YouTube-powered audio with a full-featured player
- 🔍 **Search & Discover** — Search songs and discover new music
- 📋 **Playlists** — Create and manage your personal playlists
- ❤️ **Favorites** — Save your favorite tracks
- 🎨 **Beautiful UI** — Dark-mode with glassmorphism design and smooth animations
- 📱 **Responsive** — Works on both desktop and mobile

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS (glassmorphism, dark mode) |
| Backend | Laravel 11 (PHP) |
| Database | MySQL |
| Auth | Laravel Sanctum + Google OAuth |
| Music API | YouTube Data API v3 |

## 🚀 Getting Started

### Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+
- MySQL
- A [YouTube Data API v3](https://console.cloud.google.com/) key
- [Google OAuth credentials](https://console.cloud.google.com/apis/credentials)

---

### Backend Setup

```bash
cd music-app-backend

# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate app key
php artisan key:generate

# Fill in your .env values (DB credentials, API keys, etc.)
# Then run migrations
php artisan migrate

# Start the development server
php artisan serve
```

### Frontend Setup

```bash
cd music-app-frontend

# Install JS dependencies
npm install

# Copy environment file
cp .env.example .env

# Fill in your VITE_YOUTUBE_API_KEY in .env

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173` with the API at `http://localhost:8000`.

## ⚙️ Environment Variables

### Backend (`music-app-backend/.env`)

| Variable | Description |
|----------|-------------|
| `APP_KEY` | Laravel application key (auto-generated) |
| `DB_DATABASE` | MySQL database name |
| `DB_USERNAME` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

### Frontend (`music-app-frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_YOUTUBE_API_KEY` | YouTube Data API v3 key |

> ⚠️ **Never commit `.env` files.** Use the `.env.example` templates as a guide.

## 📁 Project Structure

```
music-app/
├── music-app-backend/    # Laravel API backend
│   ├── app/
│   ├── config/
│   ├── database/
│   ├── routes/
│   └── ...
└── music-app-frontend/   # React + Vite frontend
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── hooks/
    │   ├── pages/
    │   └── api/
    └── ...
```

## 📄 License

MIT License — feel free to use and modify.
