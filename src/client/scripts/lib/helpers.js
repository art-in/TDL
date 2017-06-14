define(function() {

    /**
     * Returns index of child node inside container.
     *
     * @param {HTMLElement} container
     * @param {HTMLElement} childNode
     * @param {string} childCssClass - only take childs with this CSS class into account
     */
    function getChildNodeIndex (container, childNode, childCssClass) {
        return Array.prototype.indexOf.call(
            Array.prototype.slice.call(container.childNodes)
                .filter(
                function (node) {
                    if (node.classList) {
                        return node.classList.contains(childCssClass);
                    }
                    return false;
                }), childNode);
    }

    /**
     * Moves Array element to new position.
     *
     * @param {number} old_index
     * @param {number} new_index
     */
    function arrayMoveItem (old_index, new_index) {
        if (new_index >= this.length) {
            var k = new_index - this.length;
            while ((k--) + 1) {
                this.push(undefined);
            }
        }
        this.splice(new_index, 0, this.splice(old_index, 1)[0]);
        return this; // for testing purposes
    }

    function guid () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    function uid () {
        return guid().split('-').shift();
    }

    /**
     * Compares date objects
     * Note: useful because date objects compared by reference by default
     * 
     * @param {Date} dateA
     * @param {Date} dateB
     * @return {boolean} true if dates are equal, false - otherwise
     */
    function datesEqual(dateA, dateB) {
        return (dateA || '').toString() === (dateB || '').toString();
    }
    
    /**
     * Replaces plain text URL substrings with HTML links
     * 
     * @example
     * wrapUrls('See http://example.com')
     * // 'See <a href="http://example.com">example.com</a>'
     * 
     * @param {string} input
     * @return {string} resulting string
     */
    function wrapUrls(input) {
        var result = input;

        // remove unicode spaces to not break regexes
        result = result.replace(/&nbsp;/g, ' ');

        // unwrap URLs from input links (if any)
        // making sure to not wrap link into another link,
        // by the way clearing attributes junk from original link
        result = unwrapUrls(result);

        // wrap URLs into links
        var urlRegex = /https?:\/\/((www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=…;]*))/g;
        result = result.replace(urlRegex, function(url, urlWithoutScheme) {

            var innerText = urlWithoutScheme;

            // remove terminating slash as visual junk
            if (innerText[innerText.length - 1] === '/') {
                innerText = innerText.slice(0, innerText.length - 1);
            }

            // shorten long URL text by replacing center part with dots
            if (innerText.length > 50) {
                innerText =
                    innerText.slice(0, 23) +
                    '...' +
                    innerText.slice(innerText.length - 24, innerText.length);
            }

            return `<a href="${url}" target="_blank">${innerText}</a>`;
        });

        return result;
    }

    /**
     * Replaces HTML links with plain text URLs
     * 
     * @example
     * unwrapUrls('See <a href="http://example.com">example.com</a>')
     * // 'See http://example.com'
     * 
     * @param {string} input
     * @return {string} resulting string
     */
    function unwrapUrls(input) {
        var anchorRegex = /<a .*?href="(.*?)".*?a>/g;
        return input.replace(anchorRegex, function(match, url) {
            return url;
        });
    }
    
    /**
     * Inserts text to current caret position
     * @param {string} text
     */
    function insertTextToCaret(text) {
        var sel = window.getSelection();
        var range = sel.getRangeAt(0); 
        range.deleteContents();
        var textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    return {
        getChildNodeIndex: getChildNodeIndex,
        arrayMoveItem: arrayMoveItem,
        guid: guid,
        uid: uid,
        datesEqual: datesEqual,
        wrapUrls: wrapUrls,
        unwrapUrls: unwrapUrls,
        insertTextToCaret: insertTextToCaret
    };
});