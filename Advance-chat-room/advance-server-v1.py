import threading as th, socket as s, time, subprocess, re, os, bcrypt


port = 8000 # you can change the port number.
limit = 30 # the server can only accept 30 connections. You can change this number.


def get_public_ip():
    '''Get the public IP address of the server.
       If the public IP address is not found, use 'localhost' as default.'''
    try:
        result = subprocess.run(['ipconfig'], capture_output=True, text=True)
        output = result.stdout
        ipv4_pattern = r'IPv4 Address[.\s]+:\s+(\d+\.\d+\.\d+\.\d+)'
        match = re.search(ipv4_pattern, output)

        if match:
            ipv4_address = match.group(1)
            return ipv4_address
        else:
            print("IPv4 address not found. Using 'localhost' as default.")
            return False
    except Exception as e:
        print(f"An error occurred: {e}")
        print("using 'localhost' as default.")
        return False


help = """
Advanced Chat Room v1

Commands for all users:
/help : to show this help message.
/save_chat : to save the chat log.

These commands are for ADMIN only:

/kick : to kick a user.
/ban : to ban a user (only ban the alias - v2 server, ban IP address - v1 server).
/unban : to unban a user.
/list : to show list of users who are in the server.
/banned : to show list of users who are banned.
/show_log : to show the log of the server.
/save_log : to save the log of the server.
/pass : to change your ADMIN password. Wait for input field to enter your new password.
/shutdown : to shut down the server.

*Password rules*
1. Password can't be the same as your old password.
2. Password can't be an empty string.
3. Password is stripped of leading and trailing whitespaces.

One command that normal users can use but ADMIN can't: 
/alias : to change your alias.
/whisper : to send a private message to ADMIN (ADMIN can still read later when they're not online). You can use this to report someone or ask for help. ADMIN will use chat log and ban the user if necessary.

*Alias rules*
1. Alias can't be 'ADMIN'.
2. Alias can't be an empty string.
3. Alias can't be the same as other users' alias.
4. Alias is stripped of leading and trailing whitespaces.
5. Alias can't be the same as your old alias.

Author: Klaus Jackson (https://github.com/KlausJackson)
For more infomation about this TCP Chat Room, visit https://github.com/KlausJackson/Chat-Room
"""


clients = [] # store the clients.
aliases = [] # store the aliases of the clients.
addresses = [] # store the IP address of the clients.


def savelog(text):
    with open(f'serverlog_{timestamp}', 'a', encoding='utf-8') as f:
        f.write(text + '\n')
        f.close()


def get_ban():
    ban = {}
    try:
        with open("ban-v1.txt", 'r', encoding='utf-8') as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) == 2:
                    username, ip_address = parts
                    ban[username] = ip_address
            f.close()
            
    except Exception as e:
        text = f"An error occurred while reading ban-v1.txt: {e}"
        print(text)
        savelog(text)
    return ban
    
        
password = '123'  # you can create a pass.txt file or something to store the password, so it doesn't change when you shutdown and restart the server.
# with open('pass.txt', 'r', encoding='utf-8') as f:
#     password = f.read().strip()
#     f.close()
    
    
public_ip = get_public_ip()  # edit here
# example: public_ip = 'localhost' 
if not public_ip:
    public_ip = 'localhost'
    

def stop_server(now):
    text = f'[{now}] - Server shutting down...'
    print(text)
    savelog(text)
    broadcast('Server shutting down...', now)
    os._exit(0)


def change_pass(passwd, client, now):
    global password
    password = passwd
    # with open('pass.txt', 'w') as f:
    #     f.write(password)
    #     f.close()
    text = f'[{now}] ADMIN password changed successfully.'
    print(text)
    savelog(text)
    client.send('Password changed successfully.\n'.encode('utf-8'))
    

def change_alias(alias, client, address, now):
    old_alias = aliases[clients.index(client)]
    broadcast(f'{old_alias} has changed to {alias}.', now)
    text = f'[{now}] <{address}> - {old_alias} has changed to {alias}.'
    print(text)
    savelog(text)
    print('saving')
    aliases[clients.index(client)] = alias
    print(aliases[clients.index(client)])
    client.send('Alias changed successfully!\n'.encode('utf-8'))


def unban(user, user_ip, client, now):
    ban = get_ban() # get the banned users list from the file.
    if user in ban: # check if the user is in the banned users list.
        del ban[user] # remove the user from the banned users list.
        with open("ban-v1.txt", 'w', encoding='utf-8') as f:
            for banned_user, banned_ip in ban.items():
                f.write(f'{banned_user} {banned_ip}\n')
            f.close()

        broadcast(f'{user} has been unbanned.', now)
        text = f'[{now}] <{user_ip}> - {user} has been unbanned.'
        print(text)
        savelog(text)
    else:
        client.send(f'User {user} is not in the banned users list.'.encode('utf-8'))
    del ban # free up memory
        

def kick(user, user_ip, now):               
    i = aliases.index(user)
    client_to_kick = clients[i] 
    clients.remove(client_to_kick)   
    addresses.remove(user_ip)     
    client_to_kick.send('You were kicked by ADMIN.'.encode('utf-8'))
    client_to_kick.close() # close the connection
    aliases.remove(user)
    text = f'[{now}] <{user_ip}> - {user} was kicked.'
    print(text)
    savelog(text)
    broadcast(f'{user} was kicked by ADMIN.', now)


def broadcast(message, now):
    '''Display the message.'''  
    if isinstance(message, bytes):
        message = message.decode('utf-8')
    for client in clients:   
        client.send(f'[{now}] {message}'.encode('utf-8'))


def connection(client, address, alias):
    '''Constantly get messages from clients.
    If a client is not connected anymore, it raises an exception, 
    removes that client and broadcasts everyone that someone just left.'''  
    
    now = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())   
    while 1:
        try:
            msg = message = client.recv(1024).decode('utf-8').strip()
            
            if msg.startswith('/'):
                if msg.startswith('/help'):
                    client.send(help.encode('utf-8'))
                    
                elif msg.startswith('/save_chat'):
                    if save_chat:
                        with open(f'chatlog_{timestamp}', 'r', encoding='utf-8') as f:
                            client.send(f'chatlog_{timestamp}+{f.read()}'.encode('utf-8'))
                            client.send('Chat log saved succesfully.\n'.encode('utf-8'))
                            f.close()   

                else: 
                    # COMMANDS FOR ADMIN
                    if alias.upper() == 'ADMIN':
                        if msg.startswith('/shutdown'):
                            stop_server(now)
                            
                            
                        # print : print in the server side
                        # client.send : print in the ADMIN client side  
                        elif msg[1:] == 'list':
                            client.send(f'Total: {len(clients)}'.encode('utf-8'))
                            # print('Total:', len(clients))
                            for k, (ad, al) in enumerate(zip(addresses, aliases), start=1):              
                                client.send(f'{k}. <{ad}> {al}\n'.encode('utf-8'))
                                # print(f'{k}. <{ad}> {al}')                        
                        
                        
                        elif msg[1:] == 'save_log' or msg[1:] == 'show_log':
                            with open(f'serverlog_{timestamp}', 'r', encoding='utf-8') as f:
                                client.send(f'serverlog_{timestamp}+{f.read()}'.encode('utf-8'))
                                f.close()
                        
                        
                        elif msg.startswith('/kick'):
                            user = msg[6:] # get the alias
                            if user in aliases and user != aliases[clients.index(client)]: 
                            # check if the alias exists and not the ADMIN alias because ADMIN can't kick themselves.
                                # get the user's index in the aliases list then get the IP address using the index
                                kick(user, addresses[aliases.index(user)], now)
                            else:
                                client.send(f'User {user} doesn\'t exist.\n'.encode('utf-8'))                         
                        
                        
                        elif msg[1:] == 'banned':
                            ban = get_ban()
                            client.send(f'Total: {len(ban)}'.encode('utf-8'))
                            # print('Total:', len(ban))
                            for index, k in enumerate(ban, start=1):
                                client.send(f'{index}. {k}'.encode('utf-8'))
                                # print(f'{index}. {k}')
                            client.send('\n'.encode('utf-8'))
                            del ban # free up memory
                        
                        
                        elif msg.startswith('/ban'):
                            user = msg[5:] # get the alias
                            if user in aliases and user != aliases[clients.index(client)]: 
                            # check if the alias exists and not the ADMIN alias because ADMIN can't ban themselves.
                                # get the user's index in the aliases list then fetch the IP address using the index.
                                user_ip = addresses[aliases.index(user)]
                                kick(user, user_ip, now) # kick the user
        
                                with open("ban-v1.txt",'a', encoding='utf-8') as f: # append the banned user to the file.
                                    f.write(f'{user} {user_ip}\n') # save the alias in case ADMIN remember the alias along with what they did to derseve the ban or they banned the wrong person and want to undo that action but they only know the alias.         
                                    f.close()
                                    
                                text = f'[{now}] <{user_ip}> - {user} was banned.'                  
                                print(text)    
                                savelog(text)
                                broadcast(f'{user} was banned by ADMIN.', now)  
                            else:
                                client.send(f'User {user} doesn\'t exist.\n'.encode('utf-8'))  
                            
                            
                        elif msg.startswith('/unban'):
                            user = msg[7:] # get the alias
                            if user in aliases and user != aliases[clients.index(client)]:
                                unban(user, addresses[aliases.index(user)], client, now)
                            
                        elif msg.startswith('/pass'):
                            passw = msg[6:] # get the new password
                            if passw == password or passw == '':
                                client.send('no'.encode('utf-8'))
                            else:
                                client.send('yes'.encode('utf-8'))
                                if client.recv(1024).decode('utf-8').lower() == 'y':
                                    change_pass(passw, client, now)
                                else:
                                    client.send('Password change was cancelled.\n'.encode('utf-8'))


                        elif msg.startswith('/showpass'):
                            client.send(f'Your password is: {password}\n'.encode('utf-8'))
                        else:
                            client.send('Invalid command or this command is for normal users only.'.encode('utf-8'))
                        
                    else: # COMMANDS FOR NORMAL USERS
                        if msg.startswith('/alias ') and msg[7:] != '' and msg[7:] not in aliases and msg[7:] != alias and msg[7:].upper() != 'ADMIN':
                            change_alias(msg[7:].strip(), client, address, now)
                            
                        elif msg.startswith('/whisper ') and msg[9:] != '':
                            text = f'[{now}] <{address}> - {alias} whispers: {msg[9:].strip()}'
                            print(text)     
                            savelog(text)    
                            client.send('Whisper sent.\n'.encode('utf-8')) 
                        else:
                            client.send('Invalid command (use /help to understand how to use commands) or you can\'t use ADMIN commands.\n'.encode('utf-8'))                            
          
            else:                                        
                broadcast(f'[{alias}] {message}', now)
                if save_chat:
                    with open(f'chatlog_{timestamp}', 'a', encoding='utf-8') as f:
                        f.write(f'[{now}] [{alias}] {message}\n')
                        f.close()  
                               
        except Exception as e:
            # if a client is not connected anymore, remove that client.
            print(f"An error occurred: {e}.")
            if client in clients:
                i = clients.index(client)
                clients.remove(client)
                alias = aliases[i]
                aliases.remove(alias)
                addresses.remove(address)
                text = f'[{now}] <{address}> - {alias} has left the chat.'
                print(text)
                savelog(text)
                broadcast(f'{alias} has left the chat.'.encode('utf-8'), now)
                break



def start():
    '''AF_INET : the address domain of the socket. 
    Indicate that socket can be used for communication between any hosts connected to the Internet.
    SOCK_STREAM : the type of socket. Means that data or characters are read in a continuous flow.'''

    server = s.socket(s.AF_INET, s.SOCK_STREAM)
    server.setsockopt(s.SOL_SOCKET, s.SO_REUSEADDR, 1)
    try:
        server.bind((public_ip, port))
    except Exception as e:
        print(f'An error occurred: {e}.')
        print("You should try to change the public_ip to 'localhost'.")
        
    server.listen(limit)
    global timestamp 
    timestamp = f'{time.strftime("%Y-%m-%d_%H-%M-%S")}.txt'
    text = f'''
    Time : {time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())}
    Server is running...
    Server is using port {port}.
    Your server IP address is: {public_ip}.
    '''
    print(text)
    savelog(text)


    while 1:   
        client, address = server.accept()
        client.send("alias".encode('utf-8'))
        alias = client.recv(1024).decode('utf-8')
        now = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())   
        ban = get_ban() 
        
        if (address in ban.values()) or alias in aliases or alias == '':
            client.send('ban'.encode('utf-8'))
            client.close()
            continue          
          
        if alias.upper() == 'ADMIN': # if the alias is ADMIN, ask for the password.
            client.send('pass'.encode('utf-8'))
            passw = client.recv(1024).decode('utf-8') # get the password from the client.
            if passw != password: # if the password is wrong, close the connection.
                client.send('no'.encode('utf-8'))
                text = f'[{now}] - Someone tried to log in ADMIN.'
                print(text)
                savelog(text)
                client.close()
                continue    
                                            
        clients.append(client)       
        addresses.append(address)                
        aliases.append(alias)
                       
        hello = f'''
        ---------------------------------------------------------------
        Welcome to this chat room! You're now connected to the server!
        Type /help to see every commands available and how to use them.
        Save chat mode is set to {save_chat}.
        ---------------------------------------------------------------
        '''      
        client.send(f'\n{hello}\n'.encode('utf-8'))
        
        text = f'[{now}] <{str(address)}> - ({alias}) has joined the chat.'    
        print(text)
        savelog(text)
        broadcast(f"{alias} has joined the chat.".encode('utf-8'), now)           
        client_thread = th.Thread(target=connection, args=(client, address, alias))
        client_thread.start()
        

if __name__ == '__main__':
    a = ''
    while a != 'y' and a != 'n': # save the chat log to a file.
        a = input('Do you want to save the chat log? (y/n): ')
        if a == 'y':
            save_chat = True
        elif a == 'n':
            save_chat = False
        else:
            print('Invalid input. Please enter y or n.')
    start()
        
