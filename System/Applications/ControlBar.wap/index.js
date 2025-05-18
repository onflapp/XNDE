let OPTIONS = {
  reconnection: true
};

let socket = io('http://localhost:3000', OPTIONS);

function create_frame(url) {
  let el = document.createElement('iframe');
  el.src = url;

  $('#container').append(el);
}

function load_widget(path) {
  let msg = {
    name:'LAUNCHER',
    command:'launch',
    display:'CONTROLBAR',
    path:path
  };

  socket.emit('dispatch', msg);
}

socket.on('connect', function() {
  console.log('connected');

  socket.emit('register', {name:'CONTROLBAR'}, function() {
    load_widget('System/Widgets/Battery.wap');
    load_widget('System/Widgets/Audio.wap');
    load_widget('System/Widgets/Clock.wap');
    load_widget('System/Widgets/Monitor.wap');
  });

  socket.on('dispatch', function(req, cb) {
    console.log(req);

    if (req.command == 'show') {
      create_frame(req.url);
    }

    if (cb) cb();
  });
});
