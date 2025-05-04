#include <poll.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <X11/Xlib.h>
#include <X11/Xutil.h>
#include <X11/Xatom.h>
#include "events_helper.h"

void find_top_window(Display* dpy, Window win) {
  unsigned int nchildren;
  Window *children;
  Window r, p;
  XClassHint hints;

  if (win == 0) {
    printf("FOCUS 0x0 root root\n");
    return;
  }

  int c = 0;
  int rv = XQueryTree(dpy, win, &r, &p, &children, &nchildren);

  for (c = nchildren-1; rv && c >= 0; c--) {
    Window w = children[c];

    if (XGetClassHint(dpy, w, &hints)) {
      printf("FOCUS 0x%x %s %s\n", w, hints.res_class, hints.res_name);    
      break;
    }
  }

  if (children != NULL) {
    XFree((char*) children);
  }
}

void start_loop() {
  Display* dpy;
  Window root;
  Window last;
  XEvent event;

  dpy = XOpenDisplay(NULL);
  if (!dpy) {
    fprintf(stderr, "unable to open display\n");
    exit(1);
  }

  root = DefaultRootWindow(dpy); 
  if (!root) {
    fprintf(stderr, "unable to get root window\n");
    exit(1);
  }

  Window w;
  Window r;
  int rx, ry, x, y, m;
  XSelectInput(dpy, root, FocusChangeMask|EnterWindowMask|LeaveWindowMask);

  while (1) {
    XNextEvent(dpy, &event);
    if (XQueryPointer(dpy, root, &r, &w, &rx, &ry, &x, &y, &m)) {
      if (w != last) {
        find_top_window(dpy, w);
        last = w;
        if (w != 0) {
          XSelectInput(dpy, w, FocusChangeMask|EnterWindowMask|LeaveWindowMask);
        }
      }
    }
  }
}

int main(int argc, char* argv[]) {

  setbuf(stdout, NULL);
  start_loop();

  return 0;
}
