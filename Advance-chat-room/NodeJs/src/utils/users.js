// Description: This file contains the users array and functions for users management.

//let ban = []
const fs = require('fs')
function getBanned() {
    try {
        const dataBuffer = fs.readFileSync('ban.json')
        const dataJSON = dataBuffer.toString()
        const data = JSON.parse(dataJSON)
        return data
    } catch (e) { return [] }
} // read file json to get banned users

const users = []

// read password from file
let password = fs.readFileSync('password.txt', 'utf8')


// add
const add = ({ id, ip, username, room, isAdmin }) => {
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()
    
    if (!username || !room) { return { error: 'Empty username or room.' } }
    if (users.find((user) => user.username === username && user.room === room)) {
        return { error: 'Username is taken.' }
    } 
    const bannedIPs = getBanned();
    if (bannedIPs.includes(ip)) { return { error: 'User is banned.' }; } 
    const user = { id, ip, username, room, isAdmin }
    users.push(user)
    return { user }
};


// remove
const remove = (id) => {
    const index = users.findIndex((user) => user.id === id)
    if (index !== -1) { return users.splice(index, 1)[0] } // return the removed user
}; 


const get = (id) => {
    return users.find((user) => user.id === id) // return the user
};
const getIP = (username) => {
    return users.find((user) => user.username === username).ip // return the user ip
};


// get list of users in a room
const getUsersInRoom = (room) => {
    return users.filter((user) => user.room === room) // return boolean
}


// ban
const banUser = (ip) => {
    // check if the user being banned is an admin
    const user = users.find((user) => user.ip === ip)
    if (user.isAdmin) { return { error: 'Cannot ban an admin.' } }

    const index = users.findIndex((user) => user.ip === ip)
    if (index !== -1) { // if user is found
        // remove the user from users array -> add to ban.json
        users.splice(index, 1)[0] // splice(index, number of elements to remove)
        const bannedIPs = getBanned();
        bannedIPs.push(ip);
        fs.writeFileSync('ban.json',  JSON.stringify(bannedIPs, null, 2))
        return { message: 'User banned.' }
    } else { return { error: 'User not found.' } }
};


const unbanUser = (ip) => {
    let bannedIPs = getBanned(); //get the bans
    const index = bannedIPs.indexOf(ip);
    if (index !== -1) { // if IP is found
        bannedIPs.splice(index, 1);
        fs.writeFileSync('ban.json', JSON.stringify(bannedIPs, null, 2));
        return { message: 'User unbanned.' }
    } else { return { error: 'User not found.' } }
}; // unban


const changepass = (newpass) => {
    fs.writeFileSync('password.txt', newpass, 'utf8');
    password = newpass
}; // changepass
const getpass = () => { return password }; // getpass


module.exports = {
    add,
    remove,
    get,
    getIP,
    getUsersInRoom,
    banUser,
    unbanUser,
    getBanned,
    changepass,
    getpass
}
