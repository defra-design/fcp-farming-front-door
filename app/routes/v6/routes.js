const e = require("express");

module.exports = function (router) {

    var version = "v6";


    // Every GET and POST
    router.all('/' + version + '/*', function (req, res, next) {

        // can do data setting and checking here - that will happen on every get and post

        next()
    });

    

    //index
    router.get('/' + version + '/index', function (req, res) {
        // req.session.data.dave = "test"
        res.render(version + '/index', {});
    });
    // router.post('/' + version + '/index', function (req, res) {
      // res.redirect(301, '/' + version + '/index');
    // });

    //business-payments
    router.get('/' + version + '/business-payments', function (req, res) {
        req.session.data.dave = "test"
        res.render(version + '/business-payments', {});
    });
    // router.post('/' + version + '/index', function (req, res) {
      // res.redirect(301, '/' + version + '/index');
    // });
    

    


    

}