#!/usr/bin/env node

/**
 * @fileoverview Java runtime for Ant Framework.
 */
const { spawn, spawnSync } = require('child_process');
const { parse } = require('path');
const { argv, stdout, stderr } = process;

/**
 * Flushes the stdout and stderr and exits the process.
 *
 * @param {Number} code The status code
 */
const exit = code => {
  // On "close", waits stdout and stderr to flush
  // and then exits. If it is already done,
  // the cb is called anyway
  stdout.end(() => {
    stderr.end(() => {
      process.exit(code);
    });
  });
};

let javaFile = argv[2];
const { dirname, name: fileName, ext } = parse(javaFile);

let args = [];
const options = {};
if (ext === '.jar') {
  args.push('-cp');
} else if (ext === '.java') {
  const { error, status, stderr: javacStderr, stdout: javacStdout } = spawnSync('javac', [javaFile]);
  if (error) {
    stdout.write(javacStdout);
    stderr.write(javacStderr);
    exit(status);
  }
  options.cwd = dirname;
  javaFile = fileName;
}
args.push(javaFile);
args = args.concat(JSON.parse(argv[3]));

const javaProgram = spawn('java', args, options);
javaProgram.stdout.on('data', data => stdout.write(data.toString()));
javaProgram.stderr.on('data', data => stderr.write(data.toString()));
javaProgram.on('close', exit);
