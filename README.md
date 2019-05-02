# My Reading List
This is my developer reading list - recent articles and books I've read, with occasional thoughts.

View my [full reading list](https://brettdewoody.github.io/reading-list/).


## How it Works

This reading list is git-based - designed to be easy to update, deploy, and host, using a tool I use nearly daily - `git`.

Adding an item, compiling the list, and deploying, are accomplished with three simple `git` commands. Simplified, the commands are:

* Add an item with `git commit`
* Compile the list with `git log > index.md`
* Deploy the list with `git push origin master`

See below for more specifics on these commands and how to set them up. The result is a publicly available list of articles and associated thoughts.


## Create Your Own Reading List

First, _**DO NOT clone this repo**_. Cloning this repo will merely clone my reading list and not the underlying functionality. This reading list is created using a few simple `git` commands.

To create your own git-based reading list, follow these steps:

1. Create a new directory and init a repo:

  ```bash
  mkdir reading-list
  cd reading-list
  git init
  ```

2. Create a new repo on Github (or similar) and add it as a remote to your local repo, with:

  ```bash
  git remote add origin https://github.com/user/repo.git
  ```

3. Add a `git alias` for adding a new item, with:

  ```bash
  git config alias.addItem "commit --allow-empty"
  ```

  This allows us to perform a no-change commit.

4. Add a `git alias` for building the reading list, with:

  ```bash
  git config alias.build '!git --no-pager log --max-count=100 --grep="^http" --pretty=format:"%ad  
  [%s](%s)  
  %N

  " > index.md'
  ```

  This alias searches the `git log` for commit messages starting with 'http' and writes them to the `index.md` file.

5. Add a `git alias` for deploying the reading list, with:

  ```bash
  git config alias.deployList '!git add index.md && git commit -m "Update reading list" && git push origin master'
  ```

6. Add a `post-commit` hook to run `git build` and push the changes to the remote. First open the `post-commit` hook file using your preferred editor, something like:

  ```bash
  nano .git/hooks/post-commit
  ```

then add:

  ```bash
  #!/bin/bash
  commit_message=$(git log -1 --pretty="format:%s")

  if [[ "$commit_message" == http* ]]; then
  echo "New Item Added"

  git build
  git deployList
  fi

  exit 0
  ```

  Save the file and exit.

7. Make the `post-commit` hook executable, with:

  ```bash
  chmod +x .git/hooks/post-commit
  ```

## And You're Ready To Go

#### Add a new item
To add a new item to your reading list, use:

```bash
git addItem -m "YOUR-URL"
```

The `post-commit` hook will detect the commit and automatically compile the reading list, and push the changes to the remote.

#### Add a note to an item
Notes are added using the built-in `git notes`. To add a note, after the `git addItem` command, perform a:

```bash
  git notes add -m "YOUR NOTE"
  git build
  git deployList
```


Notes can also be added to past items by referencing the commit hash in the `git notes add` command, like:

```bash
  git notes add -m "YOUR NOTE" <COMMIT HASH>
  git build
  git deployList
```


#### Build the reading list

```
git build
```

to compile the reading list. This will update the `index.md` file with the latest changes.


## Making the Reading List Public

If using Github, we can take advantage of [Github Pages](https://pages.github.com/) to make the reading list publicly available.

To enable the public reading list, go to your repo on Github, then Settings, and scroll to 'Github Pages'. Select the `master` branch, and a theme if desired. Your reading list, the `index.md` file, will now be available at https://[YOUR-GITHUB-USERNAME].github.io/[REPO-NAME]/
