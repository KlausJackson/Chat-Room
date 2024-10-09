// Description: 
// This file contains functions for:
// - creating messages, locations with timestamps 
// - store them.

// chat history : messages, files, timestamp to mongodb
// server log : log, timestamp to txt file
const fs = require('fs').promises; // Use promises for async operations
// log messages frequently -> asynchronous to avoid blocking the event loop


const log = async (filename, text) => {
    try {
        await fs.appendFile(filename, text + '\n');
    } catch (e) { 
        console.error('Error writing to log file:', e);
    }
}

const msg = (username, text) => {
    return {
        username,
        text,
        time : new Date().toLocaleString()
    };
};

const location_time = (username, location) => {
    return {
        username,
        location,
        time : new Date().toLocaleString()
    };
};

module.exports = {
    msg,
    location_time,
    log
}
