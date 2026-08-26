const fs = require('fs');
let src = fs.readFileSync('app.js','utf8');
src = src.replace('alert("Property published locally!");', 'alert("Property published locally!");\n      loadAdminListings();');
fs.writeFileSync('app.js', src);
