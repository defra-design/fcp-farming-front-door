const paymentsUpcoming = require("./payments-upcoming");
const paymentsPrevious = require("./payments-previous");
const paymentsPreviousItems = require("./payments-previous-items");
const businesses = require("./businesses");
const users = require("./users");
const messages = require("./messages");
const pageList = require("./page-list");

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

  "version": "v8", //put latest prototype version folder name here as a default

  "view": "ext", //used to show either the prototype as internal user or external user

  "release": "b1", //used to show different release versions e.g. buffalo mvp, buffalo v2, capybara, etc. Set on prototype setup page from version 7 onwards. can also be overriddenn on pages with a query string ?release=concept ?release=b1
    //concept = latest designs / conceptual for testing
    //b1 = buffalo first release 'Buffalo 1.0 MVP'
    //b2 - buffalo second release 'Buffalo 1.X'
  "startFrom": "si", //used to determine where the prototype starts from
    //st = lstart page (sfd)
    //si = sign in (sfd)
    //bl - business list
    //home - home / business page
  "includeValidation": "true", //used to determine whether any forms will throw validation errors or not. good to turn on for user testing.

  users, //users list
  "user": users[0],

  businesses, //businesses list
  "selectedBusiness": businesses[0], 

  //PAYMENTS DATA
  paymentsUpcoming, //all upcoming payments
  paymentsPrevious, //all past payments
  "selectedPayment": paymentsUpcoming[0], //default selected payment (for payment detail page)
  "selectedPaymentPrevious": paymentsPrevious[0], //default selected previous payment (for payment detail page)
  "defaultSelectedPaymentYear": 2024, //used on the tabs so when clicked they start from the recent year
  "selectedPaymentYear": 2024, //used for the year filter on past payments page

  pageList, //contains urls, page names and meta descriptions - used for the designspec popout panel

  messages, //messages list
  "selectedMessagesType": "All messages", //used for the read/unread filter on messages page

  "schemes": [
    {
      "value": "Countryside stewardship"
    },
    {
      "value": "Sustainable farming incentive 2024"
    },
    {
      "value": "Sustainable farming incentive 2023"
    }
  ] //used for the filters on messages list

}
