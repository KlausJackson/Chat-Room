import threading as th, socket as s, time, subprocess, re, os

# get_public_ip function note:
# Advance version: not recommended if you plan to run server.py and client.py on the same machine because the ban 
# function bans the IP address, causes the server to be unable to connect to itself -> crash.

# Simple version: works fine because no ban function. If you want ban command then use advance version (v2)
# because it only bans alias.

port = 55555 # you can change the port number if you want to.
limit = 30 # the server can only accept 30 connections. You can change this number if you want to.


def get_public_ip():
    '''Get the public IP address of the server.'''
    try:
        # Run ipconfig command to get network interface information
        result = subprocess.run(['ipconfig'], capture_output=True, text=True)
        output = result.stdout

        # Use regular expressions to find IPv4 address in the output
        ipv4_pattern = r'IPv4 Address[.\s]+:\s+(\d+\.\d+\.\d+\.\d+)'
        match = re.search(ipv4_pattern, output)

        if match:
            ipv4_address = match.group(1)
            return ipv4_address
        else:
            print("IPv4 address not found.")
            return False
    except Exception as e:
        print(f"An error occurred: {e}")
        return False
    
    
clients = [] # store the clients
aliases = [] # store the aliases
addresses = [] # store the addresses

# public_ip = get_public_ip()
# if not public_ip:
#     public_ip = 'localhost'    
public_ip = '0.0.0.0' # listens on all interfaces.

def broadcast(message, now):
    '''Display the message.'''  
    if isinstance(message, bytes):
        message = message.decode('utf-8')
    for client in clients:
        client.send(f'--------------------------------'.encode('utf-8'))   
        client.send(f'[{now}] {message}'.encode('utf-8'))


def connection(client, address, alias):
    '''Constantly get messages from clients.
    If a client is not connected anymore, it raises an exception, 
    removes that client and broadcasts everyone that someone just left.'''  
    
    now = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())       
    while 1:
        try:
            message = client.recv(1024).decode('utf-8').strip()
            broadcast(f'[{alias}] {message}', now)           
        except Exception as e:
            print(f"An error occurred: {e}.")
            i = clients.index(client)
            clients.remove(client)
            alias = aliases[i]
            aliases.remove(alias)
            addresses.remove(address)
            print(f'[{now}] <{address}> - {alias} has left the chat.')
            broadcast(f'{alias} has left the chat.'.encode('utf-8'), now)
            break


def go():
    '''AF_INET : the address domain of the socket. 
    Indicate that socket can be used for communication between any hosts connected to the Internet.
    SOCK_STREAM : the type of socket. Means that data or characters are read in a continuous flow.'''  
      
    server = s.socket(s.AF_INET, s.SOCK_STREAM)
    server.setsockopt(s.SOL_SOCKET, s.SO_REUSEADDR, 1)
    try:
        server.bind((public_ip, port))
        server.listen(limit) # the server can only accept 30 connections.
        print("Server is running...")
        print(f"Server is using port {port}.")
        print(f'Your server IP address is: {public_ip}')
        
        
        while 1:       
            client, address = server.accept()
            client.send("alias".encode('utf-8')) # send 'alias' to the client as a signal for client to send their alias.
            alias = client.recv(1024).decode('utf-8') # get the alias of the client.
                    
            if alias in aliases:
                client.send("no".encode('utf-8')) # if the alias is already taken, send 'no' to the client.
                client.close()           
                continue     
                                            
            clients.append(client)       
            addresses.append(address)                
            aliases.append(alias)     
            now = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())  
            
            client.send("Welcome to this chat room!\nYou're now connected to the server!".encode('utf-8'))
            client.send("-------------------------------\n".encode('utf-8'))
            print(f"[{now}] <{str(address)}> - ({alias}) has joined the chat.")
            broadcast(f"{alias} has joined the chat.".encode('utf-8'), now)        
            
            client_thread = th.Thread(target=connection, args=(client, address, alias))
            client_thread.start()        
        
    except Exception as e:
        print(f'An error occurred: {e}.')
        server.close()
        os._exit(0)
    

if __name__ == '__main__':
    go()
   
    
      
    

        
