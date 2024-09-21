import threading as th, socket as s, os, time


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
                with open(timestamp, 'a') as f:
                    f.write(log)   
                    f.close() 
                                       
            else:
                print(msg)
                if msg == 'You were kicked by ADMIN.':
                    os._exit(0)                             
                    
        except Exception as e:
            print("-------------------------------")
            print(f"Something's wrong: {e}. Closing...")   
            os._exit(0)                     
                
                
def typing():
    '''Send messages to the server.'''
    global alias
    while 1:
        msg = input()     
               
        if msg.startswith('/alias'):
            if alias.upper() == 'ADMIN': # check if the alias is ADMIN
                print('ADMIN can\'t change their alias.')
            elif msg[7:].upper() == 'ADMIN': # check if the new alias is ADMIN
                # 7 is the length of '/alias '.
                print('You can\'t pretend to be ADMIN.')
            else:    
                client.send(msg.encode('utf-8'))
                if client.recv(1024).decode('utf-8') == 'yes': # recieve confirmation from the server
                    alias = msg[7:] # update the new alias
                # check if client receive the response from the server or not about alias already been taken or an empty string.
            
        elif msg.startswith('/shutdown'):
            if alias.upper() == 'ADMIN':
                client.send(msg.encode('utf-8'))
                print('Shutting down the server.')
                os._exit(0)  
        
        elif msg.startswith('/pass'):
            if alias.upper() == 'ADMIN':
                client.send(msg.encode('utf-8'))
                # check for error if the user receive the response from the server or not.
                if client.recv(1024).decode('utf-8') == 'no':
                    print('1. Password can\'t be the same as your old password.')
                    print('2. Password can\'t be an empty string.')
                elif client.recv(1024).decode('utf-8') == 'yes':
                    confirmation = input("Type 'y' to confirm the new password, other to cancel:")
                    client.send(confirmation.encode('utf-8'))

        elif msg.startswith('save_log'):
            all_lines = client.recv(1024).decode('utf-8')
            now = time.localtime() # save time of the log.
            with open('serverlog_'+str(now.strftime("%Y-%m-%d_%H-%M-%S"))+'.txt', 'a') as f:
                f.write(all_lines)   
                f.close()

        else:
            client.send(msg.encode('utf-8'))    
                
        
receive = th.Thread(target = receive).start()     
typing = th.Thread(target = typing).start()   
                
                
                
