function refresh() {
  clearTimeout(window.refreshtm);
  $.getJSON("http://localhost:3000/dispatch?name=BATTERY&command=status", function(rv) {
    $('#output').html(JSON.stringify(rv));
    window.refreshtm = setTimeout(refresh, 10000);
  });
}
  
refresh();
