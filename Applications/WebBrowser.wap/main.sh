#!/usr/bin/env bash

[ -d "/Applications/Google Chrome.app" ] && CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" 
[ -z "$CHROME" ] && CHROME=`type -p google-chrome`
[ -z "$CHROME" ] && CHROME=`type -p chromium`
[ -z "$CHROME" ] && CHROME=`type -p chromium-browser`
[ -z "$CHROME" ] && CHROME=`type -p chrome`

if [ -z "$CHROME" ];then
  echo "chrome not found!"
  exit 1
fi

"$CHROME" $@
