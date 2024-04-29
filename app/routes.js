//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Add your routes here


router.post('/which-service-answer', function(request, response) {

    var country = request.session.data['whichService']
    if (country == "whichRPS"){
        response.redirect("/to-be/v3/rps/sign-in?rpsFirst=True&sfdFirst=")
    } else {
        response.redirect("/to-be/v3/start/sign-in?sfdFirst=True&rpsFirst=")
    }
})