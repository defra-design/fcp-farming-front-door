//
// For guidance on how to create filters see:
// https://prototype-kit.service.gov.uk/docs/filters
//

const govukPrototypeKit = require('govuk-prototype-kit')
const addFilter = govukPrototypeKit.views.addFilter

// Add your filters here

addFilter('shortDate', function shortDate (x) {

    x = new Date()
 
   const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
   const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
 
   const dayOfWeek = daysOfWeek[x.getDay()];
   const dayOfMonth = x.getDate();
   const month = months[x.getMonth()];
 
   return `${dayOfWeek} ${dayOfMonth} ${month}`;
 
 });

 addFilter('toMonth', function toMonth (x) {

  x = x - 1

 const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

 var month = months[x];

 //if not valid month number - November returned as default value
 if(!month){
  month = "November"
 }

 return `${month}`;

});

