function include_script(src) {
  let js = document.createElement('script');  
  js.src = src;
  document.head.appendChild(js);
}

function include_css(src) {
  let css = document.createElement('link');
  css.href = src;
  css.rel = 'stylesheet';
  document.head.appendChild(css);
}

function wm_create_window(options) {
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

  wv.src = options.url;
}

function init_workspace() {
  let desk = document.createElement('div');
  document.body.appendChild(desk);
  desk.classList.add('ddesktop');
  
  WORKSPACE = new DWorkspace(desk);
}

COMMANDS = {
  'create_window':wm_create_window
};

include_script("display_wm/simple/node_modules/jquery/dist/jquery.min.js");
include_script("display_wm/simple/node_modules/jquery-ui/dist/jquery-ui.min.js");
include_script("display_wm/simple/window-manager.js");

include_css("display_wm/simple/window-manager.css");
include_css("display_wm/simple/node_modules/jquery-ui/dist/themes/ui-darkness/jquery-ui.min.css");

setTimeout(function() {
  init_workspace();
}, 2000);
