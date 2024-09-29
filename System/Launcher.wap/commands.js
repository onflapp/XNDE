const launcher= require('./launcher.js');
const mutils = require('shared/messages');

exports.commands = {

  launch:function(options, cb) {
    let path = options;
    if (options.url) path = msg.options.url;

    launcher.launch_app(path,
      function() { // => ack registration has happened
        cb(mutils.make_ack());
      }
    );
  },

  ping:function(options, cb) {
    console.error('ping');
    setTimeout(
      function() {
        cb(mutils.make_ack({rv:'pong'}));
      },2000
    );
  }
};
