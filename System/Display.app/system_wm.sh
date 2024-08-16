#!/usr/bin/env bash

WIDTH="100%"
HEIGHT="100%"
PIDF="/tmp/$UID-xnde-systemwm.pid"

function resize_chrome() {
  while [ 1 ];do
    P=`xdotool search --name XNDEDisplay`
    if [ -n "$P" ];then
      xdotool windowsize "$P" $WIDTH $HEIGHT \
        windowmove "$P" 0 0 \
        windowraise "$P" \
        sleep 1 \
        windowfocus "$P"
      echo "done"
      break
    else
      echo "wait for chrome"
      sleep 1
    fi
  done
}

function cleanup() {
  if [ -n "$WPID" ];then
    kill "$WPID"
  fi
  exit
}

if [ "$1" == "start" ];then
  trap cleanup SIGINT SIGTERM SIGKILL

  echo "starting X windowmanager"

  twm -f ./system_wm/twmrc &
  WPID="$!"
  echo "$$" > "$PIDF"

  sleep 1
  resize_chrome

  echo "$WPID" > "$PIDF"
elif [ "$1" == "startwm" ];then
  echo "starting X windowmanager"

  twm -f ./system_wm/twmrc
elif [ "$1" == "stop" ];then
  P=`cat $PIDF`
  if [ -n "$P" ];then
    kill "$P"
    rm "$PIDF" 2>/dev/null
  fi
fi
