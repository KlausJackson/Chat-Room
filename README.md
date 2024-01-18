# Python_Chat-Room

Python implementation of a simple chat room using TCP protocol. <br>
For fun only. I'm a newbie, please don't throw rocks.

## Credits

Original idea and code: [NeuralNine](https://www.youtube.com/@NeuralNine) <br>
Simple version: [Link](https://youtu.be/3UOyky9sEQY?si=ZfhIld_oTzGdTsgC) <br>
Advance version: [Link](https://youtu.be/F_JDA96AdEI?si=naX_kLDcCWYCMohQ)

Special thanks to NeuralNine for his valuable content and tutorials.

When I have time, I'm also gonna add some more cool features like [Erkenbend's advance chat room version](https://github.com/Erkenbend/tcp-chat-room)

## Requirements

Python 3
Libraries and Frameworks: 
- threading
- socket
- time
- requests  (You only need this library if you want to connect between multiple machines)

## Usage

I post 2 versions of the chat room, the more advance version currently has cool features like admin role (kick, ban user alias)

To be able to connect multiple machines to one server, the machine with the server.py file must uncomment all the code I commented. <br>
If you accidentally deleted them, you can download the code again or copy these:

```python

import requests

def get_ip():
    '''This commented code is for long distance connecting.
       Uncomment to use. '''
     try:
         response = requests.get('https://api64.ipify.org?format=json')
         data = response.json()
         return data['ip']
     except Exception as e:
         print(f"Error fetching public IP: {e}")
         return None
         
public_ip = get_ip()

```

**NOTE**: remember to comment out or remove the public_ip = 'localhost'.

## Features

These commands are for ADMIN accounts only.
- `/kick` : to kick a user (only kick the user, you can still re-connect)
- `/ban` : to ban a user alias (which means you can use another alias to get right back in)

That's all I got.




