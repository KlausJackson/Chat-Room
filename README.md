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

## Preview

This is when I run the scripts on the same machine using 3 command prompt windows.

![Alt Text](example.png)

I haven't tried it on 2 different machines yet.

## Usage

I post 2 versions of the chat room, the more advance version currently has cool features like admin role (kick, ban user alias)

*How to run the code: You can use command prompt and type in `python <name of the file>.py` or you can use other platforms that run python files, as long as you have the python 3 version installed and its necessary libraries I mentioned above.

**NOTE**: 
- You have to run the server.py first to be able to connect the clients together and chat.
- If you're running the scripts on the same machine, open separated command prompt windows for each scripts.
- Remember to navigate to the directory containing the .py file first before you run the script.

*To be able to connect multiple machines to one server, follow these steps: <br>

1. The machine with the server.py file must uncomment all the code I commented. <br>
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

**NOTE**: remember to comment out or remove the `public_ip = 'localhost'`.

2. The machines with the client.py must uncomment `ip = input('IP address of the server: ')` and remove or comment out `ip = '127.0.0.1'    #localhost`.


## Features

These commands are for ADMIN accounts only.
- `/kick` : to kick a user (only kick the user, you can still re-connect)
- `/ban` : to ban a user alias (which means you can use another alias to get right back in)

That's all I got. Enjoy!




