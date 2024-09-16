const mutil = require('shared/messages');
const registry = require('shared/registry');
const router = require('shared/router');
const commands = require('./commands.js').commands;

function route_message(msg, cb) {
  global.message_router.route(msg, cb);
}

function ws_server() {
  const handler = require('./server_ws.js');
  const WebSocketServer = require('websocket').server;
  const http = require('http');
  const port = (process.env.KERNEL_WSPORT || 4000);

  let server = http.createServer();

  let wsServer = new WebSocketServer({
    httpServer:server
  });

  wsServer.on('request', handler.receive_message(
    function(msg, cb) {
      if (msg) {
        route_message(msg, cb);
      }
      else {
        cb(null);
      }
    }
  ));

  server.listen(port,
    function() {
      console.error(`ws://localhost:${port}`);
    }
  );
}

function web_server() {
  const reg = require('shared/registry');
  const express = require('express');
  //const fshandler = require('./filesystem.js');
  const handler = require('./server_web.js');

  const app = express();
  const port = (process.env.KERNEL_PORT || 3000);

  reg.set_property('BASE_PORT', port);
  reg.set_property('BASE_URL', `http://localhost:${port}`);
  reg.set_property('BASE_DIR', process.cwd());

  //app.get('/files/*', fshandler.handle_file_request);
  app.get('/dispatch*', handler.receive_message(
    function(msg, cb) {
      if (msg) {
        route_message(msg, cb);
      }
      else {
        cb(null);
      }
    }
  ));

  app.listen(port, 
    function() {
      console.error(`http://localhost:${port}/dispatch`);
    }
  );
}

function io_client() {
  const cio = require('shared/client_io');

  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  cio.receive_message(process,
    function(msg, cb) {
      if (msg) {
        route_message(msg, cb);
      }
      else {
        cb(null);
      }
    }
  );
}

/* main */

global.message_router = new router.MessageRouter('CORE', commands);

web_server();
ws_server();
io_client();
