const path = require('path');

function wsserver(cb) {
  const WebSocketServer = require('websocket').server;
  const http = require('http');
  const Pty = require("node-pty");

  let server = http.createServer();
  let wsServer = new WebSocketServer({
    httpServer: server
  });

  wsServer.on('request', function(request) {
    let connection = request.accept(null, request.origin);
    let ptty = Pty.spawn("bash", [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: process.env.PWD,
      env: process.env
    });

    ptty.on('exit', function(code, signal) {
      console.log('process exit');
    });

    ptty.on('data', function(data) {
      connection.send(data);
    });

    connection.on('message', function(message) {
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
    });

    connection.on('close', function(reasonCode, description) {
      console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
  });

  server.listen(0, function() {
    cb(server);
  });
}

const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/', express.static("."));

let server = app.listen(0, function () {
  let sport = server.address().port;
  wsserver(function(ws) {
    let wport = ws.address().port;
    const utils = require('../../System/utils.js');
    console.log(utils.make_message('DISPLAY', {'cmd':'show','url':`http://localhost:${sport}/index.html?data=${wport}`}));
  });
})
