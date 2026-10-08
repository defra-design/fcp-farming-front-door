module.exports = function (router, _myData) {

    var version = "v18/1.3";

    // Every GET and POST
    router.all('/' + version + '/*', function (req, res, next) {

        if (!req.session.myData || req.query.r) {
            req.session.myData = JSON.parse(JSON.stringify(_myData))

            //selected business defaults - to match session defaults
            req.session.myData.selectedBusiness = req.session.data.selectedBusiness
            req.session.myData.nameBus = req.session.data.selectedBusiness.name

            req.session.myData.selectedUser = req.session.data.selectedUser
            req.session.myData.namePers = req.session.data.selectedUser.name
            req.session.myData.nameFirstPers = req.session.data.selectedUser.firstName
            req.session.myData.nameLastPers = req.session.data.selectedUser.lastName
            // "nameTitlePers": "",
            // "nameMiddlePers": "",

        }

        //version
        req.session.myData.version = version

        //set selected business
        if (req.query.business) {

            // main businesses list
            var _selectedBusiness = req.session.data.businesses.find(obj => { return obj.id.toString() === req.query.business.toString() })
            //if coming from internal search results use that list instead
            if (req.query.intSearch) {
                var _selectedBusiness = req.session.data.internalSearchResults.find(obj => { return obj.id.toString() === req.query.business.toString() })
            }

            if (_selectedBusiness) {
                req.session.data.selectedBusiness = _selectedBusiness
                req.session.myData.selectedBusiness = _selectedBusiness
                req.session.myData.nameBus = req.session.myData.selectedBusiness.name
            }
        }

        //set selected user
        if (req.query.user) {

            // main users list
            var _selectedUser = req.session.data.users.find(obj => { return obj.id.toString() === req.query.user.toString() })
            //if coming from internal search results use that list instead
            if (req.query.intSearch) {
                var _selectedUser = req.session.data.internalSearchResults.find(obj => { return obj.id.toString() === req.query.user.toString() })
            }

            if (_selectedUser) {
                req.session.data.selectedUser = _selectedUser
                req.session.myData.selectedUser = _selectedUser
                req.session.myData.namePers = req.session.myData.selectedUser.name
                req.session.myData.nameFirstPers = req.session.myData.selectedUser.firstName
                req.session.myData.nameLastPers = req.session.myData.selectedUser.lastName
            }
        }

        // Reset page validation to false by default. Will only be set to true, if applicable, on a POST of a page
        // req.session.data.validationErrors = {}
        // req.session.data.validationError = "false"
        // req.session.data.includeValidation =  req.query.iv || req.session.data.includeValidation

        // Reset page validation to false by default. Will only be set to true, if applicable, on a POST of a page
        req.session.myData.validationErrors = {}
        req.session.myData.validationError = "false"
        req.session.myData.includeValidation = req.query.iv || req.session.myData.includeValidation

        //Used to show either the prototype as internal user or external user
        req.session.myData.view = req.query.view || req.session.myData.view

        req.session.myData.bank = req.query.bank || req.session.myData.bank

        req.session.myData.regBus = req.query.regBus || req.session.myData.regBus


        req.session.myData.rollNumber = req.query.bank || req.session.myData.rollNumber

        //Reset page notifications
        req.session.myData.notifications = {}
        req.session.myData.showNotification = "false"

        //default filters
        req.session.myData.schemefilters = []

        //
        // Fixes for checkbox values in query string - turns them into arrays
        //
        var _checkboxQueries = [
            "schemefilters"
        ]
        _checkboxQueries.forEach(function (_checkboxQuery, index) {
            req.session.myData[_checkboxQuery] = req.query[_checkboxQuery] || []
            if (req.session.myData[_checkboxQuery] == "_unchecked") {
                req.session.myData[_checkboxQuery] = []
            }
            if (!Array.isArray(req.session.myData[_checkboxQuery])) {
                req.session.myData[_checkboxQuery] = [req.session.myData[_checkboxQuery]]
            }
        });

        // can do data setting and checking here - that will happen on every get and post



        next()
    });

    //SBI for this version; ?sbi=<n> overrides it. Kept in its own session key because
    //req.session.myData is shared by every version, so setting myData.sbi would leak into 1.2.
    router.all('/' + version + '/*', function (req, res, next) {
        if (req.query.sbi) {
            req.session.sbiV18_13 = req.query.sbi.toString().trim()
        } else if (!req.session.sbiV18_13 || req.query.r) {
            req.session.sbiV18_13 = '112965195'
        }
        res.locals.myData13 = Object.assign({}, req.session.myData, { sbi: req.session.sbiV18_13 })
        next()
    });

    //view land
    router.get('/' + version + '/view-land', function (req, res) {
        res.render(version + '/view-land', {
            myData: res.locals.myData13
        });
    });

    //view land parcel
    router.get('/' + version + '/view-land-parcel', function (req, res) {
        res.render(version + '/view-land-parcel', {
            myData: res.locals.myData13
        });
    });

    // Fallback: render any view by name on GET or POST. Restores the prototype kit's
    // automatic page routing (incl. POSTing a form to a page), which doesn't fire for
    // URLs containing a dot (e.g. the "1.0"/"1.1" dir). Explicit routes above still win.
    router.all('/' + version + '/:view', function (req, res, next) {
        res.render(version + '/' + req.params.view, { myData: res.locals.myData13 }, function (err, html) {
            if (err) {
                next();
            } else {
                res.send(html);
            }
        });
    });

}
