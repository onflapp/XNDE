function DWindow(opts) {
  let self = this;
  this.$el = $(`
    <div class="dwindow">
      <div class="header">
        <span class="close">X</span>
        <span class="title">untitled</span>
      </div>
      <div class="content">
      </div>
    </div>
  `);

  if (opts) {
    if (opts['size']) {
      this.$el.width(opts.size.width);
      this.$el.height(opts.size.height);
    }
    if (opts['position']) {
      this.$el.offset(opts.position);
    }
  }
}

function DWorkspace(root, opts) {
  let self = this;
  this.$el = $(root);

  this.createWindow = function(opts) {
    let win = new DWindow(opts);
    this.$el.append(win.$el);

    win.$el.resizable({
      containment: 'parent',
      start: function(evt, ui) {
        self.$el.find('.content').hide();
      },
      stop: function(evt, ui) {
        self.$el.find('.content').show();
      }
    });

    win.$el.draggable({
      handle:'.title',
      start: function(evt, ui) {
        self.$el.find('.content').hide();
      },
      stop: function(evt, ui) {
        self.$el.find('.content').show();
      }
    });

    win.$el.on('click', '.close', function(evt) {
      win.$el.remove();
    });

    return win;
  };
}
