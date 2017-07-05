define(['ko', 'lib/helpers', 'Sortable', 'ResizeSensor'], 
function (ko, helpers, Sortable, ResizeSensor) {

    /**
     * Sets background color to the element 
     * depending on tag found in the source string.
     * 
     * Binding properties:
     * @param {string} source - source string observable
     * @param {Array} tags - array of tag definitions 
     *        (objects - {tag - regex string, color, default - (optional) bool});
     * @param {string} [defaultTag] - default tag if no tag found in source string.
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
     * Usually used for contentEditables instead of default 'html'-binding,
     * because it syncs HTML changes immediately after each keyup.
     */
    ko.bindingHandlers.editableHTML = getEditableTextBinding(true);
    
    /**
     * Synchronizes observable with inner text of the element.
     * Usually used for contentEditables instead of default 'text'-binding,
     * because it syncs text changes immediately after each keyup.
     */
    ko.bindingHandlers.editableText = getEditableTextBinding();
    
    /** 
     * Returns binding that synchronizes observable with inner text or html of the element.
     * @param {boolean} [html=false] - leave untouched HTML or sanitize to text
     */
    function getEditableTextBinding(html) {
        return {
            init: function(element, valueAccessor) {
                
                var observable = valueAccessor();
                
                if (!ko.isObservable(observable)) 
                    throw new Error('Invalid target observable');
                    
                var $element = $(element);

                $element.on('keyup blur', function() {
                    var observable = valueAccessor();
                    observable(html ? $element.html() : $element.text());
                });
            },
            update: function(element, valueAccessor) {
                var $element = $(element);
                
                var value = ko.unwrap(valueAccessor());
                var currentValue = html ? $element.html() : $element.text();
                
                // check if actual HTML content and observable value are different,
                // otherwise value reset will also reset input caret
                if (currentValue !== value) {                 
                    if (html) {
                        $element.html(value);
                    } else {
                        $element.text(value);
                    }
                }
            }
        };
    }
    
    /**
     * Sets value of contentEditable attribute of target element.
     */
    ko.bindingHandlers.contentEditable = {
        update: function(element, valueAccessor) {
            var isCE = ko.unwrap(valueAccessor());
            
            element.contentEditable = !!isCE;
        }
    };
    
    /**
     * Calls function when 'Return'-key pressed on target element.
     * 'Return + shift' adds new line.
     */
    ko.bindingHandlers.returnKeyPress = {
        init: function(element, valueAccessor) {
            $(element).on('keydown', function(e) {
                // 'Return'
                if (e.keyCode == 13 && !e.shiftKey) {
                    valueAccessor();
                    e.preventDefault();
                }
    
                // 'Return + shift'
                if (e.keyCode == 13 && e.shiftKey) {
                    document.execCommand('insertHTML', false, '<br><br>');
                    e.preventDefault();
                }
            });
        }
    };

    /**
     * Calls function when 'Escape'-key pressed on target element.
     */
    ko.bindingHandlers.escapeKeyPress = {
        init: function(element, valueAccessor) {
            $(element).on('keydown', function(e) {
                // 'Escape'
                if (e.keyCode === 27) {
                    valueAccessor();

                    window.getSelection().removeAllRanges();
                }
            });
        }
    };
    
    /**
     * Selects all contents of target element when observable turns true.
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
    };
    
    /**
     * Makes childs of target element - draggable.
     * 
     * Binding properties:
     * @param {string} draggableClass - CSS class of draggable elements
     * @param {string} handleClass - CSS class of handle element inside each draggable element
     * @param {string} ghostClass - CCS class element currently dragged
     * @param {function} onUpdate - function which is called after element released
     */
    ko.bindingHandlers.sortable = {
        init: function(element, valueAccessor) {
            var container = element;
            
            var params = valueAccessor();
            
            //noinspection JSUnusedGlobalSymbols
            new Sortable(container, {
                group: element.id,
                draggable: '.' + params.draggableClass,
                handle: '.' + params.handleClass,
                ghostClass: params.ghostClass,
                scroll: true,
                scrollSensitivity: params.scrollSensitivity,
                scrollSpeed: params.scrollSpeed,
                onUpdate: function(e) {
                    if (params.onUpdate) {
                        var draggedElement = e.item;
                        var prevElement = draggedElement.previousElementSibling;
                        
                        params.onUpdate(draggedElement, prevElement);
                    }
                }
            });
        }
    };
    
    /**
     * Synchronizes observable with bound view-model in selected option.
     */
    ko.bindingHandlers.selectedChildVM = {
        init: function(element, valueAccessor) {
            
            var observable = valueAccessor();
            
            if (!ko.isObservable(observable)) 
                throw new Error('Invalid target observable');
            
            $(element).change(function(e) {
                var targetOption = e.target.options[e.target.selectedIndex];
                var targetVM = ko.dataFor(targetOption);
                observable(targetVM);
            });
            
            if (observable() === undefined && element.options > 0) {
                // Set default option's view model
                element.selectedIndex = 0;
                $(element).trigger('change');
            }
        },
        update: function(element, valueAccessor) {
            var vm = valueAccessor()();
            
            if (!vm) return;
        
            var optionVMs = $(element).find('option').toArray().map(function(option) {
                return ko.dataFor(option);
            });
            var optionIndex = optionVMs.indexOf(vm);
            
            element.selectedIndex = optionIndex;
        }
    };

    /**
     * Prevents dangerous HTML to be injected into
     * target contenteditable element
     */
    ko.bindingHandlers.sanitizeHtml = {
        init: function(element) {

            // ways for user to inject HTML into contenteditable element
            // 1. edit shortcuts (ctrl+b for <b>, ctrl+i for <i>) 
            // 2. new line shortcut (ctrl+enter) - custom behavior adds <br>
            // 3. copy-paste
            // any manually written HTML will be auto-escaped.
            // edit/new line shortcuts cannot do any harm, so we only need
            // to rewrite pasting behavior
            document.addEventListener('paste', function(e) {
                
                // do not affect other elements
                if (!$(e.target).closest(element).length) return;

                // extract no-dangerous plain text from clipboard
                // note: this will loose href from links and get link text,
                // but I assume it is better then manual regex extraction
                var data = e.clipboardData.getData('text/plain');

                // insert data
                helpers.insertTextToCaret(data);
                
                e.preventDefault();
            });
        }
    };

    /**
     * Replaces plain text URLs in contents of element
     * with HTML links
     * 
     * Binding properties:
     * @param {boolean} wrapUrls - wrap urls to links, otherwice - unwrap
     */
    ko.bindingHandlers.wrapUrls = {
        init: function(element, valueAccessor) {

            ko.bindingHandlers.wrapUrls.toggleWrap(element, valueAccessor);

            // monitor node changes in case inner HTML changed
            // without changing observable 'wrap' flag
            // eg. after saving task, it is remapped from business model
            new MutationObserver(function() {
                ko.bindingHandlers.wrapUrls.toggleWrap(element, valueAccessor);
            }).observe(element, {childList: true, subtree: true});
        },
        update: function(element, valueAccessor) {
            ko.bindingHandlers.wrapUrls.toggleWrap(element, valueAccessor);
        },
        toggleWrap(element, valueAccessor) {

            var observable = valueAccessor();
            var wrap = ko.unwrap(valueAccessor());
            
            var $element = $(element);
            var value = $element.html();

            if (wrap) {
                var wrapped = helpers.wrapUrls(value);
                if (value !== wrapped) {
                    $element.html(wrapped);
                }
            } else {
                var unwrapped = helpers.unwrapUrls(value);
                if (value !== unwrapped) {
                    $element.html(unwrapped);
                }
            }
        }
    };

    /**
     * Detects weither target element`s content fits into element`s height
     * (no vertical overflow happens)
     */
    ko.bindingHandlers.contentFits = {
        init(element, valueAccessor) {
            let observable = valueAccessor();

            if (!ko.isObservable(observable)) 
                throw new Error('Invalid target observable');
            
            // throttle observable change notifications,
            // since transition animation can generate bunch
            // of resize events
            observable = observable.extend({
                rateLimit: { 
                    timeout: 100, 
                    method: 'notifyWhenChangesStop'
                }
            });

            // currently only way to subsribe to element resize 
            // event is ResizeSensor-hack, which creates invisible
            // absolutely positioned element subscribed to scroll event.
            // when target block resized, ResizeSensor-block changes
            // scroll position over its inner child block
            new ResizeSensor(element, function() {
                const offsetHeight = parseInt(element.offsetHeight);
                const scrollHeight = parseInt(element.scrollHeight);

                const fits = offsetHeight >= scrollHeight;
                observable(fits);
            });
        }
    };

    /**
     * Sets current element height to observable
     */
    ko.bindingHandlers.height = {
        init(element, valueAccessor) {
            let observable = valueAccessor();

            if (!ko.isObservable(observable)) 
                throw new Error('Invalid target observable');

            // throttle observable change notifications,
            // since transition animation can generate bunch
            // of resize events
            observable = observable.extend({
                rateLimit: { 
                    timeout: 100, 
                    method: 'notifyWhenChangesStop'
                }
            });

            new ResizeSensor(element, function() {
                const offsetHeight = parseInt(element.offsetHeight);
                observable(offsetHeight);
            });
        }
    };

    /**
     * Detects weither CCS transition animation 
     * is currently in progress on target element
     * NOTE: detects only animation end event, since there is
     * no animation start event supported by browsers now.
     * Manually set observable value to 'true' when needed.
     */
    ko.bindingHandlers.animationInProgress = {
        init(element, valueAccessor) {
            let observable = valueAccessor();

            if (!ko.isObservable(observable)) 
                throw new Error('Invalid target observable');
            
            element.addEventListener('transitionend', function() {
                observable(false);
            });
        }
    };

    /**
     * Expands element's height to fit its contents without oveflows.
     * 
     * Sets value of element scroll height (contents height) 
     * to its max-height inline.
     * 
     * Note: useful for CSS transition animations (expand/collapse).
     * Why js and not css solution?
     * Because there's no CSS solution.
     * - '0px to 100000px' will kill animation timing (range too big)
     * - '0px to 100%' will depend on parent's height, not child contents
     * - '0px to fit-content' wont animate
     * - CSS has no ability to set value of one property to another
     *   (scrollHeight to maxHeight)
     * So solution is to set right max-height value with script.
     */
    ko.bindingHandlers.scrollHeightToMaxHeight = {
        init(element, valueAccessor) {
            const observable = valueAccessor();
            const setMaxHeight = ko.bindingHandlers.scrollHeightToMaxHeight.setMaxHeight;

            if (!ko.isObservable(observable)) 
                throw new Error('Invalid target observable');
            
            // set handlers to dynamically change element height
            // in response to its contents height change

            // content height can change because of parent block resize (from outside)
            // eg. setting task edit mode will expand buttons block and
            // and narrow task description block. which can change content
            // height and lead to overflow
            new ResizeSensor(element, function onResize() {
                const set = observable();
                setMaxHeight(element, set);
            });

            // content height can change because of content change (from inside)
            // eg. when editing task description, description block contents
            // can obviously change its height
            new MutationObserver(function() {
                const set = observable();
                setMaxHeight(element, set);
            }).observe(element, {childList: true, subtree: true, characterData: true});
        },
        update(element, valueAccessor) {
            const observable = valueAccessor();
            const set = observable();
            const setMaxHeight = ko.bindingHandlers.scrollHeightToMaxHeight.setMaxHeight;
            setMaxHeight(element, set);
        },
        setMaxHeight(element, set) {
            element.style.maxHeight = set ? element.scrollHeight + 'px' : '';
        }
    };
});
