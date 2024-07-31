import threading as th, socket as s, os


ip = input('IP address of the server: ')
# ip = '127.0.0.1'    #localhost
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
            # if the message is 'alias', the client sends their alias to the server.    
            if message == 'alias':
                client.send(alias.encode('utf-8'))                           
                resp = client.recv(1024).decode('utf-8')
                
                # after sending the alias, the client sends their password to the server.    
                if resp == 'pass':
                    client.send(passw.encode('utf-8'))
                    if client.recv(1024).decode('utf-8') == 'no':
                        print('Connection refused. Wrong password.')
                        os._exit(0)                                                                           
                elif resp == 'ban':
                    print('Connection refused. You\'re either banned from the server or this alias has been taken already or an empty string, Please try again.') 
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
            # change alias (only for non-ADMIN)
            if message[len(alias) + 3:].startswith('/alias'):
                if alias.upper() == 'ADMIN':
                    print('You can\'t change your alias because you\'re ADMIN.')
                elif message[len(alias) + 3 + 7:].upper() == 'ADMIN':
                    print('You can\'t do that, you\'re not an ADMIN.')
                else:    
                    client.send(message[len(alias) + 3:].encode('utf-8'))
                    alias = message[len(alias) + 3 + 7:]  
            
            # check if the alias is ADMIN, the commands still won't work if you modify this file
            # because the server is what checks the commands, not the client.                 
            elif alias.upper() == 'ADMIN':
                
                # commands that don't need any parameters
                if message[len(alias) + 3:].startswith('/pass'): # change password
                    client.send(message[len(alias) + 3:].encode('utf-8'))    
                elif message[len(alias) + 3:].startswith('/showpass'): # show password
                    client.send(message[len(alias) + 3:].encode('utf-8')) 
                elif message[len(alias) + 3:].startswith('/q'): # quit
                    print('Shutting down the server.')
                    os._exit(0)                     
                
                # commands that need parameters, ex: /kick <alias>      
                else:    
                    client.send(f'{message[len(alias) + 3:]}'.encode('utf-8'))                        
            else:
                print('Commands are for ADMIN only.')
        else:
            client.send(message.encode('utf-8'))    
                
        
receive = th.Thread(target = receive).start()     
typing = th.Thread(target = typing).start()   
                
                
                
