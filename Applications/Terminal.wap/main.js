const path = require('path');

let SPORT = 0;
let WPORT = 0;

function start_process(cmd, connection, opts) {
  const Pty = require("node-pty");

  let shell = (opts.shell?opts.shell:process.env.SHELL);
  let ptty = Pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: (opts.cols?opts.cols:80),
    rows: (opts.rows?opts.rows:24),
    cwd: process.env.PWD,
    env: process.env
  });

  ptty.on('exit', function(code, signal) {
    connection.send('\x1bP?'+code+'Sexit\x1b\\');
    console.log('process exit');
  });

  ptty.on('data', function(data) {
    connection.send(data);
  });

  return ptty;
}

function ws_handle_connection(connection) {
  let ptty = null;

  connection.on('message', function(message) {
    let str = message.utf8Data;
    if (ptty == null) {
      let i = str.indexOf('\n');
      let opts = {};
      if (i != -1) {
        opts = JSON.parse(unescape(str.substr(0, i))); //extract initial options
        str = str.substr(i+1);
      }
      console.log('start process');
      console.log(opts);
      ptty = start_process('bash', connection, opts);
    }
    if (str) {
      if (str.startsWith('\1b[') && str.endsWith('Z')) { //handle resize
        let a = str.match(/\1b\[(\d+);(\d+)Z/);
        ptty.resize(Number.parseInt(a[1]), Number.parseInt(a[2]));
      }
      else {
        ptty.write(str);
      }
    }
  });

  connection.on('close',
    function(reasonCode, description) {
      console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    }
  );
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

  server.listen(0, function() {
    cb(server);
  });
}

function web_server() {
  const express = require('express');
  const app = express();

  app.get('/', (req, res) => {
    res.send('you should not be here');
  });

  app.use('/', express.static("."));

  let server = app.listen(0, function () {
    SPORT = server.address().port;
    ws_server(function(ws) {
      WPORT = ws.address().port;
      console.log("/dispatch?name=DISPLAY&command=show&url="+escape(`http://localhost:${SPORT}/index.html?data=${WPORT}`));
    });
  });
}

function handle_messages() {
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', function(data) {
    let line = data.toString().replace(/\n/, '');
    if (line.indexOf("/dispatch?") == 0) {
      let q = require('url').parse(line, true);
      if (q && q.query) {
        console.log("/dispatch?name=DISPLAY&command=show&url="+escape(`http://localhost:${SPORT}/index.html?data=${WPORT}`));
      }
    }
  });
}

web_server();
handle_messages();
