Add a note to an existing reading list entry.

Usage: /add-note <note>

Steps:
1. Show the user the 10 most recent reading list entries to pick from: `git --no-pager log --max-count=20 --grep="^http" --pretty=format:"%h %ad  %s" --date=short`
2. Ask the user which entry they want to attach the note to (by number or URL).
3. Add the note to the identified commit: `git notes add -m "<note>" <commit-hash>`
4. Rebuild index.md from the git log: `git --no-pager log --max-count=100 --grep="^http" --date=local --pretty=format:"%ad  \n[%s](%s)  \n%N\n" > index.md`
5. Stage and commit index.md: `git add index.md && git commit -m "Update reading list"`
6. Push to remote: `git push -u origin <current-branch>`

If no note text is provided in the arguments, ask the user for one before proceeding.
