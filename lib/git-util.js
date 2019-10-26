const cp = require('child_process');
const path = require('path');

const { getOutput, normalizePath, spawnPromise } = require('./util');


let inferredGitCommand;
function getGitCommand() {
  if (process.env.GIT_CMD) {
    return process.env.GIT_CMD;
  }
  if (!inferredGitCommand) {
    inferredGitCommand = cp.execSync('which git', { encoding: 'utf-8' }).trim();
  }
  return inferredGitCommand;
}

function getConfig(key) {
  return getOutput([getGitCommand(), 'config', key]).then((value) => value.trim());
}

function getPreviousCommit(branch) {
  return getOutput([getGitCommand(), 'rev-list', '--max-count=1', branch, '--'])
    .then((rev) => rev.trim())
    .catch(() => null);
}

function getGitTimestamp(d) {
  const tzOff = d.getTimezoneOffset();
  const tzOffHours = Math.abs(Math.floor(tzOff / 60));
  const tzOffMinutes = Math.abs(Math.floor(tzOff % 60));
  const tzOffString = (
    `${tzOff >= 0 ? '+' : '-'}`
    + `${tzOffHours < 10 ? '0' : ''}${tzOffHours}`
    + `${tzOffMinutes < 10 ? '0' : ''}${tzOffMinutes}`
  );
  return `${Math.floor((+d) / 1000)} ${tzOffString}`;
}

function getGitPath(fname) {
  return normalizePath(fname).split(path.sep).join('/');
}

function createTag(tagName, message, ref) {
  return spawnPromise(
    getGitCommand(),
    ['tag', '-a', tagName, '-m', message, ref],
    { stdio: 'inherit' }
  );
}

function push(remote, branch) {
  return spawnPromise(
    getGitCommand(),
    ['push', '-v', remote, branch],
    { stdio: 'inherit' }
  );
}

module.exports.getGitCommand = getGitCommand;
module.exports.getConfig = getConfig;
module.exports.getPreviousCommit = getPreviousCommit;
module.exports.getGitTimestamp = getGitTimestamp;
module.exports.getGitPath = getGitPath;
module.exports.createTag = createTag;
module.exports.push = push;
