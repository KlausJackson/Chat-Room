import threading as th, socket as s, os, time

# the client side only send the message to the server, the server handles the message. 
# server side detects if the message is a command or not, based on the first character of the message.
# server side will send a message if the command is invalid or you're not authorized to use ADMIN commands.
# so handling commands on the client side is not necessary, except for /save_chat, /save_log, /pass.
            
def receive():
    '''Receive messages from the server.'''
    while 1:
        try:
            msg = client.recv(1024).decode('utf-8')     
            # if the message is 'alias', the client sends their alias to the server.    
            if msg == 'alias':
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
            
            elif 'log_' in msg[0:11]:
                timestamp, log = msg.split('+')
                with open(timestamp, 'a', encoding='utf-8') as f:
                    f.write(log)   
                    f.close() 
                                       
            else:
                print(msg)
                if msg == 'You were kicked by ADMIN.': os._exit(0)                             
                    
        except Exception as e:
            print("---------------------------------------------------------------")
            print(f"Something's wrong: {e}.\nClosing...")   
            os._exit(0)                     
               
                
                
def typing():
    '''Send messages to the server.'''
    global alias
    while 1:
        try:
            msg = input().strip()     

            if msg.startswith('/alias '): # 7 is the length of '/alias '.
                print('Changing alias...')
                if msg[7:] != '' and msg[7:] != 'ADMIN' and msg[7:] != alias and alias.upper() != 'ADMIN':
                # if you delete the above condition, the client side will probably freeze for a while.   
                    print('fhweghwr')
                    client.send(msg.encode('utf-8'))
                    if client.recv(1024).decode('utf-8') == 'Alias changed successfully!': 
                        alias = msg[7:] # update the new alias
                        print('hello')
                    else: print('Invalid alias. Please try again. Type /help to read *alias rules*.\n')
                else: print('Invalid alias. Please try again. Type /help to read *alias rules*.\n')
                

            elif msg.startswith('/shutdown') and alias.upper() == 'ADMIN':
                client.send(msg.encode('utf-8'))
                print('Shutting down the server.')
                os._exit(0)  
            
            
            elif msg.startswith('/pass') and alias.upper() == 'ADMIN' and msg[6:] != '':
                client.send(msg.encode('utf-8'))
                if not client.recv(1024).decode('utf-8').startswith('Invalid password.'):
                    confirmation = input("Type 'y' to confirm the new password, other to cancel:")
                    client.send(confirmation.encode('utf-8'))

            elif msg.startswith('save_log') and alias.upper() == 'ADMIN':
                timestamp, log = client.recv(1024).decode('utf-8').split('+')
                with open(timestamp, 'a') as f:
                    f.write(log)   
                    f.close()

            else: client.send(msg.encode('utf-8'))
                
        except Exception as e:
            print(f"Error: {e}.\nTry restarting the client if it crashes.\n") 
            break     
                    
                      

if __name__ == '__main__':
    ip = input('IP address of the server: ')
    # ip = 'localhost' or '127.0.0.1' if you're running the server on the same machine.
    client = s.socket(s.AF_INET, s.SOCK_STREAM)
    alias = input("What do you wish to be called? - ") 
    if alias.upper() == 'ADMIN': passw = input('Enter pass: ')
            
    client.connect((ip, 8000))
    receive = th.Thread(target = receive).start()     
    typing = th.Thread(target = typing).start()   
                
                
                
