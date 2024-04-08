#!/bin/bash

function install_package {
  D=`pwd`
  P=`dirname $1`

  cd "$P"
  echo "installing $P"
  npm install || exit 1
  cd "$D"
}

for DD in `find . -name 'package.json'`;do
  install_package "$DD"
done
