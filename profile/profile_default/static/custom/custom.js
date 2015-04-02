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
                        .addClass("fa fa-paragraph add-cell-button")
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
                        .addClass("fa fa-terminal add-cell-button")
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

        // Add the sidebar
        $("body").append(
            $("<span></span>")
                .addClass("glyphicon glyphicon-ok sidebar-button")
                .attr("title", "Open GenePattern Options")
                .attr("data-toggle", "tooltip")
                .attr("data-placement", "right")
                .click(function() {
                    alert("Placeholder");
                })
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
            this.setElement(
                $("<div></div>")
                    .addClass("panel panel-default gp-widget gp-widget-auth")
                    .append(
                        $("<div></div>")
                            .addClass("panel-heading")
                            .append(
                                $("<h3></h3>")
                                    .addClass("panel-title")
                                    .append(
                                        $("<span></span>")
                                            .addClass("glyphicon glyphicon-th")
                                    )
                                    .append(" GenePattern Login")
                            )
                        )
                    .append(
                        $("<div></div>")
                            .addClass("panel-body")
                            .append("This is a placeholder for the authentication widget, which will by default appear at the top of a notebook. This widget allows authentication to be part of the workflow in a GenePattern Notebook. By making it part of the workflow we solve a problem in portability - namely, what happens if someone downloads their notebook and sends it to another user. Through this widget we can also expose the GPServer object, which is important for code cells making use of our Python library. We may decide to make this widget collapsed by default so as not to consume too much screen real estate for those who aren't interested.")
                    )
            );

            // Hide the code by default
            var element = this.$el;
            setTimeout(function() {
                element.closest(".cell").find(".input").hide();
            }, 1);

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