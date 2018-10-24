import sys
import json

def main(args):
  sys.stdout.write(json.dumps([
    'foo',
    1,
    { 'foo': 'bar' }
  ]))
  sys.stdout.flush()
