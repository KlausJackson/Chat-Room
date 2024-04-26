import threading as th
import socket as s
import time
import subprocess
import re

def get_public_ip():
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
            return None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None
    
clients = []
aliases = []
addresses = []
public_ip = get_public_ip()    


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
            message = client.recv(1024)
            broadcast(message)           
        except:
            i = clients.index(client)
            clients.remove(client)
            alias = aliases[i]
            aliases.remove(alias)
            print(f'{alias} has left the chat.'.encode('utf-8'))
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
                   
        if alias in aliases:
            client.send("no".encode('utf-8'))
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
   
    
      
    

        
