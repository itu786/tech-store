const { exec } = require('child_process');

function gitAutoCommitPush() {
  const commitMessage = `Auto commit at ${new Date().toISOString()}`;

  exec('git add .', (err, stdout, stderr) => {
    if (err) {
      console.error(`Error adding files: ${stderr}`);
      return;
    }
    exec(`git commit -m "${commitMessage}"`, (err2, stdout2, stderr2) => {
      if (err2) {
        // Ignore error if no changes to commit
        if (stderr2.includes('nothing to commit')) {
          console.log('No changes to commit');
        } else {
          console.error(`Error committing: ${stderr2}`);
        }
        return;
      }
      exec('git push', (err3, stdout3, stderr3) => {
        if (err3) {
          console.error(`Error pushing: ${stderr3}`);
          return;
        }
        console.log(`Successfully pushed at ${new Date().toLocaleTimeString()}`);
      });
    });
  });
}

// Run once immediately
gitAutoCommitPush();

// Then run every 10 minutes (600000 milliseconds)
setInterval(gitAutoCommitPush, 600000);
