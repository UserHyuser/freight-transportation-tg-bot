

const dataStore = require('nedb-promises');
let lawyerDB = new dataStore({filename: './DBs/lawyers.txt', autoload: true});
module.exports = lawyerDB;




