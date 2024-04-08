function procserver() {
  const WebSocketServer = require('websocket').server;
  const http = require('http');
  const port = (process.env.KERNEL_WSPORT || 4000);

  let server = http.createServer();

  let wsServer = new WebSocketServer({
    httpServer: server
  });

  wsServer.on('request', function(request) {
    console.log('req');
    let connection = request.accept(null, request.origin);
    connection.send('data');

    connection.on('message', function(message) {
      let str = message.utf8Data;
    });

    connection.on('close', function(reasonCode, description) {
      console.error((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
  });

  server.listen(port, function() {
    console.error('kernel ws port ' + port);
  });
}

function webserver() {
  const reg = require('./registry.js');
  const express = require('express');
  const fshandler = require('./filesystem.js');
  const app = express();
  const port = (process.env.KERNEL_PORT || 3000);

  reg.set_property('BASE_PORT', port);
  reg.set_property('BASE_URL', `http://localhost:${port}`);
  reg.set_property('BASE_DIR', process.cwd());

  app.get('*', fshandler.handle_file_request);

  app.listen(port, function() {
    console.error(`kernel url http://localhost:${port}`);
  });
}

webserver();
procserver();
