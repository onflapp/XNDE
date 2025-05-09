var x11 = require('x11/lib');

// The list provided by GetKeyboardMapping has sublists where each position
// represents the result for some key composition.
keyComposition = [
  'Key',
  'shift + Key',
  'modeSwitch + Key',
  'modeSwitch + shift + Key',
  'altGr + Key',
  'altGr + shift + Key'
]

function Initialize(display) {
  var min = display.min_keycode,  // TODO: explain min_keycode
      max = display.max_keycode,  // TODO: explain max_keycode
      chr2Data = [],              // allow us to find a char by the charcode
      key2Data = [];              // associate chars to a keycode

  // The keySyms is a hash of mnemonic char names, associated to an integer
  // charcode and its description.
  for (codeName in x11.keySyms) {
    keyData = x11.keySyms[codeName];
    chr2Data[keyData.code] = { codeName: codeName, description: keyData.description };
  }

  //console.log(x11.keySyms);

  var X = display.client;

  // Get the local key mapping to build key2Data.
  X.GetKeyboardMapping(min, max-min, function(err, list) {
    for (var i=0; i < list.length; ++i) {
      var name = key2Data[i+min] = [];
      var sublist = list[i];
      for (var j=0; j < sublist.length; ++j)
        name.push(chr2Data[sublist[j]]);
    }
  });
}


function HandleKeyEvent(ev) {
  var key = key2Data[ev.keycode];  // key is a list of chars related to the pressed key.
  if (key) {
    console.log('\n>> key pressed:', ev.keycode);
    for (var i=0; i<key.length; i++) // Describe each related char
      if (key[i])
        console.log(
          key[i].codeName, '\t', (
            key[i].description ? key[i].description : 'no description'
          ), (
            keyComposition[i] ? '\t' + keyComposition[i] : ''
          )
        );
  }
  else
    console.log('>> keyCode '+ ev.keycode +' was not recognized.');
}

exports.Initialize = Initialize;
exports.HandleKeyEvent = HandleKeyEvent;
