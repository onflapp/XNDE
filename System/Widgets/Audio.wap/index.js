$(document).on('click', 'a.control', function(evt) {
  let href = evt.target.href;
  $.get(href);

  refresh();
  evt.preventDefault();
});

function refresh() {
  clearTimeout(window.refreshtm);
  $.getJSON("http://localhost:3000/dispatch?name=AUDIO&command=status", function(rv) {
    $('#output').html(JSON.stringify(rv));
    window.refreshtm = setTimeout(refresh, 5000);
  });
}

refresh();
