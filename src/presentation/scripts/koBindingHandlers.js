/**
 * Sets background color to the element
 * depending on project tag found in the description.
 * Binding properties:
 *  @Description - task description;
 *  @Tags - array of project tag definitions (objects - {Tag, Color});
 *  @DefaultTag (optional) - default project tag
 *                           to associate with task if no tag was found in description;
 */
ko.bindingHandlers.projectAssignment = {
    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var value = valueAccessor();

        var description = value.Description();
        var tags = value.Tags;
        var defaultTag = value.DefaultTag;

        // Check arguments.
        if (!description || !tags || tags.length < 1) {
            return;
        }

        // Find project tag to associate this description with.
        var tagFound = false;
        tags.forEach(function(tag) {
            if (description.indexOf(tag.Tag) != -1) {
                $(element).css({'background-color': tag.Color });
                tagFound = true;
                return true;
            }
        });

        // Set default project tag.
        if (!tagFound && defaultTag) {
            tags.forEach(function(tag) {
                if (tag.Tag == defaultTag ) {
                    $(element).css({'background-color': tag.Color });
                    return true;
                }
            });
        }
    }
}