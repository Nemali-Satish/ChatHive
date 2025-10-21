# 🚀 ChatHive - Real-Time Chat Application

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS">
</div>

A modern, full-stack chat application inspired by WhatsApp, built with the MERN stack and real-time messaging capabilities. ChatHive allows users to communicate seamlessly through individual and group chats with features like file sharing, online status tracking, and more.

## ✨ Features

### 🔐 Authentication & User Management
- **Secure Registration/Login**: JWT-based authentication with password hashing
- **Profile Management**: Complete user profiles with avatars and bio
- **Online Status**: Real-time online/offline status tracking
- **User Search**: Find and connect with other users

### 💬 Messaging
- **Real-Time Chat**: Instant messaging powered by Socket.io
- **Individual & Group Chats**: Support for both private and group conversations
- **Message Types**: Text, images, videos, documents, and audio files
- **Read Receipts**: Track message delivery and read status
- **Message History**: Persistent chat history with MongoDB

### 👥 Group Management
- **Create Groups**: Start group conversations with custom names and descriptions
- **Admin Controls**: Group admins can manage members and settings
- **Member Management**: Add/remove members and assign admin roles
- **Group Settings**: Customize group avatars and descriptions

### 🔧 Advanced Features
- **File Sharing**: Upload and share media files via Cloudinary integration
- **Message Management**: Delete messages and clear chat history
- **User Blocking**: Block/unblock users for privacy control
- **Chat Muting**: Mute notifications for specific chats
- **Responsive Design**: Works seamlessly on desktop and mobile devices



## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/chathive.git
   cd chathive
   ```

2. **Backend Setup**
   ```bash
   cd backend

   # Install dependencies
   npm install

   # Configure environment variables
   cp .env.example .env
   # Edit .env with your MongoDB URI, JWT secret, and Cloudinary credentials
   ```

   **Required Environment Variables:**
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/chatapp
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   NODE_ENV=development

   # Cloudinary Configuration (for file uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Frontend URL for CORS
   CLIENT_URL=http://localhost:5173
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend

   # Install dependencies
   npm install

   # Configure environment variables
   cp .env.example .env
   # Edit .env with your backend API URL
   ```

   **Required Environment Variables:**
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_SOCKET_URL=http://localhost:5000
   ```

4. **Start the Application**

   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the Application**

   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api/health

## 🔧 Development Scripts

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Frontend
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### Users
- `GET /api/users/search` - Search users by username or email
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id` - Get user by ID

### Chats
- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:id` - Get chat details
- `PUT /api/chats/:id` - Update chat (group chats)

### Messages
- `GET /api/messages/:chatId` - Get chat messages
- `POST /api/messages` - Send new message
- `DELETE /api/messages/:id` - Delete message

### Invites
- `POST /api/invites` - Send chat invitation
- `PUT /api/invites/:id` - Respond to invitation

## 🔌 Socket Events

### Connection Events
- `connection` - User connects to socket
- `disconnect` - User disconnects from socket
- `join_chat` - Join a chat room
- `leave_chat` - Leave a chat room

### Message Events
- `new_message` - New message received
- `message_deleted` - Message deleted
- `typing_start` - User started typing
- `typing_stop` - User stopped typing

### Status Events
- `user_online` - User came online
- `user_offline` - User went offline
- `message_read` - Message marked as read


## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password encryption
- **CORS Protection**: Configured cross-origin resource sharing
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Express rate limiting (configurable)
- **Helmet Security**: Security headers middleware
- **File Upload Security**: Secure file handling with Cloudinary

## 🎨 UI/UX Features

- **Modern Design**: Clean, WhatsApp-inspired interface
- **Dark/Light Theme**: Theme switching capability
- **Responsive Layout**: Mobile-first responsive design
- **Real-time Updates**: Live message updates without page refresh
- **Loading States**: Smooth loading animations and states
- **Error Handling**: User-friendly error messages and recovery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

