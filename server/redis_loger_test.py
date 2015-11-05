import random
from time import sleep
from redislog import handlers, logger
l = logger.RedisLogger('loger_test')
l.addHandler(handlers.RedisHandler.to("log", host='192.168.1.12', port=6379))

msg_list = ['asdfasdf','randmom message', 'asdf 123123 asdf', "More randmom messages, this one is a full sentenc","123 234 456 567 123",'ALL CAPS THIS COULD BE BAD']

def print_msg(l):
	try:
		l.info("I am a message")	
	except:
		print("Error message")



if __name__ == '__main__':
	num_of_msgs = len(msg_list) - 1
	while 1:		
		ix = random.randint(0,num_of_msgs)
		l.info(msg_list[ix])
		sleep(1)


		ix = random.randint(0,num_of_msgs)
		l.debug(msg_list[ix])
		sleep(1)


		ix = random.randint(0,num_of_msgs)
		l.error(msg_list[ix])
		sleep(1)