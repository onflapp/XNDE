const proc = require('child_process');

function init_display(opts, cb) {
  cb(this, "MONITOR");
}

function get_brightness() {
  return new Promise(function(resolve) {
    proc.exec('brightnessctl -lm', {}, function(error, stdout, stderr) {
      let backlight = null;
      let lines = stdout.split('\n');
      let l = lines.filter(function(line) {
        let a = line.split(/,/);
        if (a[1] == 'backlight') {
          let v = a[3];
          backlight = v.substr(0, v.length-1);
        }
      });
      resolve(backlight);
    });
  });
}

async function get_status() {
  let rv = {};
  rv['brightness'] = await get_brightness();
  
  return rv;
}

function handle_message(msg, cb) {
  if (msg.command == "status") {
    get_status().then(function(rv) {
      cb(rv);
    });
  }
  else if (msg.command == 'change') {
    /* brightness */
    if (msg.brightness == 'up') {
      proc.exec('brightnessctl s +10%', {}, function() {
        cb();
      });
    }
    else if (msg.brightness == 'down') {
      proc.exec('brightnessctl s 10%-', {}, function() {
        cb();
      });
    }
    else if (typeof msg.brightness != 'undefined') {
      proc.exec('brightnessctl s '+msg.brightness+'%', {}, function() {
        cb();
      });
    }
    else {
      cb();
    }
  }
  else {
    cb();
  }
}

exports.init = init_display;
exports.dispatch = handle_message;
