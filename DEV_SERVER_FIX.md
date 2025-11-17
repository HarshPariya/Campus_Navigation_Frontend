# Next.js Dev Server Lock File Fix

## Problem
The error `Unable to acquire lock at .next/dev/lock` occurs when:
- A previous dev server instance didn't shut down properly
- The lock file wasn't cleaned up after a crash
- Multiple instances tried to run simultaneously

## Solution Implemented

### Automatic Cleanup
The dev server now automatically cleans up stale lock files before starting:
- **`npm run dev`** - Automatically runs cleanup, then starts the server
- **`npm run dev:clean`** - Explicitly runs cleanup, then starts the server

### How It Works
1. A `predev` npm script hook automatically runs `cleanup-dev.js` before `next dev`
2. The cleanup script removes:
   - Stale lock files (`.next/dev/lock`)
   - The entire `.next/dev` directory if needed

## Manual Cleanup (If Needed)

If you still encounter issues, manually clean up:

```powershell
cd frontend

# Remove lock file
Remove-Item -Force .next\dev\lock -ErrorAction SilentlyContinue

# Or remove entire dev directory
Remove-Item -Recurse -Force .next\dev -ErrorAction SilentlyContinue

# Kill any Node processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Then start dev server
npm run dev
```

## Quick Fix Command

One-liner to fix and start:
```powershell
cd frontend; Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force; Remove-Item -Recurse -Force .next\dev -ErrorAction SilentlyContinue; npm run dev
```

## Prevention

The automatic cleanup should prevent this issue from happening again. The `predev` hook ensures cleanup runs every time you start the dev server.

