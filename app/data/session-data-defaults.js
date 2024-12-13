const paymentsUpcoming = require("./payments-upcoming");
const paymentsPrevious = require("./payments-previous");
const paymentsPreviousItems = require("./payments-previous-items");
const businesses = require("./businesses");

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
  //ROUND the total of the whole payment to 2 decimals if needed (had a weird bug where it was giving loads of decimal places)
  _payment.total = Math.round(_payment.total * 100) / 100
});

//
// GO THROUGH ALL PAST PAYMENTS DATA, to set various values to use on pages
//
paymentsPrevious.forEach(function(_payment, indexA) {
  //SETS the same payment items for each past payment. Pulled from a data file.
  _payment.items = paymentsPreviousItems
  //SET A TOTAL
  _payment.total = 0
  //GO THROUGH ALL ITEMS WITHIN EACH PAYMENT
  _payment.items.forEach(function(_paymentItem, indexB) {
    //UPDATE THE PAYMENT TOTAL
    _payment.total = _payment.total + _paymentItem.amount
  });
  //ROUND the total of the whole payment to 2 decimals if needed (had a weird bug where it was giving loads of decimal places)
  _payment.total = Math.round(_payment.total * 100) / 100
});


module.exports = {
  businesses, //businesses list
  user: {
    "name": "Alfred Waldron",
    "email": "alfred.waldron@gmail.com",
    "crn": "1101996862"
  },
  paymentsUpcoming, //all upcoming payments
  paymentsPrevious, //all past payments
  "selectedBusiness": businesses[0], 
  "selectedPayment": paymentsUpcoming[0], 
  "selectedPaymentPrevious": paymentsPrevious[0], 
  "defaultSelectedPaymentYear": 2024, //used on the tabs so when clicked they start from the recent year
  "selectedPaymentYear": 2024 //used for the year filter on past payments page
  // Insert values here
}
