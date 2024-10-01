# Python_Chat-Room

Python implementation of a simple chat room using TCP protocol. <br>
For fun only. I'm a newbie, please don't throw rocks. <br>

This repo first commit: [Jan 18, 2024](https://github.com/KlausJackson/Chat-Room/commits/main?after=2637ba4f72031e8af6516213d424f0ad5ac2f55d+69)

It's best to deploy this on a cloud or use locally. I had the chance to test it on 2 different machines and the code did not work as expected. The reason is because of firewalls, ports, etc.

## Credits

Original idea and code: [NeuralNine](https://www.youtube.com/@NeuralNine) <br>
Simple version: [Link to YouTube video](https://youtu.be/3UOyky9sEQY?si=ZfhIld_oTzGdTsgC) <br>
Advance version: [Link to YouTube video](https://youtu.be/F_JDA96AdEI?si=naX_kLDcCWYCMohQ) <br>

C++ version for anyone who's interested: [Link to Github repo](https://github.com/cjchirag7/chatroom-cpp) (only works on Linux/MacOs, doesn't have any features - at the time that I'm writing this line) <br>

Special thanks to NeuralNine for his valuable content and tutorials.

My version is a lot different from NeuralNine!
`/unban`, `/list`, `/banned`, `/shutdown` are ideas inspired by [Erkenbend's advance chat room version](https://github.com/Erkenbend/tcp-chat-room).

## Preview

Preview of the simple version scripts on the same machine using 3 command prompt windows.

![Python preview](example.png)

## Requirements

Python 3.8 or higher <br>
Libraries and Frameworks used in this repository:

- threading
- socket
- time

They're all Python default library so no need to install anything except for Python 3.8 or higher.

## Usage

Non-programmers can read [this short tutorial on how to setup Python environment if you haven't](../../README.md#how-to-setup-python-environment-for-non-programmers), ask AI or file an issue to get better instruction on how to run this app. <br>

There are 2 versions of the chat room: simple and advance.

**The simple version:** has no authorities or commands at all.

```terminal
python3 simple-server.py
```

```terminal
python3 simple-client.py
```

**The advance version:** has ADMIN role, 7 available commands (description of each command below) and 2 small versions of the server:

- v1: to connect dfference machines because `/ban` bans IP address.

  ``` terminal
  python3 advance-server-v1.py
  ```

- v2: can be used to run on the same machines with multiple terminal windows, `/ban` only bans alias, just log in under another alias.

  ```terminal
  python3 advance-server-v2.py
  ```

For the client side:

  ```terminal
  python3 advance-client.py
  ```

**How to run the code:** open the terminal in the location where you installed the code and type `python3 <name of the file>.py`.

**NOTE**:

- If you intent to use this chat room to handle many connections, I recommend using a database to store users' information and the banned users for better performance.
- You have to run the `server.py` first to be able to connect the clients together and chat.
- If you're running the scripts on the same machine, open separated terminal windows for each scripts.
- Remember to navigate to the directory containing the .py file first before you run the script.
- Ban list is in `ban-v[version name].txt`, edit it manually or use commands to change.
- Uncomment every `savelog` function if you don't want to save your server log to txt file.
- ADMIN password resets to 123 when you run `server.py` or you can use `pass.txt` file to store the password, so it doesn't change when you shutdown and restart the server. `pass.txt` should only be kept on the machine that keeps the server running. Locate the follwoing code (in `server.py`) then uncomment them for this to work:

  ```python
  with open('pass.txt', 'r') as f:
      password = f.read().strip()
      f.close()

    # inside `change_pass` function.    
  with open('pass.txt', 'w') as f:
      f.write(password)
      f.close()
  ```  

- When using `/list`, you can edit whether you want to view list of users in the server to be printed out in the server terminal or the ADMIN client terminal (in case you're far away from the server terminal to see the content in it) by editing the following code:

  ```python
    # printing in the server side to avoid interuption from messages of other clients.
    # print : print in the server side
    # client.send : print in the ADMIN client side
    elif msg.startswith('/list'):
      if aliases[clients.index(client)].upper() == 'ADMIN':
        client.send(f'Total: {len(clients)}'.encode('utf-8'))
        # print('Total:', len(clients))
        for k, (ad, al) in enumerate(zip(addresses, aliases), start=1):              
          client.send(f'{k}. <{ad}> {al}\n'.encode('utf-8'))
          # print(f'{k}. <{ad}> {al}') 
  ```

- You can edit `limit` to change the number of connections that you allow in your server. The orginal value is 30.
- You can edit the `port` if your 8000 port is already in used.

**Tip**:

- Open the folder that contains the script you need to run.
- From the path box, type 'cmd' or right-mouse, select `Open in Terminal`. Both works.

## Features

- `/help` : to show detail description of all the commands available.
- `/save_chat` : to save chat history is `save_chat = True` in `server.py`. This will be asked every time the server starts running.

These commands are for ADMIN only:

- `/kick` : to kick a user (only kick the user, you can still re-connect).
- `/ban` : to ban a user (only ban the alias - v2 server, ban IP address - v1 server).
- `/unban` : to unban a user. Still works even if that user is not online.
- `/list` : to show list of users in the server.
- `/banned` : to show list of users who are banned.
- `/pass` : to change your ADMIN password.
- `/shutdown` : to shut down the server.
- `/show_log` : to show the log of the server.
- `/save_log` : to save the log of the server.

One command that normal users can use but ADMIN can't:  

- `/whisper` : to send a private message to ADMIN (ADMIN can still read later when they're not online). You can use this to report someone or ask for help.
- `/alias` : to change your alias.

**NOTE**:

- Keep the server running, or ADMIN password will be back to default: 123 or you can modify the code like in #Usage.
- Banned list (`ban-v[version name].txt`) is still the same, edit it manually or use commands to change.
- Recent banned is always at the bottom of the file.

## How to Setup Python Environment (for non-programmers)

##### This tutorial is for Windows users, check out YouTube, ask AI if you use other operating system (Linux/MacOS)

- Download [Python on their website](https://www.python.org/downloads/) or Microsoft Store.
- Search for "Environment Variables" on your computer, click on the following: "Edit the system environment variables" > "Environment Variables" > "Path" (below "OS") > "Edit".
- Locate `python.exe`, `Scripts` and `site-packages` folders, add their paths to the system path (click on "New" in ""Edit environment variables" window). Click "OK" to save everything.
- SOMETIMES, the order of the path matters, so you need to move them up to the top.
- Open command prompt, use `python --version` and `pip --version` to verify that you have successfully setup your Python environment.

Check out YouTube tutorials, ask AI or file an issue if you still have questions.
