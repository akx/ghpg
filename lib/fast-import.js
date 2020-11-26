/* eslint-disable no-param-reassign */
const fs = require('fs');

const {
  getGitPath,
  getConfig,
  getPreviousCommit,
  getGitTimestamp,
  getGitCommand,
} = require('./git-util');
const {
  sequentially,
  spawnPromise,
  accessAsync,
  statAsync,
} = require('./util');

/**
 * Write a fast-import commit header into the given stream.
 *
 * @param {stream.Writable} pipe The stream to write the commit header into.
 * @param {String} branch Branch name (`refs/heads` is prepended); the parent commit is read from here too
 * @param {String} message Commit message
 * @param {boolean} clean Whether to clean the branch ("deleteall")
 */
async function startCommit(pipe, branch, message, clean) {
  if (!branch) {
    throw new Error('Branch required');
  }
  if (!message) {
    throw new Error('Message required');
  }
  const [username, email, head] = await Promise.all([
    getConfig('user.name'),
    getConfig('user.email'),
    getPreviousCommit(branch),
  ]);
  pipe.write(`commit refs/heads/${branch}\n`);
  pipe.write(
    `committer ${username} <${email}> ${getGitTimestamp(new Date())}\n`,
  );
  const messageBuffer = Buffer.from(message, 'utf8');
  pipe.write(`data ${messageBuffer.length}\n`);
  pipe.write(messageBuffer);
  pipe.write('\n');
  if (head) {
    pipe.write(`from ${head}\n`);
  }
  if (clean) {
    pipe.write('deleteall\n');
  }
}

/**
 * Write a fast-import file header into the given stream.
 *
 * @param {stream.Writable} pipe The stream to write the commit header into.
 * @param {String} pth The relative file path. Sanitized internally.
 * @param {boolean} isExecutable Whether to mark the file executable.
 * @param {boolean} size The size of the data to follow.
 */
function writeFileHeader(pipe, pth, isExecutable, size) {
  pipe.write(
    `M ${isExecutable ? '100755' : '100644'} inline ${getGitPath(pth)}\n`,
  );
  pipe.write(`data ${size}\n`);
}

/**
 * Copy a file system file into the fast-import stream.
 *
 * @param {stream.Writable} pipe The stream to write the commit header into.
 * @param {String} repositoryPath Destination repository path
 * @param {String} sourcePath Source filesystem path
 */
async function addFilesystemFile(pipe, repositoryPath, sourcePath) {
  const [isExecutable, stat] = await Promise.all([
    accessAsync(sourcePath, fs.constants.X_OK)
      .then(() => true)
      .catch(() => false),
    statAsync(sourcePath),
  ]);
  writeFileHeader(pipe, repositoryPath, isExecutable, stat.size);
  return new Promise((resolve) => {
    const stream = fs.createReadStream(sourcePath);
    stream.pipe(pipe, { end: false });
    stream.on('end', () => resolve());
  });
}

/**
 * Copy a virtual file into the fast-import stream.
 *
 * @param {stream.Writable} pipe The stream to write the commit header into.
 * @param {String} repositoryPath Destination repository path
 * @param {Buffer|string} contents Content buffer (or string, in which case it's UTF-8)
 * @param {boolean} isExecutable Whether to mark the file executable
 */
function addVirtualFile(pipe, repositoryPath, contents, isExecutable) {
  const buffer = Buffer.from(contents);
  writeFileHeader(
    pipe,
    repositoryPath,
    isExecutable,
    Buffer.byteLength(buffer),
  );
  pipe.write(buffer);
}

function validateOptions(options) {
  return {
    branch: null,
    message: null,
    directory: '.',
    clean: true,
    ...options,
  };
}

async function writeFastImport(pipe, fileMap, options) {
  await startCommit(pipe, options.branch, options.message);
  sequentially(Object.keys(fileMap), (relativePath) => {
    const value = fileMap[relativePath];
    const repositoryPath = `${options.directory}/${relativePath}`;
    if (typeof value === 'string') {
      return addFilesystemFile(pipe, repositoryPath, value);
    }
    if (value.contents === undefined) {
      const err = new Error(
        `file map value for ${relativePath} must be a FS path or an object with {contents} buffer; got ${value}`,
      );
      err.repositoryPath = repositoryPath;
      err.value = value;
      throw err;
    }
    return addVirtualFile(
      pipe,
      repositoryPath,
      value.contents,
      !!value.isExecutable,
    );
  });
  return pipe.write('done\n');
}

async function runImport(fileMap, options) {
  options = validateOptions(options);
  await spawnPromise(
    getGitCommand(),
    ['fast-import', '--date-format=raw', '--quiet', '--done'],
    { stdio: ['pipe', process.stdout, process.stderr] },
    (proc) => {
      const pipe = proc.stdin;
      writeFastImport(pipe, fileMap, options)
        .then(() => pipe.end())
        .catch((err) => {
          pipe.end();
          throw err;
        });
    },
  );
  return getPreviousCommit(options.branch);
}

module.exports.runImport = runImport;
module.exports.writeFastImport = writeFastImport;
