function print(str, cb) {
  document.body.append(str);
  cb(make_ack());
}

function clear(options, cb) {
  document.body.innerHTML = '';
  cb(make_ack());
}

function create_window(options, cb) {
  let wv = document.createElement('webview');  
  let url = null;

  if (options && options.url) url = options.url;
  else url = options;

  if (url) wv.src = url;
  
  document.body.appendChild(wv);
  cb(make_ack());
}

function close(options, cb) {
  cb(make_ack());
}

function init_wm(name, cb) {
  let wm = document.createElement('script');  
  wm.src = `display_wm/${name}/index.js`;
  document.head.appendChild(wm);
  
  window.addEventListener('message',
    function(evt) {
      cb(make_ack());
    }
  );
}

window.COMMANDS = {
  'print':print,
  'clear':clear,
  'close':close,
  'create_window':create_window,
  'init_wm':init_wm
};
