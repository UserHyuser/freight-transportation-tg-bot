const dataStore = require('nedb-core');
let orderDB = new dataStore({filename: './DBs/orders.txt', autoload: true});
module.exports = orderDB;