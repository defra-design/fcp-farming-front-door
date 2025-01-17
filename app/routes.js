//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Add your routes here


//Using 'myData' as the overarching object to contain all user entered data. Using this instead of the built in 'data' object because of a bug with that. When posting a page, set values in the post in routes are not available immediately on the page if you render that same page from the post. If you refresh the page, the set 'data' is then available. This means we can't prototype things like error validation on pages properly. Until that bug is fixed we will use this method.
var _myData = {
    "mobNumberPers": "07700 900 967",
    "mobNumberBus": "07700 900 967"
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