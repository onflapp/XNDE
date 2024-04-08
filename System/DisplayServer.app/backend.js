chrome.app.runtime.onLaunched.addListener(function(evt) {
  let f = evt.items[0].entry.name;
  let port = f.split('.')[0];
  chrome.app.window.create('index.html?data='+port, {
    'outerBounds': {
      'width': 400,
      'height': 500
    }
  }, 
  function(w) {
    //w.fullscreen();
  });
});
