#!/usr/bin/env python3

import sys
import json
from importlib.machinery import SourceFileLoader
import traceback

if __name__ == "__main__":
  executable = sys.argv[1]
  args = json.loads(sys.argv[2])

  # Loads the user function and runs it, providing the
  # arguments received from Ant
  user_module = SourceFileLoader('antframework', executable).load_module()

  # By default, we invoke the "main" function
  try:
    user_module.main(args)
  except Exception as error:
    sys.stdout.write(traceback.format_exc())
