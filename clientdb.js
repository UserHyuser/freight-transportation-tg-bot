const dataStore = require('nedb');
let clientDB = new dataStore({filename: './DBs/clients.txt', autoload: true});
module.exports = clientDB;