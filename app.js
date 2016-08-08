'use strict'

const fs = require('fs');

const readStream = fs.createReadStream('file.mp4');
const writeStream = fs.createWriteStream('fileCopy.mp4');

// To use with text files
// readStream.setEncoding('utf8')
let counter = 0;
readStream.on('data', (chunk) => {
  // counter++;
  // readStream.pause();
  console.log(`Received ${chunk.length} bytes of data.`);
  readStream.pause();
  console.log('There will be no additional data for 5 second.');
  setTimeout(() => {
    console.log('Now data will start flowing again.');
    readStream.resume();
  }, 5000);
});
readStream.on('end', () => {
  console.log(counter);
})
readStream.pipe(writeStream);
