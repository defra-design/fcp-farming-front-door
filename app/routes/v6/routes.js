const e = require("express");

module.exports = function (router) {

    var version = "to-be/v6";


    // Every GET and POST
    router.all('/' + version + '/*', function (req, res, next) {

        // can do data setting and checking here - that will happen on every get and post

        next()
    });

    

    //best-teams
    router.get('/' + version + '/index', function (req, res) {
        // req.session.data.dave = "test"
        res.render(version + '/index', {});
    });
    // router.post('/' + version + '/index', function (req, res) {
      // res.redirect(301, '/' + version + '/index');
    // });
    

    


    

}