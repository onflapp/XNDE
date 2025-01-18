function init_xterm() {
  var opts = {
    fontSize:12
  };
  term = new Terminal(opts);
  term.open(document.getElementById('terminal'));

  var wport = location.search.match(/data=(\d+)/)[1];
  var client = new WebSocket(`ws://${location.hostname}:${wport}/`);
  var attachAddon = new AttachAddon.AttachAddon(client);
  var fitAddon = new FitAddon.FitAddon();
  term.loadAddon(attachAddon);
  term.loadAddon(fitAddon);
  fitAddon.fit();

  var opts = {
    cols:term.cols,
    rows:term.rows
  };

  client.addEventListener('open', function() {
    client.send(escape(JSON.stringify(opts))+'\n');
  });

  term.parser.registerDcsHandler({prefix:'?', final:'S'}, function(param, data) {
    console.log('param:'+param+',data:'+data);
    if (param == 'exit') {
      window.close();
    }
  });

  function trigger_resize() {
  }

  var func = null;
  window.addEventListener('resize', function() {
    clearTimeout(func);
    func = setTimeout(function() {
      fitAddon.fit();
      client.send('\1b[' + term.cols + ';' + term.rows + 'Z');
    }, 250);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  init_xterm();
});
