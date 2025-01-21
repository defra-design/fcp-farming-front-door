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
        if(req.query.business){
            var _selectedBusiness = req.session.data.businesses.find(obj => {return obj.id.toString() === req.query.business.toString()})
            if(_selectedBusiness){
                req.session.data.selectedBusiness = _selectedBusiness
            }
        }

        next()
    });

    

    //index
    router.get('/' + version + '/index', function (req, res) {
        res.render(version + '/index', {});
    });

    //sfd sign in
    router.get('/' + version + '/start-sfd-sign-in', function (req, res) {
        req.session.data.deeplink = req.query.deeplink || "businesses-list"
        res.render(version + '/start-sfd-sign-in', {});
    });
    

    


    

}