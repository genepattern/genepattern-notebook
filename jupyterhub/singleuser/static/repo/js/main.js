var repo_events_init = false;

require([
    'base/js/namespace',
    'jquery'], function(IPython, $) {
    "use strict";

    // Load css
    $('head').append(
        $('<link rel="stylesheet" type="text/css" />')
            .attr("rel", "stylesheet")
            .attr("type", "text/css")
            .attr('href', '/static/repo/css/repo.css')
    );

    // Function to call when sharing a notebook
    function share_selected() {
        alert("WORKS!");
    }

    // Bind events for action buttons.
    $('.share-button').click($.proxy(share_selected, this));

    // Function to call when the file list selection has changed
    function selection_changed() {
        var selected = [];
        var has_running_notebook = false;
        var has_directory = false;
        var has_file = false;
        var checked = 0;
        $('.list_item :checked').each(function(index, item) {
            var parent = $(item).parent().parent();

            // If the item doesn't have an upload button, isn't the
            // breadcrumbs and isn't the parent folder '..', then it can be selected.
            // Breadcrumbs path == ''.
            if (parent.find('.upload_button').length === 0 && parent.data('path') !== '') {
                checked++;
                selected.push({
                    name: parent.data('name'),
                    path: parent.data('path'),
                    type: parent.data('type')
                });

                // Set flags according to what is selected.  Flags are later
                // used to decide which action buttons are visible.
                has_file = has_file || (parent.data('type') === 'file');
                has_directory = has_directory || (parent.data('type') === 'directory');
            }
        });

        // Sharing isn't visible when a directory or file is selected.
        // To allow sharing multiple notebooks at once: selected.length > 0 && !has_directory && !has_file
        if (selected.length == 1 && !has_directory && !has_file) {
            $('.share-button').css('display', 'inline-block');
        }
        else {
            $('.share-button').css('display', 'none');
        }
    }

    $(document).click(function() {
        selection_changed();
    });

    // TODO: FIXME hard-coded sharing list for testing purposes
    var public_notebooks = ['/notebooks/CKEditor.ipynb', '/notebooks/GenePattern%20Files%20in%20Python.ipynb', '/notebooks/GenePattern%20Python%20Tutorial.ipynb'];

    // Attach the repository events if they haven't already been initialized
    if (!repo_events_init) {
        // Mark repo events as initialized
        repo_events_init = true;

        // When the files list is refreshed
        $([Jupyter.events]).on('draw_notebook_list.NotebookList', function() {
            $("a.item_link").each(function(i, element) {
                // If a notebook matches a path in the shared list
                if (public_notebooks.indexOf($(element).attr("href")) >= 0) {
                    // Add a shared icon to it
                    $(element).parent().find('.item_buttons').append(
                        $('<i class="item_icon icon-fixed-width fa fa-share-square pull-right"></i>')
                    )
                }
            })
        });
    }
});