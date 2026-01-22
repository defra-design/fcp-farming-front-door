//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Add your routes here


//
//Using 'myData' as a custom overarching object to contain all user entered data. e.g. on a page 'myData.mobNumberPers'
//
//Using this instead of the built in 'data' object because of a bug with that. Bug = When posting a page, values set in the post in routes are not available immediately on the page if you render that same page from the post. If you refresh the page, the values that were set on 'data' are then available. This means we can't prototype things like error validation on pages properly. Until that bug is fixed we will use this method.
var _myData = {
    "nameTitlePers": "",
    "nameFirstPers": "Alfred",
    "nameMiddlePers": "",
    "nameLastPers": "Waldron",
    "namePers": "Alfred Waldron",
    "dobDayPers": "2",
    "dobMonthPers": "11",
    "dobYearPers": "1970",
    "address1Pers": "10 Skirbeck Way",
    "address2Pers": "",
    "addressCityPers": "Maidstone",
    "addressCountyPers": "",
    "addressPostcodePers": "SK22 1DL",
    "addressCountryPers": "United Kingdom",
    "telNumberPers": "01632 960000",
    "mobNumberPers": "07700 900 967",
    "emailPers": "alfredwaldron@email.com",

    "nameBus": "Agile Farm Ltd",
    "address1Bus": "10 Skirbeck Way",
    "address2Bus": "",
    "addressCityBus": "Maidstone",
    "addressCountyBus": "",
    "addressPostcodeBus": "SK22 1DL",
    "addressCountryBus": "United Kingdom",
    "telNumberBus": "01632 960000",
    "mobNumberBus": "07700 900 967",
    "emailBus": "agilefarmsrus25@gmail.com",
    "typeBus": "Farmer",
    "legalBus": "Sole proprietorship",
    "legalCHRNBus": "",
    "legalCCRNBus": "",
    "vatBus": "",
    "bankNameBus": "Alfred Waldron",
    "bankSortBus": "123456",
    "bankAccountBus": "12345678",
    "bankRollBus": "",
    "bankCountryCode": "",

    "cookiesFunctional": "No",
    "cookiesAnalytics": "No",

    "includeValidation": "true", //used to show either the prototype as internal user or external user
    "view": "ext", //used to show either the prototype as internal user or external user
    "bank": "filled",
    "rollNumber": "no",
    "regBus" : "true", // used to display the business list with businesses - or not
    "access" : "full",
    "permissionsMVP" : "full",
    "addNumberBus" : "full",
    "addNumberPers" : "full",
    "addDOBPers" : "full",
    "filesUploaded" : "empty",
    "newToFileUpload" : "no",
    "upliftSucessBus" : "no",
    "upliftSucessPers" : "no",

    "intSearchType": "all" //used to show default tab displayed on internal search results page
}

router.post('/which-service-answer', function(request, response) {

    var country = request.session.data['whichService']
    if (country == "whichRPS"){
        response.redirect("/to-be/v3/rps/sign-in")
    } else {
        response.redirect("/to-be/v3/start/sign-in")
    }
})

require('./routes/v6/routes.js')(router);
require('./routes/v7/routes.js')(router,JSON.parse(JSON.stringify(_myData)));
require('./routes/v8/routes.js')(router,JSON.parse(JSON.stringify(_myData)));
require('./routes/v9/routes.js')(router,JSON.parse(JSON.stringify(_myData)));
require('./routes/v10/routes.js')(router,JSON.parse(JSON.stringify(_myData)));
require('./routes/v11/routes.js')(router,JSON.parse(JSON.stringify(_myData)));
require('./routes/v14/routes.js')(router,JSON.parse(JSON.stringify(_myData)));
require('./routes/v15-DAL/routes.js')(router,JSON.parse(JSON.stringify(_myData)));
require('./routes/v16/routes.js')(router,JSON.parse(JSON.stringify(_myData)));
require('./routes/MVP/routes.js')(router,JSON.parse(JSON.stringify(_myData)));
require('./routes/MVP-enhanced/routes.js')(router,JSON.parse(JSON.stringify(_myData)));
require('./routes/AHWP/routes.js')(router,JSON.parse(JSON.stringify(_myData)));
require('./routes/AHWP-v2/routes.js')(router,JSON.parse(JSON.stringify(_myData)));
require('./routes/IAHW/routes.js')(router,JSON.parse(JSON.stringify(_myData)));