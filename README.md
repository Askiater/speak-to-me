# Speak To Me

A WebRTC-based video calling application with 1:1 video calls, built with React, Next.js, Node.js, and Socket.io.

## Features

- **1:1 Video Calls**: High-quality peer-to-peer video calls using WebRTC
- **TURN/STUN Support**: Works behind NATs using coturn server
- **Authentication System**: User login with admin and regular user roles
- **Room Management**: Create and join rooms with unique, unguessable URLs
- **Camera & Microphone Controls**: Toggle video and audio during calls
- **Admin Panel**: Monitor active sessions and manage users
- **Automatic Cleanup**: Rooms are automatically cleaned up when empty or after timeout
- **Guest Access**: Users can join rooms without authentication

## Tech Stack

### Frontend
- Next.js 14
- React 18
- TypeScript
- Socket.io Client
- CSS

### Backend
- Node.js
- Express
- Socket.io
- MongoDB (for unstructured data)
- PostgreSQL (for relational data)
- coturn (TURN/STUN server)

### DevOps
- Docker & Docker Compose
- GitHub Actions

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd speak-to-me
```

### 2. Set up environment variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and update the following:

```env
# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Other settings are pre-configured for Docker
```

### 3. Run with Docker

Start all services (frontend, backend, MongoDB, PostgreSQL, coturn):

```bash
docker-compose up -d
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

### 4. Access the application

1. **Home Page**: Visit http://localhost:3000
2. **Login**: Click "Login" and use the admin credentials from your `.env` file
3. **Create Room**: Authenticated users can create a new room
4. **Join Room**: Anyone can join an existing room using the room link
5. **Admin Panel**: Admin users can access the admin panel from the home page

## Development

### Run locally without Docker

#### Backend

```bash
cd backend
npm install
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Make sure to update the `.env` file with local database connections.

## Architecture

### Authentication Flow

1. Admin user is created automatically on server start using credentials from `.env`
2. Admin can create additional users through the admin panel
3. Authentication uses JWT tokens stored in HTTP-only cookies
4. Users remain logged in across sessions

### Room Flow

1. Authenticated user creates a room → receives unique room ID
2. Room creator is redirected to the room
3. Room creator can share the room link with others
4. Anyone (authenticated or guest) can join using the link
5. WebRTC peer connection is established between participants
6. When a user leaves, the other user sees a "waiting" screen
7. Room is automatically deleted when:
   - All users leave
   - Single user stays alone for > 10 minutes (configurable)

### Admin Panel

- **Active Sessions Tab**: Monitor all active video call sessions in real-time
  - View room IDs, creators, participants
  - Terminate any session
- **User Management Tab**: Create, edit, and delete users

## Configuration

### Room Timeout

Default timeout for a user staying alone in a room is 10 minutes. Configure this in `.env`:

```env
ROOM_TIMEOUT_MINUTES=10
```

### TURN/STUN Configuration

The application uses Google's public STUN servers and a local coturn server. Configure coturn credentials in `.env`:

```env
COTURN_HOST=coturn
COTURN_PORT=3478
TURN_USERNAME=turn_user
TURN_PASSWORD=turn_password
```

## Deployment

### Frontend Deployment

The frontend is a Next.js application with dynamic routes and requires a Node.js server. Deploy to:

**Recommended Options:**
- **Vercel** (Best for Next.js - automatic deployment, zero config)
- **Railway** (Easy deployment with Git integration)
- **Render** (Simple and affordable)
- **DigitalOcean App Platform**
- **Fly.io**

**Environment Variables:**
- `NEXT_PUBLIC_BACKEND_URL`: Your backend URL (e.g., https://api.yourdomain.com)

**Note:** Cloudflare Pages only supports static sites, so it's not suitable for this application without significant code changes to use static site generation.

### Backend Deployment

The backend requires a Node.js hosting service that supports:
- WebSocket connections (Socket.io)
- MongoDB and PostgreSQL databases
- Long-running processes

**Recommended Options:**
- **Railway** (Easy deployment, includes databases)
- **Render** (Free tier available, managed databases)
- **DigitalOcean App Platform**
- **Fly.io**
- **AWS/GCP/Azure** with containerization

**Required Services:**
- MongoDB database
- PostgreSQL database
- Node.js runtime

**Environment Variables:**
Set all variables from `.env.example` in your hosting platform.

### TURN Server

For production, you'll need to deploy the coturn server separately or use a TURN service:
- Self-hosted coturn on a VPS
- Managed TURN services (Twilio, Xirsys, etc.)

## Project Structure

```
speak-to-me/
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── app/             # Next.js pages
│   │   │   ├── page.tsx     # Home page
│   │   │   ├── room/        # Room page
│   │   │   └── admin/       # Admin panel
│   │   ├── components/      # React components
│   │   ├── lib/             # API & Socket.io clients
│   │   └── styles/          # CSS styles
│   └── Dockerfile
├── backend/                  # Node.js backend
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── sockets/         # Socket.io signaling
│   │   ├── utils/           # Utilities
│   │   └── index.ts         # Entry point
│   └── Dockerfile
├── coturn/                   # TURN server config
├── .github/                  # GitHub Actions
├── docker-compose.yml        # Docker services
└── .env.example             # Environment template
```

## Security Considerations

1. **Admin Credentials**: Store admin credentials securely in environment variables
2. **JWT Secret**: Use a strong, random JWT secret in production
3. **HTTPS**: Use HTTPS in production for secure WebRTC connections
4. **Database**: Use strong database passwords and restrict access
5. **CORS**: Configure CORS properly for your domain
6. **Rate Limiting**: Add rate limiting for API endpoints (not included in this version)

## Future Enhancements

- Group video calls (3+ participants)
- Screen sharing
- Chat functionality
- Recording capabilities
- End-to-end encryption
- Mobile app (React Native)

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
