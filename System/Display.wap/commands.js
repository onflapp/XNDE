function print(str, cb) {
  document.body.append(str);
  cb();
}

function clear(options, cb) {
  document.body.innerHTML = '';
  cb();
}

function create_window(options, cb) {
  let wv = document.createElement('webview');  
  let url = null;

  if (options && options.url) url = options.url;
  else url = options;

  if (url) wv.src = url;
  
  document.body.appendChild(wv);
  cb();
}

function close(options, cb) {
  cb();
}

function init_windowmanager(name, cb) {
  let wm = document.createElement('script');  
  wm.src = `windowmanagers/${name}/index.js`;
  document.head.appendChild(wm);
  cb();
}

window.COMMANDS = {
  'print':print,
  'clear':clear,
  'close':close,
  'create_window':create_window,
  'init_windowmanager':init_windowmanager
};
