Add a URL to the reading list.

Usage: /add-link <url>

Steps:
1. Create an empty git commit with the URL as the commit message: `git commit --allow-empty -m "<url>"`
2. Rebuild index.md from the git log: `git --no-pager log --max-count=100 --grep="^http" --date=local --pretty=format:"%ad  \n[%s](%s)  \n%N\n" > index.md`
3. Stage and commit index.md: `git add index.md && git commit -m "Update reading list"`
4. Push to remote: `git push -u origin <current-branch>`

If no URL is provided in the arguments, ask the user for one before proceeding.
