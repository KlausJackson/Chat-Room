const socket = io() 
// control elements inside compose message form
// $ : convention to indicate that this is a DOM element.
// DOM elements : elements that are accessible in the browser.

// message form
const $msgForm = document.querySelector('#message-form'); 
const $msgFormInput = $msgForm.querySelector('textarea');
const $msgFormButton = $msgForm.querySelector('button');


// messages, files and location sharing
const $location = document.querySelector('#send-location');
const $fileButton = document.querySelector('#send-file');
const $fileInput = document.querySelector('#file-input');
const $messages = document.querySelector('#messages');


// templates (innerHTML : the content of the element.) for rendering messages, locations and files
const msgTemplate = document.querySelector('#message-template').innerHTML; 
const locTemplate = document.querySelector('#location-template').innerHTML;
// const $sidebarTempl = document.querySelector('#sidebar-template');
// const sidebarTemplate = $sidebarTempl.innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;



// PARSE THE QUERY STRING
const { username, room, password } = Qs.parse(location.search, { ignoreQueryPrefix: true }); // parse the query string
// ignoreQueryPrefix : ignore the question mark in the query string.

// Parse the current URL to get username and room
const currentUrl = new URL(window.location.href);
const urlParams = new URLSearchParams(currentUrl.search);

// const user = urlParams.get('username');
// const r = urlParams.get('room');
const p = urlParams.get('password');

if (p) {
    urlParams.delete('password');
    currentUrl.search = urlParams.toString(); // Update the URL's search property
    window.history.pushState({}, '', currentUrl); // Update the browser's URL without reloading the page
}


function render_msg(msg) {
	let html = "";
	if (msg.text !== null && msg.text !== undefined) {
		msg.text = marked(msg.text) // remove unnecessary tags
			.replace(/\n/g, "<br>")
			.replace(/(<br>)+$/, "");
		html = `
                <div class="mb-3">
                    <p>
                        <span class="alias font-semibold">${msg.username}</span>
                        <span class="stamp text-gray-400">${msg.time}</span>
                    </p>
                    <div class="msg">
                        ${msg.text}
                    </div>
                </div>
                `;
	} else { html = Mustache.render(msgTemplate, msg); }
	$messages.insertAdjacentHTML("beforeend", html); // insert the message into the div
}

function render_file(all) {
    let html = `
        <div class="file mb-3">
            <p>
                <span class="font-semibold">${all.username}</span>
                <span class="text-gray-400">${all.time}</span>
            </p>`;
            
    const type = all.filetype.split("/")[0];
    console.log(all.filetype);
	if (type === "image") {
        html += `
			<p><img src="${all.data}" alt="${all.filename}" class="max-w-full h-auto rounded-md" /></p>
        </div>`;
    } else if (type === "audio") {
        html += `
            <p>
                <audio controls class="max-w-full h-auto rounded-md" style="width: 100%; height: 50px;">
                    <source src="${all.data}" type="${all.filetype}">
                    Your browser does not support the audio tag.
                </audio>
            </p>
        </div>`;
    } else if (type === "video") {
        html += `
            <p>
                <video controls class="max-w-full h-auto rounded-md">
                    <source src="${all.data}" type="${all.filetype}">
                    Your browser does not support the video tag.
                </video>
            </p>
        </div>`;
    } else if (all.filetype === "application/pdf") {
        html += `
            <embed src="${all.data}" type="${all.filetype}" class="max-w-full h-auto rounded-md" style="width: 100%; height: 500px;"/> 
        </div>`;
    } else {
        html += `
            <p><a href="${all.data}" download="${all.filename}" 
            target="_blank" class="text-blue-400">${all.filename}</a></p>
        </div>`;
    }
    $messages.insertAdjacentHTML("beforeend", html);
}



// LISTEN FOR EVENTS FROM SERVER
socket.on('message', (message) => { render_msg(message); });
socket.on('location', (location) => {
    const html = Mustache.render(locTemplate, location);
    $messages.insertAdjacentHTML('beforeend', html);
});
socket.on('file', (all) => {
    try { render_file(all); } catch (error) { console.error("Error rendering template:", error); }
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
window.typing = typing; 
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
$msgFormInput.addEventListener('textarea', typing);




// SIDEBAR : room info and actions
function setupEventListeners() {
    const $banButtons = document.querySelectorAll('.ban');
    const $unbanButtons = document.querySelectorAll('.unban'); // select using

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

    const $chat = document.getElementById("chat");
    const $close = document.getElementById("close");

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
        if (item.type === "message") { render_msg(item); } 
        else if (item.type === "file") { render_file(item); }
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
        if (file.size > 100000000) { return alert('File can\'t be larger than 100MB.'); }
        const reader = new FileReader();
        reader.onload = function(event) {
            const all = {
                filename: file.name, 
                data: event.target.result, //  base64 encoded string
                filetype: file.type
            }
            let retries = 1;
            function sendFile() {
                socket.emit('file', all, (e) => {
                    if (e) {
                        if (retries > 0) {
                            retries--;
                            alert(`Error sending file. Retrying...`);
                            sendFile();
                        } else { alert(e); }
                    } else { $fileInput.value = ""; }
                });
            }
            sendFile();
        };
        reader.onerror = function() { alert('Error reading file. Please try again.'); };
        reader.readAsDataURL(file); // read the file as a data URL, trigger the onload event
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

