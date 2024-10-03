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
        getIP,
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


function update_info(user) {
    const usersInRoom = getUsersInRoom(user.room);
    const nonAdmins = usersInRoom.filter(u => !u.isAdmin);
    const ads = usersInRoom.filter(u => u.isAdmin);
    
    nonAdmins.forEach(nonAdmin => {
        io.to(nonAdmin.id).emit('room', {
            room: user.room,
            users: usersInRoom,
            banned: []
        });
    }); // Emit to each non-admin user individually

    ads.forEach(ad => {
        io.to(ad.id).emit('room', {
            room: user.room,
            users: usersInRoom,
            banned: getBanned().map(ip => ({ ip }))
        }); 
    }); // Emit to each admin user individually
}



//----------------------------------------------------------------------------------------
// EVENTS HANDLING
io.on('connection', (socket) => {
    console.log('New WebSocket connection');
    let admin = false;

    // handle joining
    socket.on('join', ({ username, room, password }, callback) => {
        // check if the user is banned
        const ip = socket.handshake.address; // get ip address of the client
        let bannedIPs = getBanned();
        if (bannedIPs.indexOf(ip) !== -1) { return callback('You are banned.'); }

        // check if the user is an admin and if the password is correct
        if (username === 'admin' && getpass() === password) { admin = true; } 
        else if (username === 'admin') {
            return callback('Incorrect password or login session ended or you\'re not an admin.');
        } 

        // add user to the users array, socket.id : unique id for the connection
        const { error, user } = add({ id: socket.id, ip, username, room, isAdmin: admin });
        if (error) { return callback(error); }

        // user.room and user.username: values after trimming and lowercasing
        socket.join(user.room);
        socket.emit('message', msg(`Welcome to room ${user.room}!`)); // emit to the client
        socket.broadcast.to(user.room).emit('message', msg(`${user.username} has joined!`)); // emit to all clients except the current one
        update_info(user);
        callback() 
    });


    // handle messages
    socket.on('message', (message, callback) => {
        const user = get(socket.id);
        if (!user) { return; }
        const filter = new Filter();
        if (filter.isProfane(message)) { return callback('No profanity.'); }
        io.to(user.room).emit('message', msg(user.username, message)); // emit to all clients
        callback();
    });


    // handle file sharing
    socket.on('file', (file, callback) => {
        const user = get(socket.id);
        if (!user) { return; }
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
        callback();
    });


    socket.on('ban', (username, callback) => {
        const ad = get(socket.id);
        if (!ad.isAdmin) { return callback('You are not an admin.'); }
        const user = getIP(username); 
        if (!user) { return callback('User not found.'); }
        const { message, error } = banUser(user);
        if (error) { return callback(error); }
        else {
            update_info(ad);
            callback(message);
        }
    });

    socket.on('unban', (ip, callback) => {
        const ad = get(socket.id);
        if (!ad.isAdmin) { return callback('You are not an admin.'); }
        const { message, error } = unbanUser(ip);
        if (error) { return callback(error); }
        else {
            update_info(ad);
            callback(message);
        }
    });

    socket.on('changepass', (password, callback) => {
        if (!admin) { return callback('You are not an admin.'); }
        if (password.trim() === '') { return callback('Password cannot be empty.'); }
        changepass(password);
    });

    // handle disconnection
    socket.on('disconnect', () => {
        const user = remove(socket.id);
        if (user) {
            io.to(user.room).emit('message', msg(`${user.username} has left.`));
            update_info(user);          
        } // in case the user never joined the room
    });

    // handle location sharing
    socket.on('location', (coords, callback) => {
        const user = get(socket.id);
        if (!user) { return; }
        io.to(user.room).emit('location', 
            location_time(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback();
    }); // google maps link
});



//----------------------------------------------------------------------------------------
server.listen(port, () => { console.log(`Server is up on port ${port}.`) }); 
