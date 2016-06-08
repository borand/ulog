"""ulogserver.py -

Main webserver for ulogserver

Usage:
  ulogserver.py [--port=PORT] [--host=HOST]

Options:
  --port=PORT  [default: 8888]

"""

from __future__ import print_function
import uuid
import tornado.httpserver
import tornado.web
import tornado.websocket
import tornado.ioloop
import tornado.gen
import logging
import tornadoredis
import os
import re
import logbook
import simplejson

from docopt import docopt

from redis import Redis

#define("port", default=8888, help="run on the given port", type=int)

def get_host_ip():
    """
    parses ifconfig system command and returns host ip
    """
    return '0.0.0.0'
    # ip_exp = re.compile(r'(?:eth\d.*?inet addr\:)(\d{1,3}\.\d{1,3}.\d{1,3}.\d{1,3})',re.DOTALL)
    # ip_out = ip_exp.findall(sh.ifconfig().stdout)
    # if len(ip_out) > 0:
    #     return  ip_out[0]
    # else:
    #     return '127.0.0.1'

##########################################################################################
#
#
log = logbook.Logger('ulogserver.py')
redis_host_ip = get_host_ip()
host_ip       = get_host_ip()
host_port     = 8001;
log_url       = "log"

R = Redis()

def websocket_processing(msg):    
    #log.debug("websocket_processing(msg = {0})".format(msg))
    
    try:
        data = simplejson.loads(msg)
        cmd = data.get('cmd',None)

        if cmd == "pub":
        	log.debug("pub(param = {0})".format(data['param']))
            #params = simplejson.loads(data['param'])
        	R.publish(data['param']['chan'], data['param']['msg'])
    except:
    	pass

class MainHandler(tornado.web.RequestHandler):
    def get(self):        
        self.render("main.html", title="uLog", host_ip=host_ip, host_port=host_port, log_url=log_url)

class TestHandler(tornado.web.RequestHandler):
    def get(self):        
        self.render("test.html", title="uLog", host_ip=host_ip, host_port=host_port, log_url=log_url)

class MsgHandler(tornado.web.RequestHandler):
    def get(self, msg):        
        #msg  = simplejson.dumps({'cmd' : cmd, 'chan' : chan, 'res' : 'OK'})
        #self.write('cmd= %s  para= %s' % (cmd, para))
        #print('MsgHandler(%s)' % cmd)
        R.publish(log_url,msg)
        res = dict()
        res['raw'] = msg
        try:            
            out = simplejson.loads(msg)
            res['json'] = True            
        except:
            res['json'] = False
            
        msg = simplejson.dumps(res)
        self.write(msg)

class MessageHandler(tornado.websocket.WebSocketHandler):
    channel = 'comport'

    def __init__(self, *args, **kwargs):
        super(MessageHandler, self).__init__(*args, **kwargs)

    def check_origin(self, origin):
        return True

    #def check_origin(self, origin):
    #    parsed_origin = urllib.parse.urlparse(origin)
    #    return parsed_origin.netloc.endswith(".mydomain.com")

    def open(self, chan):
        log.debug("ulogserver:   MessageHandler.open(chan={0})".format(chan))
        self.sub_channel = chan
        self.listen()

    @tornado.gen.engine
    def listen(self):
        self.client = tornadoredis.Client(redis_host_ip)
        self.client.connect()
        yield tornado.gen.Task(self.client.subscribe, self.sub_channel)
        self.client.listen(self.on_message)

    def on_message(self, msg):
        #log.debug(type(msg))
        
        if isinstance(msg,unicode):
            log.debug(msg)            
            websocket_processing(msg)
        else:
            if msg.kind == 'message':
                #log.debug(str(simplejson.loads(msg.body)))
                self.write_message(msg.body)
            if msg.kind == 'disconnect':
                # Do not try to reconnect, just send a message back
                # to the client and close the client connection
                self.write_message('The connection terminated '
                                   'due to a Redis server error.')
                self.close()

    def on_close(self):
        log.debug("on_close()")
        if self.client.subscribed:
            self.client.unsubscribe(self.sub_channel)
            self.client.disconnect()

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
                (r'/', MainHandler),
                (r'/test', TestHandler),
                (r'/msg/(?P<msg>.*)', MsgHandler),                
                (r'/websocket/(?P<chan>.*)', MessageHandler),
                ]
        
        settings = dict(
            cookie_secret="__TODO:_GENERATE_YOUR_OWN_RANDOM_VALUE_HERE__",
            template_path=os.path.join(os.path.dirname(__file__), "templates"),
            static_path=os.path.join(os.path.dirname(__file__), "static"),
            debug=True,
            xsrf_cookies=False,
        )
        tornado.web.Application.__init__(self, handlers, **settings)

if __name__ == '__main__':
    print("=== uLogger ===")
    arguments = docopt(__doc__, version='Naval Fate 2.0')
    print(arguments)
    host_port = int(arguments['--port'])

    app = Application()
    app.listen(host_port)
    log.level = logbook.DEBUG;
    print('uLogger is running at %s:%d\nQuit the demo with CONTROL-C' % (get_host_ip(), host_port))
    tornado.ioloop.IOLoop.instance().start()
