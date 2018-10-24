#!/usr/bin/env python

import sys
import json
import imp
import traceback

if __name__ == "__main__":
  executable = sys.argv[1]
  args = json.loads(sys.argv[2], "utf-8")

  # Loads the user function and runs it, providing the
  # arguments received from Ant
  user_module = imp.load_source('antframework', executable)

  # By default, we invoke the "main" function
  try:
    user_module.main(args)
  except Exception as error:
    sys.stdout.write(traceback.format_exc())
