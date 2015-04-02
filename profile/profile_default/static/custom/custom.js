// Necessary because jQuery isn't imported until after the custom HTML
setTimeout(function() { 
	$(document).ready(function() {
        // Change the logo
		$("#ipython_notebook").find("img").attr("src", "/static/custom/GP_logo_on_black.png");

        // Add the bottom buttons
        $("#notebook-container").append(
            $("<div></div>")
                .addClass("container add-cell-container")
                .append(
                    $("<span></span>")
                        .addClass("glyphicon glyphicon-pencil add-cell-button")
                        .attr("title", "Add Markdown Cell")
                        .attr("data-toggle", "tooltip")
                        .attr("data-placement", "top")
                        .click(function() {
                            var index = IPython.notebook.get_cells().length;
                            IPython.notebook.insert_cell_below('markdown', index);
                            IPython.notebook.select_next();
                        })
                )
                .append(
                    $("<span></span>")
                        .addClass("glyphicon glyphicon-list-alt add-cell-button")
                        .attr("title", "Add Code Cell")
                        .attr("data-toggle", "tooltip")
                        .attr("data-placement", "top")
                        .click(function() {
                            var index = IPython.notebook.get_cells().length;
                            IPython.notebook.insert_cell_below('code', index);
                            IPython.notebook.select_next();
                        })
                )
                .append(
                    $("<span></span>")
                        .addClass("glyphicon glyphicon-th add-cell-button")
                        .attr("title", "Add GenePattern Cell")
                        .css("padding-left", "3px")
                        .attr("data-toggle", "tooltip")
                        .attr("data-placement", "top")
                )
        );

        // Initialize tooltips
        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        });
	});
}, 100);

/**
 * Define the IPython GenePattern Authentication widget
 */
require(["widgets/js/widget"], function (WidgetManager) {

    var AuthWidgetView = IPython.WidgetView.extend({
        render: function () {
            // Render the view.
            this.setElement($('<div/>OK</div>'));
            //var json = this.model.get('json');
            //this.$el.jobResults({
            //    json: json
            //});
        },

        events: {
            // List of events and their handlers.
            'click': 'handle_click'
        },

        handle_click: function (evt) {
            console.log("Clicked!");
        }
    });

    // Register the JobWidgetView with the widget manager.
    IPython.WidgetManager.register_widget_view('AuthWidgetView', AuthWidgetView);
});

/**
 * Define the IPython GenePattern Job widget
 */
require(["widgets/js/widget"], function (WidgetManager) {

    var JobWidgetView = IPython.WidgetView.extend({
        render: function () {
            // Render the view.
            this.setElement($('<div/></div>'));
            var json = this.model.get('json');
            this.$el.jobResults({
                json: json
            });
        },

        events: {
            // List of events and their handlers.
            'click': 'handle_click'
        },

        handle_click: function (evt) {
            console.log("Clicked!");
        }
    });

    // Register the JobWidgetView with the widget manager.
    IPython.WidgetManager.register_widget_view('JobWidgetView', JobWidgetView);
});