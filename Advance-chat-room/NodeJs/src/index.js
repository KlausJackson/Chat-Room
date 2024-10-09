// IMPORTS
const path = require('path');
const http = require('http');
const express = require('express'); // npm i express
const socketio = require('socket.io'); // npm i socket.io
const Filter = require('bad-words'); // npm i bad-words
const { msg, location_time, log } = require('./utils/msg'); // import msg functions from msg.js

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


function format() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(now.getDate()).padStart(2, '0');
    // const hours = String(now.getHours()).padStart(2, '0');
    // const minutes = String(now.getMinutes()).padStart(2, '0');
    // const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
const filename = `log_${format()}.txt`;

 
async function update_info(user) {
    const usersInRoom = getUsersInRoom(user.room);
    const nonAdmins = usersInRoom.filter(u => !u.isAdmin);
    const ads = usersInRoom.filter(u => u.isAdmin);
    const banned_ips = await getBanned();

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
            banned: banned_ips.map(ip => ({ ip }))
        }); 
    }); // Emit to each admin user individually
}



//----------------------------------------------------------------------------------------
// EVENTS HANDLING
io.on('connection', (socket) => {
    let admin = false;

    // handle joining
    socket.on('join', async ({ username, room, password }, callback) => {
        await log(filename, '------------------------------------------------------------');
        
        // get the real IP address if the client is behind a proxy
        const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address || socket.request.connection.remoteAddress;
        // socket.request.connection.remoteAddress : get the IP address of the last proxy server, if none then the client's IP.
        // socket.handshake.headers['x-forwarded-for'] : get multiple IP addresses if the client is behind multiple proxies. The first one is usually the client's IP.
        
        const time = new Date().toLocaleString()
        // check if the user is an admin and if the password is correct
        if (username === 'admin' && getpass() === password) { admin = true; } 
        else if (username === 'admin') {
            await log(filename, `${time} - ${socket.id} - ${username} - ${ip} - ${room} - ${password} - failed to log in as admin.`);
            return callback('Incorrect password or login session ended or you\'re not an admin.');
        } 

        // add user to the users array, socket.id : unique id for the connection
        const { error, user } = await add({ id: socket.id, ip, username, room, isAdmin: admin });
        if (error) { 
            await log(filename, `${time} - ${socket.id} - ${username} - ${ip} - ${room} - ${password} - failed to log in - ${error}.`);
            return callback(error);
        }

        // user.room and user.username: values after trimming and lowercasing
        socket.join(user.room);
        socket.emit('message', msg(`Welcome to room ${user.room}!`)); // emit to the client
        io.to(user.room).emit('message', msg(`${user.username} has joined!`)); // emit to all clients
        await log(filename, `${time} - ${socket.id} - ${username} - ${ip} - ${room} - ${password} - successfully joined.`);
        update_info(user);
        callback() 
    });


    // handle messages
    socket.on('message', async (message, callback) => {
        const user = get(socket.id);
        if (!user) { return; }
        const filter = new Filter();
        if (filter.isProfane(message)) { 
            await log(filename, `${new Date().toLocaleString()} - ${user.ip} - ${user.username} - ${message} - profanity detected.`);
            return callback('No profanity.'); 
        }
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


    socket.on('ban', async (username, callback) => {
        const time = new Date().toLocaleString();
        const ad = get(socket.id);
        if (!admin) { 
            await log(filename, `${time} - ${socket.id} - ${username} - ${ad.ip} - ${ad.room} - tried to ban ${username} - not an admin.`);
            return callback('You are not an admin.'); 
        }
        const user_ip = getIP(username); 
        if (!user) { return callback('User not found.'); }
        const { message, error } = await banUser(user_ip);
        if (error) { return callback(error); }
        else {
            update_info(ad);
            await log(filename, `${time} - ${socket.id} - ${username} - ${ad.ip} - ${ad.room} - banned ${username}.`);
            callback(message);
        }
    });

    socket.on('unban', async (ip, callback) => {
        const time = new Date().toLocaleString();
        const ad = get(socket.id);
        if (!admin) { 
            await log(filename, `${time} - ${socket.id} - ${ad.username} - ${ad.ip} - ${ad.room} - tried to unban ${ip} - not an admin.`);
            return callback('You are not an admin.'); 
        }
        const { message, error } = await unbanUser(ip);
        if (error) { return callback(error); }
        else {
            update_info(ad);
            await log(filename, `${time} - ${socket.id} - ${ad.username} - ${ad.ip} - ${ad.room} - unbanned ${ip}.`);
            callback(message);
        }
    });

    socket.on('changepass', async (password, callback) => {
        if (!admin) { return callback('You are not an admin.'); }
        if (password.trim() === '') { return callback('Password cannot be empty.'); }
        try {
            await changepass(password);
            await log(filename, `${new Date().toLocaleString()} - ${socket.id} - ${get(socket.id).username} - ${get(socket.id).ip} - ${get(socket.id).room} - changed the password.`);
            callback();    
        } catch (e) {
            callback('Error changing password:', e.message);
        }
    });

    socket.on('search', (text, callback) => {
        if (text.trim() === '') { return callback('Search text cannot be empty.'); }
        console.log(text);
        callback();
    });


    socket.on('close', async (callback) => {
        if (!admin) { return callback('You are not an admin.'); }
        server.close(async (e) => {
            if (e) { return callback('Error closing the server:', e.message); }
            await log(filename, 'Server closed at ' + new Date().toLocaleString() + 'by ' + getIP(get(socket.id).username) + '.');
            callback();
        });
    });


    // handle disconnection
    socket.on('disconnect', async () => {
        const user = remove(socket.id);
        if (user) {
            io.to(user.room).emit('message', msg(`${user.username} has left.`));
            await log(filename, `${new Date().toLocaleString()} - ${socket.id} - ${user.username} - ${user.ip} - ${user.room} - disconnected.`);
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



app.use((req, res) => {
    res.status(404).sendFile(path.join(publicpath, '404.html'), (err) => {
        if (err) {
            console.error(err);
            res.status(err.status).end();
        }
    });
});


//----------------------------------------------------------------------------------------
server.listen(port, async () => { 
    await log(filename, '                                                            ')
    await log(filename, '                                                            ')
    await log(filename, '                                                            ')
    await log(filename, '------------------------------------------------------------');
    await log(filename, '------------------------------------------------------------');
    await log(filename, `Server is up on port ${port} at ${new Date().toLocaleString()}.`); 
}); 
