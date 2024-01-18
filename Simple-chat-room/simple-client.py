import threading as th
import socket as s
import time


# ip = input('IP address of the server: ')
ip = '127.0.0.1'    #localhost
client = s.socket(s.AF_INET, s.SOCK_STREAM)
alias = input("What do you wish to be called? - ") 
client.connect((ip, 8000))


def receive():
    '''Receive messages from the server.'''
    while 1:
        try:
            message = client.recv(1024).decode('utf-8')            
            if message == 'Your alias: ':
                client.send(alias.encode('utf-8'))                           
            else:
                print(message)    
                
        except:
            print("-------------------------------")
            print("Something's wrong. Closing.")
            client.close()   
            break     
                
                
def typing():
    '''Send messages to the server.'''
    while 1:
        message = f'[{alias}] {input()}'    
        client.send(message.encode('utf-8'))
        
        
receive = th.Thread(target = receive).start() 
time.sleep(1)    
typing = th.Thread(target = typing).start()   

                
                
                