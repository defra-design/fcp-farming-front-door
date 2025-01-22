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
    "dobDayPers": "2",
    "dobMonthPers": "11",
    "dobYearPers": "1970",
    "address1Pers": "10 Skirbeck Way",
    "address2Pers": "",
    "addressCityPers": "Maidstone",
    "addressCountyPers": "",
    "addressPostcodePers": "SK22 1DL",
    "telNumberPers": "01632 960000",
    "mobNumberPers": "07700 900 967",
    "emailPers": "alfredwaldron@email.com",

    "nameBus": "Agile Farms Ltd",
    "address1Bus": "10 Skirbeck Way",
    "address2Bus": "",
    "addressCityBus": "Maidstone",
    "addressCountyBus": "",
    "addressPostcodeBus": "SK22 1DL",
    "telNumberBus": "01632 960000",
    "mobNumberBus": "07700 900 967",
    "emailBus": "agilefarmsrus25@gmail.com",
    "typeBus": "Farmer"
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