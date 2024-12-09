const paymentsUpcoming = require("./payments-upcoming");
const paymentsPrevious = require("./payments-previous");
const businesses = require("./businesses");

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Calculate totals AND Add commas to numbers in upcoming payments
paymentsUpcoming.forEach(function(_payment, indexA) {
  _payment.total = 0
  _payment.items.forEach(function(_paymentItem, indexB) {
    _payment.total = _payment.total + _paymentItem.amount

    //Set minus sign and £ in right place
    if (_paymentItem.amount < 0) {
      _paymentItem.amount = numberWithCommas(_paymentItem.amount)
      _paymentItem.amount = _paymentItem.amount.substring(1);
      _paymentItem.amount = "-£" + _paymentItem.amount
    } else {
      _paymentItem.amount = "£" + numberWithCommas(_paymentItem.amount)
    }

  });

  _payment.total = Math.round(_payment.total * 100) / 100

  //Set minus sign and £ in right place
  if (_payment.total < 0){
    _payment.total = numberWithCommas(_payment.total)
    _payment.total = _payment.total.substring(1);
    _payment.total = "-£" + numberWithCommas(_payment.total)
  } else {
    _payment.total = "£" + numberWithCommas(_payment.total)
  }

});

// Add commas to numbers in past payments
paymentsPrevious.forEach(function(_payment, index) {
  _payment.amount = numberWithCommas(_payment.amount)
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
  "selectedPaymentYear": 2024,
  // Insert values here
}
