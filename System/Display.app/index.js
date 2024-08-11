/*

print:{text:'text'}
display:{url:'url'}

*/

function start_process() {
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

  client.onmessage = function(evt) {
    let data = evt.data;
    let msg = parse_message(data);
    dispatch_message(msg, window.COMMANDS);
  };
}

window.addEventListener("DOMContentLoaded", function() {
  start_process();
});
