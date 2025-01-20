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

        if(req.query.changed == "true"){
            req.session.myData.notifications.type = "success"
            req.session.myData.showNotification = "true"
        }

        // Notification banner messages
        if(req.query.telchanged == "true"){
            req.session.myData.notifications.message = "[notification banner - tel changed to " + req.session.myData.telNumberPers + "]"
        }
        if(req.query.mobchanged == "true"){
            req.session.myData.notifications.message = "[notification banner - mob changed to " + req.session.myData.mobNumberPers + "]"
        }
        
        res.render(version + '/details-personal-details', {
            myData: req.session.myData
        });
    });

    //personal details - change mobile
    router.get('/' + version + '/personal-details-mob-change', function (req, res) {
        if(req.query.newChange){
            req.session.myData.newMobNumberPers = ""
        }
        res.render(version + '/personal-details-mob-change', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/personal-details-mob-change', function (req, res) {

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
            res.render(version + '/personal-details-mob-change', {
                myData: req.session.myData
            });
        } else {
            // req.session.myData.mobNumberPers = req.session.myData.newMobNumberPers
            res.redirect(301, '/' + version + '/personal-details-mob-check');
        }
        
    });

    //personal details - check mobile
    router.get('/' + version + '/personal-details-mob-check', function (req, res) {
        res.render(version + '/personal-details-mob-check', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/personal-details-mob-check', function (req, res) {
        req.session.myData.mobNumberPers = req.session.myData.newMobNumberPers
        req.session.myData.newMobNumberPers = ""
        res.redirect(301, '/' + version + '/details-personal-details?changed=true&mobchanged=true');
    });

    //personal details - change telephone
    router.get('/' + version + '/personal-details-tel-change', function (req, res) {
        if(req.query.newChange){
            req.session.myData.newTelNumberPers = ""
        }
        res.render(version + '/personal-details-tel-change', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/personal-details-tel-change', function (req, res) {

        req.session.myData.newTelNumberPers = req.body.telNumberPers.trim()

        if(req.session.myData.includeValidation == "false"){
            req.session.myData.newTelNumberPers = req.session.myData.newTelNumberPers || req.session.myData.telNumberPers
        }

        if(!req.session.myData.newTelNumberPers){
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.telNumberPers = {
                "anchor": "telNumberPers",
                "message": "[error message - blank - change telephone personal]"
            }
        }

        if(req.session.myData.validationError == "true") {
            res.render(version + '/personal-details-tel-change', {
                myData: req.session.myData
            });
        } else {
            // req.session.myData.telNumberPers = req.session.myData.newTelNumberPers
            res.redirect(301, '/' + version + '/personal-details-tel-check');
        }
        
    });

    //personal details - check telephone
    router.get('/' + version + '/personal-details-tel-check', function (req, res) {
        res.render(version + '/personal-details-tel-check', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/personal-details-tel-check', function (req, res) {
        req.session.myData.telNumberPers = req.session.myData.newTelNumberPers
        req.session.myData.newTelNumberPers = ""
        res.redirect(301, '/' + version + '/details-personal-details?changed=true&telchanged=true');
    });



    //
    //BUSINESS details
    //
    router.get('/' + version + '/details-business-details', function (req, res) {

        if(req.query.changed == "true"){
            req.session.myData.notifications.type = "success"
            req.session.myData.showNotification = "true"
        }

        // Notification banner messages
        if(req.query.telchanged == "true"){
            req.session.myData.notifications.message = "[notification banner - tel changed to " + req.session.myData.telNumberBus + "]"
        }
        if(req.query.mobchanged == "true"){
            req.session.myData.notifications.message = "[notification banner - mob changed to " + req.session.myData.mobNumberBus + "]"
        }
        
        res.render(version + '/details-business-details', {
            myData: req.session.myData
        });
    });

    //business details - change mobile
    router.get('/' + version + '/business-details-mob-change', function (req, res) {
        if(req.query.newChange){
            req.session.myData.newMobNumberBus = ""
        }
        res.render(version + '/business-details-mob-change', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-mob-change', function (req, res) {

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
            res.render(version + '/business-details-mob-change', {
                myData: req.session.myData
            });
        } else {
            // req.session.myData.mobNumberBus = req.session.myData.newMobNumberBus
            res.redirect(301, '/' + version + '/business-details-mob-check');
        }
        
    });

    //business details - check mobile
    router.get('/' + version + '/business-details-mob-check', function (req, res) {
        res.render(version + '/business-details-mob-check', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-mob-check', function (req, res) {
        req.session.myData.mobNumberBus = req.session.myData.newMobNumberBus
        req.session.myData.newMobNumberBus = ""
        res.redirect(301, '/' + version + '/details-business-details?changed=true&mobchanged=true');
    });

    //business details - change telephone
    router.get('/' + version + '/business-details-tel-change', function (req, res) {
        if(req.query.newChange){
            req.session.myData.newTelNumberBus = ""
        }
        res.render(version + '/business-details-tel-change', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-tel-change', function (req, res) {

        req.session.myData.newTelNumberBus = req.body.telNumberBus.trim()

        if(req.session.myData.includeValidation == "false"){
            req.session.myData.newTelNumberBus = req.session.myData.newTelNumberBus || req.session.myData.telNumberBus
        }

        if(!req.session.myData.newTelNumberBus){
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.telNumberBus = {
                "anchor": "telNumberBus",
                "message": "[error message - blank - change telephone business]"
            }
        }

        if(req.session.myData.validationError == "true") {
            res.render(version + '/business-details-tel-change', {
                myData: req.session.myData
            });
        } else {
            // req.session.myData.telNumberBus = req.session.myData.newTelNumberBus
            res.redirect(301, '/' + version + '/business-details-tel-check');
        }
        
    });

    //business details - check telephone
    router.get('/' + version + '/business-details-tel-check', function (req, res) {
        res.render(version + '/business-details-tel-check', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-tel-check', function (req, res) {
        req.session.myData.telNumberBus = req.session.myData.newTelNumberBus
        req.session.myData.newTelNumberBus = ""
        res.redirect(301, '/' + version + '/details-business-details?changed=true&telchanged=true');
    });
    


}