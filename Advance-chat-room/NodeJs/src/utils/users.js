// Description: This file contains the users array and functions for users management.
const fs = require('fs').promises;
const getBanned = async () => {
    try {
        const dataBuffer = await fs.readFile('ban.json')
        const dataJSON = dataBuffer.toString()
        return JSON.parse(dataJSON)
    } catch (e) { return [] }
} // read file json to get banned users

const users = []

// read password from file
let password;
(async () => {
    try {
        // Read password from file
        password = await fs.readFile('password.txt', 'utf8');
    } catch (error) {
        console.error('Error reading password file:', error);
        password = 'dcm';
    }
})();


// add
const add = async ({ id, ip, username, room, isAdmin }) => {
    username = username?.trim().toLowerCase()
    room = room?.trim().toLowerCase()
    if (!username || !room) { return { error: 'Empty username or room.' } }
    
    if (users.find((user) => user.username === username && user.room === room)) {
        return { error: 'Username is taken.' }
    } 
    const bannedIPs = await getBanned();
    if (bannedIPs.includes(ip)) { return { error: 'User is banned.' }; } 
    const user = { 
        id, 
        ip, 
        username, 
        room, 
        isAdmin 
    }
    users.push(user)
    return { user }
};



// remove user
const remove = (id) => {
    const index = users.findIndex((user) => user.id === id)
    if (index !== -1) { return users.splice(index, 1)[0] } // return the removed user
}; 


const get = (id) => users.find((user) => user.id === id) // return the user
const getIP = (username) => users.find((user) => user.username === username).ip // return the user ip


// get list of users in a room
const getUsersInRoom = (room) => users.filter((user) => user.room === room) // return boolean


// ban
const banUser = async (ip) => {
    // check if the user being banned is an admin
    const user = users.find((user) => user.ip === ip)
    if (user?.isAdmin) { return { error: 'Cannot ban an admin.' } }

    const index = users.findIndex((user) => user.ip === ip)
    if (index !== -1) { // if user is found
        // remove the user from users array -> add to ban.json
        users.splice(index, 1)[0] // splice(index, number of elements to remove)
        const bannedIPs = await getBanned();
        bannedIPs.push(ip);
        await fs.writeFile('ban.json', JSON.stringify(bannedIPs, null, 2), 'utf8');
        return { message: 'User banned.' }
    } else { return { error: 'User not found.' } }
};


const unbanUser = async (ip) => {
    let bannedIPs = await getBanned(); //get the bans
    const index = bannedIPs.indexOf(ip);
    if (index !== -1) { // if IP is found
        bannedIPs.splice(index, 1);
        await fs.writeFile('ban.json', JSON.stringify(bannedIPs, null, 2), 'utf8');
        return { message: 'User unbanned.' }
    } else { return { error: 'User not found.' } }
};


const changepass = async (newpass) => {
    await fs.writeFile('password.txt', newpass, 'utf8');
    password = newpass
};
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
