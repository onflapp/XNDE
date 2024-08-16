function print(str) {
  document.body.append(str);
}

function clear() {
  document.body.innerHTML = '';
}

function create_window(options) {
  let wv = document.createElement('webview');  
  if (options && options.url) {
    wv.src = options.url;
  }
  document.body.appendChild(wv);
}

function close() {

}

function init_windowmanager(name) {
  let wm = document.createElement('script');  
  wm.src = `windowmanagers/${name}/index.js`;
  document.head.appendChild(wm);
}

window.COMMANDS = {
  'print':print,
  'clear':clear,
  'close':close,
  'create_window':create_window,
  'init_windowmanager':init_windowmanager
};
