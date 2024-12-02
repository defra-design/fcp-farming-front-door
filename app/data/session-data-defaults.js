const payments = require("./payments");
const businesses = require("./businesses");


module.exports = {
  businesses,
  payments,
  "selectedBusiness": businesses[0]
  // Insert values here
}
