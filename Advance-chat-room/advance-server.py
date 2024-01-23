import threading as th
import socket as s
import time
import requests
import os


clients = []
aliases = []
addresses = []
#Change the path for ban.txt here
with open("E:\\Newfolder\\Files\\Github\\Python_Chat-Room\\Advance-chat-room\\ban.txt", 'r') as f:
    ban = [name.strip() for name in f.readlines()]
password = '123'


# def get_ip():
#    '''This commented code is for long distance connecting.
#       Uncomment to use. '''
#     try:
#         response = requests.get('https://api64.ipify.org?format=json')
#         data = response.json()
#         return data['ip']
#     except Exception as e:
#         print(f"Error fetching public IP: {e}")
#         return None
# public_ip = get_ip()
public_ip = 'localhost'     #Comment this line if you want long distance connection.


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
    old_alias = aliases[clients.index(client)]
    broadcast(f'{old_alias} has changed to {alias}.')
    now = time.strftime("%H:%M:%S")
    print(f'[{now}] <{address}> - {old_alias} has changed to {alias}.')
    aliases[clients.index(client)] = alias


def unban(user, address):
    if user in ban:
        ban.remove(user)
        #Change the path for ban.txt here
        with open("E:\\Newfolder\\Files\\Github\\Python_Chat-Room\\Advance-chat-room\\ban.txt", 'w') as f:
            for banned in ban:
                f.write(f'{banned}\n')
                
        now = time.strftime("%H:%M:%S")
        print(f'[{now}] <{address}> - {user} has been unbanned.')
        broadcast(f'{user} has been unbanned.')
    else:
        print(f'User {user} is not in the banned users list.')
        

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
                    if aliases[clients.index(client)].upper() == 'ADMIN':
                        print('Total: ', len(ban))
                        for index, k in enumerate(ban, start=1):
                            print(f'{index}. {k}')
                            client.send(f'{index}. {k}'.encode('utf-8')) 
                    else:
                        client.send('Command was refused.'.encode('utf-8'))                   
                    
                elif msg.startswith('/ban'):
                    if aliases[clients.index(client)].upper() == 'ADMIN':
                        user = msg[5:]
                        if user in aliases:
                            kick(user, address, client)
                            ban.append(user)   
                                                     
                            #Change the path for ban.txt here
                            with open("E:\\Newfolder\\Files\\Github\\Python_Chat-Room\\Advance-chat-room\\ban.txt",'a') as f:
                                f.write(f'{user}\n')                            
                            now = time.strftime("%H:%M:%S")
                            print(f'[{now}] <{address}> {user} was banned.')    
                            broadcast(f'{user} was banned by ADMIN.')  
                        else:
                            client.send(f'User {user} doesn\'t exist.'.encode('utf-8'))   
                    else:
                        client.send('Command was refused.'.encode('utf-8'))    
                         
                elif msg.startswith('/unban'):
                    if aliases[clients.index(client)].upper() == 'ADMIN':
                        user = msg[7:]
                        unban(user, address)            
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
                        print('Total: ', len(clients))
                        for k, (ad, al) in enumerate(zip(addresses, aliases), start=1):
                            #Also printing in the server screen to avoid interuption from messages of other clients.
                            print(f'{k}. <{ad}> {al}')                             
                            client.send(f'{k}. <{ad}> {al}'.encode('utf'))
                            
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
    server.bind((public_ip, 8000))
    server.listen(5)
    print("Server is running...")
    print(f'Your server IP address is: {public_ip}')

    while 1:    
        client, address = server.accept()
        client.send("alias".encode('utf-8'))
        alias = client.recv(1024).decode('utf-8')
        #Change the path for ban.txt here
        with open("E:\\Newfolder\\Files\\Github\\Python_Chat-Room\\Advance-chat-room\\ban.txt",'r') as f:
            bans = f.readlines()
            
        if alias+'\n' in bans:
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
        
