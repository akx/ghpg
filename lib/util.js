/* eslint-disable no-param-reassign */
const cp = require('child_process');
const path = require('path');
const unorm = require('unorm');
const fs = require('fs');
const util = require('util');

const statAsync = util.promisify(fs.stat);
const accessAsync = util.promisify(fs.access);

function getOutput(args, options) {
  args = args.slice();
  const command = args.shift();
  const mergedOptions = {
    encoding: 'utf-8',
    ...options,
  };
  return new Promise((resolve, reject) => {
    cp.execFile(command, args, mergedOptions, (err, stdout) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(stdout);
    });
  });
}

function spawnPromise(command, args, options, executor = null) {
  return new Promise((resolve, reject) => {
    const proc = cp.spawn(command, args, options);
    proc.on('error', err => {
      reject(err);
    });
    proc.on('exit', (code, signal) => {
      if (code !== 0 || signal) {
        reject(
          new Error(
            `${command} ${args.join(' ')} exited with ${code || signal}`,
          ),
        );
        return;
      }
      resolve();
    });
    if (executor) executor(proc);
  });
}

function sequentially(lst, promiser) {
  return lst.reduce(
    (promise, value) => promise.then(() => promiser(value)),
    Promise.resolve(false),
  );
}

function normalizePath(p) {
  if (process.platform === 'darwin') {
    p = unorm.nfkc(p);
  }
  return path.normalize(p);
}

function ensureDirectory(pth) {
  return statAsync(pth).then(stat => {
    if (!stat.isDirectory()) {
      throw new Error('Not a directory');
    }
  });
}

module.exports.getOutput = getOutput;
module.exports.sequentially = sequentially;
module.exports.normalizePath = normalizePath;
module.exports.spawnPromise = spawnPromise;
module.exports.ensureDirectory = ensureDirectory;
module.exports.statAsync = statAsync;
module.exports.accessAsync = accessAsync;
