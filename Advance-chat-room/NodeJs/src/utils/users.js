// Description: This file contains the users array and functions for users management.

const users = []
const ban = []
let password = 'dcm'


// add
const add = ({ id, ip, username, room }) => {
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()
    
    if (!username || !room) {
        return {
            error: 'Empty username or room.'
        }
    } // if username or room is empty
    if (users.find((user) => user.username === username && user.room === room)) {
        return {
            error: 'Username is taken.'
        }
    } // if username is taken in the room
    if (ban.find((user) => user.username === username && user.room === room)) {
        return {
            error: 'User is banned.'
        }
    } // if user is banned

    const user = { id, ip, username, room }
    users.push(user)
    return { user }
};


// remove
const remove = (id) => {
    const index = users.findIndex((user) => user.id === id)
    if (index !== -1) { // if user is found
        return users.splice(index, 1)[0] // splice(index, number of elements to remove)
    } // return the removed user
};


// get
const get = (id) => {
    return users.find((user) => user.id === id) // return the user
};


// getFromRoom
const getUsersInRoom = (room) => {
    return users.filter((user) => user.room === room) // return boolean
}


// ban
const banUser = (ip) => {
    const index = users.findIndex((user) => user.ip === ip)
    if (index !== -1) { // if user is found
        // remove the user from users array -> add to ban array
        ban.push(users.splice(index, 1)[0]) // splice(index, number of elements to remove)
    } // return the removed user
};


// unban
const unbanUser = (ip) => {
    const index = ban.findIndex((user) => user.ip === ip)
    if (index !== -1) { // if user is found
        // remove the banned ip address from ban array
        return ban.splice(index, 1)[0] // splice(index, number of elements)
    } // return the removed user
};


// getBanned
const getBanned = () => {
    return ban
};


// changepass
const changepass = (newpass) => {
    password = newpass
};

// getpass
const getpass = () => {
    return password
};



module.exports = {
    add,
    remove,
    get,
    getUsersInRoom,
    banUser,
    unbanUser,
    getBanned,
    changepass,
    getpass
}