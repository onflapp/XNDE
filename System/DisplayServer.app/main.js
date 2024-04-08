CONNECTIONS = {};

function wssend(line) {
  for (let key in CONNECTIONS) {
    let connection = CONNECTIONS[key];
    connection.send(line);
  }
}

function wsserver(cb) {
  const WebSocketServer = require('websocket').server;
  const http = require('http');

  let server = http.createServer();
  let wsServer = new WebSocketServer({
    httpServer: server
  });

  wsServer.on('request', function(request) {
    console.log('req');
    let connection = request.accept(null, request.origin);
    CONNECTIONS[connection] = connection;
    //connection.send(data);

    connection.on('message', function(message) {
      let str = message.utf8Data;
      console.log(str);
    });

    connection.on('close', function(reasonCode, description) {
      delete CONNECTIONS[connection];
      console.log('end connection');
    });
  });

  let port = (process.env.DISPLAYSERVER_PORT || 6000);
  server.listen(port, function() {
    cb(server);
  });
}

function chrome_app(wport) {
  const proc = require('child_process');
  console.error(`start chrome process ${__dirname} ${wport}`)
  let app = proc.spawn('./start_chrome.sh', [`/tmp/${wport}.pid`], {
    cwd:__dirname
  });
}

wsserver(function(ws) {
  const utils = require('../utils.js');
  let wport = ws.address().port;

  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  utils.receive_messages(process.stdin, function(msg) {
    console.error(msg);
    wssend(utils.make_message(msg.target, msg.options));
  });

  console.log(utils.make_message('services', {cmd:'register', name:'DISPLAY'}));
  console.error(`DisplayServer.app - port ${wport}`);

  chrome_app(wport);
});
