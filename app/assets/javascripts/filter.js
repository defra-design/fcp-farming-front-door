function filterVisibilityToggle(_filtersApplied){

    var _viewIs = (jQuery(window).width() < 641) ? "mobile" : "desktop",
        _viewWas = _viewIs,
        _firstLoad = true,
        _focusFilterPrompt = jQuery(".focus-field-prompt"),
        _filterContainer = jQuery(".sfd-filter"),
        _filterHeader = jQuery(".sfd-filter__header"),
        _filterToggleContainer = jQuery("<div class='sfd-filter__togle-container closed'></div>"),
        _filterOptions = _filterContainer.find(".sfd-filter__options"),
        _buttonTextClosed = _filtersApplied ? "Show filter options" : "Show filter",
        _buttonTextOpen = _filtersApplied ? "Hide filter options" : "Hide filter",
        _toggleButton = jQuery("<button class='govuk-button govuk-button--secondary sfd-filter__toggle' type='button' >" + _buttonTextClosed + "</button>"),
        _optionsVisible = true;

    if (!_filtersApplied) {
        _filterToggleContainer.addClass("filters-not-applied")
    }

    _filterToggleContainer.insertAfter(_filterContainer)
    _filterToggleContainer.append(_toggleButton)

    // On window resize
    jQuery(window).on( "resize", function() {
        _viewIs = (jQuery(window).width() < 641) ? "mobile" : "desktop"
        if((_viewWas != _viewIs) || _firstLoad){
            hideShowPanel()
            if(_viewIs == "mobile") {
                _toggleButton.show() 
            } else {
                _toggleButton.hide()
            }
        }
        _viewWas = _viewIs
        _firstLoad = false
    }).trigger("resize");

    // On toggle click
    _toggleButton.on( "click", function() {
        hideShowPanel()
    });
    _focusFilterPrompt.on( "click", function() {
        hideShowPanel("justshow")
        jQuery('html, body').animate({scrollTop: _filterContainer.offset().top - 50}, 20);
    });

    function hideShowPanel(_justshow){
        if(!_optionsVisible || _viewIs == "desktop"){
            _toggleButton.text(_buttonTextOpen)
            _filterToggleContainer.removeClass("closed")
            _optionsVisible = true
            _filterOptions.show()
            if(!_filtersApplied){
                _filterHeader.show()
            } 
        } else if(!_justshow) {
            _toggleButton.text(_buttonTextClosed)
            _filterToggleContainer.addClass("closed")
            _optionsVisible = false 
            _filterOptions.hide()
            if(!_filtersApplied){
                _filterHeader.hide()
            }
        }
    }

}
