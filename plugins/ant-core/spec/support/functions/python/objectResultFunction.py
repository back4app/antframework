import sys
import json

def main(args):
  sys.stdout.write(json.dumps({ 'foo': 'bar' }))
  sys.stdout.flush()
