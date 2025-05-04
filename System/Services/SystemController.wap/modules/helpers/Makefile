all: gesture_helper keyboard_helper events_helper

gesture_helper: gesture_helper.c
	gcc `pkg-config --atleast-version=1.19 libinput && echo "-DHAS_LIBINPUT19"` gesture_helper.c -linput -ludev -o gesture_helper

keyboard_helper: keyboard_helper.c
	gcc keyboard_helper.c -o keyboard_helper

events_helper: events_helper.c
	gcc events_helper.c -lX11 -o events_helper

clean:
	rm ./gesture_helper
	rm ./keyboard_helper
	rm ./events_helper
