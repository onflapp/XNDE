window.SESSION = 0;

function init_xterm() {
  var opts = {
    fontSize:12
  };
  term = new Terminal(opts);
  term.open(document.getElementById('terminal'));

  var wport = location.search.match(/data=(\d+)/)[1];
  var client = null;
  var attachAddon = null;
  var connections = 0;
  var fitAddon = new FitAddon.FitAddon();
  term.loadAddon(fitAddon);
  fitAddon.fit();

  var opts = {
    cols:term.cols,
    rows:term.rows
  };

  var connect = function() {
    if (attachAddon) {
      attachAddon.dispose();
    }

    client = new WebSocket(`ws://${location.hostname}:${wport}/`);
    attachAddon = new AttachAddon.AttachAddon(client);
    term.loadAddon(attachAddon);

    client.addEventListener('open', function() {
      if (connections == 0) { //the first time
        client.send(escape(JSON.stringify(opts))+'\n');
      }
      else { //reconnect to the existing session
        client.send(escape(JSON.stringify({session:window.SESSION}))+'\n');
      }
      connections++;
    });

    client.addEventListener('close', function() {
      console.log('close');
      setTimeout(connect, 500);
    });
  };

  connect();

  term.parser.registerDcsHandler({prefix:'?', final:'S'}, function(param, data) {
    console.log('param:'+param+',data:'+data);
    if (param == 'exit') {
      window.close();
    }
    else if (param == 'session') {
      window.SESSION = data[0];
    }
  });

  var func = null;
  window.addEventListener('resize', function() {
    clearTimeout(func);
    func = setTimeout(function() {
      fitAddon.fit();
      client.send('\1b[' + term.cols + ';' + term.rows + 'Z');
    }, 100);
  });
}

window.resizeTo(580,450);
document.addEventListener('DOMContentLoaded', function() {
  init_xterm();
});

window.addEventListener('beforeunload', function() {
  client.send('\1b[closeZ\n');
});
