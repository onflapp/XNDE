#!/bin/bash

[ -d "/Applications/Google Chrome.app" ] && CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" 
[ -z "$CHROME" ] && CHROME=`type -p chromium`

if [ -z "$CHROME" ];then
  echo "chrome not found!"
  exit 1
fi

"$CHROME" --enable-widevine --silent-launch --load-and-launch-app=`pwd` "$1"
