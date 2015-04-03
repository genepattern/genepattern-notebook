// Add the loading screen
$("body").append(
    $("<div></div>")
        .addClass("loading-screen")
        .append(
            $("<img/>")
                .attr("src", "/static/custom/GP_logo_on_black.png")
        )
        //.append("<br/>Loading...")
);

// Declare and attach the initialization function
function launch_init(evt) {
    // console.log("maybe launching", evt, launch_first_cell.executed, IPython.notebook.kernel && IPython.notebook.kernel.is_connected());
    if (!launch_init.done_init  && IPython.notebook.kernel) {
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

        // Auto-run widgets
        $(function () {
            $.each($(".cell"), function(index, val) {
                if ($(val).html().indexOf("# !AUTOEXEC") > -1) {
                    IPython.notebook.get_cell(index).execute();
                }
            });
        });

        // Hide the loading screen
        $(".loading-screen").toggle("fade");

        // Mark init as done
        launch_init.done_init = true;
    }
}
$([IPython.events]).on('kernel_ready.Kernel kernel_created.Session notebook_loaded.Notebook', launch_init);

/**
 * Define the IPython GenePattern Authentication widget
 */
require(["widgets/js/widget"], function (WidgetManager) {

    var AuthWidgetView = IPython.WidgetView.extend({
        render: function () {
            // Render the view.
            this.setElement(
                $("<div></div>")
                    .addClass("panel panel-primary gp-widget gp-widget-auth")
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
                            .append(
                                $("<div></div>")
                                    .addClass("form-group")
                                    .append(
                                        $("<label></label>")
                                            .attr("for", "server")
                                            .text("GenePattern Server")
                                    )
                                    .append(
                                        $("<select></select>")
                                            .addClass("form-control")
                                            .attr("name", "server")
                                            .attr("type", "text")
                                            .css("margin-left", "0")
                                            .append(
                                                $("<option></option>")
                                                    .attr("value", "http://genepattern.broadinstitute.org/gp")
                                                    .text("GenePattern @ Broad Institute")
                                            )
                                            .append(
                                                $("<option></option>")
                                                    .attr("value", "http://127.0.0.1:8080/gp")
                                                    .text("GenePattern @ localhost")
                                            )
                                    )
                            )
                            .append(
                                $("<div></div>")
                                    .addClass("form-group")
                                    .append(
                                        $("<label></label>")
                                            .attr("for", "username")
                                            .text("GenePattern Username")
                                    )
                                    .append(
                                        $("<input></input>")
                                            .addClass("form-control")
                                            .attr("name", "username")
                                            .attr("type", "text")
                                            .attr("placeholder", "Username")
                                    )
                            )
                            .append(
                                $("<div></div>")
                                    .addClass("form-group")
                                    .append(
                                        $("<label></label>")
                                            .attr("for", "password")
                                            .text("GenePattern Password")
                                    )
                                    .append(
                                        $("<input></input>")
                                            .addClass("form-control")
                                            .attr("name", "password")
                                            .attr("type", "password")
                                            .attr("placeholder", "Password")
                                    )
                            )
                            .append(
                                $("<button></button>")
                                    .addClass("btn btn-default gp-auth-button")
                                    .text("Login")
                            )
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