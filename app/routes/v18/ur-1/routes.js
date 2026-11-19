module.exports = function (router, _myData) {

    var version = "v18/ur-1";

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

    //User research build. The participant's SBI and business name come from demo-start (POST) and
    //live in their own session key: req.session.myData is shared by every version, and keeping the
    //SBI out of query strings keeps it out of the address bar on recordings. Pages show a made-up SBI.
    var DEFAULT_SBI = '112965195'
    var DEFAULT_BUSINESS_NAME = 'Agile Farm Ltd'
    var DISPLAY_SBI = '123456789'

    router.all('/' + version + '/*', function (req, res, next) {
        if (!req.session.urV18 || req.query.r) {
            req.session.urV18 = { sbi: DEFAULT_SBI, businessName: DEFAULT_BUSINESS_NAME }
        }
        res.locals.myDataUr = Object.assign({}, req.session.myData, {
            sbi: req.session.urV18.sbi,
            businessName: req.session.urV18.businessName,
            sbiDisplay: DISPLAY_SBI
        })
        next()
    });

    //demo-start - the participant enters their own business name and SBI
    router.get('/' + version + '/demo-start', function (req, res) {
        res.render(version + '/demo-start', {
            myData: res.locals.myDataUr,
            errors: {},
            values: {}
        });
    });

    router.post('/' + version + '/demo-start', function (req, res) {
        var rawSbi = (req.session.data['sbi'] || '').toString()
        var sbi = rawSbi.replace(/\s+/g, '')
        var businessName = (req.session.data['business-name'] || '').toString().trim()
        // Don't leave the real values in the kit's shared data store
        delete req.session.data['sbi']
        delete req.session.data['business-name']

        var errors = {}
        if (!sbi) {
            errors.sbi = 'Enter your SBI'
        } else if (!/^\d{9}$/.test(sbi)) {
            errors.sbi = 'Your SBI must be 9 digits'
        }

        if (Object.keys(errors).length) {
            return res.render(version + '/demo-start', {
                myData: res.locals.myDataUr,
                errors: errors,
                values: { businessName: businessName, sbi: rawSbi }
            });
        }

        req.session.urV18 = { sbi: sbi, businessName: businessName || DEFAULT_BUSINESS_NAME }
        res.redirect('/' + version + '/view-land')
    });

    //sign out (sub-header link) - forget the participant and go back to demo-start for the next one
    router.get('/' + version + '/sign-out', function (req, res) {
        delete req.session.urV18
        res.redirect('/' + version + '/demo-start')
    });

    //view land
    router.get('/' + version + '/view-land', function (req, res) {
        res.render(version + '/view-land', {
            myData: res.locals.myDataUr
        });
    });

    //view land parcel
    router.get('/' + version + '/view-land-parcel', function (req, res) {
        res.render(version + '/view-land-parcel', {
            myData: res.locals.myDataUr
        });
    });

    // Fallback: render any view by name on GET or POST. Restores the prototype kit's
    // automatic page routing (incl. POSTing a form to a page), which doesn't fire for
    // URLs containing a dot (e.g. the "1.0"/"1.1" dir). Explicit routes above still win.
    router.all('/' + version + '/:view', function (req, res, next) {
        res.render(version + '/' + req.params.view, { myData: res.locals.myDataUr }, function (err, html) {
            if (err) {
                next();
            } else {
                res.send(html);
            }
        });
    });

}
