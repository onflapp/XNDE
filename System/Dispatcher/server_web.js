const mutil = require('shared/messages');

function handle_request(req, res, handle_msg) {
  let target = req.query.target;
  let command = req.query.command;
  let options = req.query.options;

  if (!target) {
    target = '.';
  }

  if (options) {
    try {
      options = JSON.parse(options);
    }
    catch(ex) {
      //console.error(ex);
    }
  }

  let msg = mutil.make_message(target, command, options);

  handle_msg(msg,
    function(rv) {
      if (rv) {
        res.writeHead(200);
        res.end(mutil.encode_message(rv));
      }
      else {
        res.writeHead(200);
        res.end('DONE');
      }
    }
  );
}

exports.receive_message = function(handle_msg) {
  return function(req, res) {
    handle_request(req, res, handle_msg);
  };
};
