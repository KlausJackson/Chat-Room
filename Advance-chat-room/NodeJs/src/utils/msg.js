// Description: 
// This file contains functions for:
// - creating messages, locations with timestamps
// - store them.

// chat history : messages, files, timestamp to json file
// server log : log, timestamp to txt file
const fs = require('fs').promises; // Use promises for async operations
// log messages frequently -> asynchronous to avoid blocking the event loop
const sqlite3 = require('sqlite3').verbose(); // verbose mode for detailed error messages
const db = new sqlite3.Database('chat.db'); // create database object


const setup = () => {
    db.serialize(() => {
        db.run("create table if not exists messages (id INTEGER PRIMARY KEY, username TEXT, text TEXT, time TEXT, room TEXT)");
        db.run("create table if not exists files (id INTEGER PRIMARY KEY, username TEXT, filename TEXT, data BLOB, time TEXT, isImage BOOLEAN, isVideo BOOLEAN, room TEXT)");
    }); // db.serialize() to run multiple queries
}; // create table if it doesn't exist



const log = async (filename, text) => {
    try { await fs.appendFile(filename, text + '\n', 'utf8'); } 
    catch (e) { console.log('Error writing to log file:', e); }
}
const get_log = async (filename) => {
    try {
        const data = await fs.readFile(filename, 'utf8');
        return data;
    } catch (e) { console.log('Error reading log file:', e); }
}

const get_chat = async (room) => {
    const msgQuery = `select username, text, time from messages where room = ?`;
    try {
        const msgRows = await new Promise((resolve, reject) => {
            db.all(msgQuery, [room], (err, rows) => {
                if (err) {
                    console.error('Error fetching messages:', err.message);
                    return reject(err);
                } else { resolve(rows); }
            });
        });
        return(msgRows);
    } catch (error) { console.error('Error in get_chat function:', error.message); }
}


const load = (room) => {
    return new Promise((resolve, reject) => {
        const msg_query = `select 'message' as type, username, text, time from messages where room = ?`;
        const file_query = `select 'file' as type, username, filename, data, time, isImage, isVideo from files where room = ?`;

        db.all(msg_query, [room], (e, msgRows) => {
            if (e) {
                console.log('Error fetching messages:', e.message);
                return reject(e);
            }
            db.all(file_query, [room], (e, fileRows) => {
                if (e) {
                    console.log('Error fetching files:', e.message);
                    return reject(e);
                }
                const combinedResults = [...msgRows, ...fileRows];
                combinedResults.sort((a, b) => new Date(a.time) - new Date(b.time));
                resolve(combinedResults);
            });
        });
    });
}


const getFile = (room, username, file) => {
    const { filename, data, isImage, isVideo, isAudio } = file; // import file from utils
    const all = { 
        username: username, 
        filename: filename, 
        data: data, 
        time: new Date().toLocaleString(), 
        isImage: isImage, 
        isVideo: isVideo
    };

    // insert file into the database
    return new Promise((resolve, reject) => {
        const stmt = db.prepare("insert into files (username, filename, data, time, isImage, isVideo, room) values (?, ?, ?, ?, ?, ?, ?, ?)");
        stmt.run(all.username,  all.filename,  all.data,  all.time,  all.isImage,  all.isVideo, room, (e) => {
            if (e) { 
                console.log('Error inserting file:', e.message); 
                reject(e);
            } 
            else { 
                console.log('File inserted successfully');
                resolve(all);
            }
        });
        stmt.finalize();
    });
}


const msg = (room, username, text) => {
    const message = {
        username,
        text,
        time: new Date().toLocaleString()
    };

    // insert message into the database
    return new Promise((resolve, reject) => {
        const stmt = db.prepare("insert into messages (username, text, time, room) values (?, ?, ?, ?)");
        stmt.run(message.username, message.text, message.time, room, (e) => {
            if (e) { 
                console.log('Error inserting message:', e.message);
                reject(e);
            }  else {  resolve(message); }
        });
        stmt.finalize();
        
    });
};


const location_time = (username, location) => {
    return {
        username,
        location,
        time : new Date().toLocaleString()
    };
};


setup(); 
module.exports = {
    msg,
    location_time,
    log,
    get_log,
    getFile,
    get_chat,
    load
}


// db.close((err) => {
//     if (err) { console.error('Error closing the database:', err.message); }
// });