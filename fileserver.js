/*
* Inspired by: http://stackoverflow.com/questions/4360060/video-streaming-with-html-5-via-node-js
*/
'use strict'
const http = require('http');
const fs = require('fs');
const url = require('url');
const file_types = require('./fileTypes.json');
const config = require('./config.json');
const files_tree = [];

http.createServer(onRequest).listen(8080, () => {
  console.log('Server running at http://192.168.1.108:8080/');
});

function onRequest(req, res){
  const path_name = url.parse(req.url, true).pathname;
  switch (path_name) {
    case '/':
      resFileList(req, res);
      break;
    case '/playfile':
      resFile(req, res);
      break;
    default:
      res404(req, res);
  }
}

// GET '/'
function resFileList(req, res){

}
// config.files_folder
function files_tree(path){
  const stats = fs.statSync(path);
  if(stats.isFile()){
    files_tree.push()
  }
}

function readDir(dir_path){
  return new Promise((resolve, reject) => {
    fs.readdir(dir_path, (err, files) => {
      if(err) reject(err);
      else resolve(files);
    });
  })
}

// const files_json = [];
// files.filter(file => { return file !== 'Thumbs.db' && file !== 'Desktop.ini'})
// .map((file) => {
//   files_json.push({
//     name: file.replace(/\s\(\d{4}\)/, ''),
//     year: file.match(/\(\d{4}\)/) ? parseInt(file.match(/\(\d{4}\)/)[0].slice(1, -1)) : null,
//     folder_path: dir_path + '/' + file
//   });
// });
// console.log(files_json);

// GET '/playfile?filename=filename&type=type'
function resFile(req, res){
  const query = url.parse(req.url, true).query;
  console.log(query);
  // file path
  const path = query.filename + '.' + query.type;
  // total size in bytes
  const total = fs.statSync(path).size;
  if(req.headers.range){
    // gets the range that the browser's header declares that it can accept
    // slices the first part ("bytes=")
    // splits it to get the values (strings) on a array
    // parses the string to int values
    const range = req.headers.range
    .slice(6)
    .split("-")
    .map((value) => {return value ? parseInt(value) : total-1}); // find out why the original version subtracts 1 from the total
    const start = range[0];
    const end = range[1];
    const chunk_size = (end - start) + 1;
    // writes the response code 206 (Partial Content) and the other pertinent info
    res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunk_size, 'Content-Type': 'video/mp4' });
    // creates a read stream with the file size that the browser can accept and pipes it into the response object
    fs.createReadStream(path, {start: start, end: end}).pipe(res);
  }
  else{
    // writes the response code 200 (OK) and the other pertinent info
    res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'video/mp4' });
    // creates a read stream with the full file size and pipes it into the response object
    fs.createReadStream(path).pipe(res);
  }
}

function res404(req, res){
  res.writeHead(404, {"Content-Type": "text/html"});
  res.end(
    "<h3>Sorry we could not find the file you requested<h3>"+
    "<h3><a href='/'>Home</a><h3>"
  );
}
