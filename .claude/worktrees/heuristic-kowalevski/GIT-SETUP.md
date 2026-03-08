# Git setup after adding .gitignore for large files

`.gitignore` now ignores large video files (e.g. `*.mp4`, `client/public/videos/`) so the repo can be pushed to GitHub.

## If the main repo is at the parent folder (`SkyReach Visuals Website`)

1. **Copy `.gitignore` into the main repo root** (if you're working from the main repo, not this worktree):
   ```bash
   cp .gitignore "/path/to/SkyReach Visuals Website/"
   ```

2. **Restore the working tree** (if the main repo shows lots of "deleted" files):
   ```bash
   cd "/path/to/SkyReach Visuals Website"
   git checkout main
   git reset --hard HEAD
   ```

3. **Stop tracking large files** (they stay on disk but are no longer in Git):
   ```bash
   git rm --cached "client/public/"*.mp4 2>/dev/null || true
   git rm -r --cached "client/public/videos" 2>/dev/null || true
   git rm -r --cached "client/public/Website_Background_Video" 2>/dev/null || true
   # Add any other large files or folders you see in `git status`
   git add .gitignore
   git commit -m "Remove large videos from repo; add .gitignore for media"
   ```

4. **Push** (if the repo is still too big, you'll need to rewrite history with `git filter-repo` or BFG, then force-push):
   ```bash
   git push -u origin main
   ```

On the Pi, host the videos elsewhere (e.g. separate storage or CDN) or add them after clone.
