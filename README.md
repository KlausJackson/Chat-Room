# Popcorn Chat

Real-time, ephemeral chat room application built with Node.js, Express, Socket.IO, React, MinIO and MongoDB.

## Features

- **Ephemeral Rooms:** Rooms (and their messages) are soft-deleted from the user's perspective when the last user leaves.
- **No Accounts Required:** Users are identified by their chosen display name and IP address for the session.
- **Role Management:**
  - **Owner:** The creator of the room. Can manage admins, change the room name, and configure settings.
  - **Admins:** Designated by the owner with specific rights (kick, ban, lock, set bad words, change password).
- **Hidden Status:** Owners and Admins can choose to hide their status badge from other users while retaining their permissions.
- **File Sharing:** Upload and share files, images, and audio up to 100MB.
- **Message Filtering:** Toggle a default bad-words filter or specify custom filtered words for a room.
- **Search:** Search through the room's message history and shared files.
- **UI:** A modern, dark-themed, glass-morphism UI.

## Installation & Setup

### Requirements

- Node.js (v18+ recommended)
- MongoDB (Running locally or accessible via connection string - edit in `backend/.env`)
- MinIO

### Setup

In each of the `backend` and `frontend` directories, run:
```bash
npm install
```

Configure environment variables in `backend/.env` or `backend/src/config/index.js`:
```
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/chat_room
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=chat-room
```

Configure environment variables in `frontend/.env`:
```
PORT=3001
REACT_APP_BACKEND_URL=http://localhost:3000
```

Start the server and client in separate terminal windows:
```bash
npm start
```

*Soft Delete:* The backend uses soft-delete.
- When the last user leaves a room, the `Room` and its `Messages` are marked with a `deletedAt` timestamp.
- Handlers filter queries with `deletedAt: null` to hide closed rooms from users.

## Project Architecture

### Backend

Implements a RESTful API with WebSocket support for real-time communication. The backend is built with Node.js, Express, Socket.IO, MongoDB for data storage and MinIO for object storage.

```
└── backend
    └── src
        └── config
            ├── index.js
        └── handlers
            └── admin
                ├── ban.js
                ├── changePassword.js
                ├── index.js
                ├── kick.js
                ├── makeAdmin.js
                ├── removeAdmin.js
                ├── setFilter.js
                ├── setRights.js
                ├── transferOwnership.js
            └── message
                ├── index.js
                ├── search.js
                ├── send.js
            └── room
                ├── create.js
                ├── index.js
                ├── join.js
                ├── leave.js
            ├── index.js
        └── models
            ├── BannedIP.js
            ├── Message.js
            ├── Room.js
            ├── User.js
        └── utils
            ├── socketHelpers.js
            ├── storage.js
            ├── verifyAdmin.js
        ├── database.js
        ├── index.js
    ├── package-lock.json
    └── package.json
```

#### REST Endpoints

*   **`POST /upload`**: Handles multipart/form-data file uploads.
    *   **Parameters**:
        *   `file`: The file buffer to upload.
        *   `roomId`: The destination room database ID.
        *   `socketId`: Active socket ID of the uploading user.
    *   **Response**: `200 OK` with JSON `{ success: true, message: { ... } }` or error code.
*   **`GET /uploads/:roomId/:fileName`**: Streams the requested file from MinIO with proper headers (`Content-Type`, `Content-Disposition: inline`).
*   **`GET /health`**: Simple health check returning `{ status: "ok" }`.

#### Socket.IO API

##### Client-to-Server (Emit)

*   `createRoom` `{ roomName, username, roomPassword }` -> Returns room details (ID, name) or error.
*   `joinRoom` `{ roomId, username, roomPassword }` -> Adds the user to the room, returns room details.
*   `leaveRoom` -> Leaves the active room.
*   `sendMessage` `{ messageText }` -> Sends a text message to the room.
*   `searchMessages` `{ query }` -> Searches room history (messages/files/usernames).
*   `kickUser` `{ socketIdToKick, reason }` -> Kicks a user from the room.
*   `adminBanIP` `{ ipToBan, reason }` -> Bans a user's IP address.
*   `adminUnbanIP` `{ ipToUnban }` -> Unbans an IP address.
*   `toggleLockRoom` -> Locks or unlocks a room.
*   `adminMakeAdmin` `{ targetUserSocketId }` -> Promotes an active user to Admin.
*   `removeAdmin` `{ targetSocketId }` -> Demotes an Admin.
*   `setAdminRights` `{ targetSocketId, newRights }` -> Configures rights for an Admin.
*   `adminChangePassword` `{ newPassword }` -> Changes or removes the room password.
*   `adminSetFilteredWords` `{ filteredWords }` -> Configures custom filtered words.
*   `adminToggleDefaultFilter` -> Toggles the default library word filter.
*   `changeRoomName` `{ newName }` -> Renames the room.
*   `toggleStatusVisibility` -> Toggles whether Admin/Owner badges are visible.
*   `transferOwnership` `{ targetUserSocketId }` -> Transfers ownership of the room.

##### Server-to-Client (Listen)

*   `loadMessages` -> Emits last 50 messages/files upon joining a room.
*   `newMessage` -> Broadcasts any new incoming message or file.
*   `roomDetailsUpdated` -> Broadcasts public room info and user roles (with hidden status masked).
*   `adminRoomDetailsUpdated` -> Broadcasts detailed room configuration and raw IP addresses to authorized admins.
*   `personalStatus` -> Sends current user their true role state and available action rights.
*   `kicked` -> Sent to a user when they are kicked or banned.

### Frontend

Uses React, Socket.IO client, TailwindCSS.

```
└── frontend
    └── src
        └── components
            ├── ChatRoom.js
            ├── MessageForm.js
            ├── MessageItem.js
            ├── MessageList.js
            ├── Sidebar.js
        └── pages
            ├── Home.js
        └── services
            ├── socket.js
        ├── App.css
        ├── App.js
        ├── index.js
        ├── logo.svg
    ├── .env
    ├── package-lock.json
    └── package.json
```

