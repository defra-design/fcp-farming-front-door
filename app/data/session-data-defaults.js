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

//
// GO THROUGH ALL UPCOMING PAYMENTS DATA, to set various values to use on pages
//
paymentsUpcoming.forEach(function(_payment, indexA) {
  //SET A TOTAL
  _payment.total = 0
  //SET ITEM GROUPS, to be used to list all schemes the items cover and the number of actions (items) within them
  _payment.itemGroups = []
  //GO THROUGH ALL ITEMS WITHIN EACH PAYMENT
  _payment.items.forEach(function(_paymentItem, indexB) {
    //UPDATE THE PAYMENT TOTAL
    _payment.total = _payment.total + _paymentItem.amount
    //FORMAT THE ITEM AMOUNT TOTAL, so we have a £1,000 version of it for rendering
    _paymentItem.amountFormatted = numberWithPoundSign(_paymentItem.amount)

    //BUILD UP ITEM GROUPS LIST
    var _scheme = _paymentItem.scheme
    if(_paymentItem.deduction) {
      //IF IT'S A DEDUCTION THE WE WANT THE SCHEME NAME/GROUP TO HAVE THAT IN IT
      _scheme = "Deductions (" + _scheme + ")"
    }
    const i = _payment.itemGroups.findIndex(e => e.name === _scheme);
    //IF GROUP ALREADY EXIST, then we can add 1 to the count of items this group has and update it's total £
    if (i > -1) {
      _payment.itemGroups[i].count++
      _payment.itemGroups[i].amount = _payment.itemGroups[i].amount + _paymentItem.amount
    //ELSE IF GROUP DOES NOT EXIST, then create it, we want the name, count and amount of £
    } else {
      _payment.itemGroups.push({
        "name": _scheme,
        "count": 1,
        "amount": _paymentItem.amount
      })
    }

  });
  //SET A FORMATTED TOTAL FOR EACH ITEM GROUP, e.g. £1,000 to use on pages
  _payment.itemGroups.forEach(function(_paymentItemGroup, index) {
    _paymentItemGroup.amountFormatted = numberWithPoundSign(_paymentItemGroup.amount)
  });
  //ROUND the total of the whole payment to 2 decimals if needed (had a weird bug where it was giving loads of decimal places)
  _payment.total = Math.round(_payment.total * 100) / 100
  //SET A FORMATTED TOTAL FOR THE WHOLE PAYMENT, e.g. £1,000 to use on pages
  _payment.totalFormatted = numberWithPoundSign(_payment.total)
});


// PREVIOUS PAYMENTS
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
