const e = require("express");

module.exports = function (router,_myData) {

    var version = "v7";

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

        if(!req.session.myData || req.query.r) {
            req.session.myData = JSON.parse(JSON.stringify(_myData))
        }

        //version
        req.session.data.version = version

        // Reset page validation to false by default. Will only be set to true, if applicable, on a POST of a page
        // req.session.data.validationErrors = {}
        // req.session.data.validationError = "false"
        // req.session.data.includeValidation =  req.query.iv || req.session.data.includeValidation

        // Reset page validation to false by default. Will only be set to true, if applicable, on a POST of a page
        req.session.myData.validationErrors = {}
        req.session.myData.validationError = "false"
        req.session.myData.includeValidation =  req.query.iv || req.session.myData.includeValidation

        //Reset page notifications
        req.session.myData.notifications = {}
        req.session.myData.showNotification = "false"

        // can do data setting and checking here - that will happen on every get and post

        //Set selected business
        // setSelectedBusiness(req)

        next()
    });

    //index - setup page
    router.get('/' + version + '/index', function (req, res) {
        res.render(version + '/index', {});
    });

    //sfd sign in
    router.get('/' + version + '/start-sfd-sign-in', function (req, res) {
        req.session.data.deeplink = req.query.deeplink || "businesses-list"
        res.render(version + '/start-sfd-sign-in', {});
    });

    //
    //PERSONAL details
    //
    router.get('/' + version + '/details-personal-details', function (req, res) {

        if(req.query.mobchanged == "true"){
            req.session.myData.notifications.type = "success"
            req.session.myData.showNotification = "true"
        }

        // Notification banner messages
        if(req.query.mobchanged == "true"){
            req.session.myData.notifications.message = "[notification banner - mob changed to " + req.session.myData.mobNumberPers + "]"
        }
        
        res.render(version + '/details-personal-details', {
            myData: req.session.myData
        });
    });

    //personal details - change mobile
    router.get('/' + version + '/details-change-mob-personal', function (req, res) {
        if(req.query.newChange){
            req.session.myData.newMobNumberPers = ""
        }
        res.render(version + '/details-change-mob-personal', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/details-change-mob-personal', function (req, res) {

        req.session.myData.newMobNumberPers = req.body.mobNumberPers.trim()

        if(req.session.myData.includeValidation == "false"){
            req.session.myData.newMobNumberPers = req.session.myData.newMobNumberPers || req.session.myData.mobNumberPers
        }

        if(!req.session.myData.newMobNumberPers){
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.mobNumberPers = {
                "anchor": "mobNumberPers",
                "message": "[error message - blank - change mobile personal]"
            }
        }

        // if(req.session.myData.newMobNumberPers == "BOB" && req.session.myData.includeValidation != "false"){
        //     req.session.myData.validationError = "true"
        //     req.session.myData.validationErrors.mobNumberPers = {
        //         "anchor": "mobNumberPers",
        //         "message": "[error message - BOB - change mobile personal]"
        //     }
        // }

        if(req.session.myData.validationError == "true") {
            res.render(version + '/details-change-mob-personal', {
                myData: req.session.myData
            });
        } else {
            // req.session.myData.mobNumberPers = req.session.myData.newMobNumberPers
            res.redirect(301, '/' + version + '/details-check-mob-personal');
        }
        
    });

    //personal details - check mobile
    router.get('/' + version + '/details-check-mob-personal', function (req, res) {
        res.render(version + '/details-check-mob-personal', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/details-check-mob-personal', function (req, res) {
        req.session.myData.mobNumberPers = req.session.myData.newMobNumberPers
        req.session.myData.newMobNumberPers = ""
        res.redirect(301, '/' + version + '/details-personal-details?mobchanged=true');
    });



    //
    //BUSINESS details
    //
    router.get('/' + version + '/details-business-details', function (req, res) {

        if(req.query.mobchanged == "true"){
            req.session.myData.notifications.type = "success"
            req.session.myData.showNotification = "true"
        }

        // Notification banner messages
        if(req.query.mobchanged == "true"){
            req.session.myData.notifications.message = "[notification banner - mob changed to " + req.session.myData.mobNumberBus + "]"
        }
        
        res.render(version + '/details-business-details', {
            myData: req.session.myData
        });
    });

    //business details - change mobile
    router.get('/' + version + '/details-change-mob-business', function (req, res) {
        if(req.query.newChange){
            req.session.myData.newMobNumberBus = ""
        }
        res.render(version + '/details-change-mob-business', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/details-change-mob-business', function (req, res) {

        req.session.myData.newMobNumberBus = req.body.mobNumberBus.trim()

        if(req.session.myData.includeValidation == "false"){
            req.session.myData.newMobNumberBus = req.session.myData.newMobNumberBus || req.session.myData.mobNumberBus
        }

        if(!req.session.myData.newMobNumberBus){
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.mobNumberBus = {
                "anchor": "mobNumberBus",
                "message": "[error message - blank - change mobile business]"
            }
        }

        if(req.session.myData.validationError == "true") {
            res.render(version + '/details-change-mob-business', {
                myData: req.session.myData
            });
        } else {
            // req.session.myData.mobNumberBus = req.session.myData.newMobNumberBus
            res.redirect(301, '/' + version + '/details-check-mob-business');
        }
        
    });

    //business details - check mobile
    router.get('/' + version + '/details-check-mob-business', function (req, res) {
        res.render(version + '/details-check-mob-business', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/details-check-mob-business', function (req, res) {
        req.session.myData.mobNumberBus = req.session.myData.newMobNumberBus
        req.session.myData.newMobNumberBus = ""
        res.redirect(301, '/' + version + '/details-business-details?mobchanged=true');
    });
    


}