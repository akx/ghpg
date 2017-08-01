ghpg
====

Easily publish a directory to `gh-pages` (or another branch really).

Inspired by [tschaub/gh-pages](https://github.com/tschaub/gh-pages).

Implemented using [git-fast-import](https://git-scm.com/docs/git-fast-import),
so there is no intermediate checkout step or cache shenanigans.

## Usage

The command-line usage and parameter naming of `ghpg` mirrors that of `gh-pages`,
but the branch is *not pushed by default* (use `--push` for that).

```

  Usage: ghpg [options]


  Options:

    -V, --version            output the version number
    -d, --dist <dist>        Source directory
    -s, --src <src>          Minimatch pattern for publishable files
    -b, --branch <branch>    Branch to create commit in
    -e, --dest <dest>        Target directory within the destination branch
    -a, --add                Only add, and never remove existing files
    -m, --message <message>  Commit message
    -g, --tag <tag>          Add tag to commit
    -o, --remote <name>      The name of the remote (if pushing)
    -p, --push               Push the branch after creating the commit
    -h, --help               output usage information
```

### Programmatic usage

The bits and pieces `ghpg` uses to do its magic are modularized and promise-based; see `bin/ghpg` how to use them.