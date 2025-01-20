const e = require("express");

module.exports = function (router,_myData) {

    var version = "v7";

    //coverts a number to a month
    function toMonth(_monthNumber){

        _monthNumber = _monthNumber - 1

        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        var month = months[_monthNumber];

        //if not valid month number - November returned as default value
        if(!month){
            month = "November"
        }

        return month
    }


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
        if(req.query.namechanged == "true"){
            // Adds space after title if a title was entered
            var _titleValue = req.session.myData.nameTitlePers || ""
            if (_titleValue != ""){
                var _titleValue = _titleValue + " "
            }

            // Adds space after middle names if a title was entered
            var _middleValue = req.session.myData.nameMiddlePers || ""
            if (_middleValue != ""){
                var _middleValue = _middleValue + " "
            }
            req.session.myData.notifications.message = "[notification banner - name changed to " + _titleValue + req.session.myData.nameFirstPers + " " + _middleValue + req.session.myData.nameLastPers + "]"
        }
        if(req.query.dobchanged == "true"){
            req.session.myData.notifications.message = "[notification banner - dob changed to " + req.session.myData.dobDayPers + " " + toMonth(req.session.myData.dobMonthPers) + " " + req.session.myData.dobYearPers + "]"
        }
        if(req.query.addresschanged == "true"){
            // Adds space after address line 2 if a address line 2 was entered
            var _address2Value = req.session.myData.address2Pers || ""
            if (_address2Value != ""){
                var _address2Value = _address2Value + " "
            }
            // Adds space after address county if a address county was entered
            var _addressCountyValue = req.session.myData.addressCountyPers || ""
            if (_addressCountyValue != ""){
                var _addressCountyValue = _addressCountyValue + " "
            }

            req.session.myData.notifications.message = "[notification banner - address changed to " + req.session.myData.address1Pers + " " + _address2Value + req.session.myData.addressCityPers + " " + _addressCountyValue + req.session.myData.addressPostcodePers + "]"
        }
        if(req.query.telchanged == "true"){
            req.session.myData.notifications.message = "[notification banner - tel changed to " + req.session.myData.telNumberPers + "]"
        }
        if(req.query.mobchanged == "true"){
            req.session.myData.notifications.message = "[notification banner - mob changed to " + req.session.myData.mobNumberPers + "]"
        }
        if(req.query.emailchanged == "true"){
            req.session.myData.notifications.message = "[notification banner - email changed to " + req.session.myData.emailPers + "]"
        }
        
        res.render(version + '/details-personal-details', {
            myData: req.session.myData
        });
    });

    //personal details - change name
    router.get('/' + version + '/personal-details-name-change', function (req, res) {
        if(req.query.newChange){
            req.session.myData.newNameTitlePers = ""
            req.session.myData.newNameFirstPers = ""
            req.session.myData.newNameMiddlePers = ""
            req.session.myData.newNameLastPers = ""
        }
        res.render(version + '/personal-details-name-change', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/personal-details-name-change', function (req, res) {

        req.session.myData.newNameTitlePers = req.body.nameTitlePers.trim()
        req.session.myData.newNameFirstPers = req.body.nameFirstPers.trim()
        req.session.myData.newNameMiddlePers = req.body.nameMiddlePers.trim()
        req.session.myData.newNameLastPers = req.body.nameLastPers.trim()

        if(req.session.myData.includeValidation == "false"){
            req.session.myData.newNameFirstPers = req.session.myData.newNameFirstPers || req.session.myData.nameFirstPers
            req.session.myData.newNameLastPers = req.session.myData.newNameLastPers || req.session.myData.nameLastPers
        }

        if(!req.session.myData.newNameFirstPers){
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.nameFirstPers = {
                "anchor": "nameFirstPers",
                "message": "[error message - blank - change first name]"
            }
        }
        if(!req.session.myData.newNameLastPers){
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.nameLastPers = {
                "anchor": "nameLastPers",
                "message": "[error message - blank - change last name]"
            }
        }

        if(req.session.myData.validationError == "true") {
            res.render(version + '/personal-details-name-change', {
                myData: req.session.myData
            });
        } else {
            res.redirect(301, '/' + version + '/personal-details-name-check');
        }
        
    });

    //personal details - check name
    router.get('/' + version + '/personal-details-name-check', function (req, res) {
        res.render(version + '/personal-details-name-check', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/personal-details-name-check', function (req, res) {
        req.session.myData.nameTitlePers = req.session.myData.newNameTitlePers
        req.session.myData.nameFirstPers = req.session.myData.newNameFirstPers
        req.session.myData.nameMiddlePers = req.session.myData.newNameMiddlePers
        req.session.myData.nameLastPers = req.session.myData.newNameLastPers

        req.session.myData.newNameTitlePers = ""
        req.session.myData.newNameFirstPers = ""
        req.session.myData.newNameMiddlePers = ""
        req.session.myData.newNameLastPers = ""

        res.redirect(301, '/' + version + '/details-personal-details?changed=true&namechanged=true');
    });

    //personal details - change date of birth
    router.get('/' + version + '/personal-details-dob-change', function (req, res) {
        if(req.query.newChange){
            req.session.myData.newDobDayPers = ""
            req.session.myData.newDobMonthPers = ""
            req.session.myData.newDobYearPers = ""
        }
        res.render(version + '/personal-details-dob-change', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/personal-details-dob-change', function (req, res) {

        req.session.myData.newDobDayPers = req.body.dobDayPers.trim()
        req.session.myData.newDobMonthPers = req.body.dobMonthPers.trim()
        req.session.myData.newDobYearPers = req.body.dobYearPers.trim()

        if(req.session.myData.includeValidation == "false"){
            req.session.myData.newDobDayPers = req.session.myData.newDobDayPers || req.session.myData.dobDayPers
            req.session.myData.newDobMonthPers = req.session.myData.newDobMonthPers || req.session.myData.dobMonthPers
            req.session.myData.newDobYearPers = req.session.myData.newDobYearPers || req.session.myData.dobYearPers
        }

        var _anchor = "",
            _errors = []
        if(!req.session.myData.newDobYearPers){
            _anchor = "dobYearPers"
            req.session.myData.validationErrors.dobYearPers = true
            _errors.unshift("year")
        }
        if(!req.session.myData.newDobMonthPers){
            _anchor = "dobMonthPers"
            req.session.myData.validationErrors.dobMonthPers = true
            _errors.unshift("month")
        }
        if(!req.session.myData.newDobDayPers){
            _anchor = "dobDayPers"
            req.session.myData.validationErrors.dobDayPers = true
            _errors.unshift("day")
        }

        if(!req.session.myData.newDobDayPers || !req.session.myData.newDobMonthPers || !req.session.myData.newDobYearPers){
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.dobPers = {
                "anchor": _anchor,
                "message": "[error message - blank - " + _errors + "]"
            }
        }

        if(req.session.myData.validationError == "true") {
            res.render(version + '/personal-details-dob-change', {
                myData: req.session.myData
            });
        } else {
            res.redirect(301, '/' + version + '/personal-details-dob-check');
        }
        
    });

    //personal details - check date of birth
    router.get('/' + version + '/personal-details-dob-check', function (req, res) {
        res.render(version + '/personal-details-dob-check', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/personal-details-dob-check', function (req, res) {
        req.session.myData.dobDayPers = req.session.myData.newDobDayPers
        req.session.myData.dobMonthPers = req.session.myData.newDobMonthPers
        req.session.myData.dobYearPers = req.session.myData.newDobYearPers

        req.session.myData.newDobDayPers = ""
        req.session.myData.newDobMonthPers = ""
        req.session.myData.newDobYearPers = ""

        res.redirect(301, '/' + version + '/details-personal-details?changed=true&dobchanged=true');
    });

     //personal details - change address
     router.get('/' + version + '/personal-details-address-change', function (req, res) {
        if(req.query.newChange){
            req.session.myData.newAddress1Pers = ""
            req.session.myData.newAddress2Pers = ""
            req.session.myData.newAddressCityPers = ""
            req.session.myData.newAddressCountyPers = ""
            req.session.myData.newAddressPostcodePers = ""
        }
        res.render(version + '/personal-details-address-change', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/personal-details-address-change', function (req, res) {

        req.session.myData.newAddress1Pers = req.body.address1Pers.trim()
        req.session.myData.newAddress2Pers = req.body.address2Pers.trim()
        req.session.myData.newAddressCityPers = req.body.addressCityPers.trim()
        req.session.myData.newAddressCountyPers = req.body.addressCountyPers.trim()
        req.session.myData.newAddressPostcodePers = req.body.addressPostcodePers.trim()

        if(req.session.myData.includeValidation == "false"){
            req.session.myData.newAddress1Pers = req.session.myData.newAddress1Pers || req.session.myData.address1Pers
            req.session.myData.newAddressCityPers = req.session.myData.newAddressCityPers || req.session.myData.addressCityPers
            req.session.myData.newAddressPostcodePers = req.session.myData.newAddressPostcodePers || req.session.myData.addressPostcodePers
        }

        if(!req.session.myData.newAddress1Pers){
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.address1Pers = {
                "anchor": "address1Pers",
                "message": "[error message - blank - change address line 1]"
            }
        }
        if(!req.session.myData.newAddressCityPers){
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.addressCityPers = {
                "anchor": "addressCityPers",
                "message": "[error message - blank - change city]"
            }
        }
        if(!req.session.myData.newAddressPostcodePers){
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.addressPostcodePers = {
                "anchor": "addressPostcodePers",
                "message": "[error message - blank - change postcode]"
            }
        }
        

        if(req.session.myData.validationError == "true") {
            res.render(version + '/personal-details-address-change', {
                myData: req.session.myData
            });
        } else {
            res.redirect(301, '/' + version + '/personal-details-address-check');
        }
        
    });

    //personal details - check name
    router.get('/' + version + '/personal-details-address-check', function (req, res) {
        res.render(version + '/personal-details-address-check', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/personal-details-address-check', function (req, res) {
        req.session.myData.address1Pers = req.session.myData.newAddress1Pers
        req.session.myData.address2Pers = req.session.myData.newAddress2Pers
        req.session.myData.addressCityPers = req.session.myData.newAddressCityPers
        req.session.myData.addressCountyPers = req.session.myData.newAddressCountyPers
        req.session.myData.addressPostcodePers = req.session.myData.newAddressPostcodePers
        
        req.session.myData.newAddress1Pers = ""
        req.session.myData.newAddress2Pers = ""
        req.session.myData.newAddressCityPers = ""
        req.session.myData.newAddressCountyPers = ""
        req.session.myData.newAddressPostcodePers = ""

        res.redirect(301, '/' + version + '/details-personal-details?changed=true&addresschanged=true');
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

    //personal details - change email
    router.get('/' + version + '/personal-details-email-change', function (req, res) {
        if(req.query.newChange){
            req.session.myData.newEmailPers = ""
        }
        res.render(version + '/personal-details-email-change', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/personal-details-email-change', function (req, res) {

        req.session.myData.newEmailPers = req.body.emailPers.trim()

        if(req.session.myData.includeValidation == "false"){
            req.session.myData.newEmailPers = req.session.myData.newEmailPers || req.session.myData.emailPers
        }

        if(!req.session.myData.newEmailPers){
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.emailPers = {
                "anchor": "emailPers",
                "message": "[error message - blank - change email personal]"
            }
        }

        if(req.session.myData.validationError == "true") {
            res.render(version + '/personal-details-email-change', {
                myData: req.session.myData
            });
        } else {
            // req.session.myData.emailPers = req.session.myData.newEmailPers
            res.redirect(301, '/' + version + '/personal-details-email-check');
        }
        
    });

    //personal details - check email
    router.get('/' + version + '/personal-details-email-check', function (req, res) {
        res.render(version + '/personal-details-email-check', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/personal-details-email-check', function (req, res) {
        req.session.myData.emailPers = req.session.myData.newEmailPers
        req.session.myData.newEmailPers = ""
        res.redirect(301, '/' + version + '/details-personal-details?changed=true&emailchanged=true');
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