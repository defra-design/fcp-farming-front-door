
module.exports = function (router, _myData) {

    var version = "MVP-integration";

    //coverts a number to a month
    function toMonth(_monthNumber) {

        _monthNumber = _monthNumber - 1

        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        var month = months[_monthNumber];

        //if not valid month number - November returned as default value
        if (!month) {
            month = "November"
        }

        return month
    }


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

    //index - setup page
    router.get('/' + version + '/index', function (req, res) {
        res.render(version + '/index', {
            myData: req.session.myData
        });
    });

    //design history
    router.get('/' + version + '/_design-history', function (req, res) {
        res.render(version + '/_design-history', {
            myData: req.session.myData
        });
    });

    //sfd sign in
    router.get('/' + version + '/start-sfd-sign-in', function (req, res) {
        req.session.data.deeplink = req.query.deeplink || "businesses-list"
        res.render(version + '/start-sfd-sign-in', {
            myData: req.session.myData
        });
    });
    //sfd reset password
    router.get('/' + version + '/start-sfd-reset-password', function (req, res) {
        res.render(version + '/start-sfd-reset-password', {
            myData: req.session.myData
        });
    });

    //businesses list
    router.get('/' + version + '/businesses-list', function (req, res) {
        res.render(version + '/businesses-list', {
            myData: req.session.myData
        });
    });
    //businesses list page 2
    router.get('/' + version + '/businesses-list-p2', function (req, res) {
        res.render(version + '/businesses-list-p2', {
            myData: req.session.myData
        });
    });

    //business home
    router.get('/' + version + '/business-home', function (req, res) {
        res.render(version + '/business-home', {
            myData: req.session.myData
        });
    });

    // emma's test page
    router.get('/' + version + '/test-page', function (req, res) {
        req.session.myData.emmaserrors = req.query.emmaserrors
        res.render(version + '/test-page', {
            myData: req.session.myData
        });
    });

    // defining the submission destintation for test-page
    router.post('/' + version + '/test-page', function (req, res) {
        res.redirect(301, '/' + version + '/business-home');
    });

    // defining the submission destintation for test-page

    router.post('/search-criteria-answer', function (request, response) {

        var searchCriteria = request.session.data['searchCriteria']
        if (searchCriteria == "int-sr-cusName") {
            response.redirect("/MVP/internal-search-customer-name")
        } else {
            response.redirect("/MVP/internal-search")
        }
    })

    // Check a message if it matches search term
    function checkMessageSearchTerm(req, _item, _searchesToDo) {

        _item.search = false
        _item.searchrelevance = 0

        var _matchedsearch = false
        for (var i = 0; i < _searchesToDo.length; i++) {
            var _thisItem = _searchesToDo[i]
            if (Array.isArray(_thisItem.searchOn)) {
                _thisItem.searchOn.forEach(function (_arrayPart, index) {
                    doSearches(_arrayPart)
                });
            } else {
                doSearches(_thisItem.searchOn)
            }
            function doSearches(_itemToSearch) {
                //Exact check
                if (_thisItem.exactrelevance && _itemToSearch.toUpperCase() == req.session.myData.searchTerm.toUpperCase()) {
                    _item.searchrelevance = _item.searchrelevance + _thisItem.exactrelevance
                    _matchedsearch = true
                    if (_thisItem.ifmatch == "exit") {
                        return
                    }
                }
                // Within check
                if (_thisItem.withinrelevance && _itemToSearch.toUpperCase().indexOf(req.session.myData.searchTerm.toUpperCase()) != -1) {
                    _item.searchrelevance = _item.searchrelevance + _thisItem.withinrelevance
                    _matchedsearch = true
                    if (_thisItem.ifmatch == "exit") {
                        return
                    }
                }
            }
            if (_matchedsearch == true && _thisItem.ifmatch == "exit") {
                break
            }
        }
        if (_matchedsearch && _item.searchrelevance > 1) {
            req.session.myData.hasAMatchcount++
        }
    }

    // Search filtering
    function searchFilterSetup(req, _selectedLabel) {
        req.session.myData.searchapplied = false
        req.session.myData.searchTerm = ""
        if (req.query.q && req.query.q != "") {
            req.session.myData.displaycount = 0
            req.session.myData.needToMatchCount++
            req.session.myData.searchapplied = true
            req.session.myData.searchTerm = req.query.q.trim()
            req.session.myData.searchfilters.push({ "value": "‘" + req.session.myData.searchTerm + "’", "type": "search", "typeText": _selectedLabel })
        }
    }

    // Scheme filters - setup
    function schemeFilterSetup(req) {
        req.session.myData.schemefilterapplied = false
        if (req.session.myData.schemefilters.length > 0) {
            req.session.myData.displaycount = 0
            req.session.myData.needToMatchCount++
            req.session.myData.schemefilterapplied = true
            var schemefiltersValues = []
            req.session.myData.schemefilters.forEach(function (_schemeFilter, index) {
                var _scheme = req.session.data.schemes.find(obj => obj.value === _schemeFilter)
                if (_scheme) {
                    schemefiltersValues.push({
                        "label": _scheme.value,
                        "id": _scheme.value
                    })
                }
            });
            req.session.myData.searchfilters.push({ "value": schemefiltersValues, "type": "schemefilters", "typeText": "Schemes", "typeof": "array" })
        }
    }

    //businesses messages
    router.get('/' + version + '/business-messages', function (req, res) {

        req.session.myData.searchfilters = []
        req.session.myData.displaycount = req.session.data.messages.length
        req.session.myData.needToMatchCount = 0

        // Keyword search reset/setup
        searchFilterSetup(req, "Messages")

        // Scheme filter reset/setup
        schemeFilterSetup(req)


        req.session.data.messages.forEach(function (_message, index) {

            req.session.myData.hasAMatchcount = 0

            // Reset each message
            _message.search = true

            //SEARCH TERM
            if (req.session.myData.searchapplied) {
                var _searchesToDo = [
                    { "searchOn": _message.subject, "exactrelevance": 999999, "withinrelevance": 100000, "ifmatch": "exit" },
                    { "searchOn": _message.scheme, "exactrelevance": 99999, "withinrelevance": 10000, "ifmatch": "exit" }
                ]
                checkMessageSearchTerm(req, _message, _searchesToDo)
            }

            //SCHEME
            if (req.session.myData.schemefilterapplied) {
                _message.search = false
                var _scheme = req.session.myData.schemefilters.find(obj => obj === _message.scheme.toString())
                if (_scheme) {
                    req.session.myData.hasAMatchcount++
                }
            }

            //MATCHES ALL IT NEEDS TO?
            if (req.session.myData.needToMatchCount > 0 && req.session.myData.needToMatchCount == req.session.myData.hasAMatchcount) {
                _message.search = true
                req.session.myData.displaycount++
            }

        });



        res.render(version + '/business-messages', {
            myData: req.session.myData
        });
    });

    //internal search
    router.get('/' + version + '/internal-search', function (req, res) {

        req.session.myData.searchapplied = false
        req.session.myData.searchTerm = ""
        if (req.query.q && req.query.q != "") {
            req.session.myData.searchapplied = true
            req.session.myData.searchTerm = req.query.q.trim()
        }

        if (req.query.intSearchType && req.query.intSearchType != "") {
            req.session.myData.intSearchType = req.query.intSearchType
        }

        res.render(version + '/internal-search', {
            myData: req.session.myData
        });
    });

    //internal selected business 
    router.get('/' + version + '/internal-search-pagination', function (req, res) {
        res.render(version + '/internal-search-pagination', {
            myData: req.session.myData
        });
    });

    //internal selected business 
    router.get('/' + version + '/internal-business', function (req, res) {
        res.render(version + '/internal-business', {
            myData: req.session.myData
        });
    });


    //internal selected customer 
    router.get('/' + version + '/internal-customer', function (req, res) {
        res.render(version + '/internal-customer', {
            myData: req.session.myData
        });
    });



    //payment action letter
    router.get('/' + version + '/payment-action-letter', function (req, res) {
        res.render(version + '/payment-action-letter', {
            myData: req.session.myData
        });
    });
    //payment action text
    router.get('/' + version + '/payment-action-text', function (req, res) {
        res.render(version + '/payment-action-text', {
            myData: req.session.myData
        });
    });
    //payment next email
    router.get('/' + version + '/payment-next-email', function (req, res) {
        res.render(version + '/payment-next-email', {
            myData: req.session.myData
        });
    });

    //
    //ERROR PAGES
    //
    router.get('/' + version + '/error-not-found', function (req, res) {
        res.render(version + '/error-not-found', {
            myData: req.session.myData
        });
    });
    router.get('/' + version + '/error-server', function (req, res) {
        res.render(version + '/error-server', {
            myData: req.session.myData
        });
    });
    router.get('/' + version + '/error-shutter', function (req, res) {
        res.render(version + '/error-shutter', {
            myData: req.session.myData
        });
    });

    //
    //MISCELLANEOUS PAGES
    //
    router.get('/' + version + '/misc-accessibility', function (req, res) {
        res.render(version + '/misc-accessibility', {
            myData: req.session.myData
        });
    });
    router.get('/' + version + '/misc-contact', function (req, res) {
        res.render(version + '/misc-contact', {
            myData: req.session.myData
        });
    });
    router.get('/' + version + '/misc-cookies', function (req, res) {
        req.session.myData.cookiesVariant1 = req.query.cookiesVariant1
        req.session.myData.cookiesNeedJS = req.query.cookiesNeedJS
        req.session.myData.showCookieBanner1 = req.query.showCookieBanner1
        req.session.myData.showCookieBanner2 = req.query.showCookieBanner2
        req.session.myData.showCookieBanner3 = req.query.showCookieBanner3

        if (req.query.changed == "true") {
            req.session.myData.notifications.type = "success"
            req.session.myData.showNotification = "true"
            // req.session.myData.notifications.message = "You have updated your full name"
        }
        res.render(version + '/misc-cookies', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/misc-cookies', function (req, res) {
        req.session.myData.cookiesFunctional = req.body.cookiesFunctional
        req.session.myData.cookiesAnalytics = req.body.cookiesAnalytics
        res.redirect(301, '/' + version + '/misc-cookies?changed=true&cookiesVariant1=true');
    });
    router.get('/' + version + '/misc-information', function (req, res) {
        res.render(version + '/misc-information', {
            myData: req.session.myData
        });
    });
    router.get('/' + version + '/misc-privacy', function (req, res) {
        res.render(version + '/misc-privacy', {
            myData: req.session.myData
        });
    });
    router.get('/' + version + '/misc-signed-out-auto', function (req, res) {
        res.render(version + '/misc-signed-out-auto', {
            myData: req.session.myData
        });
    });
    router.get('/' + version + '/misc-signed-out', function (req, res) {
        res.render(version + '/misc-signed-out', {
            myData: req.session.myData
        });
    });
    router.get('/' + version + '/misc-terms', function (req, res) {
        res.render(version + '/misc-terms', {
            myData: req.session.myData
        });
    });

    //
    //PERSONAL details
    //
    router.get('/' + version + '/details-personal-details', function (req, res) {

        if (req.query.changed == "true") {
            req.session.myData.notifications.type = "success"
            req.session.myData.showNotification = "true"
        }

        // Notification banner messages
        if (req.query.namechanged == "true") {
            req.session.myData.notifications.message = "You have updated your full name"
        }
        if (req.query.dobchanged == "true") {
            req.session.myData.notifications.message = "You have updated your date of birth"
        }
        if (req.query.addresschanged == "true") {
            req.session.myData.notifications.message = "You have updated your personal address"
        }
        if (req.query.phonechanged == "true") {
            req.session.myData.notifications.message = "You have updated your personal phone numbers"
        }
        if (req.query.emailchanged == "true") {
            req.session.myData.notifications.message = "You have updated your personal email address"
        }

        res.render(version + '/details-personal-details', {
            myData: req.session.myData
        });
    });

    //personal details - change name
    router.get('/' + version + '/personal-details-name-change', function (req, res) {
        if (req.query.newChange) {
            req.session.myData.newNameFirstPers = ""
            req.session.myData.newNameMiddlePers = ""
            req.session.myData.newNameLastPers = ""
            // for concept variant
            req.session.myData.newNamePers = ""
        }
        res.render(version + '/personal-details-name-change', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/personal-details-name-change', function (req, res) {

        if (req.session.data.release == "b1") {
            req.session.myData.newNameFirstPers = req.body.nameFirstPers.trim()
            req.session.myData.newNameMiddlePers = req.body.nameMiddlePers.trim()
            req.session.myData.newNameLastPers = req.body.nameLastPers.trim()
        } else {
            req.session.myData.newNamePers = req.body.namePers.trim()
        }

        if (req.session.myData.includeValidation == "false") {
            req.session.myData.newNameFirstPers = req.session.myData.newNameFirstPers || req.session.myData.nameFirstPers
            req.session.myData.newNameLastPers = req.session.myData.newNameLastPers || req.session.myData.nameLastPers
            req.session.myData.newNamePers = req.session.myData.newNamePers || req.session.myData.namePers
        }

        // MVP
        if (req.session.data.release == "b1") {
            if (!req.session.myData.newNameFirstPers) {
                req.session.myData.validationError = "true"
                req.session.myData.validationErrors.nameFirstPers = {
                    "anchor": "nameFirstPers",
                    "message": "Enter first name"
                }
            }
            if (!req.session.myData.newNameLastPers) {
                req.session.myData.validationError = "true"
                req.session.myData.validationErrors.nameLastPers = {
                    "anchor": "nameLastPers",
                    "message": "Enter last name"
                }
            }
            // CONCEPT
        } else {
            if (!req.session.myData.newNamePers) {
                req.session.myData.validationError = "true"
                req.session.myData.validationErrors.namePers = {
                    "anchor": "namePers",
                    "message": "Enter full name"
                }
            }
        }

        if (req.session.myData.validationError == "true") {
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
        req.session.myData.nameFirstPers = req.session.myData.newNameFirstPers || req.session.myData.nameFirstPers
        req.session.myData.nameMiddlePers = req.session.myData.newNameMiddlePers
        req.session.myData.nameLastPers = req.session.myData.newNameLastPers || req.session.myData.nameLastPers
        req.session.myData.namePers = req.session.myData.newNamePers || req.session.myData.namePers

        if (req.session.data.release == "b1") {
            req.session.myData.selectedUser.firstName = req.session.myData.nameFirstPers
            req.session.myData.selectedUser.middleName = req.session.myData.nameMiddlePers
            req.session.myData.selectedUser.lastName = req.session.myData.nameLastPers

            req.session.data.selectedUser.firstName = req.session.myData.nameFirstPers
            req.session.data.selectedUser.middleName = req.session.myData.nameMiddlePers
            req.session.data.selectedUser.lastName = req.session.myData.nameLastPers

            var _fullname = ""
            var _middleValue = req.session.myData.nameMiddlePers
            if (_middleValue) {
                _middleValue = _middleValue + " "
            }
            _fullName = req.session.myData.nameFirstPers + " " + _middleValue + req.session.myData.nameLastPers
            req.session.myData.selectedUser.name = _fullName
            req.session.data.selectedUser.name = _fullName


        } else {
            req.session.myData.selectedUser.name = req.session.myData.newNamePers || req.session.myData.namePers
            req.session.data.selectedUser.name = req.session.myData.newNamePers || req.session.myData.namePers
        }


        req.session.myData.newNameFirstPers = ""
        req.session.myData.newNameMiddlePers = ""
        req.session.myData.newNameLastPers = ""
        req.session.myData.newNamePers = ""

        res.redirect(301, '/' + version + '/details-personal-details?changed=true&namechanged=true');
    });

    //personal details - change date of birth
    router.get('/' + version + '/personal-details-dob-change', function (req, res) {
        if (req.query.newChange) {
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

        if (req.session.myData.includeValidation == "false") {
            req.session.myData.newDobDayPers = req.session.myData.newDobDayPers || req.session.myData.dobDayPers
            req.session.myData.newDobMonthPers = req.session.myData.newDobMonthPers || req.session.myData.dobMonthPers
            req.session.myData.newDobYearPers = req.session.myData.newDobYearPers || req.session.myData.dobYearPers
        }

        var _anchor = "",
            _errors = {
                "day": false,
                "month": false,
                "year": false
            }
        if (!req.session.myData.newDobYearPers) {
            _anchor = "dobYearPers"
            req.session.myData.validationErrors.dobYearPers = true
            _errors.year = true
        }
        if (!req.session.myData.newDobMonthPers) {
            _anchor = "dobMonthPers"
            req.session.myData.validationErrors.dobMonthPers = true
            _errors.month = true
        }
        if (!req.session.myData.newDobDayPers) {
            _anchor = "dobDayPers"
            req.session.myData.validationErrors.dobDayPers = true
            _errors.day = true
        }

        if (_errors.day || _errors.month || _errors.year) {
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.dobPers = {
                "anchor": _anchor,
                "message": "Enter your date of birth"
            }

            // Day is good
            if (!_errors.day) {
                req.session.myData.validationErrors.dobPers.message = "Date of birth must include a month and year"
                // Month is good
                if (!_errors.month) {
                    req.session.myData.validationErrors.dobPers.message = "Date of birth must include a year"
                    // Year is good
                } else if (!_errors.year) {
                    req.session.myData.validationErrors.dobPers.message = "Date of birth must include a month"
                }
                // Day is bad
            } else {
                // Month bad and year good
                if (_errors.month && !_errors.year) {
                    req.session.myData.validationErrors.dobPers.message = "Date of birth must include a day and month"
                    // Month good and year bad
                } else if (!_errors.month && _errors.year) {
                    req.session.myData.validationErrors.dobPers.message = "Date of birth must include a day and year"
                    // Month good and year good
                } else if (!_errors.month && !_errors.year) {
                    req.session.myData.validationErrors.dobPers.message = "Date of birth must include a day"
                }
            }

        }

        if (req.session.myData.validationError == "true") {
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
        req.session.myData.dobDayPers = req.session.myData.newDobDayPers || req.session.myData.dobDayPers
        req.session.myData.dobMonthPers = req.session.myData.newDobMonthPers || req.session.myData.dobMonthPers
        req.session.myData.dobYearPers = req.session.myData.newDobYearPers || req.session.myData.dobYearPers

        req.session.myData.newDobDayPers = ""
        req.session.myData.newDobMonthPers = ""
        req.session.myData.newDobYearPers = ""

        res.redirect(301, '/' + version + '/details-personal-details?changed=true&dobchanged=true');
    });

    //personal details - search postcode
    router.get('/' + version + '/personal-details-address-postcode-change', function (req, res) {
        if (req.query.newChange) {
            req.session.myData.newAddressPostcodePers = null
        }
        res.render(version + '/personal-details-address-postcode-change', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/personal-details-address-postcode-change', function (req, res) {

        req.session.myData.newAddressPostcodePers = req.body.addressPostcodePers.trim()

        if (req.session.myData.includeValidation == "false") {
            req.session.myData.newAddressPostcodePers = req.session.myData.newAddressPostcodePers || req.session.myData.addressPostcodePers
        }

        if (!req.session.myData.newAddressPostcodePers) {
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.addressPostcodePers = {
                "anchor": "addressPostcodePers",
                "message": "Enter a postcode"
            }
        }

        if (req.session.myData.validationError == "true") {
            res.render(version + '/personal-details-address-postcode-change', {
                myData: req.session.myData
            });
        } else {
            res.redirect(301, '/' + version + '/personal-details-address-select-change');
        }

    });
    //personal details - select address
    router.get('/' + version + '/personal-details-address-select-change', function (req, res) {
        if (req.query.newChange) {
            // req.session.myData.newAddress1Pers = ""
        }
        res.render(version + '/personal-details-address-select-change', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/personal-details-address-select-change', function (req, res) {

        req.session.myData.newAddressPers = req.body.addressPers

        if (req.session.myData.includeValidation == "false") {
            if (req.session.myData.newAddressPers == "select") {
                req.session.myData.newAddressPers = "10 Skirbeck Way"
            } else {
                req.session.myData.newAddressPers = req.session.myData.newAddressPers || "10 Skirbeck Way"
            }
        }

        if (req.session.myData.newAddressPers == "select") {
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.addressPers = {
                "anchor": "addressPers",
                "message": "Choose an address"
            }
        }


        if (req.session.myData.validationError == "true") {
            res.render(version + '/personal-details-address-select-change', {
                myData: req.session.myData
            });
        } else {

            req.session.myData.newAddress1Pers = req.session.myData.newAddressPers
            req.session.myData.newAddress2Pers = ""
            req.session.myData.newAddressCityPers = "Maidstone"
            req.session.myData.newAddressCountyPers = ""
            req.session.myData.newAddressPostcodePers = req.session.myData.newAddressPostcodePers || req.session.myData.addressPostcodePers
            req.session.myData.newAddressCountryPers = "United Kingdom"

            res.redirect(301, '/' + version + '/personal-details-address-check');
        }

    });
    //personal details - change address
    router.get('/' + version + '/personal-details-address-change', function (req, res) {
        if (req.query.newChange) {
            req.session.myData.newAddress1Pers = ""
            req.session.myData.newAddress2Pers = ""
            req.session.myData.newAddressCityPers = ""
            req.session.myData.newAddressCountyPers = ""
            req.session.myData.newAddressPostcodePers = ""
            req.session.myData.newAddressCountryPers = ""
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
        req.session.myData.newAddressCountryPers = req.body.addressCountryPers.trim()

        if (req.session.myData.includeValidation == "false") {
            req.session.myData.newAddress1Pers = req.session.myData.newAddress1Pers || req.session.myData.address1Pers
            req.session.myData.newAddressCityPers = req.session.myData.newAddressCityPers || req.session.myData.addressCityPers
            req.session.myData.newAddressCountryPers = req.session.myData.newAddressCountryPers || req.session.myData.addressCountryPers
        }

        if (!req.session.myData.newAddress1Pers) {
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.address1Pers = {
                "anchor": "address1Pers",
                "message": "Enter address line 1, typically the building and street"
            }
        }
        if (!req.session.myData.newAddressCityPers) {
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.addressCityPers = {
                "anchor": "addressCityPers",
                "message": "Enter town or city"
            }
        }
        if (!req.session.myData.newAddressCountryPers) {
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.addressCountryPers = {
                "anchor": "addressCountryPers",
                "message": "Enter a country"
            }
        }


        if (req.session.myData.validationError == "true") {
            res.render(version + '/personal-details-address-change', {
                myData: req.session.myData
            });
        } else {
            res.redirect(301, '/' + version + '/personal-details-address-check');
        }

    });
    //personal details - check address
    router.get('/' + version + '/personal-details-address-check', function (req, res) {
        res.render(version + '/personal-details-address-check', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/personal-details-address-check', function (req, res) {
        req.session.myData.address1Pers = req.session.myData.newAddress1Pers || req.session.myData.address1Pers
        req.session.myData.address2Pers = req.session.myData.newAddress2Pers || req.session.myData.address2Pers
        req.session.myData.addressCityPers = req.session.myData.newAddressCityPers || req.session.myData.addressCityPers
        req.session.myData.addressCountyPers = req.session.myData.newAddressCountyPers || req.session.myData.addressCountyPers
        if (req.session.myData.newAddressPostcodePers == null) {
            req.session.myData.addressPostcodePers = req.session.myData.addressPostcodePers
        } else {
            req.session.myData.addressPostcodePers = req.session.myData.newAddressPostcodePers
        }
        req.session.myData.addressCountryPers = req.session.myData.newAddressCountryPers || req.session.myData.addressCountryPers

        req.session.myData.newAddress1Pers = ""
        req.session.myData.newAddress2Pers = ""
        req.session.myData.newAddressCityPers = ""
        req.session.myData.newAddressCountyPers = ""
        req.session.myData.newAddressPostcodePers = ""
        req.session.myData.newAddressCountryPers = ""

        res.redirect(301, '/' + version + '/details-personal-details?changed=true&addresschanged=true');
    });

    //personal details - change phone numbers
    router.get('/' + version + '/personal-details-phone-change', function (req, res) {
        if (req.query.newChange) {
            req.session.myData.newMobNumberPers = null
            req.session.myData.newTelNumberPers = null
        }
        res.render(version + '/personal-details-phone-change', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/personal-details-phone-change', function (req, res) {

        req.session.myData.newMobNumberPers = req.body.mobNumberPers.trim()
        req.session.myData.newTelNumberPers = req.body.telNumberPers.trim()

        if (req.session.myData.includeValidation == "false") {
            req.session.myData.newMobNumberPers = req.session.myData.newMobNumberPers || req.session.myData.mobNumberPers
            req.session.myData.newTelNumberPers = req.session.myData.newTelNumberPers || req.session.myData.telNumberPers
        }

        if (!req.session.myData.newTelNumberPers && !req.session.myData.newMobNumberPers) {
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.phoneNumbersPers = {
                "anchor": "telNumberPers",
                "message": "Enter at least one phone number"
            }
        }

        if (req.session.myData.validationError == "true") {
            res.render(version + '/personal-details-phone-change', {
                myData: req.session.myData
            });
        } else {
            res.redirect(301, '/' + version + '/personal-details-phone-check');
        }

    });
    //personal details - check phone numbers
    router.get('/' + version + '/personal-details-phone-check', function (req, res) {
        res.render(version + '/personal-details-phone-check', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/personal-details-phone-check', function (req, res) {
        if (req.session.myData.newMobNumberPers == null) {
            req.session.myData.mobNumberPers = req.session.myData.mobNumberPers
        } else {
            req.session.myData.mobNumberPers = req.session.myData.newMobNumberPers
        }
        if (req.session.myData.newTelNumberPers == null) {
            req.session.myData.telNumberPers = req.session.myData.telNumberPers
        } else {
            req.session.myData.telNumberPers = req.session.myData.newTelNumberPers
        }
        req.session.myData.newMobNumberPers = ""
        req.session.myData.newTelNumberPers = ""
        res.redirect(301, '/' + version + '/details-personal-details?changed=true&phonechanged=true');
    });

    //personal details - change email
    router.get('/' + version + '/personal-details-email-change', function (req, res) {
        if (req.query.newChange) {
            req.session.myData.newEmailPers = ""
        }
        res.render(version + '/personal-details-email-change', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/personal-details-email-change', function (req, res) {

        req.session.myData.newEmailPers = req.body.emailPers.trim()

        if (req.session.myData.includeValidation == "false") {
            req.session.myData.newEmailPers = req.session.myData.newEmailPers || req.session.myData.emailPers
        }

        if (!req.session.myData.newEmailPers) {
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.emailPers = {
                "anchor": "emailPers",
                "message": "Enter personal email address"
            }
        }

        if (req.session.myData.validationError == "true") {
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
        req.session.myData.emailPers = req.session.myData.newEmailPers || req.session.myData.emailPers
        req.session.myData.newEmailPers = ""
        res.redirect(301, '/' + version + '/details-personal-details?changed=true&emailchanged=true');
    });





    //
    //BUSINESS details
    //
    router.get('/' + version + '/details-business-details', function (req, res) {

        req.session.myData.cphCount = req.query.cphCount
        req.session.myData.vendorCount = req.query.vendorCount
        req.session.myData.traderCount = req.query.traderCount

        if (req.query.changed == "true") {
            req.session.myData.notifications.type = "success"
            req.session.myData.showNotification = "true"
        }

        // Notification banner messages
        if (req.query.namechanged == "true") {
            req.session.myData.notifications.message = "You have updated your business name"
        }
        if (req.query.addresschanged == "true") {
            req.session.myData.notifications.message = "You have updated your business address"
        }
        if (req.query.phonechanged == "true") {
            req.session.myData.notifications.message = "You have updated your business phone numbers"
        }
        if (req.query.emailchanged == "true") {
            req.session.myData.notifications.message = "You have updated your business email address"
        }
        if (req.query.vatchanged == "true") {
            req.session.myData.notifications.message = "You have updated your VAT registration number"
        }
        if (req.query.vatremoved == "true") {
            req.session.myData.notifications.message = "You have removed your VAT registration number"
        }
        if (req.query.typechanged == "true") {
            req.session.myData.notifications.message = "You have updated your business type"
        }
        if (req.query.legalchanged == "true") {
            req.session.myData.notifications.message = "You have updated your business legal status"
        }
        if (req.query.bankchanged == "true") {
            req.session.myData.notifications.message = "You have updated your business bank details"
        }

        res.render(version + '/details-business-details', {
            myData: req.session.myData
        });
    });

    //business details - change business name
    router.get('/' + version + '/business-details-name-change', function (req, res) {
        if (req.query.newChange) {
            req.session.myData.newNameBus = ""
        }
        res.render(version + '/business-details-name-change', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-name-change', function (req, res) {

        req.session.myData.newNameBus = req.body.nameBus.trim()

        if (req.session.myData.includeValidation == "false") {
            req.session.myData.newNameBus = req.session.myData.newNameBus || req.session.myData.nameBus
        }

        if (!req.session.myData.newNameBus) {
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.nameBus = {
                "anchor": "nameBus",
                "message": "Enter business name"
            }
        }

        if (req.session.myData.validationError == "true") {
            res.render(version + '/business-details-name-change', {
                myData: req.session.myData
            });
        } else {
            // req.session.myData.nameBus = req.session.myData.newNameBus
            res.redirect(301, '/' + version + '/business-details-name-check');
        }

    });
    //business details - check business name
    router.get('/' + version + '/business-details-name-check', function (req, res) {
        res.render(version + '/business-details-name-check', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-name-check', function (req, res) {

        req.session.myData.nameBus = req.session.myData.newNameBus || req.session.myData.nameBus
        req.session.myData.selectedBusiness.name = req.session.myData.newNameBus || req.session.myData.nameBus
        req.session.data.selectedBusiness.name = req.session.myData.newNameBus || req.session.myData.nameBus

        req.session.myData.newNameBus = ""
        res.redirect(301, '/' + version + '/details-business-details?changed=true&namechanged=true');
    });

    //business details - search postcode
    router.get('/' + version + '/business-details-address-postcode-change', function (req, res) {
        if (req.query.newChange) {
            req.session.myData.newAddressPostcodeBus = null
        }
        res.render(version + '/business-details-address-postcode-change', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-address-postcode-change', function (req, res) {

        req.session.myData.newAddressPostcodeBus = req.body.addressPostcodeBus.trim()

        if (req.session.myData.includeValidation == "false") {
            req.session.myData.newAddressPostcodeBus = req.session.myData.newAddressPostcodeBus || req.session.myData.addressPostcodeBus
        }

        if (!req.session.myData.newAddressPostcodeBus) {
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.addressPostcodeBus = {
                "anchor": "addressPostcodeBus",
                "message": "Enter a postcode"
            }
        }

        if (req.session.myData.validationError == "true") {
            res.render(version + '/business-details-address-postcode-change', {
                myData: req.session.myData
            });
        } else {
            res.redirect(301, '/' + version + '/business-details-address-select-change');
        }

    });
    //business details - select address
    router.get('/' + version + '/business-details-address-select-change', function (req, res) {
        if (req.query.newChange) {
            // req.session.myData.newAddress1Bus = ""
        }
        res.render(version + '/business-details-address-select-change', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-address-select-change', function (req, res) {

        req.session.myData.newAddressBus = req.body.addressBus

        if (req.session.myData.includeValidation == "false") {
            if (req.session.myData.newAddressBus == "select") {
                req.session.myData.newAddressBus = "10 Skirbeck Way"
            } else {
                req.session.myData.newAddressBus = req.session.myData.newAddressBus || "10 Skirbeck Way"
            }
        }

        if (req.session.myData.newAddressBus == "select") {
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.addressBus = {
                "anchor": "addressBus",
                "message": "Choose an address"
            }
        }


        if (req.session.myData.validationError == "true") {
            res.render(version + '/business-details-address-select-change', {
                myData: req.session.myData
            });
        } else {

            req.session.myData.newAddress1Bus = req.session.myData.newAddressBus
            req.session.myData.newAddress2Bus = ""
            req.session.myData.newAddressCityBus = "Maidstone"
            req.session.myData.newAddressCountyBus = ""
            req.session.myData.newAddressPostcodeBus = req.session.myData.newAddressPostcodeBus || req.session.myData.addressPostcodeBus
            req.session.myData.newAddressCountryBus = "United Kingdom"


            res.redirect(301, '/' + version + '/business-details-address-check');
        }

    });
    //business details - change address
    router.get('/' + version + '/business-details-address-change', function (req, res) {
        if (req.query.newChange) {
            req.session.myData.newAddress1Bus = ""
            req.session.myData.newAddress2Bus = ""
            req.session.myData.newAddressCityBus = ""
            req.session.myData.newAddressCountyBus = ""
            req.session.myData.newAddressPostcodeBus = ""
            req.session.myData.newAddressCountryBus = ""
        }
        res.render(version + '/business-details-address-change', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-address-change', function (req, res) {

        req.session.myData.newAddress1Bus = req.body.address1Bus.trim()
        req.session.myData.newAddress2Bus = req.body.address2Bus.trim()
        req.session.myData.newAddressCityBus = req.body.addressCityBus.trim()
        req.session.myData.newAddressCountyBus = req.body.addressCountyBus.trim()
        req.session.myData.newAddressPostcodeBus = req.body.addressPostcodeBus.trim()
        req.session.myData.newAddressCountryBus = req.body.addressCountryBus.trim()

        if (req.session.myData.includeValidation == "false") {
            req.session.myData.newAddress1Bus = req.session.myData.newAddress1Bus || req.session.myData.address1Bus
            req.session.myData.newAddressCityBus = req.session.myData.newAddressCityBus || req.session.myData.addressCityBus
            req.session.myData.newAddressCountryBus = req.session.myData.newAddressCountryBus || req.session.myData.addressCountryBus
        }

        if (!req.session.myData.newAddress1Bus) {
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.address1Bus = {
                "anchor": "address1Bus",
                "message": "Enter address line 1, typically the building and street"
            }
        }
        if (!req.session.myData.newAddressCityBus) {
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.addressCityBus = {
                "anchor": "addressCityBus",
                "message": "Enter town or city"
            }
        }
        if (!req.session.myData.newAddressCountryBus) {
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.addressCountryBus = {
                "anchor": "addressCountryBus",
                "message": "Enter a country"
            }
        }


        if (req.session.myData.validationError == "true") {
            res.render(version + '/business-details-address-change', {
                myData: req.session.myData
            });
        } else {
            res.redirect(301, '/' + version + '/business-details-address-check');
        }

    });
    //business details - check address
    router.get('/' + version + '/business-details-address-check', function (req, res) {
        res.render(version + '/business-details-address-check', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-address-check', function (req, res) {
        req.session.myData.address1Bus = req.session.myData.newAddress1Bus || req.session.myData.address1Bus
        req.session.myData.address2Bus = req.session.myData.newAddress2Bus || req.session.myData.address2Bus
        req.session.myData.addressCityBus = req.session.myData.newAddressCityBus || req.session.myData.addressCityBus
        req.session.myData.addressCountyBus = req.session.myData.newAddressCountyBus || req.session.myData.addressCountyBus
        if (req.session.myData.newAddressPostcodeBus == null) {
            req.session.myData.addressPostcodeBus = req.session.myData.addressPostcodeBus
        } else {
            req.session.myData.addressPostcodeBus = req.session.myData.newAddressPostcodeBus
        }
        req.session.myData.addressCountryBus = req.session.myData.newAddressCountryBus || req.session.myData.addressCountryBus

        req.session.myData.newAddress1Bus = ""
        req.session.myData.newAddress2Bus = ""
        req.session.myData.newAddressCityBus = ""
        req.session.myData.newAddressCountyBus = ""
        req.session.myData.newAddressPostcodeBus = ""
        req.session.myData.newAddressCountryBus = ""

        res.redirect(301, '/' + version + '/details-business-details?changed=true&addresschanged=true');
    });



    //business details - change phone numbers
    router.get('/' + version + '/business-details-phone-change', function (req, res) {
        if (req.query.newChange) {
            req.session.myData.newMobNumberBus = null
            req.session.myData.newTelNumberBus = null
        }
        res.render(version + '/business-details-phone-change', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-phone-change', function (req, res) {

        req.session.myData.newMobNumberBus = req.body.mobNumberBus.trim()
        req.session.myData.newTelNumberBus = req.body.telNumberBus.trim()

        if (req.session.myData.includeValidation == "false") {
            req.session.myData.newMobNumberBus = req.session.myData.newMobNumberBus || req.session.myData.mobNumberBus
            req.session.myData.newTelNumberBus = req.session.myData.newTelNumberBus || req.session.myData.telNumberBus
        }

        if (!req.session.myData.newTelNumberBus && !req.session.myData.newMobNumberBus) {
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.phoneNumbersBus = {
                "anchor": "telNumberBus",
                "message": "Enter at least one phone number"
            }
        }

        if (req.session.myData.validationError == "true") {
            res.render(version + '/business-details-phone-change', {
                myData: req.session.myData
            });
        } else {
            res.redirect(301, '/' + version + '/business-details-phone-check');
        }

    });
    //business details - check phone numbers
    router.get('/' + version + '/business-details-phone-check', function (req, res) {
        res.render(version + '/business-details-phone-check', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-phone-check', function (req, res) {
        if (req.session.myData.newMobNumberBus == null) {
            req.session.myData.mobNumberBus = req.session.myData.mobNumberBus
        } else {
            req.session.myData.mobNumberBus = req.session.myData.newMobNumberBus
        }
        if (req.session.myData.newTelNumberBus == null) {
            req.session.myData.telNumberBus = req.session.myData.telNumberBus
        } else {
            req.session.myData.telNumberBus = req.session.myData.newTelNumberBus
        }
        req.session.myData.newMobNumberBus = ""
        req.session.myData.newTelNumberBus = ""
        res.redirect(301, '/' + version + '/details-business-details?changed=true&phonechanged=true');
    });


    //business details - change email
    router.get('/' + version + '/business-details-email-change', function (req, res) {
        if (req.query.newChange) {
            req.session.myData.newEmailBus = ""
        }
        res.render(version + '/business-details-email-change', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-email-change', function (req, res) {

        req.session.myData.newEmailBus = req.body.emailBus.trim()

        if (req.session.myData.includeValidation == "false") {
            req.session.myData.newEmailBus = req.session.myData.newEmailBus || req.session.myData.emailBus
        }

        if (!req.session.myData.newEmailBus) {
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.emailBus = {
                "anchor": "emailBus",
                "message": "Enter business email address"
            }
        }

        if (req.session.myData.validationError == "true") {
            res.render(version + '/business-details-email-change', {
                myData: req.session.myData
            });
        } else {
            // req.session.myData.emailBus = req.session.myData.newEmailBus
            res.redirect(301, '/' + version + '/business-details-email-check');
        }

    });
    //business details - check email
    router.get('/' + version + '/business-details-email-check', function (req, res) {
        res.render(version + '/business-details-email-check', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-email-check', function (req, res) {
        req.session.myData.emailBus = req.session.myData.newEmailBus || req.session.myData.emailBus
        req.session.myData.newEmailBus = ""
        res.redirect(301, '/' + version + '/details-business-details?changed=true&emailchanged=true');
    });
    //business details - change type
    router.get('/' + version + '/business-details-type-change', function (req, res) {
        if (req.query.newChange) {
            req.session.myData.newTypeBus = ""
        }
        res.render(version + '/business-details-type-change', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-type-change', function (req, res) {

        req.session.myData.newTypeBus = req.body.typeBus

        if (req.session.myData.includeValidation == "false") {
            req.session.myData.newTypeBus = req.session.myData.newTypeBus || req.session.myData.typeBus
        }

        if (!req.session.myData.newTypeBus) {
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.typeBus = {
                "anchor": "typeBus-1",
                "message": "Select the business type"
            }
        }

        if (req.session.myData.validationError == "true") {
            res.render(version + '/business-details-type-change', {
                myData: req.session.myData
            });
        } else {
            // req.session.myData.typeBus = req.session.myData.newTypeBus
            res.redirect(301, '/' + version + '/business-details-type-check');
        }

    });
    //business details - check type
    router.get('/' + version + '/business-details-type-check', function (req, res) {
        res.render(version + '/business-details-type-check', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-type-check', function (req, res) {
        req.session.myData.typeBus = req.session.myData.newTypeBus || req.session.myData.typeBus
        req.session.myData.newTypeBus = ""
        res.redirect(301, '/' + version + '/details-business-details?changed=true&typechanged=true');
    });

    // business details - change legal status - internal user 


    router.get('/' + version + '/business-details-legal-change', function (req, res) {
        res.render(version + '/business-details-legal-change', {
            myData: req.session.myData
        });
    });

    router.post('/legal-answer', function (request, response) {

        var legalBus = request.session.data['legalBus']
        if (legalBus == "Charitable incorporated organisation (CIO)") {
            response.redirect("mvp/business-details-legal-charity")
        }
        else if (legalBus == "Charitable trust") {
            response.redirect("mvp/business-details-legal-check")
        }
        else if (legalBus == "Government (central)") {
            response.redirect("mvp/business-details-legal-check")
        }
        else if (legalBus == "Government (local)") {
            response.redirect("mvp/business-details-legal-check")
        }
        else if (legalBus == "Partnership") {
            response.redirect("mvp/business-details-legal-check")
        }
        else if (legalBus == "Sole proprietorship") {
            response.redirect("mvp/business-details-legal-check")
        }
        else if (legalBus == "The Crown") {
            response.redirect("mvp/business-details-legal-check")
        }
        else {
            response.redirect("mvp/business-details-legal-company")
        }
    })

    router.get('/' + version + '/business-details-legal-charity', function (req, res) {
        res.render(version + '/business-details-legal-charity', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-legal-charity', function (req, res) {
        res.redirect(301, '/' + version + '/business-details-legal-check');
    });

    router.get('/' + version + '/business-details-legal-company', function (req, res) {
        res.render(version + '/business-details-legal-company', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-legal-company', function (req, res) {
        res.redirect(301, '/' + version + '/business-details-legal-check');
    });

    router.get('/' + version + '/business-details-legal-check', function (req, res) {
        res.render(version + '/business-details-legal-check', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-legal-check', function (req, res) {
        res.redirect(301, '/' + version + '/details-business-details');
    });




    //business details - change VAT
    router.get('/' + version + '/business-details-vat-change', function (req, res) {
        if (req.query.newChange) {
            req.session.myData.newVatBus = ""
        }
        res.render(version + '/business-details-vat-change', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-vat-change', function (req, res) {

        req.session.myData.newVatBus = req.body.vatBus.trim()

        if (req.session.myData.includeValidation == "false") {
            req.session.myData.newVatBus = req.session.myData.newVatBus || "GB123456789"
        }

        if (!req.session.myData.newVatBus) {
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.vatBus = {
                "anchor": "vatBus",
                "message": "Enter a VAT registration number"
            }
        }

        if (req.session.myData.validationError == "true") {
            res.render(version + '/business-details-vat-change', {
                myData: req.session.myData
            });
        } else {
            // req.session.myData.vatBus = req.session.myData.newVatBus
            res.redirect(301, '/' + version + '/business-details-vat-check');
        }

    });
    //business details - check VAT
    router.get('/' + version + '/business-details-vat-check', function (req, res) {
        res.render(version + '/business-details-vat-check', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-vat-check', function (req, res) {
        req.session.myData.vatBus = req.session.myData.newVatBus || req.session.myData.vatBus
        req.session.myData.newVatBus = ""
        res.redirect(301, '/' + version + '/details-business-details?changed=true&vatchanged=true');
    });
    //business details - remove VAT
    router.get('/' + version + '/business-details-vat-remove', function (req, res) {
        res.render(version + '/business-details-vat-remove', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-vat-remove', function (req, res) {

        req.session.myData.newVATRemoveBus = req.body.vatRemoveBus


        if (req.session.myData.includeValidation == "false") {
            req.session.myData.newVATRemoveBus = req.session.myData.vatRemoveBus || "Yes"
        }

        if (!req.session.myData.newVATRemoveBus) {
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.vatBus = {
                "anchor": "vatRemoveBus-1",
                "message": "Select yes if you want to remove your VAT registration number"
            }
        }

        if (req.session.myData.validationError == "true") {
            res.render(version + '/business-details-vat-remove', {
                myData: req.session.myData
            });
        } else {

            if (req.session.myData.newVATRemoveBus == "Yes") {
                req.session.myData.vatRemoveBus = ""
                req.session.myData.newVATRemoveBus = ""
                req.session.myData.vatBus = ""
                req.session.myData.newVatBus = ""
                res.redirect(301, '/' + version + '/details-business-details?changed=true&vatremoved=true');
            } else {
                res.redirect(301, '/' + version + '/details-business-details');
            }
        }

    });




    //business details - change bank details - CONCEPT VERSIONS // outdated
    router.get('/' + version + '/business-details-bank-change', function (req, res) {
        if (req.query.newChange) {
            req.session.myData.newAddress1Bus = ""
            req.session.myData.newAddress2Bus = ""
            req.session.myData.newAddressCityBus = ""
            req.session.myData.newAddressCountyBus = ""
            req.session.myData.newAddressPostcodeBus = ""
        }
        res.render(version + '/business-details-bank-change', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-bank-change', function (req, res) {

        req.session.myData.newBankNameBus = req.body.bankNameBus.trim()
        req.session.myData.newBankSortBus = req.body.bankSortBus.trim()
        req.session.myData.newBankAccountBus = req.body.bankAccountBus.trim()
        req.session.myData.newBankRollBus = req.body.bankRollBus.trim()

        if (req.session.myData.includeValidation == "false") {
            req.session.myData.newBankNameBus = req.session.myData.newBankNameBus || req.session.myData.bankNameBus
            req.session.myData.newBankSortBus = req.session.myData.newBankSortBus || req.session.myData.bankSortBus
            req.session.myData.newBankAccountBus = req.session.myData.newBankAccountBus || req.session.myData.bankAccountBus
        }

        if (!req.session.myData.newBankNameBus) {
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.bankNameBus = {
                "anchor": "bankNameBus",
                "message": "[error message - blank - bank account name]"
            }
        }
        if (!req.session.myData.newBankSortBus) {
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.bankSortBus = {
                "anchor": "bankSortBus",
                "message": "[error message - blank - sort code]"
            }
        }
        if (!req.session.myData.newBankAccountBus) {
            req.session.myData.validationError = "true"
            req.session.myData.validationErrors.bankAccountBus = {
                "anchor": "bankAccountBus",
                "message": "[error message - blank - account number]"
            }
        }


        if (req.session.myData.validationError == "true") {
            res.render(version + '/business-details-bank-change', {
                myData: req.session.myData
            });
        } else {
            res.redirect(301, '/' + version + '/business-details-bank-check');
        }

    });
    //business details - check bank details
    router.get('/' + version + '/business-details-bank-check', function (req, res) {
        res.render(version + '/business-details-bank-check', {
            myData: req.session.myData
        });
    });
    router.post('/' + version + '/business-details-bank-check', function (req, res) {
        req.session.myData.bankNameBus = req.session.myData.newBankNameBus || req.session.myData.bankNameBus
        req.session.myData.bankSortBus = req.session.myData.newBankSortBus || req.session.myData.bankSortBus
        req.session.myData.bankAccountBus = req.session.myData.newBankAccountBus || req.session.myData.bankAccountBus
        req.session.myData.bankRollBus = req.session.myData.newBankRollBus || req.session.myData.bankRollBus

        req.session.myData.newBankNameBus = ""
        req.session.myData.newBankSortBus = ""
        req.session.myData.newBankAccountBus = ""
        req.session.myData.newBankRollBus = ""

        res.redirect(301, '/' + version + '/details-business-details?changed=true&bankchanged=true');
    });

}