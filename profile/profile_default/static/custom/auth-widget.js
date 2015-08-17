/**
 * Define the IPython GenePattern Authentication widget
 */
require(["widgets/js/widget", "widgets/js/manager", "jqueryui"], function (widget, manager) {
    $.widget("gp.auth", {
        options: {
            servers: [                                              // Expects a list of lists with [name, url] pairs
                ['GenePattern @ localhost', 'http://127.0.0.1:8080/gp'],
                ['GenePattern @ Broad Institute', 'http://genepattern.broadinstitute.org/gp'],
                ['GenePattern @ gpbeta', 'http://genepatternbeta.broadinstitute.org/gp']
            ],
            cell: null                                              // Reference to the IPython cell
        },

        /**
         * Constructor
         *
         * @private
         */
        _create: function() {
            var widget = this;

            // Add data pointer
            this.element.data("widget", this);

            // Render the view.
            this.element
                .addClass("panel panel-primary gp-widget gp-widget-auth")
                .append(
                    $("<div></div>")
                        .addClass("panel-heading")
                        .append(
                            $("<div></div>")
                                .addClass("widget-float-right")
                                .append(
                                    $("<span></span>")
                                        .addClass("widget-server-label")
                                        .append(widget.getServerLabel(""))
                                )
                                .append(
                                    $("<button></button>")
                                        .addClass("btn btn-default btn-sm widget-slide-indicator")
                                        .css("padding", "2px 7px")
                                        .attr("title", "Expand or Collapse")
                                        .attr("data-toggle", "tooltip")
                                        .attr("data-placement", "bottom")
                                        .append(
                                            $("<span></span>")
                                                .addClass("fa fa-arrow-up")
                                        )
                                        .tooltip()
                                        .click(function() {
                                            widget.expandCollapse();
                                        })
                                )
                                .append(" ")
                                .append(
                                    $("<button></button>")
                                        .addClass("btn btn-default btn-sm")
                                        .css("padding", "2px 7px")
                                        .attr("title", "Toggle Code View")
                                        .attr("data-toggle", "tooltip")
                                        .attr("data-placement", "bottom")
                                        .append(
                                            $("<span></span>")
                                                .addClass("fa fa-terminal")
                                        )
                                        .tooltip()
                                        .click(function() {
                                            widget.toggleCode();
                                        })
                                )
                        )
                        .append(
                            $("<img/>")
                                .addClass("gp-widget-logo")
                                .attr("src", "/static/custom/GP_logo_on_black.png")
                        )
                        .append(
                            $("<h3></h3>")
                                .addClass("panel-title")
                                .append(
                                    $("<span></span>")
                                        .addClass("widget-username-label")
                                        .append(widget.getUserLabel("Login"))
                                )
                        )
                    )
                .append(
                    $("<div></div>")
                        .addClass("panel-body widget-code")
                        .css("display", "none")
                )
                .append(
                    $("<div></div>")
                        .addClass("panel-body widget-view")
                        .append(
                            $("<div></div>")
                                .addClass("gp-widget-loading")
                                .append("<img src='/static/custom/loader.gif' />")
                                .hide()
                        )
                        .append(
                            $("<div></div>")
                                .addClass("gp-widget-logged-in")
                                .append(
                                    $("<div></div>")
                                        .text("You are already logged in.")
                                        .append($("<br/>"))
                                        .append(
                                            $("<button></button>")
                                                .text("Login Again")
                                                .addClass("btn btn-warning btn-lg")
                                                .click(function() {
                                                    widget.element.find(".gp-widget-logged-in").hide();
                                                })
                                        )
                                )
                                .hide()
                        )
                        .append(
                            $("<div></div>")
                                .addClass("alert gp-widget-auth-message")
                                .hide()
                        )
                        .append(
                            $("<div></div>")
                                .addClass("gp-widget-auth-form")
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
                                            $("<input/>")
                                                .addClass("form-control")
                                                .attr("name", "username")
                                                .attr("type", "text")
                                                .attr("placeholder", "Username")
                                                .attr("required", "required")
                                                .val(widget.getUserLabel(""))
                                                .keyup(function (e) {
                                                    if (e.keyCode == 13) {
                                                        widget._enterPressed();
                                                    }
                                                })
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
                                            $("<input/>")
                                                .addClass("form-control")
                                                .attr("name", "password")
                                                .attr("type", "password")
                                                .attr("placeholder", "Password")
                                                .val(widget.getPasswordLabel(""))
                                                .keyup(function (e) {
                                                    if (e.keyCode == 13) {
                                                        widget._enterPressed();
                                                    }
                                                })
                                        )
                                )
                                .append(
                                    $("<button></button>")
                                        .addClass("btn btn-primary gp-auth-button")
                                        .text("Login to GenePattern")
                                        .click(function() {
                                            var server = widget.element.find("[name=server]").val();
                                            var username = widget.element.find("[name=username]").val();
                                            var password = widget.element.find("[name=password]").val();

                                            // Display the loading animation
                                            widget._displayLoading();

                                            widget.buildCode(server, username, password);
                                            widget.authenticate(server, username, password, function() {
                                                widget.executeCell();
                                                widget.buildCode(server, "", "");
                                            });
                                        })
                                )
                        )
            );

            // Add servers to select
            var serverSelect = this.element.find("[name=server]");
            $.each(this.options.servers, function(i, e) {
                serverSelect.append(
                    $("<option></option>")
                        .attr("value", e[1])
                        .text(e[0])
                );
            });

            // Hide the code by default
            var element = this.element;
            setTimeout(function() {
                element.closest(".cell").find(".input")
                    .css("height", "0")
                    .css("overflow", "hidden");
            }, 1);

            // Hide the login form if already authenticated
            if (GenePattern.authenticated) {
                setTimeout(function() {
                    element.find(".panel-body").hide();
                    var indicator = element.find(".widget-slide-indicator").find("span");
                    indicator.removeClass("fa-arrow-up");
                    indicator.addClass("fa-arrow-down");

                    // Display the logged in message
                    // widget._displayLoggedIn();

                    // Hide the login form
                    widget.hideLoginForm();

                    // Display the system message, if available
                    widget.checkSystemMessage(function() {});
                }, 1);
            }

            return this;
        },

        /**
         * Destructor
         *
         * @private
         */
        _destroy: function() {
            this.element.removeClass("gp-widget-job-widget");
            this.element.empty();
        },

        /**
         * Update all options
         *
         * @param options - Object contain options to update
         * @private
         */
        _setOptions: function(options) {
            this._superApply(arguments);
        },

        /**
         * Update for single options
         *
         * @param key - The name of the option
         * @param value - The new value of the option
         * @private
         */
        _setOption: function(key, value) {
            this._super(key, value);
        },

        /**
         * Display the loading animation
         *
         * @private
         */
        _displayLoading: function() {
            this.hideMessage();
            this.element.find(".gp-widget-loading").show();
        },

        _displayLoggedIn: function() {
            this.element.find(".gp-widget-loading").hide();
            this.element.find(".gp-widget-logged-in").show();
        },

        /**
         * Hide the success or error message
         */
        hideMessage: function() {
            this.element.find(".gp-widget-auth-message").hide();
        },

        hideLoginForm: function() {
            this.element.find(".gp-widget-auth-form").hide();
        },

        /**
         * Show a success message to the user
         *
         * @param message - String containing the message to show
         */
        successMessage: function(message) {
            // Get into the correct view
            var code = this.element.find(".widget-code");
            var view = this.element.find(".widget-view");
            view.slideDown();
            code.slideUp();

            // Hide the loading message & logged in
            this.element.find(".gp-widget-loading").hide();
            this.element.find(".gp-widget-logged-in").hide();

            // Display the message
            var messageBox = this.element.find(".gp-widget-auth-message");
            messageBox.removeClass("alert-danger");
            messageBox.removeClass("alert-info");
            messageBox.addClass("alert-success");
            messageBox.text(message);
            messageBox.show("shake", {}, 500);
        },

        /**
         * Display an error message in the job widget
         *
         * @param message - String containing the message to show
         */
        errorMessage: function(message) {
            // Get into the correct view
            var code = this.element.find(".widget-code");
            var view = this.element.find(".widget-view");
            view.slideDown();
            code.slideUp();

            // Hide the loading message & logged in
            this.element.find(".gp-widget-loading").hide();
            this.element.find(".gp-widget-logged-in").hide();

            // Display the error
            var messageBox = this.element.find(".gp-widget-auth-message");
            messageBox.removeClass("alert-success");
            messageBox.removeClass("alert-info");
            messageBox.addClass("alert-danger");
            messageBox.text(message);
            messageBox.show("shake", {}, 500);
        },

        /**
         * Show an info message to the user
         *
         * @param message - String containing the message to show
         */
        infoMessage: function(message) {
            // Get into the correct view
            var code = this.element.find(".widget-code");
            var view = this.element.find(".widget-view");
            view.slideDown();
            code.slideUp();

            // Hide the loading message & logged in
            this.element.find(".gp-widget-loading").hide();
            this.element.find(".gp-widget-logged-in").hide();

            // Display the message
            var messageBox = this.element.find(".gp-widget-auth-message");
            messageBox.removeClass("alert-danger");
            messageBox.removeClass("alert-success");
            messageBox.addClass("alert-info");
            messageBox.text(message);
            messageBox.show();
        },

        /**
         * Click the login button if the enter key is pressed
         *
         * @private
         */
        _enterPressed: function() {
            this.element.find(".gp-auth-button").trigger("click");
        },

        expandCollapse: function() {
            var toSlide = this.element.find(".panel-body.widget-view");
            var indicator = this.element.find(".widget-slide-indicator").find("span");
            if (toSlide.is(":hidden")) {
                toSlide.slideDown();
                indicator.removeClass("fa-arrow-down");
                indicator.addClass("fa-arrow-up");
                this.element.find(".widget-code").slideUp();
            }
            else {
                toSlide.slideUp();
                indicator.removeClass("fa-arrow-up");
                indicator.addClass("fa-arrow-down");
            }
        },

        toggleCode: function() {
            var code = this.element.find(".widget-code");
            var view = this.element.find(".widget-view");

            if (code.is(":hidden")) {
                this.options.cell.code_mirror.refresh();
                var raw = this.element.closest(".cell").find(".input").html();
                code.html(raw);

                // Fix the issue where the code couldn't be selected
                code.find(".CodeMirror-scroll").attr("draggable", "false");

                // Fix the issue with the bogus scrollbars
                code.find(".CodeMirror-hscrollbar").remove();
                code.find(".CodeMirror-vscrollbar").remove();
                code.find(".CodeMirror-sizer").css("min-width", "").css("overflow", "auto");

                view.slideUp();
                code.slideDown();
            }
            else {
                // If normally collapsed
                var collapsed = $(".widget-slide-indicator").find(".fa-arrow-down").length > 0;
                if (collapsed) {
                    code.slideUp();
                }
                // If otherwise expanded
                else {
                    view.slideDown();
                    code.slideUp();
                }
            }
        },

        buildCode: function(server, username, password) {
            var code = GenePattern.notebook.init.buildCode(server, username, password);
            this.options.cell.code_mirror.setValue(code);
        },

        executeCell: function() {
            this.options.cell.execute();
        },

        /**
         * Call the authentication endpoint, then call afterAuthenticate();
         *
         * @param server
         * @param username
         * @param password
         * @param done
         */
        authenticate: function(server, username, password, done) {
            var widget = this;
            $.ajax({
                type: "POST",
                url: server + "/rest/v1/oauth2/token?grant_type=password&username=" + encodeURIComponent(username) +
                        "&password=" + encodeURIComponent(password) + "&client_id=GenePatternNotebook",
                cache: false,
                xhrFields: {
                    withCredentials: true
                },
                success: function(data) {
                    var token = data['access_token'];

                    $.ajaxSetup({
                        headers: {"Authorization": "Bearer " + token}
                    });

                    widget.afterAuthenticate(server, username, password, done);
                },
                error: function() {
                    widget.errorMessage("Error authenticating");
                }
            });
        },

        /**
         * Assumes the authenticate endpoint has already been called,
         * then does all the other stuff needed for authentication
         *
         * @param server
         * @param username
         * @param password
         * @param done
         */
        afterAuthenticate: function(server, username, password, done) {
            var widget = this;
            $.ajax({
                type: "GET",
                url: server + "/rest/v1/tasks/all.json",
                dataType: 'json',
                cache: false,
                xhrFields: {
                    withCredentials: true
                },
                success: function(data) {
                    // Set the authentication info on GenePattern object
                    GenePattern.authenticated = true;
                    GenePattern.setServer(server);
                    GenePattern.username = username;
                    GenePattern.password = password;

                    // Make authenticated UI changes to auth widget
                    widget.element.find(".widget-username-label").text(username);
                    widget.element.find(".widget-server-label").text(server);

                    // Enable authenticated nav elsewhere in notebook
                    GenePattern.notebook.authenticate(data);

                    // Populate the GenePattern._tasks list
                    if (data['all_modules']) {
                        $.each(data['all_modules'], function(index, module) {
                            GenePattern._tasks.push(new GenePattern.Task(module));
                        });
                    }

                    // If a function to execute when done has been passed in, execute it
                    if (done) { done(); }
                },
                error: function() {
                    widget.errorMessage("Error loading server info");
                }
            });
        },

        /**
         * Checks the system message and displays the message, if one is found
         * Calls the done() method regardless of success or error
         *
         * @param done
         */
        checkSystemMessage: function(done) {
            var widget = this;
            $.ajax({
                type: "GET",
                url: GenePattern.server() + "/rest/v1/config/system-message",
                dataType: 'html',
                cache: false,
                xhrFields: {
                    withCredentials: true
                },
                success: function(data) {
                    // Display if the system message is not blank
                    if (data !== "") {
                        // Strip data of HTML
                        var cleanMessage = $("<div></div>").html(data).text();

                        // Display the system message
                        widget.infoMessage(cleanMessage);
                    }

                    // If a function to execute when done has been passed in, execute it
                    if (done) { done(); }
                },
                error: function() {
                    // Assume that the server is not a version that supports the system message call

                    // If a function to execute when done has been passed in, execute it
                    if (done) { done(); }
                }
            });
        },

        getUserLabel: function(alt) {
            if (GenePattern.authenticated && GenePattern.username) {
                return GenePattern.username;
            }
            else {
                return alt
            }
        },

        getPasswordLabel: function(alt) {
            if (GenePattern.authenticated && GenePattern.password) {
                return GenePattern.password;
            }
            else {
                return alt
            }
        },

        getServerLabel: function(alt) {
            if (GenePattern.authenticated && GenePattern._server) {
                return GenePattern._server;
            }
            else {
                return alt
            }
        }
    });


    var AuthWidgetView = widget.DOMWidgetView.extend({
        render: function () {
            var cell = this.options.cell;

            // Double check to make sure that this is the correct cell
            if ($(cell.element).hasClass("running")) {
                // Check to see if this auth widget was manually created, if so replace with full code
                if (cell.code_mirror.getValue().indexOf("# !AUTOEXEC") === -1) {
                    var code = GenePattern.notebook.init.buildCode("http://genepattern.broadinstitute.org/gp", "", "");
                    cell.code_mirror.setValue(code);
                    cell.execute();
                }

                // Render the view.
                this.setElement($('<div></div>'));
                this.$el.auth({
                    cell: this.options.cell
                });

                // Hide the code by default
                var element = this.$el;
                setTimeout(function() {
                    element.closest(".cell").find(".input")
                        .css("height", "0")
                        .css("overflow", "hidden");
                }, 1);
            }
        }
    });

    // Register the JobWidgetView with the widget manager.
    manager.WidgetManager.register_widget_view('AuthWidgetView', AuthWidgetView);
});