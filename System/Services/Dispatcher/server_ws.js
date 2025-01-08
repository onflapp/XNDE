const mutil = require('shared/messages');

function receive_message(connection, handle_msg) {
  connection.on('message', 
    function(message) {
      let str = message.utf8Data;
      let msg = mutil.parse_message(str);
      if (msg) {
        handle_msg(msg,
          function(rv) {
            if (rv) {
              let s = mutil.encode_message(rv);
              connection.sendUTF(s);
            }
          }
        );
      }
    }
  );

  connection.on('close', 
    function(reasonCode, description) {
      console.error('disconnected: ' + connection.remoteAddress);
    }
  );
}

exports.receive_message = function(handle_msg) {
  return function(request) {
    console.error('new request');
    let connection = request.accept(null, request.origin);
    receive_message(connection, handle_msg);
  };
};
