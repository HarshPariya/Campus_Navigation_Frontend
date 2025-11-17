// Cleanup script for Next.js dev server
// This removes stale lock files

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Cleaning up Next.js dev environment...');

const lockPath = path.join('.next', 'dev', 'lock');
const devPath = path.join('.next', 'dev');

// Try to kill any Node processes that might be holding the lock (Windows)
// Only kill processes that are likely Next.js dev servers
if (process.platform === 'win32') {
  try {
    // Kill processes on ports 3000 and 3001
    execSync('powershell -Command "$ports = 3000,3001; foreach($port in $ports) { $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue; if($conn) { Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue } }"', { stdio: 'ignore' });
    
    // Kill Node processes in TASK directory
    execSync('powershell -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {$_.Path -like \'*TASK*\'} | Stop-Process -Force -ErrorAction SilentlyContinue"', { stdio: 'ignore' });
    
    // Wait longer for processes to fully terminate and release file handles
    const start = Date.now();
    while (Date.now() - start < 2000) {
      // Wait 2 seconds for file handles to be released
    }
  } catch (err) {
    // Ignore errors if no processes found
  }
}

// Remove lock file if it exists - try multiple times with delays
if (fs.existsSync(lockPath)) {
  let removed = false;
  for (let i = 0; i < 5; i++) {
    try {
      // Change file permissions first (Windows)
      if (process.platform === 'win32') {
        try {
          execSync(`attrib -r "${lockPath}"`, { stdio: 'ignore' });
        } catch (e) {
          // Ignore
        }
      }
      fs.unlinkSync(lockPath);
      console.log('✅ Removed stale lock file');
      removed = true;
      break;
    } catch (err) {
      if (i < 4) {
        // Wait 200ms before retry
        const start = Date.now();
        while (Date.now() - start < 200) {}
      } else {
        console.log('⚠️  Could not remove lock file after retries:', err.message);
      }
    }
  }
}

// Remove entire dev directory if it exists (more aggressive cleanup)
if (fs.existsSync(devPath)) {
  try {
    // On Windows, use rmdir command which is more forceful
    if (process.platform === 'win32') {
      try {
        execSync(`rmdir /s /q "${devPath}"`, { stdio: 'ignore' });
        console.log('✅ Removed .next/dev directory');
      } catch (e) {
        // Fallback to Node.js method
        fs.rmSync(devPath, { recursive: true, force: true });
        console.log('✅ Removed .next/dev directory (fallback)');
      }
    } else {
      fs.rmSync(devPath, { recursive: true, force: true });
      console.log('✅ Removed .next/dev directory');
    }
  } catch (err) {
    console.log('⚠️  Could not remove dev directory:', err.message);
    console.log('💡 Try manually: Remove-Item -Recurse -Force .next\\dev');
  }
}

console.log('✨ Cleanup complete!\n');

