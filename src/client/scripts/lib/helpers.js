define(function() {
    var exports = {};

    /**
     * Returns index of child node inside container.
     *
     * @param {HTMLElement} container
     * @param {HTMLElement} childNode
     * @param {string} childCssClass - only take childs with this CSS class into account
     */
    exports.getChildNodeIndex = function (container, childNode, childCssClass) {
        return Array.prototype.indexOf.call(
            Array.prototype.slice.call(container.childNodes)
                .filter(
                function (node) {
                    if (node.classList) {
                        return node.classList.contains(childCssClass);
                    }
                    return false;
                }), childNode);
    };

    /**
     * Moves Array element to new position.
     *
     * @param {number} old_index
     * @param {number} new_index
     */
    exports.arrayMoveItem = function (old_index, new_index) {
        if (new_index >= this.length) {
            var k = new_index - this.length;
            while ((k--) + 1) {
                this.push(undefined);
            }
        }
        this.splice(new_index, 0, this.splice(old_index, 1)[0]);
        return this; // for testing purposes
    };

    exports.guid = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    return exports;
});