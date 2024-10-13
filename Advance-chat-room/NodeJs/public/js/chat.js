const socket = io() 

// control elements inside compose message form
// $ : convention to indicate that this is a DOM element.
// DOM elements : elements that are accessible in the browser.

// message form
const $msgForm = document.querySelector('#message-form'); 
const $msgFormInput = $msgForm.querySelector('input');
const $msgFormButton = $msgForm.querySelector('button');


// messages, files and location sharing
const $location = document.querySelector('#send-location');
const $fileButton = document.querySelector('#send-file');
const $fileInput = document.querySelector('#file-input');
const $messages = document.querySelector('#messages');


// templates (innerHTML : the content of the element.) for rendering messages, locations and files
const msgTemplate = document.querySelector('#message-template').innerHTML; 
const locTemplate = document.querySelector('#location-template').innerHTML;
const fileTemplate = document.querySelector('#file-template').innerHTML;
// const $sidebarTempl = document.querySelector('#sidebar-template');
// const sidebarTemplate = $sidebarTempl.innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;



// PARSE THE QUERY STRING
const { username, room, password } = Qs.parse(location.search, { ignoreQueryPrefix: true }); // parse the query string
// ignoreQueryPrefix : ignore the question mark in the query string.

// Parse the current URL to get username and room
const currentUrl = new URL(window.location.href);
const urlParams = new URLSearchParams(currentUrl.search);

const user = urlParams.get('username');
const r = urlParams.get('room');
const p = urlParams.get('password');

if (p) {
    urlParams.delete('password');
    currentUrl.search = urlParams.toString(); // Update the URL's search property
    window.history.pushState({}, '', currentUrl); // Update the browser's URL without reloading the page
}



// LISTEN FOR EVENTS FROM SERVER
socket.on('message', (message) => {
    const html = Mustache.render(msgTemplate, message); // render the template with the message
    $messages.insertAdjacentHTML('beforeend', html); // insert the message into the div
});
socket.on('location', (location) => {
    const html = Mustache.render(locTemplate, location);
    $messages.insertAdjacentHTML('beforeend', html);
});
socket.on('file', (all) => {
    const html = Mustache.render(fileTemplate, all);
    $messages.insertAdjacentHTML('beforeend', html);
});


// banned
socket.on('banned', () => {
    alert('You have been banned.');
    location.href = '/'; // redirect to the homepage
});



// UX : TYPING INDICATOR
let typingTimeout;

function typing() {
    // notify others that the user is typing
    socket.emit('typing', { username }); // username from the parsed query string
    clearTimeout(typingTimeout);
    // notify others that the user is no longer typing
    typingTimeout = setTimeout(() => { socket.emit('no_typing'); }, 1000); // user stop typing after 1 second
}

// typing
socket.on('userTyping', (data) => {
    const typingIndicator = document.getElementById('typing-indicator');
    typingIndicator.textContent = `${data.username} is typing...`;
    typingIndicator.style.display = 'block'; // show the typing indicator
});

// stop typing
socket.on('userStoppedTyping', () => {
    const typingIndicator = document.getElementById('typing-indicator');
    typingIndicator.style.display = 'none'; // hide the typing indicator
});

// event listener to message input for typing detection
$msgFormInput.addEventListener('input', typing);




// SIDEBAR : room info and actions
function setupEventListeners() {
    const $banButtons = document.querySelectorAll('.ban');
    const $unbanButtons = document.querySelectorAll('.unban');
    const $changepass = document.querySelector('#change-pw-form');

    $banButtons.forEach($banButton => {
        $banButton.addEventListener('click', () => {
            if (!confirm('Are you sure you want to ban this user?')) { return; }
            const username = $banButton.getAttribute('data-username'); 
            console.log(username);
            socket.emit('ban', username, (e) => { if (e) { alert(e); } });
        });
    });

    $unbanButtons.forEach($unbanButton => {
        $unbanButton.addEventListener('click', () => {
            if (!confirm('Are you sure you want to unban this user?')) { return; }
            const ip = $unbanButton.getAttribute('data-ip');
            console.log(ip);
            socket.emit('unban', ip, (e) => { if (e) { alert(e); } });
        });
    });

    $changepass.addEventListener('submit', (e) => {
        e.preventDefault();
        if ($changepass.querySelector('input').value === '') { return; }
        if (!confirm('Are you sure you want to change the password? Make sure you have alerted other Admin about this.')) { return; }
        const new_password = e.target.elements['new-password'].value;
        socket.emit('changepass', new_password, (error) => {
            if (error) { alert(error); } else { alert('Password changed.'); }
        });
    });


    const $log = document.getElementById("log");
    const $chat = document.getElementById("chat");
    const $close = document.getElementById("close");

    $log.addEventListener("click", function() {
        if (!confirm('Do you want to download the server log?')) { return; }
        $log.setAttribute('disabled', 'disabled');
        socket.emit('log', (e, { data, filename }) => {
            $log.removeAttribute('disabled');
            if (e) { alert(e); } 
            else { downloadFile(data, filename, 'text/plain'); }
        });
    });
    $chat.addEventListener("click", function() {
        $chat.setAttribute('disabled', 'disabled');
        socket.emit('chat', (e, { data, filename }) => {
            $chat.removeAttribute('disabled');
            if (e) { alert(e); }
            else { downloadFile(JSON.stringify(data, null, 2), filename, 'application/json'); }
        });
    });
    $close.addEventListener("click", function() {
        if (!confirm('Are you sure you want to close the server?')) { return; }
        $close.setAttribute('disabled', 'disabled');
        socket.emit('close', (e) => {
            $close.removeAttribute('disabled');
            if (e) { alert(e); }
        });
    });
};


document.addEventListener("DOMContentLoaded", () => { setupEventListeners(); });
socket.on('room', (room_info) => {
    const html = Mustache.render(sidebarTemplate, room_info);
    document.querySelector('#sidebar').innerHTML = html;
    setupEventListeners(); // must be after the sidebar is rendered 
});

socket.on('load', (items) => {
    items.forEach((item) => {
        const html = item.type === 'message' 
            ? Mustache.render(msgTemplate, item) 
            : Mustache.render(fileTemplate, item);
        $messages.insertAdjacentHTML('beforeend', html);
    });
});




// SEND SIGNALS TO SERVER
// send message
$msgForm.addEventListener('submit', (e) => {
    e.preventDefault(); // prevent the page from refreshing
    if ($msgFormInput.value === '') { return; }
    $msgFormButton.setAttribute('disabled', 'disabled'); // disable button after sending message
    const message = e.target.elements.message.value;
    
    socket.emit('message', message, (e) => {
        $msgFormButton.removeAttribute('disabled'); // enable button after sending message
        if (e) { alert(e); } else { 
            $msgFormInput.value = '';
            $msgFormInput.focus();
        } // clear the input field if no error and focus on it
    }); // emit to the server 
});


// send location
$location.addEventListener('click', () => {
    if (!navigator.geolocation) { return alert('Geolocation is not supported by your browser.'); } // not all browsers support geolocation.
    $location.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('location', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => { countdown(5); });
    });
});


// send file
$fileButton.addEventListener('click', () => {
    const file = $fileInput.files[0]; // get the file
    if (file) {
        if (file.size > 900000) { return alert('File size must be less than 900kb.'); }
        const reader = new FileReader();
        reader.onload = function(event) {
            const all = {
                filename: file.name, 
                data: event.target.result, //  base64 encoded string
                isImage: file.type.startsWith('image/'),
                isVideo: file.type.startsWith('video/')
            }
            socket.emit('file', all, (e) => { if (e) { alert(e); } });
        };
        reader.onerror = function() { alert('Error reading file. Please try again.'); };
        reader.readAsDataURL(file); // read the file as a data URL, trigger the onload event
        $fileInput.value = '';
    } else { alert('Please select a file.'); }
});



// functions
function countdown(seconds) {
    const count = setInterval(() => {
        seconds--;
        if (seconds <= 0) {
            clearInterval(count); // stop the countdown
            $location.disabled = false;
        }
    }, 1000);
};

function downloadFile(data, filename, type) {
    const blob = new Blob([data], { type: type }); // create a blob from the data
    const url = window.URL.createObjectURL(blob); // create a URL for the blob
    const a = document.createElement('a'); // create a link element

    a.style.display = 'none'; // hide the link
    a.href = url; // set the link's URL
    a.download = filename; // set the download attribute

    document.body.appendChild(a); // append the link to the body
    a.click(); // simulate a click on the link
    window.URL.revokeObjectURL(url); // release the object URL
}




// username, room get from the query string
socket.emit('join', { username, room, password }, (error) => {
    if (error) {
        alert(error); 
        location.href = '/'; // redirect to the homepage
    } 
});

