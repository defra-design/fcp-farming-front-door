const paymentsUpcoming = require("./payments-upcoming");
const paymentsPrevious = require("./payments-previous");
const paymentsPreviousItems = require("./payments-previous-items");
const businesses = require("./businesses");

//Adds comma seperators to thousands e.g. 1000 or "1000" becomes "1,000"
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

//Adds £ in correct places (after minus sign if it's a negative value)
function numberWithPoundSign(amount) {
  if (amount < 0) {
    amount = numberWithCommas(amount)
    amount = amount.substring(1);
    return "-£" + amount
  } else {
    return "£" + numberWithCommas(amount)
  }
}

// Calculate totals AND Add commas to numbers in upcoming payments
paymentsUpcoming.forEach(function(_payment, indexA) {
  _payment.total = 0
  _payment.items.forEach(function(_paymentItem, indexB) {
    _payment.total = _payment.total + _paymentItem.amount
    _paymentItem.amountFormatted = numberWithPoundSign(_paymentItem.amount)
  });
  _payment.total = Math.round(_payment.total * 100) / 100
  _payment.totalFormatted = numberWithPoundSign(_payment.total)
});

// Calculate totals AND Add commas to numbers in past payments
paymentsPrevious.forEach(function(_payment, indexA) {
  _payment.items = paymentsPreviousItems
  _payment.total = 0
  _payment.items.forEach(function(_paymentItem, indexB) {
    _payment.total = _payment.total + _paymentItem.amount
    _paymentItem.amountFormatted = numberWithPoundSign(_paymentItem.amount)
  });
  _payment.total = Math.round(_payment.total * 100) / 100
  _payment.totalFormatted = numberWithPoundSign(_payment.total)
});


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
  "defaultSelectedPaymentYear": 2024,
  "selectedPaymentYear": 2024
  // Insert values here
}
