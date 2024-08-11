const path = require('path');
const mutil = require('shared/messages');
const registry = require('shared/registry');

function route_message(msg) {
  if (msg.command == 'reactivate') {
    send_display_msg();
  }
}

function send_display_msg() {
  let sport = registry.get_property('HTTP_PORT');
  let wport = registry.get_property('WS_PORT');
  console.log(mutil.make_message('DISPLAY', 'create_window',{'url':`http://localhost:${sport}/index.html?data=${wport}`}));
}

function ws_handle_connection(connection) {
  const Pty = require("node-pty");
  let ptty = Pty.spawn("bash", [], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.env.PWD,
    env: process.env
  });

  ptty.on('exit', 
    function(code, signal) {
      console.log('process exit');
    }
  );

  ptty.on('data', 
    function(data) {
      connection.send(data);
    }
  );

  connection.on('message',
    function(message) {
      let str = message.utf8Data;
      let i = str.indexOf('^[[');
      if (i != -1) {
        let a = str.match(/\^\[\[(\d+),(\d+)/);
        ptty.resize(Number.parseInt(a[1]), Number.parseInt(a[2]));
        str = str.replace(a[0], '');
      }

      if (str) {
        ptty.write(str);
      }
    }
  );

  connection.on('close',
    function(reasonCode, description) {
      console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    }
  );
}

function ws_server_ready(cb) {
}

function ws_server(cb) {
  const WebSocketServer = require('websocket').server;
  const http = require('http');

  let server = http.createServer();
  let wsServer = new WebSocketServer({
    httpServer: server
  });

  wsServer.on('request', function(request) {
    let connection = request.accept(null, request.origin);
    ws_handle_connection(connection);
  });

  server.listen(0, 
    function() {
      cb(server);
    }
  );
}

function web_server() {
  const express = require('express');
  const app = express();

  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  app.use('/', express.static("."));

  let server = app.listen(0,
    function () {
      let sport = server.address().port;
      registry.set_property('HTTP_PORT', sport);
      ws_server(function(ws) {
        let wport = ws.address().port;
        registry.set_property('WS_PORT', wport);
        send_display_msg();
      });
    }
  );
}

function io_client() {
  const cio = require('shared/client_io');

  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  cio.receive_message(process.stdin, 
    function(msg) {
      route_message(msg);
    }
  );
}

web_server();
io_client();
