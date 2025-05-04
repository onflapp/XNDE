#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include "keyboard_helper.h"

int write_val(char* path, char* val) 
{
  FILE* fl = fopen(path, "w");
  if (fl) {
    fprintf(fl, "%s\n", val);
    fclose(fl);
    return 1;
  }
  else {
    return 0;
  }
}

int read_val(char* name, char* path) 
{
  FILE* fl = fopen(path, "r");
  char buff[2];
  memcpy(buff, "\0", sizeof(buff));

  if (fl) {
    fread(buff, 1, 1, fl);
    printf("%s=%s\n", name, buff);
    fclose(fl);
    return 1;
  }
  else {
    return 0;
  }
}


int main(int argc, char** argv, char** env)
{

  char* SWAP_FN = BASE_DIR"/swap_fn_leftctrl";
  char* FN_MODE = BASE_DIR"/fnmode";
  char* SWAP_ALT_CMD = BASE_DIR"/swap_opt_cmd";

  char* val = getenv("SWAP_FN");
  if (val) write_val(SWAP_FN, val);

  val = getenv("FN_MODE");
  if (val) write_val(FN_MODE, val);

  val = getenv("SWAP_ALT_CMD");
  if (val) write_val(SWAP_ALT_CMD, val);

  read_val("SWAP_FN", SWAP_FN);
  read_val("FN_MODE", FN_MODE);
  read_val("SWAP_ALT_CMD", SWAP_ALT_CMD);

  return 0;
}
