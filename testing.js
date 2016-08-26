const fs = require('fs');
try{
  const files = fs.readdirSync('/home/daniel/Desktop/empty');
  console.log(files);
}
catch(err){
  console.error(err);
}
