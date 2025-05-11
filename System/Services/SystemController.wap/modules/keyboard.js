const proc = require('child_process');

function config_keyboard() {
  let env = {
    SWAP_FN:1,
    FN_MODE:3,
    SWAP_ALT_CMD:0
  }

  proc.exec(`${__dirname}/helpers/keyboard_helper`, {env:env}, function(error, stdout, stderr) {
    console.log(error, stdout, stderr);
  });
}

function init_keyboard(cb) {
  config_keyboard();
  
  if (cb) cb('KEYBOARD');
}

function handle_message(cb) {
  cb();
}

exports.start_process = init_keyboard;
exports.stop_process = function() {};
exports.dispatch = handle_message;
