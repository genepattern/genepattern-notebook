/**
 * Define the IPython GenePattern Authentication widget
 *
 * @author Thorin Tabor
 * @requires - jQuery, navigation.js
 *
 * Copyright 2015-2016 The Broad Institute, Inc.
 *
 * SOFTWARE COPYRIGHT NOTICE
 * This software and its documentation are the copyright of the Broad Institute, Inc. All rights are reserved.
 * This software is supplied without any warranty or guaranteed support whatsoever. The Broad Institute is not
 * responsible for its use, misuse, or functionality.
 */

// Add shim to support Jupyter 3.x and 4.x
var Jupyter = Jupyter || IPython || {};

// Add file path shim for Jupyter 3/4
var STATIC_PATH = location.origin + Jupyter.contents.base_url + "nbextensions/genepattern/resources/";

define("gp_auth", ["jupyter-js-widgets",
                   "jqueryui",
                   STATIC_PATH + "gp.js",
                   STATIC_PATH + "navigation.js"], function (widgets) {

    $.widget("gp.auth", {
        options: {
            servers: [                                              // Expects a list of lists with [name, url] pairs
                ['Broad Institute', 'https://genepattern.broadinstitute.org/gp'],
                ['Indiana University', 'http://gp.indiana.edu/gp'],
                ['Broad Internal (Broad Institute Users Only)', 'https://gpbroad.broadinstitute.org/gp'],
                ['Custom GenePattern Server', 'Custom']
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
                                                .addClass("fa fa-minus")
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
                                .attr("src", STATIC_PATH + "GP_logo_on_black.png")
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
                                .append(
                                    $("<img />")
                                        .attr("src", STATIC_PATH + "loader.gif")
                                )
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
                                        .text("Log into GenePattern")
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
                                .append(" ")
                                .append(
                                    $("<button></button>")
                                        .addClass("btn btn-default")
                                        .text("Register an Account")
                                        .click(function() {
                                            var server = widget.element.find("[name=server]").val();
                                            var registerURL = server + "/pages/registerUser.jsf";
                                            window.open(registerURL,'_blank');
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

            // If a custom URL is specified in the code, add to server dropdown
            var customURL = widget._getCodeServerURL();
            if (customURL !== null && widget._isURLCustom(customURL)) {
                widget._setCustomURL(customURL);
            }

            // Call dialog if Custom Server selected
            serverSelect.change(function() {
                var selected = serverSelect.val();
                if (selected === "Custom") widget._selectCustomServer();
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

                    // Display the logged in message
                    // widget._displayLoggedIn();

                    // Hide the login form
                    widget.hideLoginForm();

                    // Display the system message, if available
                    widget.checkSystemMessage(function() {});
                }, 1);
            }

            // Trigger gp.widgetRendered event on cell element
            setTimeout(function() {
                widget.element.closest(".cell").trigger("gp.widgetRendered");
            }, 10);

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
         * Prompt the user for the URL to a custom GenePattern server
         *
         * @private
         */
        _selectCustomServer: function() {
            var widget = this;
            var dialog = require('base/js/dialog');
            var urlTextBox = $("<input class='form-control gp-custom-url' type='text' value='http://127.0.0.1:8080/gp'/>");
            dialog.modal({
                notebook: Jupyter.notebook,
                keyboard_manager: Jupyter.keyboard_manager,
                title : "Enter Custom GenePattern Server URL",
                body : $("<div></div>")
                            .append("Enter the URL to your custom GenePattern server below. Please use the full URL, " +
                                    "including http:// as well as any port numbers and the trailing /gp. For example: " +
                                    "https://genepattern.broadinstitute.org/gp")
                            .append($("<br/><br/>"))
                            .append($("<label style='font-weight: bold;'>Server URL </label>"))
                            .append(urlTextBox),
                buttons : {
                    "Cancel" : {},
                    "OK" : {
                        "class" : "btn-primary",
                        "click" : function() {
                            var url = urlTextBox.val();
                            url = widget._validateCustomURL(url);
                            widget._setCustomURL(url);
                        }
                    }
                }
            });

            // Allow you to type in your URL
            urlTextBox.focus(function() { Jupyter.keyboard_manager.disable(); });
            urlTextBox.blur(function() { Jupyter.keyboard_manager.enable(); });
        },

        /**
         * Attempt to correct an incorrectly entered GenePattern URL and return the corrected version
         *
         * @param url
         * @returns {string}
         * @private
         */
        _validateCustomURL: function(url) {
            var returnURL = url;
            // Check for http:// or https://
            var protocolTest = new RegExp("(^http\:\/\/)|(https\:\/\/)");
            if (!protocolTest.test(returnURL)) returnURL = "http://" + returnURL;

            // Check for trailing slash
            var slashTest = new RegExp("\/$");
            if (slashTest.test(returnURL)) returnURL = returnURL.slice(0, -1);

            // Check for /gp
            var gpTest = new RegExp("\/gp$");
            if (!gpTest.test(returnURL)) returnURL += "/gp";

            return returnURL;
        },

        /**
         * Sets the auth widget to have the specified custom GenePattern URL
         *
         * @private
         */
        _setCustomURL: function(url) {
            var widget = this;
            var serverSelect = widget.element.find("[name=server]");

            // Add custom option
            $("<option></option>")
                .val(url)
                .text(url)
                .insertBefore(serverSelect.find("option[value=Custom]"));

            // Select the custom option
            serverSelect.val(url);
        },

        /**
         * Returns the URL specified in the backing code
         *
         * @private
         */
        _getCodeServerURL: function() {
            var code = this.options.cell.code_mirror.getValue();
            var lines = code.split("\n");
            var serverLine = null;
            lines.forEach(function(line) {
                if (line.indexOf("gp.GPServer") >= 0) {
                    serverLine = line;
                }
            });

            // Found the line
            if (serverLine !== null) {
                var parts = serverLine.split("\"");
                return parts[1];
            }
            // Didn't find the line, return null
            else {
                return null;
            }
        },

        /**
         * Checks to see if the URLis in the server dropdown or not
         *
         * @param url
         * @private
         */
        _isURLCustom: function(url) {
            var widget = this;
            var serverSelect = widget.element.find("[name=server]");
            return serverSelect.find("option[value='" + url + "']").length === 0;
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
            messageBox.html(message);
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
                indicator.removeClass("fa-plus");
                indicator.addClass("fa-minus");
                this.element.find(".widget-code").slideUp();
            }
            else {
                toSlide.slideUp();
                indicator.removeClass("fa-minus");
                indicator.addClass("fa-plus");
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
                var collapsed = this.element.find(".widget-slide-indicator").find(".fa-plus").length > 0;
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
                        "&password=" + encodeURIComponent(password) + "&client_id=GenePatternNotebook-" + encodeURIComponent(username),
                cache: false,
                xhrFields: {
                    withCredentials: true
                },
                success: function(data) {
                    var token = data['access_token'];

                    $.ajaxSetup({
                        headers: {"Authorization": "Bearer " + token}
                    });

                    widget.afterAuthenticate(server, username, password, token, done);
                },
                error: function() {
                    widget.buildCode(server, "", "");
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
         * @param token
         * @param done
         */
        afterAuthenticate: function(server, username, password, token, done) {
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
                    GenePattern.server(server);
                    GenePattern.username = username;
                    GenePattern.password = password;
                    GenePattern.token = token;

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

                    // Populate the GenePattern._kinds map
                    var kindMap = GenePattern.linkKinds(data['kindToModules']);
                    GenePattern.notebook.removeKindVisualizers(kindMap);
                    GenePattern.kinds(kindMap);

                    // If a function to execute when done has been passed in, execute it
                    if (done) { done(); }
                },
                error: function() {
                    widget.errorMessage("Error loading server info");
                }
            });
        },

        /**
         * Returns a node with a feedback message and button, to be appended to the system message
         *
         * @param feedbackLink
         * @returns {*|jQuery|HTMLElement}
         */
        createFeedbackMessage: function(feedbackLink) {
            return $("<div></div>")
                .addClass("clearfix")
                .css("padding-top", "10px")
                .append(
                    $("<button></button>")
                        .addClass("btn btn-primary btn-lg pull-right")
                        .css("margin-left", "10px")
                        .text("Leave Feedback")
                        .click(function() {
                            window.location.href = feedbackLink;
                        })
                )
                .append(
                    $("<p></p>")
                        .addClass("lead")
                        .text("Experiencing a bug? Have thoughts on how to make GenePattern Notebook better? Let us know by leaving feedback.")
                )
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
                        var cleanMessage = $("<div></div>").html(data).text().trim();

                        var messageBlock = $("<div></div>");

                        // If there is a message
                        if (cleanMessage !== "") {
                            messageBlock.append(
                                $("<div></div>")
                                    .text(cleanMessage)
                            );
                            messageBlock.append("<hr/>");
                        }

                        // Append the feedback message
                        messageBlock.append(
                            widget.createFeedbackMessage("mailto:gp-help@broadinstitute.org?subject=GenePattern%20Notebook")
                        );

                        // Display the system message
                        widget.infoMessage(messageBlock);
                    }

                    // If a function to execute when done has been passed in, execute it
                    if (done) { done(); }
                },
                error: function() {
                    // Assume that the server is not a version that supports the system message call

                    // Attach the feedback messafe
                    var message = widget.createFeedbackMessage("mailto:gp-help@broadinstitute.org?subject=GenePattern%20Notebook");
                    widget.infoMessage(message);

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

    Jupyter.keyboard_manager.command_shortcuts.add_shortcut('Shift-d', {
        help : 'toggle dev servers',
        help_index : 'ee',
        handler : function () {
            GenePattern.notebook.toggleDev();
            return false;
        }}
    );

    // Method to enable dev servers from the auth widget
    GenePattern.notebook.toggleDev = function() {
        function addOptions() {
            $(".gp-widget-auth-form").find("[name=server]").each(function(i, select) {
                $(select)
                    .addClass("gp-widget-dev-on")
                    .append(
                        $("<option></option>")
                            .val("http://genepatternbeta.broadinstitute.org/gp")
                            .text("gpbeta")
                    )
                    .append(
                        $("<option></option>")
                            .val("http://gpdev.broadinstitute.org/gp")
                            .text("gpdev")
                    )
                    .append(
                        $("<option></option>")
                            .val("http://127.0.0.1:8080/gp")
                            .text("localhost")
                    )
            });
        }

        function removeOptions() {
            $(".gp-widget-auth-form").find("[name=server]").each(function(i, select) {
                $(select).removeClass("gp-widget-dev-on");
                $(select).find("option[value='http://genepatternbeta.broadinstitute.org/gp']").remove();
                $(select).find("option[value='http://gpdev.broadinstitute.org/gp']").remove();
                $(select).find("option[value='http://127.0.0.1:8080/gp']").remove();
            });
        }

        // Toggle
        var devOn = $(".gp-widget-auth-form").find("[name=server]").hasClass("gp-widget-dev-on");
        var devWord = devOn ? "off" : "on";
        if (devOn) removeOptions();
        else addOptions();

        // Show dialog
        var dialog = require('base/js/dialog');
        dialog.modal({
            notebook: Jupyter.notebook,
            keyboard_manager: this.keyboard_manager,
            title : "Development Options Toggled",
            body : "You have toggled development options " + devWord + " for GenePattern Notebook.",
            buttons : {
                "OK" : {}
            }
        });
    };

    var AuthWidgetView = widgets.DOMWidgetView.extend({
        render: function () {
            var cell = this.options.cell;

            // Check to see if this auth widget was manually created, if so replace with full code
            if (cell.code_mirror.getValue().indexOf("# !AUTOEXEC") === -1) {
                var code = GenePattern.notebook.init.buildCode("https://genepattern.broadinstitute.org/gp", "", "");
                cell.code_mirror.setValue(code);
                cell.execute();
            }

            // Render the view.
            this.setElement($('<div></div>'));
            $(this.$el).auth({
                cell: cell
            });

            // Hide the code by default
            var element = this.$el;
            setTimeout(function() {
                // Protect against the "double render" bug in Jupyter 3.2.1
                element.parent().find(".gp-widget-auth:not(:first-child)").remove();

                element.closest(".cell").find(".input")
                    .css("height", "0")
                    .css("overflow", "hidden");
            }, 1);
        }
    });

    return {
        AuthWidgetView: AuthWidgetView
    }
});