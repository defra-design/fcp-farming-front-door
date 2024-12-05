const paymentsUpcoming = require("./payments-upcoming");
const paymentsPrevious = require("./payments-previous");
const businesses = require("./businesses");


module.exports = {
  businesses,
  paymentsUpcoming,
  paymentsPrevious,
  "selectedBusiness": businesses[0],
  "selectedPayment": paymentsUpcoming[0],
  "selectedPaymentPrevious": paymentsPrevious[0],
  "selectedPaymentYear": 2024,
  // Insert values here
}
