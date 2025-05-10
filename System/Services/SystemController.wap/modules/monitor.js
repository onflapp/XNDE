const proc = require('child_process');

function exec(cmd, args, cb) {
  let app = proc.spawn(cmd, args, {});
  let buff = '';

  app.stderr.on('data', function(data) {
    console.error(data.toString());
  });

  app.stdout.setEncoding('utf8');
  app.stdout.on('data', function(chunk) {
    let str = chunk;
    if (typeof str != 'string') str = chunk.toString();

    buff += str;
  });

  app.stdout.resume();

  app.on('error', function(err) {
    console.log(err);
    cb([]);
  });

  app.on('close', function(code) {
    cb(buff.split(/\n/));
  });
}

function init_display(cb) {
  cb("MONITOR");
}

function handle_message(msg, cb) {
  if (msg.command == "status") {
    exec('brightnessctl', ['-lm'], function(lines) {
      let backlight = null;
      let l = lines.filter(function(line) {
        let a = line.split(/,/);
        if (a[1] == 'backlight') {
          let v = a[3];
          backlight = v.substr(0, v.length-1);
        }
      });

      if (backlight) {
        let rv = {};
        rv['brightness'] = backlight;
        cb(rv);
      }
      else {
        cb();
      }
    });
  }
  else if (msg.command == 'change') {
    /* brightness */
    if (msg.brightness == 'up') {
      exec('brightnessctl', ['s', '+10%'], function() {
        cb();
      });
    }
    else if (msg.brightness == 'down') {
      exec('brightnessctl', ['s', '10%-'], function() {
        cb();
      });
    }
    else if (typeof msg.brightness != 'undefined') {
      exec('brightnessctl', ['s', msg.brightness+'%'], function() {
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

exports.start_process = init_display;
exports.stop_process = function() {};
exports.dispatch = handle_message;
