import threading as th, socket as s, os

ip = input('IP address of the server: ').strip()
# ip = '127.0.0.1' # or 'localhost'
client = s.socket(s.AF_INET, s.SOCK_STREAM)
alias = input("What do you wish to be called? - ").strip() 
client.connect((ip, 55555))

def receive():
    '''Receive messages from the server.'''
    while 1:
        try:
            message = client.recv(1024).decode('utf-8')      
            # if the message is 'alias', the client sends their alias to the server.      
            if message == 'alias': 
                client.send(alias.encode('utf-8'))
                resp = client.recv(1024).decode('utf-8')     
                if resp == 'no':
                    print('Connection refused. This alias has been taken already, Please try again.') 
                    os._exit(0)                                            
            else:
                print(message)    
                
        except:
            print("-------------------------------")
            print("Something's wrong. Closing.")
            client.close()   
            os._exit(0)     
                
                
def typing():
    '''Send messages to the server.'''
    while 1:
        message = input().strip()
        if message == '/exit':
            client.close()
            break
        client.send(message.encode('utf-8'))
        
        
if __name__ == '__main__': 
    receive = th.Thread(target = receive).start() 
    typing = th.Thread(target = typing).start()   

                
                
                