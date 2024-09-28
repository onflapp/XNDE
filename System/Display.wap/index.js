/*

print:{text:'text'}
display:{url:'url'}

*/

function start_process() {
  let router = new MessageRouter('DISPLAY', window.COMMANDS);

  let hostname = 'localhost';
  let port = 6001;

  if (location.search.indexOf('?data=') == 0) port = location.search.substr(6);

  let client = new WebSocket(`ws://${hostname}:${port}/`);

  client.onerror = function(evt) {
    print(`connection error port: ${port}`);
  };

  client.onclose = function(evt) {
    window.close();
  };

  client.onmessage = function(evt) { // <= receive from the launcher
    let data = evt.data;
    let msg = parse_message(data);
    router.route(msg, 
      function(rv) {
        if (rv) {
          let s = encode_message(rv); // => send to the launcher
          client.send(s);
        }
      }
    );
  };
}

window.addEventListener("DOMContentLoaded", function() {
  start_process();
});
