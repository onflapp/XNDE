#!/bin/sh

echo "=================="
echo " system config"
echo "=================="

mkdir -p /usr/share/xsessions 2>/dev/null

A=`realpath $0`
DEST=`dirname $A`

sed -e "s:_XNDE_INSTALL_PREFIX_:$DEST:g" < ./install/xsessions/XNDE-safe.desktop >  /usr/share/xsessions/XNDE-safe.desktop
sed -e "s:_XNDE_INSTALL_PREFIX_:$DEST:g" < ./install/xsessions/XNDE.desktop      >  /usr/share/xsessions/XNDE.desktop

cd ./System/Services/SystemController.wap/modules/helpers
make all

chown root:root gesture_helper
chmod 4775      gesture_helper

chown root:root keyboard_helper
chmod 4775      keyboard_helper

echo "done"
