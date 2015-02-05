define(function(){
    var exports = {};
    
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
    
    return exports;
});