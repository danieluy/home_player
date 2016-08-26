/*
* Inspired by: http://stackoverflow.com/questions/4360060/video-streaming-with-html-5-via-node-js
*/
'use strict'
const http = require('http');
const fs = require('fs');
const url = require('url');
const file_types = require('./fileTypes.json');
const config = require('./config.json');
// const files_list = [];

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
  // sets the headers to allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  // fs.readdirSync() throws an error when the folder doesn't exists
  try{
    const files = fs.readdirSync(config.files_folder);
    if(files.length){
      const list = filesList(config.files_folder, files);
      const tree = filesTree(list);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(tree, null, 3));
    }
    else throw new Error('There are no files available');
  }
  catch(err) {res500(req, res, err)}
}

// GET '/playfile?filepath=filepath&filename=filename&fileextension=fileextension'
function resFile(req, res){
  // sets the headers to allow CORS
  res.setHeader("Access-Control-Allow-OOrigin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  const query = url.parse(req.url, true).query;
  // file path
  const path = query.filepath + query.filename + '.' + query.fileextension;
  // total size in bytes
  const total = fs.statSync(path).size;
  if(req.headers.range){
    // gets the range that the browser's header declares that it can accept
    const range = req.headers.range
    .slice(6)// slices the first part ("bytes=")
    .split("-")// splits it to get the values (strings) on a array
    .map((value) => {return value ? parseInt(value) : total-1}); // parses the string to int values, find out why the original version subtracts 1 from the total
    const start = range[0];
    const end = range[1];
    const chunk_size = (end - start) + 1;
    // writes the response code 206 (Partial Content) and the other pertinent info
    res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunk_size, 'Content-Type': getMimetype(query.fileextension) });
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

function getMimetype(file_ext){
  let mimemtype = '';
  for (var key in file_types) {
    if(file_types[key] && file_types[key].length){
      file_types[key].forEach((file_type) => {
        if(file_type.extension === file_ext) mimemtype = file_type.mimetype;
      });
    }
  }
  return mimemtype;
}

// recursively puts toghether and returns the file's list
function filesList(path, files){
  // makes sure every path ends in "/"
  path = path.charAt(path.length-1) === '/' ? path : path+'/';
  const formatted_files = [];
  files.forEach((file) => {
    // gets the stats (info) of the file/folder
    const stats = fs.statSync(path + file);
    // if it's a folder it fetch it's own content and calls it self, then it pushes the resulting files to the formatted_files array
    if(stats.isDirectory()){
      const subdirectory_files = fs.readdirSync(path + file);
      if(subdirectory_files.length)
      filesList(path + file, subdirectory_files)
      .forEach((formatted_file) => {formatted_files.push(formatted_file)});
    }
    // if it's a file it pushes it to the formatted_files array
    else if(stats.isFile()){
      formatted_files.push(fileFormatter(path, file));
    }
  });
  // previous to return the formatted_files array it filters the Thumbs.db files
  return formatted_files.filter(formatted_file => okExtensions(formatted_file.fileextension));
}

function okExtensions(file_extension){
  switch (file_extension) {
    case 'db':
      return false;
    case 'nfo':
      return false;
    case 'ini':
      return false;
    case 'txt':
      return false;
    default:
      return true;
  }
}

// puts toghether and returns the file's tree
function filesTree(files){
  const files_tree = {};
  files.forEach((formatted_file) => {
    const key = formatted_file.filepath.match(/\/[^\/]+\/$/g)[0].slice(1, -1);
    if(!files_tree[key]) files_tree[key] = [];
    files_tree[key].push(formatted_file);
  });
  return files_tree;
}

function fileFormatter(path, file){
  const file_extension = file.match(/\.\w+$/)[0].slice(1);
  const file_name = file.slice(0, (file_extension.length + 1)*-1);
  return {'filepath': path, 'filename': file_name, 'fileextension': file_extension.toLowerCase()};
}

function res404(req, res){
  res.writeHead(404, {"Content-Type": "text/html"});
  res.end(
    "<h3>Sorry we could not find the file you requested<h3>"+
    "<h3><a href='/'>Home</a><h3>"
  );
}

function res500(req, res, err){
  console.error(err);
  res.writeHead(500, { 'Content-Type': 'text/html' });
  res.end(
    "<h3>Sorry, an internal server error has ocurred<h3>"+
    "<p>" + err + "</p>"+
    "<h3><a href='/'>Home</a><h3>"
  );
}
