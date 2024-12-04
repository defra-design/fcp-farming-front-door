const e = require("express");

module.exports = function (router) {

    var version = "v6";

    // function setSelectedBusiness(req){
    //   if(req.query.business){
    //     console.log(req.query.business)
    //     req.session.data.businesses.forEach(function(_business, index) {
    //       if(req.query.business == _business.id.toString()){
    //         console.log("matched")
    //         console.log(req.query.business)
    //         console.log(_business.name)

    //           req.session.data.selectedBusiness = _business
    //           console.log(req.session.data.selectedBusiness)
    //       }
    //     });
    //   }
    // }


    // Every GET and POST
    router.all('/' + version + '/*', function (req, res, next) {

        // can do data setting and checking here - that will happen on every get and post

        //Set selected business
        // setSelectedBusiness(req)

        next()
    });

    

    //index
    router.get('/' + version + '/index', function (req, res) {
        // req.session.data.dave = "test"
        res.render(version + '/index', {});
    });

    //business-payments
    router.get('/' + version + '/business-payments', function (req, res) {
        req.session.data.dave = "test"
        res.render(version + '/business-payments', {});
    });

    //business-home
    router.get('/' + version + '/business-home', function (req, res) {
      res.render(version + '/business-home', {});
  });
    

    


    

}