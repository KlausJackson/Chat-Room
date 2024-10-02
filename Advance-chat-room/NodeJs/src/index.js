// IMPORTS
const path = require('path');
const http = require('http');
const express = require('express'); // npm i express
const socketio = require('socket.io'); // npm i socket.io
const Filter = require('bad-words'); // npm i bad-words
const { msg, location_time } = require('./utils/msg'); // import msg functions from msg.js

// import users management functions from file.js
const { add,
        remove,
        get,
        getUsersInRoom,
        banUser,
        unbanUser,
        getBanned,
        changepass,
        getpass 
} = require('./utils/users.js'); 



//----------------------------------------------------------------------------------------
// SET UP
const app = express();
// when express does it behind the scenes, we don't have access to it.
const server = http.createServer(app); // refactoring to parse it later.
const io = socketio(server); // socket.io expects to be called with the raw http server.
const port = process.env.port || 3000; 
const publicpath = path.join(__dirname, '../public');

// Middleware
app.use(express.static(publicpath));


//----------------------------------------------------------------------------------------
// EVENTS HANDLING
io.on('connection', (socket) => {
    console.log('New WebSocket connection');
    
    // handle joining
    socket.on('join', ({ username, room, password }, callback) => {
        // check if the user is banned
        const ip = socket.handshake.address; // get ip address of the client
        const ban = getBanned();
        if (ban.find((user) => user.ip === ip)) {
            return callback('You are banned.');
        }

        if (password) {
            const pass = getpass();
            if (pass !== password) {
                return callback('Incorrect password.');
            }
        }

        // add user to the users array
        const { error, user } = add({ id: socket.id, ip, username, room }); // socket.id : unique id for the connection
        if (error) {
            return callback(error);
        }

        // user successfully added
        // user.room and user.username: values after trimming and lowercasing
        socket.join(user.room);
        socket.emit('message', msg(`Welcome to room ${user.room}!`)); // emit to the client
        socket.broadcast.to(user.room).emit('message', msg(`${user.username} has joined!`)); // emit to all clients except the current one
        
        io.to(user.room).emit('room', {
            room: user.room,
            users: getUsersInRoom(user.room)
        }); // emit to all clients in the room
        
        // for admin




        callback() // acknowledge the event
    });


    // handle messages
    socket.on('message', (message, callback) => {
        const user = get(socket.id);
        if (!user) {
            return;
        }
        const filter = new Filter();
        if (filter.isProfane(message)) {
            return callback('No profanity.');
        }
        io.to(user.room).emit('message', msg(user.username, message)); // emit to all clients
        callback();
    });


    // handle file sharing
    socket.on('file', (file) => {
        const user = get(socket.id);
        if (!user) {
            return;
        }
        const alias = user.username;
        console.log('file received from client');        
        const { name, data, isImage, isVideo } = file; // import file from utils
        io.to(user.room).emit('file', {
            alias,
            name,
            data,
            time : new Date().toLocaleString(),
            isImage,
            isVideo
        });
        console.log('file sent to clients');
    });


    // handle disconnection
    socket.on('disconnect', () => {
        const user = remove(socket.id);
        if (user) {
            io.to(user.room).emit('message', msg(`${user.username} has left.`));
            io.to(user.room).emit('room', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        } // in case the user never joined the room
    });

    // handle location sharing
    socket.on('location', (coords, callback) => {
        const user = get(socket.id);
        if (!user) {
            return;
        }
        io.to(user.room).emit('location', location_time(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback();
    }); // google maps link
});


















server.listen(port, () => {    
    console.log(`Server is up on port ${port}.`);
}); 
