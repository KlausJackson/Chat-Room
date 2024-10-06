// Description: 
// This file contains functions for:
// - creating messages, locations with timestamps 
// - save them and server log to a mongodb database.


// chat history : messages, files, timestamp to mongodb
// server log : log, timestamp to mongodb




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
}
