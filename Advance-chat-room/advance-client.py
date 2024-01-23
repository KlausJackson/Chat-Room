import threading as th
import socket as s
import os

# ip = input('IP address of the server: ')
ip = '127.0.0.1'    #localhost
client = s.socket(s.AF_INET, s.SOCK_STREAM)
alias = input("What do you wish to be called? - ") 
if alias.upper() == 'ADMIN':
    passw = input('enter pass: ')
      
client.connect((ip, 8000))


def receive():
    '''Receive messages from the server.'''
    while 1:
        try:
            message = client.recv(1024).decode('utf-8')            
            if message == 'alias':
                client.send(alias.encode('utf-8'))                           
                resp = client.recv(1024).decode('utf-8')
                    
                if resp == 'pass':
                    client.send(passw.encode('utf-8'))
                    if client.recv(1024).decode('utf-8') == 'no':
                        print('Connection refused.')
                        os._exit(0)                                                                           
                elif resp == 'ban':
                    print('Connection refused. You\'re banned from the server.') 
                    os._exit(0)  
                                       
            else:
                print(message)
                if message == 'You were kicked by ADMIN.':
                    os._exit(0)                             
                    
        except Exception as e:
            print("-------------------------------")
            print(f"Something's wrong: {e}. Closing...")   
            os._exit(0)                     
                
                
def typing():
    '''Send messages to the server.'''
    global alias
    while 1:
        message = f'[{alias}] {input()}'            
            
        if message[len(alias) + 3:].startswith('/'):    
            if message[len(alias) + 3:].startswith('/alias'):
                if alias.upper() == 'ADMIN':
                    print('You can\'t change your alias because you\'re ADMIN.')
                elif message[len(alias) + 3 + 7:].upper() == 'ADMIN':
                    print('You can\'t do that, you\'re not an ADMIN.')
                else:    
                    client.send(message[len(alias) + 3:].encode('utf-8'))
                    print(f'You\'ve changed your alias from {alias} to {message[len(alias) + 3 + 7:]}')
                    alias = message[len(alias) + 3 + 7:]
                    
            elif alias.upper() == 'ADMIN':
                if message[len(alias) + 3:].startswith('/pass'):
                    client.send(message[len(alias) + 3:].encode('utf-8'))    
                else:
                    client.send(f'{message[len(alias) + 3:]}'.encode('utf-8'))                        
                    if message[len(alias) + 3:].startswith('/q'):
                        print('Shutting down the server.')
                        os._exit(0)                    

            else:
                print('Commands are for ADMIN only.')
        else:
            client.send(message.encode('utf-8'))    
                
        
receive = th.Thread(target = receive).start()     
typing = th.Thread(target = typing).start()   
                
                
                
