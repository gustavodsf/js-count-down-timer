const CountdownTimer = require('./countdown-timer');

const startTime = process.argv.length >= 3 ? process.argv[2] : 185;

const timer = new CountdownTimer({
  startTime: startTime,
  onFinish: () => {
    console.log('Finished!');
  }
});

console.log(`Starting timer is ${startTime} seconds.`);

timer.start();