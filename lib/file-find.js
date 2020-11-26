const glob = require('glob');
const path = require('path');
const util = require('util');

const globAsync = util.promisify(glob);

async function findFiles(sourceDirectory, pattern = '**/*') {
  const files = await globAsync(pattern, { cwd: sourceDirectory, nodir: true });
  const fileMap = {};
  files.forEach((p) => {
    fileMap[p] = path.join(sourceDirectory, p);
  });
  return fileMap;
}

module.exports.findFiles = findFiles;
