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

function init_keyboard(opts, cb) {
  config_keyboard();
  
  cb(this, 'KEYBOARD');
}

function handle_message(cb) {
  cb();
}

exports.init = init_keyboard;
exports.dispatch = handle_message;
