const socket = io() 

// control elements
// $ : convention to indicate that this is a DOM element.
// DOM elements : elements that are accessible in the browser.
const $msgForm = document.querySelector('#message-form'); 
const $msgFormInput = $msgForm.querySelector('input');
const $msgFormButton = $msgForm.querySelector('button');
const $location = document.querySelector('#send-location');
const $fileButton = document.querySelector('#send-file');
const $fileInput = document.querySelector('#file-input');
const $messages = document.querySelector('#messages');


// templates (innerHTML : the content of the element.)
const msgTemplate = document.querySelector('#message-template').innerHTML; 
const locTemplate = document.querySelector('#location-template').innerHTML;
const fileTemplate = document.querySelector('#file-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true }); // parse the query string
// ignoreQueryPrefix : ignore the question mark in the query string.


// LISTEN FOR EVENTS FROM SERVER
// messages
socket.on('message', (message) => {
    const html = Mustache.render(msgTemplate, {
        username: message.username,
        message: message.text,
        time: message.time
    }); // render the template with the message
    $messages.insertAdjacentHTML('beforeend', html); // insert the message into the div
});

// location
socket.on('location', (location) => {
    const html = Mustache.render(locTemplate, {
        username: location.username,
        location: location.location,
        time: location.time
    });
    $messages.insertAdjacentHTML('beforeend', html);
});

// files
socket.on('file', ({ alias, name, data, time, isImage, isVideo }) => {
    // 
    const html = Mustache.render(fileTemplate, {
        // username: object.alias,
        // filename: object.name,
        // file: object.data,
        // time: object.time,
        // isImage: object.isImage,
        // isVideo: object.isVideo

        username: alias,
        filename: name,
        file: data,
        time: time,
        isImage: isImage,
        isVideo: isVideo        
    });
    console.log('file received from server');
    console.log(alias, name, isImage, isVideo);
    $messages.insertAdjacentHTML('beforeend', html);
});

// banned
socket.on('banned', () => {
    alert('You have been banned.');
    location.href = '/'; // redirect to the homepage
});

// user list
socket.on('room', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
});



// SEND SIGNALS TO SERVER
// send message
$msgForm.addEventListener('submit', (e) => {
    e.preventDefault(); // prevent the page from refreshing
    if ($msgFormInput.value === '') {
        return;
    }

    $msgFormButton.setAttribute('disabled', 'disabled'); // disable button after sending message
    const message = e.target.elements.message.value;
    
    socket.emit('message', message, (e) => {
        $msgFormButton.removeAttribute('disabled'); // enable button after sending message
        if (e) {
            alert(e);
        } else {
            $msgFormInput.value = ''; // clear the input field if no error
        }
    }); // emit to the server 
});


// send location
$location.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.');
    } // not all browsers support geolocation.
    $location.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('location', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            countdown(5);
        });
    });
});


// send file
$fileButton.addEventListener('click', () => {
    const file = $fileInput.files[0]; // get the file
    if (file) {
        const reader = new FileReader();
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        reader.onload = function(event) {
            const data = event.target.result; //  base64 encoded string
            const name = file.name;
            socket.emit('file', { 
                name, 
                data, 
                isImage,
                isVideo 
            }); // Send file data to the server
        };
        reader.readAsDataURL(file); // read the file as a data URL
        $fileInput.value = ''; // clear the input
        console.log('file sent to server');
        console.log(file.name, isImage, isVideo);
    } else {
        alert('Please select a file.');
    }
});




// countdown for location sharing
function countdown(seconds) {
    const count = setInterval(() => {
        seconds--;
        if (seconds <= 0) {
            clearInterval(count); // stop the countdown
            $location.disabled = false;
        }
    }, 1000);
};


socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error); 
        location.href = '/'; // redirect to the homepage
    }
});
