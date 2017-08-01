const glob = require('glob');
const path = require('path');
const util = require('util');

const globAsync = util.promisify(glob);

function findFiles(sourceDirectory, pattern = '**/*') {
  return globAsync(pattern, { cwd: sourceDirectory, nodir: true }).then((files) => {
    const fileMap = {};
    files.forEach((p) => {
      fileMap[p] = path.join(sourceDirectory, p);
    });
    return fileMap;
  });
}

module.exports.findFiles = findFiles;
