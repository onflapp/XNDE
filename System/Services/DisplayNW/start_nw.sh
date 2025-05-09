#!/bin/bash

B=`realpath "$0"`
D=`dirname "$B"`

cd "$D"

./node_modules/nw/nwjs/nw .
