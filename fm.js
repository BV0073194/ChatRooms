const forever = require('forever-monitor');

const child = new forever.Monitor('index.js', {
  max: 3,
  silent: false,
  uid: 'index',
});

child.on('exit', function() {
  console.log('app.js has exited after 3 restarts');
  const { exec } = require('child_process');
  exec('busybox reboot', (err) => {
    if (err) {
      // node couldn't execute the command
      return err;
    }
  });
});

child.start(); 