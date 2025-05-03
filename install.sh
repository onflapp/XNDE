#!/bin/sh

echo "=================="
echo " system config"
echo "=================="

mkdir -p /usr/share/xsessions 2>/dev/null

A=`realpath $0`
DEST=`dirname $A`

sed -e "s:_XNDE_INSTALL_PREFIX_:$DEST:g" < ./install/xsessions/XNDE-safe.desktop >  /usr/share/xsessions/XNDE-safe.desktop
sed -e "s:_XNDE_INSTALL_PREFIX_:$DEST:g" < ./install/xsessions/XNDE.desktop      >  /usr/share/xsessions/XNDE.desktop

echo "done"
