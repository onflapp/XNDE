const mutil = require('shared/messages');
const registry = require('shared/registry');

function route_message(msg, ctx) {
  const sio = require('shared/client_ws');
  console.error(msg);

  if (msg.command == 'register' && msg.options.name && ctx) {
    registry.set_object(msg.options.name, ctx);
  }
  else if (msg.command == 'unregister') {
  }
  else {
    let con = registry.get_object(msg.target);
    if (con) {
      sio.send_message(con, msg.target, msg.command, msg.options);
    }
  }
}

function ws_receive_message(connection) {
  connection.on('message', 
    function(message) {
      let str = message.utf8Data;
      let msg = mutil.parse_message(str);
      if (msg) {
        route_message(msg, connection);
      }
    }
  );

  connection.on('close', 
    function(reasonCode, description) {
      registry.remove_all_objects(connection);
      console.error('disconnected: ' + connection.remoteAddress);
    }
  );
}

function ws_server() {
  const WebSocketServer = require('websocket').server;
  const http = require('http');
  const port = (process.env.KERNEL_WSPORT || 4000);

  let server = http.createServer();

  let wsServer = new WebSocketServer({
    httpServer:server
  });

  wsServer.on('request', 
    function(request) {
      console.error('new request');
      let connection = request.accept(null, request.origin);
      ws_receive_message(connection);
    }
  );

  server.listen(port, function() {
    console.error(`kernel ws://localhost:${port}`);
  });
}

function web_server() {
  const reg = require('shared/registry');
  const express = require('express');
  const fshandler = require('./filesystem.js');
  const app = express();
  const port = (process.env.KERNEL_PORT || 3000);

  reg.set_property('BASE_PORT', port);
  reg.set_property('BASE_URL', `http://localhost:${port}`);
  reg.set_property('BASE_DIR', process.cwd());

  app.get('*', fshandler.handle_file_request);

  app.listen(port, 
    function() {
      console.error(`kernel http://localhost:${port}`);
    }
  );
}

function io_client() {
  const cio = require('shared/client_io');

  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  cio.receive_message(process.stdin, 
    function(msg) {
      route_message(msg, null);
    }
  );
}

web_server();
ws_server();
io_client();
