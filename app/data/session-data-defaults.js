const paymentsUpcoming = require("./payments-upcoming");
const paymentsPrevious = require("./payments-previous");
const businesses = require("./businesses");


module.exports = {
  businesses,
  user: {
    "name": "Alfred Waldron",
    "email": "alfred.waldron@gmail.com",
    "crn": "1101996862"
  },
  paymentsUpcoming,
  paymentsPrevious,
  "selectedBusiness": businesses[0],
  "selectedPayment": paymentsUpcoming[0],
  "selectedPaymentPrevious": paymentsPrevious[0],
  "selectedPaymentYear": 2024,
  // Insert values here
}
