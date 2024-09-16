const mutil = require('./messages.js');

function send_message(connection, msg) {
  let l = mutil.encode_message(msg);
  if (l) {
    connection.sendUTF(l);
  }
  else {
    console.error('invalid message format');
  }
};

function receive_message(connection, func) {
  connection.on('error', 
    function(error) {
      console.error("Connection Error: " + error.toString());
      func(null);
    }
  );

  connection.on('close', 
    function() {
      console.error('connection closed');
      if (func) {
        func(null,
          function(rv) {}
        );
      }
    }
  );

  connection.on('message', 
    function(message) {
      if (message.type === 'utf8') {
        let line = message.utf8Data;
        let msg = mutil.parse_message(line);
        if (msg && func) {
          func(msg, 
            function(rv) {
              if (rv) send_message(connection, rv);
            }
          );
        }
        else {
          console.error(line);
        }
      }
    }
  );
}

function connect_client(url, func) {
  const WebSocketClient = require('websocket').client;

  let wsClient = new WebSocketClient();

  wsClient.on('connectFailed', 
    function(error) {
      console.error('connect error: '+error.toString());
      process.exit(1);
    }
  );

  wsClient.on('connect', 
    function(connection) {
      func(connection);
    }
  );

  wsClient.connect(url);
}

if (typeof exports != 'undefined') {
  exports.send_message = send_message;
  exports.receive_message = receive_message;
  exports.connect_client = connect_client;
}
