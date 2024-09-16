exports.commands = {
  ping:function(options, cb) {
    cb({
      target:'LAUNCHER',
      command:'pong'
    });
  }
};
