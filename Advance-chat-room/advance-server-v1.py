import threading as th, socket as s, time, subprocess, re, os


def get_public_ip():
    try:
        result = subprocess.run(['ipconfig'], capture_output=True, text=True)
        output = result.stdout
        ipv4_pattern = r'IPv4 Address[.\s]+:\s+(\d+\.\d+\.\d+\.\d+)'
        match = re.search(ipv4_pattern, output)

        if match:
            ipv4_address = match.group(1)
            return ipv4_address
        else:
            print("IPv4 address not found.")
            return None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

clients = []
aliases = []
addresses = []

def get_ban():
    ban = {}
    try:
        with open("ban-v1.txt", 'r') as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) == 2:
                    username, ip_address = parts
                    ban[username] = ip_address
    except Exception as e:
        print(f"An error occurred while reading ban-v1.txt: {e}")
    return ban
    
        
password = '123'
public_ip = get_public_ip()


def stop_server():
    print('Server shutting down...')
    broadcast('Server shutting down...')
    os._exit(0)


def change_pass(passwd, client):
    global password
    password = passwd
    now = time.strftime("%H:%M:%S")
    print(f'[{now}] ADMIN password changed successfully.')
    client.send('Password changed successfully.'.encode('utf-8'))
    

def change_alias(alias, client, address):
    if alias in aliases:
        client.send('This alias has been taken.'.encode('utf-8'))
        return
    old_alias = aliases[clients.index(client)]
    broadcast(f'{old_alias} has changed to {alias}.')
    now = time.strftime("%H:%M:%S")
    print(f'[{now}] <{address}> - {old_alias} has changed to {alias}.')
    aliases[clients.index(client)] = alias


def unban(user, address, client):
    ban = get_ban()
    if user in ban:
        del ban[user]
        with open("ban-v1.txt", 'w') as f:
            for username, address in ban.items():
                f.write(f'{username} {address}\n')
                
        now = time.strftime("%H:%M:%S")
        client.send(f'[{now}] <{address}> - {user} has been unbanned.'.encode('utf-8'))
        broadcast(f'{user} has been unbanned.')
    else:
        client.send(f'User {user} is not in the banned users list.'.encode('utf-8'))
        

def kick(user, address, client):
    if user.upper() != 'ADMIN' and user != aliases[clients.index(client)]:                
        i = aliases.index(user)
        client_to_kick = clients[i]
        clients.remove(client_to_kick)   
        addresses.remove(address)     
        client_to_kick.send('You were kicked by ADMIN.'.encode('utf-8'))
        client_to_kick.close()
        aliases.remove(user)
            
        now = time.strftime("%H:%M:%S")
        print(f'[{now}] <{address}> - {user} was kicked.')
        broadcast(f'{user} was kicked by ADMIN.')
    else:
        client.send('You can\'t kick yourself.')


def broadcast(message):
    '''Display the message.'''  
    
    now = time.strftime("%H:%M:%S")
    if isinstance(message, bytes):
        message = message.decode('utf-8')            
    message = f'[{now}] {message}'
    for client in clients:   
        client.send(message.encode('utf-8'))


def connection(client, address, alias):
    '''Constantly get messages from clients.
    If a client is not connected anymore, it raises an exception, 
    removes that client and broadcasts everyone that someone just left.'''  
    
    now = time.strftime("%H:%M:%S")        
    print(f"[{now}] <{str(address)}> - ({alias}) has joined the chat.")
    while 1:
        try:
            msg = message = client.recv(1024).decode('utf-8')
            if msg.startswith('/alias'):
                change_alias(msg[7:], client, address)
            
            elif msg.startswith('/'):
                if msg.startswith('/kick'):
                    if aliases[clients.index(client)].upper() == 'ADMIN':
                        user = msg[6:]
                        if user in aliases:
                            kick(user, address, client)
                        else:
                            client.send(f'User {user} doesn\'t exist.'.encode('utf-8'))                               
                    else:
                        client.send('Command was refused.'.encode('utf-8'))
                
                elif msg.startswith('/banned'):
                    ban = get_ban()
                    if aliases[clients.index(client)].upper() == 'ADMIN':
                        client.send(f'Total: {len(ban)}'.encode('utf-8'))
                        for index, k in enumerate(ban, start=1):
                            client.send(f'{index}. {k}'.encode('utf-8')) 
                    else:
                        client.send('Command was refused.'.encode('utf-8'))                   
                    
                elif msg.startswith('/ban'):
                    if aliases[clients.index(client)].upper() == 'ADMIN':
                        user = msg[5:]
                        if user in aliases:
                            kick(user, address, client)
                            ban[user] = address   
                                                     
                            with open("ban-v1.txt",'a') as f:
                                f.write(f'{user} {address}\n')                            
                            now = time.strftime("%H:%M:%S")
                            print(f'[{now}] <{address}> - {user} was banned.')    
                            broadcast(f'{user} was banned by ADMIN.')  
                        else:
                            client.send(f'User {user} doesn\'t exist.'.encode('utf-8'))   
                    else:
                        client.send('Command was refused.'.encode('utf-8'))    
                         
                elif msg.startswith('/unban'):
                    if aliases[clients.index(client)].upper() == 'ADMIN':
                        user = msg[7:]
                        unban(user, address, client)            
                    else:
                        client.send('Command was refused.'.encode('utf-8')) 
                
                elif msg.startswith('/pass'):
                    if aliases[clients.index(client)].upper() == 'ADMIN':
                        change_pass(msg[6:], client)        
                    else:
                        client.send('Command was refused.'.encode('utf-8')) 
                
                elif msg.startswith('/q') or msg.startswith('/quit'):
                    if aliases[clients.index(client)].upper() == 'ADMIN':
                        stop_server()
                    else:
                        client.send('Command was refused.'.encode('utf-8')) 
                
                elif msg.startswith('/list'):
                    if aliases[clients.index(client)].upper() == 'ADMIN':
                        client.send(f'Total: {len(clients)}'.encode('utf-8'))
                        for k, (ad, al) in enumerate(zip(addresses, aliases), start=1):
                            #Also printing in the server screen to avoid interuption from messages of other clients.                           
                            client.send(f'{k}. <{ad}> {al}\n'.encode('utf-8'))
                            
                    else:
                        client.send('Command was refused.'.encode('utf-8'))                                                            
                else:
                    if aliases[clients.index(client)].upper() == 'ADMIN':
                        client.send('Available commands for ADMIN: /list, /ban, /banned, /unban, /kick'.encode('utf-8'))                                                                                                                            
            else:                                        
                broadcast(message)
                               
        except:
            if client in clients:
                i = clients.index(client)
                clients.remove(client)
                alias = aliases[i]
                aliases.remove(alias)
                addresses.remove(address)
                
                now = time.strftime("%H:%M:%S")
                print(f'[{now}] <{address}> - {alias} has left the chat.')
                broadcast(f'{alias} has left the chat.'.encode('utf-8'))
                break


def start():
    '''AF_INET : the address domain of the socket. 
    Indicate that socket can be used for communication between any hosts connected to the Internet.
    SOCK_STREAM : the type of socket. Means that data or characters are read in a continuous flow.'''

    server = s.socket(s.AF_INET, s.SOCK_STREAM)
    server.setsockopt(s.SOL_SOCKET, s.SO_REUSEADDR, 1)
    try:
        server.bind((public_ip, 8000))
    except Exception as e:
        print(f'An error occurred: {e}.')
        print("You should try to change the public_ip to 'localhost' at line 40.")
    server.listen(30)
    print("Server is running...")
    print(f'Your server IP address is: {public_ip}')

    while 1:   
        client, address = server.accept()
        client.send("alias".encode('utf-8'))
        alias = client.recv(1024).decode('utf-8')
        ban = get_ban()
            
        if alias in ban or address in ban.values():
            client.send('ban'.encode('utf-8'))
            client.close()
            continue            
        if alias.upper() == 'ADMIN':
            client.send('pass'.encode('utf-8'))
            passw = client.recv(1024).decode('utf-8')
            if passw != password:
                client.send('no'.encode('utf-8'))
                print('Someone tried to log in ADMIN.')
                client.close()
                continue   
                                            
        clients.append(client)       
        addresses.append(address)                
        aliases.append(alias)               
        client.send("Welcome to this chat room!\nYou're now connected to the server!".encode('utf-8'))
        client.send("-------------------------------\n".encode('utf-8'))
        broadcast(f"{alias} has joined the chat.".encode('utf-8'))           
        client_thread = th.Thread(target=connection, args=(client, address, alias))
        client_thread.start()


if __name__ == '__main__':
    start()
        
