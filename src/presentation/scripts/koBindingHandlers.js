/**
 * Sets background color to the element
 * depending on tag found in the @source string.
 * Binding properties:
 *  @source - source string observable;
 *  @tags - array of tag definitions 
 *          (objects - {tag - regex string, color, default - (optional) bool});
 *  @defaultTag (optional) - default tag if no tag found in source string.
 */
ko.bindingHandlers.backgroundColorTag = {
    update: function(element, valueAccessor) {
        var value = valueAccessor();

        var source = value.source();
        var tagDefs = value.tags;
        
        // Check arguments.
        if (!source || !tagDefs || tagDefs.length < 1) {
            return;
        }

        // Find tag in source string and set background.
        var tagFound = tagDefs.filter(function(tagDef) {
            var regexp = new RegExp(tagDef.tag, 'gim');
            if (source.search(regexp) !== -1) {
                $(element).css({'background-color': tagDef.color });
                tagFound = true;
                return true;
            }
        })[0];

        // Set default tag.
        if (!tagFound) {
            tagDefs.forEach(function(tagDef) {
                if (tagDef.default) {
                    $(element).css({'background-color': tagDef.color });
                    return true;
                }
            });
        }
    }
};

/**
 * Synchronizes observable with inner HTML of the element.
 */
ko.bindingHandlers.editableHTML = {
    init: function(element, valueAccessor) {
        var $element = $(element);
        var initialValue = ko.utils.unwrapObservable(valueAccessor());
        $element.html(initialValue);
        $element.on('keyup', function() {
            var observable = valueAccessor();
            observable($element.html());
        });
    },
    update: function(element, valueAccessor) {
        var $element = $(element);
        
        var value = ko.unwrap(valueAccessor());
        
        if ($element.html() !== value) {
            $element.html(value);
        }
    }
};

/**
 * Sets value of contentEditable attribute of target element.
 */
ko.bindingHandlers.contentEditable = {
    update: function(element, valueAccessor) {
        var isCE = ko.unwrap(valueAccessor());
        
        if (isCE) {
            element.contentEditable = true;
        } else {
            element.contentEditable = false;
        }
    }
}

/**
 * Calls function when 'Return'-key pressed on target element.
 * 'Return'+Ctrl adds new line.
 */
ko.bindingHandlers.returnKeyPress = {
    init: function(element, valueAccessor) {
        $(element).on('keydown', function(e) {
            // 'Return'
            if (e.keyCode == 13 && !e.ctrlKey) {
                valueAccessor()();
                return false;
            }

            // 'Return + CTRL'
            if (e.keyCode == 13 && e.ctrlKey) {
                document.execCommand('insertHTML', false, '<br><br>');
                return false;
            }
        });
    }
};

/**
 * Selects all contents of target element when observable turns to true.
 */
ko.bindingHandlers.contentSelect = {
    update: function(element, valueAccessor) {
        var select = ko.unwrap(valueAccessor());
        
        if (select) {
            var range = document.createRange();
            range.selectNodeContents(element);
            
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
}