# Python_Chat-Room

[![Python Version](https://img.shields.io/badge/python-3.8-blue.svg)](https://www.python.org/downloads/release/python-380/) <br>
Python implementation of a simple chat room using TCP protocol. <br>
For fun only. I'm a newbie, please don't throw rocks. <br>

## Credits

Original idea and code: [NeuralNine](https://www.youtube.com/@NeuralNine) <br>
Simple version: [Link](https://youtu.be/3UOyky9sEQY?si=ZfhIld_oTzGdTsgC) <br>
Advance version: [Link](https://youtu.be/F_JDA96AdEI?si=naX_kLDcCWYCMohQ) <br>

Special thanks to NeuralNine for his valuable content and tutorials. <br>

My version is a little or maybe a lot different from NeuralNine. <br>
`/unban`, `/list`, `/banned`, `/quit` are ideas inspired by [Erkenbend's advance chat room version](https://github.com/Erkenbend/tcp-chat-room). <br>

## Requirements

Python 3
Libraries and Frameworks: 
- threading
- socket
- time <br>
How to install: open command prompt and type in `pip install <library name>` <br>

## Preview

Preview of the simple version scripts on the same machine using 3 command prompt windows. <br>

![Alt Text](example.png)

I haven't tried it on 2 different machines yet. <br>

## Usage

There are 2 versions of the chat room: simple and advance. <br>
The simple version has no authorities or commands at all (feel free to add commands by yourself by modifying the code). <br> 
The advance version has ADMIN role and 7 available commands (description of each command below) <br>

*How to run the code: You can use command prompt and type in `python <name of the file>.py` or you can use other platforms that run python files, as long as you have the python 3 version installed and its necessary libraries I mentioned above. <br>

**NOTE**: 
- You have to run the server.py first to be able to connect the clients together and chat. <br>
- If you're running the scripts on the same machine, open separated command prompt windows for each scripts. <br>
- Remember to change the ban.txt path at line 58, 133 and 215, and change '\' to '\\' for the path to work. <br>
- Remember to navigate to the directory containing the .py file first before you run the script. <br>
  
  **Tip**:
  - Open the folder that contains the script you need to run. <br>
  - From the path box, type 'cmd' and command prompt with the path we need will open itself. Or you can copy the path and type command `cd <path>`. Both works. <br>
  - To connect the clients together from other machines, get the public IP of the machine that runs server.py and edit `public_ip = 'localhost'`. The machines with the client.py can uncomment `ip = input('IP address of the server: ')` and remove or comment out `ip = '127.0.0.1'    #localhost` or just edit it.

## Features

These commands are for ADMIN only.
- `/kick` : to kick a user (only kick the user, you can still re-connect).
- `/ban` : to ban a user alias (which means you can use another alias to get right back in or you can modify the code to also ban the IP address).
- `/unban` : to unban a user.
- `/list` : to show list of users who are in the server.
- `/banned` : to show list of users who are banned.
- `/pass` : to change your ADMIN password.
- `/quit` or `/q` : to shut down the server. 
  
One command that normal users can use but ADMIN can't:  
- `/alias` : to change your alias.

**NOTE**: the server.py must be running all the time, otherwise every time you close it and run again, ADMIN password will be back to default: 123. But the banned list (ban.txt) is still the same, you can edit it manually or log in under ADMIN role and use the `/unban` command.

## The End

If you have any problem while running the code, feel free to file an issue. <br>

I will never add a function/feature to make someone an admin, there can only be one boss in a server. <br>
That's all I got. Enjoy!




