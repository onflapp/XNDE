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

  term.parser.registerDcsHandler({prefix:'?', final:'x'}, function(param, data) {
    if (data == 100) {
      window.close();
    }
    console.log('param:'+param+',data:'+data);
  });

  function trigger_resize() {
  }

  var func = null;
  window.addEventListener('resize', function() {
    clearTimeout(func);
    func = setTimeout(function() {
      fitAddon.fit();
      client.send('^[[' + term.cols + ',' + term.rows);
    }, 250);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  init_xterm();
});
