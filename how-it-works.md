# How it works

This is a list of articles and books I've read and found interesting. It's designed to be easy to update, using a tool I use nearly daily - `git`.

Adding a new item to the reading list is as easy as performing a `git commit`, with a message containing a link to the item. For example:

```bash
git commit --allow-empty -m "[URL]" -m "[COMMENTS]"
```

## Create Your Own Reading List

First, _**don't clone this repo**_. If you do, you'll merely clone my reading list, and not the underlying functionality. To create your own git-based reading list, follow these steps:


1. Create a new directory and initialize a repo:

  ```bash
  mkdir reading-list
  cd reading-list
  git init
  ```

2. Add a `git alias` to make adding a new item easier, with:

  ```bash
  git config --global alias.addItem 'commit --allow-empty'
  ```

3. Setup a `git` hook to watch for `git commit`s containing a URL to update the list. We'll use the `commit-msg` hook for this. Open `.git/hooks/commit-msg` and paste the following script into it:

  ```bash
  #!/bin/sh

  commit_regex="(^http)"
  response="New item added."
  commit_msg=$(cat "${1}")
  now=$(date +"%B %d, %Y")
  readingListFilename="readinglist.md"

  if grep -iqE "$commit_regex" "$1"; then
      echo "$now - $commit_msg \n\n" >> /tmp/tmpfile.$$
      cat "readinglist.md" >> /tmp/tmpfile.$$
      mv /tmp/tmpfile.$$ "$readingListFilename"
      git update-index --add $readingListFilename
      echo "$response" >&2
  fi

  exit 0
  ```

  When the `commit-msg` hook is triggered, this script looks for commits starting with `http`, prepends the new item to the reading list, and adds the updated file to the commit.

4. Now make the `git hook` executable, with:

  ```bash
  chmod +x .git/hooks/commit-msg
  ```

5. Create a placeholder file for the reading list. Since we named the reading list `readinglist.md` in the `git hook`, we'll use:

  ```bash
  touch readinglist.md
  ```


## And You're Ready To Go
To add a new item to your reading list, use:

```bash
git addItem -m "YOUR-URL"
```

or

```bash
git addItem -m "YOUR-URL" -m "NOTES"
```
