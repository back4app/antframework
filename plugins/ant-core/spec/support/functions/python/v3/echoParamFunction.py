import sys
import json
import time

def write(arg):
  sys.stdout.write(arg)
  sys.stdout.flush()
  time.sleep(0.01)

def main(args):
  for arg in args:
    if type(arg) is int:
      write(repr(arg))
    elif type(arg) is str:
      write(arg)
    elif type(arg) is dict or type(arg) is list:
      write(json.dumps(arg))
