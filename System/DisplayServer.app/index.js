function create_view(url) {
  let win = WORKSPACE.createWindow();
  let ua = navigator.userAgent; 
  let wv = document.createElement('webview');

  win.$el.find('.content').append(wv);
 
  wv.addEventListener('did-start-loading', function() {
    win.$el.find('.title').html('loading...');
  });

  wv.addEventListener('did-stop-loading', function(evt) {
    win.$el.find('.title').html(wv.getTitle());
  });

  wv.src = url;
}

function parse_message(line) {
  let i = line.indexOf(':');
  if (i == -1) {
    return null;
  }
  else {
    let rv = {};
    rv.target = line.substr(0, i);
    rv.options = JSON.parse(unescape(line.substr(i+1)));

    return rv;
  }
}

function start_process() {
  let hostname = 'localhost';
  let port = 1000;

  if (location.search.indexOf('?data=') == 0) port = location.search.substr(6);

  let client = new WebSocket(`ws://${hostname}:${port}/`);

  client.onerror = function(evt) {
    $('.ddesktop').html('connection error');
  };

  client.onmessage = function(evt) {
    let data = evt.data;
    let msg = parse_message(data);
    if (!msg) {
      console.log('unknown message ' + data);
      return;
    }

    if (msg.options.cmd == 'show') {
      create_view(msg.options.url);
    }
  };
}

function init_workspace() {
  let desk = $('.ddesktop')[0];
  
  WORKSPACE = new DWorkspace(desk);
}

window.addEventListener("DOMContentLoaded", function() {
  start_process();
  init_workspace();
});
