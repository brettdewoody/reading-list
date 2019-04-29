# How it works

This is a list of articles and books I've read and found interesting. It's designed to be easy to update, using a tool I use nearly daily - `git`.

Adding a new item to the reading list is as easy as performing a `git commit`, with a message containing a link to the item. For example:

```bash
git commit --allow-empty -m "[URL]" -m "[COMMENTS]"
```

## Create Your Own Reading List

First, _**don't clone this repo**_. Cloning this repo will merely clone my reading list and not the underlying functionality. To create your own git-based reading list, follow these steps:

1. Create a new directory and init a repo:

  ```bash
  mkdir reading-list
  cd reading-list
  git init
  ```

2. Create a new repo on Github (or similar) and connect your local with the remote.

3. Add a `git alias` for adding a new item, with:

  ```bash
  git config alias.addItem "commit --allow-empty"
  ```

  This allows us to perform a no-change commit.

4. Add a `git alias` for building the reading list, with:

  ```bash
  git config alias.build '!git --no-pager log --max-count=100 --grep="^http" --pretty=format:"%ad%n%s%n%N" > index.md'
  ```

  This searches the `git log` for commit messages starting with 'http' and writes them to the `index.md` file.

## And You're Ready To Go

#### Add a new item
To add a new item to your reading list, use:

```bash
git addItem -m "YOUR-URL"
```


#### Add a note to an item
Notes are added using the built-in `git notes`. To add a note, after the `git addItem` command, perform a:

```bash
  git notes add -m "YOUR NOTE"
```

Notes can also be added to past items by referencing the commit hash in the `git notes add` command, like:

```bash
  git notes add -m "YOUR NOTE" <COMMIT HASH>
```


#### Build the reading list

```
git build
```

to compile the reading list. This will update the `index.md` file with the latest changes.


#### Deploy the reading List
Deploy the reading list by pushing to master, with

```bash
  git push origin master
```


## Making the Reading List Public

If using Github, we can take advantage of [Github Pages](https://pages.github.com/) to display the reading list on a public site.

To enable the public reading list, go to your repo on Github, then Settings, and scroll to 'Github Pages'. Select the `master` branch, and a theme if desired. Your reading list, the `index.md` file, will now be available at