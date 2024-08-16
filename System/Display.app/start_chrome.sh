#!/usr/bin/env bash

function cleanup {
  ./system_wm.sh stop

  rm "$LOCK" 2>/dev/null
  exit 0
}

trap cleanup SIGINT SIGTERM

[ -d "/Applications/Google Chrome.app" ] && CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" 
[ -z "$CHROME" ] && CHROME=`type -p google-chrome`
[ -z "$CHROME" ] && CHROME=`type -p chromium`
[ -z "$CHROME" ] && CHROME=`type -p chromium-browser`
[ -z "$CHROME" ] && CHROME=`type -p chrome`

if [ -z "$CHROME" ];then
  echo "chrome not found!"
  exit 1
fi

if [ -z "$1" ];then
  echo "needs to start from the Display.app process"
  exit 1
fi

DDIR="/tmp/$$.data"
LOCK="/tmp/$UID-xnde-display.lock"

if [ -f "$LOCK" ];then
  echo "lock $LOCK exists, exit"
  exit 1
fi

mkdir -p "$DDIR" 2>/dev/null
touch "$DDIR/First Run"

echo "" > "$LOCK"

./system_wm.sh start&

"$CHROME" --user-data-dir=$DDIR --enable-widevine --silent-launch \
  --load-and-launch-app=`pwd` "$1" >/dev/null

sleep 1
cleanup
