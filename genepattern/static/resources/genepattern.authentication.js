/**
 * Define the GenePattern Authentication widget
 *
 * @author Thorin Tabor
 * @requires - jQuery, genepattern.navigation.js
 *
 * Copyright 2015-2020 Regents of the University of California & The Broad Institute
 */

/**
 *  Expects a list of lists with [name, url] pairs
 *  Configure this list to change what users see
 *  The top option is the default for the server
 *  Remove the 'Custom GenePattern Server' option to disallow custom servers
 */
const GENEPATTERN_SERVERS = [
    ['GenePattern Cloud', 'https://cloud.genepattern.org/gp'],
    ['Custom GenePattern Server', 'Custom']
];

define("genepattern/authentication", ["base/js/namespace",
                                      "nbextensions/jupyter-js-widgets/extension",
                                      "nbtools",
                                      "genepattern/navigation",
                                      "genepattern",
                                      "jquery",
                                      "nbtools/utils"], function (Jupyter, widgets, NBToolManager, GPNotebook, gp, $, Utils) {

    $.widget("gp.auth", {
        options: {
            // List of GenePattern servers to appear in the menu
            servers: GENEPATTERN_SERVERS,

            // GenePattern session
            session: null,

            // Reference to the Jupyter cell
            cell: null
        },

        /**
         * Constructor
         *
         * @private
         */
        _create: function() {
            const widget = this;

            // Add data pointer
            this.element.data("widget", this);

            // Render the view.
            this.element
                .addClass("panel panel-primary nbtools-widget gp-widget gp-widget-auth")
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
                                    $("<div></div>")
                                        .addClass("btn-group")
                                        .append(
                                            $("<button></button>")
                                                .addClass("btn btn-default btn-sm")
                                                .css("padding", "2px 7px")
                                                .attr("type", "button")
                                                .attr("data-toggle", "dropdown")
                                                .attr("aria-haspopup", "true")
                                                .attr("aria-expanded", "false")
                                                .append(
                                                    $("<span></span>")
                                                        .addClass("fa fa-cog")
                                                )
                                                .append(" ")
                                                .append(
                                                    $("<span></span>")
                                                        .addClass("caret")
                                                )
                                        )
                                        .append(
                                            $("<ul></ul>")
                                                .addClass("dropdown-menu")
                                                .append(
                                                    $("<li></li>")
                                                        .append(
                                                            $("<a></a>")
                                                                .attr("title", "Run Notebook as Workflow")
                                                                .attr("href", "#")
                                                                .append("Run Workflow")
                                                                .click(function() {
                                                                    WorkflowQueue.launch();
                                                                })
                                                        )
                                                )
                                                .append(
                                                    $("<li></li>")
                                                        .append(
                                                            $("<a></a>")
                                                                .attr("title", "Toggle Code View")
                                                                .attr("href", "#")
                                                                .append("Toggle Code View")
                                                                .click(function() {
                                                                    widget.toggle_code();
                                                                })
                                                        )
                                                )
                                        )
                                )
                        )
                        .append(
                            $("<img/>")
                                .addClass("gp-widget-logo")
                                .attr("src", Jupyter.notebook.base_url + "nbextensions/genepattern/resources/" + "gp-logo.png")
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
                        .addClass("panel-body widget-view")
                        .append(
                            $("<div></div>")
                                .addClass("gp-widget-loading")
                                .append(
                                    $("<img />")
                                        .attr("src", Jupyter.notebook.base_url + "nbextensions/genepattern/resources/" + "loading.gif")
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
                                                .keyup(function (e) {
                                                    if (e.keyCode === 13) {
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
                                                .val("")
                                                .keyup(function (e) {
                                                    if (e.keyCode === 13) {
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
                                            const server = widget.element.find("[name=server]").val();
                                            const username = widget.element.find("[name=username]").val();
                                            const password = widget.element.find("[name=password]").val();

                                            // Display the loading animation
                                            widget._displayLoading();

                                            widget.build_code(server, username, password);
                                            widget.authenticate(server, username, password, true, function() {
                                                widget.sync_sessions();
                                                widget.executeCell();
                                                widget.build_code(server, "", "");
                                                widget._tokenCountdown(server, username, password);
                                            });
                                        })
                                )
                                .append(" ")
                                .append(
                                    $("<button></button>")
                                        .addClass("btn btn-default")
                                        .text("Register an Account")
                                        .click(function() {
                                            const server = widget.element.find("[name=server]").val();
                                            const registerURL = server + "/pages/registerUser.jsf";
                                            window.open(registerURL,'_blank');
                                        })
                                )
                        )
            );

            // Add servers to select
            const serverSelect = this.element.find("[name=server]");
            $.each(this.options.servers, function(i, e) {
                const disable = GPNotebook.session_manager.get_session(e[1]) !== null;
                serverSelect.append(
                    $("<option></option>")
                        .attr("value", e[1])
                        .prop("disabled", disable)
                        .text(e[0])
                );
            });

            // If a custom URL is specified in the code, add to server dropdown
            const serverURL = widget._getCodeServerURL();
            if (serverURL !== null && widget._isURLCustom(serverURL)) {
                widget._setCustomURL(serverURL);
            }
            else {
                // Special case for notebooks that still point to the old production server
                if (serverURL.endsWith("genepattern.broadinstitute.org/gp")) {
                    widget.infoMessage("Your server selection has been changed to the GenePattern Cloud.");
                    serverSelect.find("option[value='https://cloud.genepattern.org/gp']").attr("selected", "selected");
                }

                // Set the server dropdown to the last used server
                else serverSelect.find("option[value='" + serverURL + "']").attr("selected", "selected")
            }

            // Call dialog if Custom Server selected
            serverSelect.change(function() {
                const selected = serverSelect.val();
                if (selected === "Custom") widget._selectCustomServer();
            });

            // Hide the code by default
            const element = this.element;
            const hideCode = function() {
                const cell = element.closest(".cell");
                if (cell.length > 0) {
                    element.closest(".cell").find(".input").hide();
                }
                else {
                    setTimeout(hideCode, 10);
                }
            };
            setTimeout(hideCode, 1);

            // Make calls that need run after the element has been inserted into the DOM
            setTimeout(function() {
                // Get the server URL from the code
                const server_url = widget._getCodeServerURL();

                // Grab matching session, if one is available and session is not set
                if (!widget.options.session) {
                    widget.options.session = GPNotebook.session_manager.get_session(server_url);
                }

                // Hide the login form if already authenticated and no other matching login
                const authenticated = widget.options.session !== null && widget.options.session.authenticated;
                const only_matching_login = $(".widget-server-label:contains('" + server_url + "')").length === 0;
                if (authenticated && only_matching_login) {
                    element.find(".panel-body").hide();
                    const indicator = element.find(".widget-slide-indicator").find("span");

                    // Hide the login form
                    widget.hideLoginForm();

                    // Display the system message, if available
                    widget.checkSystemMessage(function() {});
                }

                // Display username and server URL in header if authenticated
                if (widget.options.session !== null && widget.options.session.authenticated) {
                    widget.element.find(".widget-username-label").text(widget.getUserLabel(""));
                    widget.element.find(".widget-server-label").text(widget.getServerLabel(""));
                }

                // Apply server color scheme if authenticated
                if (widget.options.session !== null && widget.options.session.authenticated) {
                    GPNotebook.slider.apply_colors(widget.element, widget.options.session.server());
                }

                // Try reading GenePattern cookie and prompt, if cookie present and not authenticated
                const genepatternCookie = widget._getCookie("GenePattern");
                const public_server_selected = serverSelect.val() === GENEPATTERN_SERVERS[0][1];
                if (genepatternCookie && widget.options.session === null && public_server_selected) {
                    const username = widget._usernameFromCookie(genepatternCookie);
                    const password = widget._passwordFromCookie(genepatternCookie);

                    if (username !== null && password !== null) {
                        const toCover = widget.element.find(".widget-view");
                        const autoLogin = $("<div></div>")
                            .addClass("widget-auto-login")
                            .append(
                                $("<div></div>")
                                    .addClass("panel panel-default gp-cookie-login")
                                    .append(
                                        $("<div></div>")
                                            .addClass("panel-heading")
                                            .append("Log into GenePattern Server")
                                    )
                                    .append(
                                        $("<div></div>")
                                            .addClass("panel-body")
                                            .append("You have already authenticated with GenePattern Cloud. Would you like to automatically sign in now?")
                                            .append(
                                                $("<div></div>")
                                                    .addClass("widget-auto-login-buttons")
                                                    .append(
                                                        $("<button>")
                                                            .addClass("btn btn-primary")
                                                            .append("Login as " + username)
                                                            .click(function () {
                                                                const serverInput = toCover.find("[name=server]");
                                                                const usernameInput = toCover.find("[name=username]");
                                                                const passwordInput = toCover.find("[name=password]");
                                                                const loginButton = toCover.find(".gp-auth-button");
                                                                const defaultServer = GENEPATTERN_SERVERS[0][1];

                                                                serverInput.val(defaultServer);
                                                                usernameInput.val(username);
                                                                passwordInput.val(password);
                                                                loginButton.click();
                                                            })
                                                    )
                                                    .append(" ")
                                                    .append(
                                                        $("<button>")
                                                            .addClass("btn btn-default")
                                                            .append("Cancel")
                                                            .click(function () {
                                                                autoLogin.hide();
                                                            })
                                                    )
                                            )
                                    )
                            );

                        toCover.append(autoLogin);
                    }

                }

            }, 1);

            // Trigger gp.widgetRendered event on cell element
            setTimeout(function() {
                widget.element.closest(".cell").trigger("nbtools.widget_rendered");
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
         * Set timer for next token refresh.
         * Call upon successful login.
         * Check every minute to see if the token is going to expire.
         *
         * @param server
         * @param username
         * @param password
         * @private
         */
        _tokenCountdown: function(server, username, password) {
            const widget = this;

            // Set time of successful login
            let tokenExpiration = new Date();
            tokenExpiration.setDate(tokenExpiration.getDate() + 1);

            // Wake up every minute and check to see if the token is going to expire
            setInterval(function() {
                // Refresh token five minutes before the old one would expire
                if (new Date().valueOf() >= tokenExpiration.valueOf() - 1000 * 60 * 5) {
                    widget.authenticate(server, username, password, false, function(token) {
                        tokenExpiration = new Date();
                        tokenExpiration.setDate(tokenExpiration.getDate() + 1);
                    });
                }
            }, 1000 * 60);
        },

        /**
         * Given the GenePattern cookie, returns the password
         * Return null if the password cannot be extracted
         *
         * @param cookie
         * @returns {string|null}
         * @private
         */
        _passwordFromCookie: function(cookie) {
            // Handle the null case
            if (!cookie) return null;

            // Parse the cookie
            const parts = cookie.split("|");
            if (parts.length > 1) {
                return atob(decodeURIComponent(parts[1]));
            }

            // Cookie not in the expected format
            else return null;
        },

        /**
         * Given the GenePattern cookie, returns the username
         * Return null if the username cannot be extracted
         *
         * @param cookie
         * @returns {string|null}
         * @private
         */
        _usernameFromCookie: function(cookie) {
            // Handle the null case
            if (!cookie) return null;

            // Parse the cookie
            const parts = cookie.split("|");
            if (parts.length > 1) return parts[0];

            // Cookie not in the expected format
            else return null;
        },

        /**
         * Retrieve a cookie by name
         *
         * @param name
         * @returns {string|null}
         * @private
         */
        _getCookie: function(name) {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        },

        /**
         * Prompt the user for the URL to a custom GenePattern server
         *
         * @private
         */
        _selectCustomServer: function() {
            const widget = this;
            const dialog = require('base/js/dialog');
            const urlTextBox = $("<input class='form-control gp-custom-url' type='text' value='http://127.0.0.1:8080/gp'/>");
            dialog.modal({
                notebook: Jupyter.notebook,
                keyboard_manager: Jupyter.keyboard_manager,
                title : "Enter Custom GenePattern Server URL",
                body : $("<div></div>")
                            .append("Enter the URL to your custom GenePattern server below. Please use the full URL, " +
                                    "including http:// as well as any port numbers and the trailing /gp. For example: " +
                                    "https://cloud.genepattern.org/gp")
                            .append($("<br/><br/>"))
                            .append($("<label style='font-weight: bold;'>Server URL </label>"))
                            .append(urlTextBox),
                buttons : {
                    "Cancel" : {},
                    "OK" : {
                        "class" : "btn-primary",
                        "click" : function() {
                            let url = urlTextBox.val();
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
            let returnURL = url;
            // Check for http:// or https://
            const protocolTest = new RegExp("(^http\:\/\/)|(https\:\/\/)");
            if (!protocolTest.test(returnURL)) returnURL = "http://" + returnURL;

            // Check for trailing slash
            const slashTest = new RegExp("\/$");
            if (slashTest.test(returnURL)) returnURL = returnURL.slice(0, -1);

            // Check for /gp
            const gpTest = new RegExp("\/gp$");
            if (!gpTest.test(returnURL)) returnURL += "/gp";

            return returnURL;
        },

        /**
         * Sets the auth widget to have the specified custom GenePattern URL
         *
         * @private
         */
        _setCustomURL: function(url) {
            const widget = this;
            const serverSelect = widget.element.find("[name=server]");

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
            const code = this.options.cell.code_mirror.getValue();
            const lines = code.split("\n");
            let serverLine = null;
            lines.forEach(function(line) {
                if (line.indexOf("genepattern.session.register") >= 0 || line.indexOf("genepattern.register_session") >= 0) {
                    serverLine = line;
                }
            });

            // Found the line
            if (serverLine !== null) {
                const parts = serverLine.split("\"");
                return parts[1];
            }
            // Didn't find the line, return null
            else {
                return null;
            }
        },

        /**
         * Checks to see if the URL is in the server dropdown or not
         *
         * @param url
         * @private
         */
        _isURLCustom: function(url) {
            // Hack for pointing the old http URL of the public server at the new https URL
            if (url.endsWith("genepattern.broadinstitute.org/gp")) return false;

            const widget = this;
            const serverSelect = widget.element.find("[name=server]");
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
            // Hide the loading message & logged in
            this.element.find(".gp-widget-loading").hide();
            this.element.find(".gp-widget-logged-in").hide();

            // Display the message
            const messageBox = this.element.find(".gp-widget-auth-message");
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
            // Hide the loading message & logged in
            this.element.find(".gp-widget-loading").hide();
            this.element.find(".gp-widget-logged-in").hide();

            // Display the error
            const messageBox = this.element.find(".gp-widget-auth-message");
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
            // Hide the loading message & logged in
            this.element.find(".gp-widget-loading").hide();
            this.element.find(".gp-widget-logged-in").hide();

            // Display the message
            const messageBox = this.element.find(".gp-widget-auth-message");
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
            const toSlide = this.element.find(".panel-body.widget-view");
            const indicator = this.element.find(".widget-slide-indicator").find("span");
            if (toSlide.is(":hidden")) {
                toSlide.slideDown();
                indicator.removeClass("fa-plus");
                indicator.addClass("fa-minus");
            }
            else {
                toSlide.slideUp();
                indicator.removeClass("fa-minus");
                indicator.addClass("fa-plus");
            }
        },

        toggle_code: function() {
            // Get the code block
            const code = this.element.closest(".cell").find(".input");
            const is_hidden = code.is(":hidden");
            const cell = this.options.cell;

            if (is_hidden) {
                // Show the code block
                code.slideDown();
                GPNotebook.slider.set_metadata(cell, "show_code", true);
            }
            else {
                // Hide the code block
                code.slideUp();
                GPNotebook.slider.set_metadata(cell, "show_code", false);
            }
        },

        build_code: function(server, username, password) {
            const cell = this.options.cell;
            GPNotebook.init.build_code(cell, server, username, password);
        },

        executeCell: function() {
            this.options.cell.execute();
        },

        /**
         * If there is only one session - the one just authenticated,
         * clean the kernel's session list before the new one is entered
         */
        sync_sessions: function() {
            const should_clean = GPNotebook.session_manager.sessions.length === 1;
            if (should_clean) {
                // Call the kernel and tell it to clean
                Jupyter.notebook.kernel.execute(
                    "genepattern.sessions.clean()",
                    {}
                );
            }
        },

        /**
         * Call the authentication endpoint, then call afterAuthenticate() if set
         *
         * @param server
         * @param username
         * @param password
         * @param callAfterAuthenticate
         * @param done
         */
        authenticate: function(server, username, password, callAfterAuthenticate, done) {
            const widget = this;
            $.ajax({
                type: "POST",
                url: server + "/rest/v1/oauth2/token?grant_type=password&username=" + encodeURIComponent(username) +
                        "&password=" + encodeURIComponent(password) + "&client_id=GenePatternNotebook-" + encodeURIComponent(username),
                cache: false,
                xhrFields: {
                    withCredentials: true
                },
                success: function(data) {
                    const token = data['access_token'];

                    // Register the session
                    const session = GPNotebook.session_manager.register_session(server, username, password);
                    widget.options.session = session;
                    session.token = token;

                    if (callAfterAuthenticate) widget.afterAuthenticate(server, username, password, token, done);
                    else done(token);
                },
                error: function() {
                    widget.build_code(server, "", "");
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
            const widget = this;
            $.ajax({
                type: "GET",
                url: server + "/rest/v1/tasks/all.json",
                dataType: 'json',
                cache: false,
                headers: {"Authorization": "Bearer " + token},
                xhrFields: {
                    withCredentials: true
                },
                success: function(data) {
                    // Set the authentication info on GenePattern object
                    widget.options.session.authenticated = true;
                    widget.options.session.server(server);
                    widget.options.session.username = username;
                    widget.options.session.password = password;
                    widget.options.session.token = token;

                    // Make authenticated UI changes to auth widget
                    widget.element.find(".widget-username-label").text(username);
                    widget.element.find(".widget-server-label").text(server);

                    // Enable authenticated nav elsewhere in notebook
                    GPNotebook.slider.authenticate(widget.options.session, data);

                    // Populate the GenePattern._tasks list
                    if (data['all_modules']) {
                        $.each(data['all_modules'], function(index, module) {
                            widget.options.session._tasks.push(new widget.options.session.Task(module));
                        });
                    }

                    // Populate the GenePattern._kinds map
                    const kindMap = widget.options.session.linkKinds(data['kindToModules']);
                    GPNotebook.slider.remove_kind_visualizers(kindMap);
                    widget.options.session.kinds(kindMap);

                    // If a function to execute when done has been passed in, execute it
                    if (done) { done(token); }
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
                            window.open(feedbackLink, '_blank');
                            // window.location.href = feedbackLink;
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
            const widget = this;
            $.ajax({
                type: "GET",
                url: widget.options.session.server() + "/rest/v1/config/system-message",
                dataType: 'html',
                cache: false,
                headers: {"Authorization": "Bearer " + widget.options.session.token},
                xhrFields: {
                    withCredentials: true
                },
                success: function(data) {
                    // Display if the system message is not blank
                    if (data !== "") {
                        // Strip data of HTML
                        const cleanMessage = $("<div></div>").html(data).text().trim();

                        const messageBlock = $("<div></div>");

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
                            widget.createFeedbackMessage("http://software.broadinstitute.org/cancer/software/genepattern/contact")
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
                    const message = widget.createFeedbackMessage("http://software.broadinstitute.org/cancer/software/genepattern/contact");
                    widget.infoMessage(message);

                    // If a function to execute when done has been passed in, execute it
                    if (done) { done(); }
                }
            });
        },

        getUserLabel: function(alt) {
            if (this.options.session !== null && this.options.session.authenticated && this.options.session.username) {
                return this.options.session.username;
            }
            else {
                return alt
            }
        },

        getServerLabel: function(alt) {
            if (this.options.session !== null && this.options.session.authenticated && this.options.session.server()) {
                return this.options.session.server();
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
            GPNotebook.slider.toggleDev();
            return false;
        }}
    );

    // Method to enable dev servers from the auth widget
    GPNotebook.slider.toggleDev = function() {
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
        const devOn = $(".gp-widget-auth-form").find("[name=server]").hasClass("gp-widget-dev-on");
        const devWord = devOn ? "off" : "on";
        if (devOn) removeOptions();
        else addOptions();

        // Show dialog
        const dialog = require('base/js/dialog');
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

    const WorkflowQueue = {
        /**
         * The current status of the queue.
         *      Statuses: uninitialized, ready, running, canceled, error, complete
         */
        status: 'uninitialized',
        step_index: 0,

        /**
         * Initialize the event handling necessary for the Workflow Queue
         */
        init: function() {
            const workflow_queue = this;

            // If the queue has already been initialized, do nothing
            if (this.status !== 'uninitialized') return;

            // Event that runs every time a cell completes execution
            $([Jupyter.events]).on('shell_reply.Kernel', function(event, target) {
                if (workflow_queue.status === 'running') {
                    // Wait for display to process before testing
                    setTimeout(function() {
                        // If the new cell is a GenePattern cell, ignore this, it has its own handling
                        const cell = Jupyter.notebook.get_selected_cell();
                        if (workflow_queue._is_genepattern_cell(cell)) return;

                        workflow_queue.step_completed();
                    }, 1000);
                }
            });

            // Set the queue status as ready
            this.status = 'ready';
        },

        /**
         * Display the error message and set the queue status
         *
         * @param message
         */
        error_encountered: function(message) {
            const workflow_alert = $("#workflow_queue_alert");
            workflow_alert.removeClass('alert-info');
            workflow_alert.addClass('alert-danger');
            workflow_alert.text(message);

            this.status = 'error';
        },

        workflow_complete: function() {
            const workflow_alert = $("#workflow_queue_alert");
            workflow_alert.removeClass('alert-info');
            workflow_alert.addClass('alert-success');
            workflow_alert.text("The GenePattern workflow has successfully run to completion.");
            $(".dialog-btn-complete").show();
            $(".dialog-btn-cancel").hide();

            this.status = 'completed';
        },

        /**
         * Process the completion of a step in the workflow queue
         */
        step_completed: function() {
            const cell = Jupyter.notebook.get_cell(this.step_index);

            console.log("WORKFLOW MANAGER STEP COMPLETED  ");
            console.log(cell);
            console.log(cell.element);

            // Check for code error
            if (this._has_code_error(cell)) {
                this.error_encountered("Encountered a code cell error in the workflow. Stopping execution.");
                return;
            }

            // Check for GenePattern error
            if (this._has_genepattern_error(cell)) {
                this.error_encountered("Encountered a GenePattern cell error in the workflow. Stopping execution.");
                return;
            }

            // Check for completion
            if (this.step_index === Jupyter.notebook.get_cells().length -1) {
                this.workflow_complete();
                return;
            }

            // Increment the queue step
            this.step_index++;

            // Notify the interface
            this._update_step_display();

            // Run the next cell
            this.run_next_cell();
        },

        /**
         * Launch the notebook workflow
         */
        launch: function() {
            // Reset the queue state
            this.reset();

            // Display the workflow UI
            this.display();

            // Set the status to running
            this.status = 'running';

            // Run the first cell
            this.run_next_cell();
        },
        /**
         * Run the next cell in the queue
         */
        run_next_cell: function() {
            const workflow_queue = this;
            let cell = Jupyter.notebook.get_cell(this.step_index);

            // Scroll to the cell
            const site_div = $('#site');
            const current_offset = Math.abs(site_div.find(".container").offset().top);
            const cell_offset = $(cell.element).offset().top;
            site_div.animate({
                scrollTop: current_offset + cell_offset - 100
            }, 500, function() {
                // Select the cell
                Jupyter.notebook.select(workflow_queue.step_index);

                // Wait for the scroll & selection to complete
                setTimeout(function() {
                    cell = Jupyter.notebook.get_selected_cell();

                    // If this is a GenePattern cell, handle it
                    if (workflow_queue._is_genepattern_cell(cell)) {
                        workflow_queue._description_from_genepattern(cell);
                        workflow_queue._handle_genepattern_step(cell);
                        return;
                    }

                    // If this is a code cell, run it
                    if (cell.cell_type === 'code') {
                        workflow_queue._description_from_code(cell);

                        // If the code is empty, move on
                        if (cell.get_text().trim() === '') workflow_queue.step_completed();

                        else Jupyter.notebook.execute_cell();
                        return;
                    }

                    // Otherwise, make sure the status is still running and skip the cell
                    if (workflow_queue.status === 'running') {
                        workflow_queue._description_from_markdown(cell);
                        workflow_queue.step_completed();
                    }
                }, 100);
            });
        },

        /**
         * Reset the state of the workflow queue back to ready
         */
        reset: function() {
            // If the queue hasn't been initialized, do so
            if (this.status === 'uninitialized') this.init();

            // Reset the state
            this.step_index = 0;
            this.status = 'ready';
        },

        /**
         * Display the workflow queue dialog and UI
         */
        display: function() {
            const workflow_queue = this;
            const step_count = Jupyter.notebook.get_cells().length;

            const dialog = require('base/js/dialog');
            dialog.modal({
                notebook: Jupyter.notebook,
                keyboard_manager: this.keyboard_manager,
                title : "Running Notebook as GenePattern Workflow",
                body : $("<p>This notebook is currently being executed as a GenePattern workflow. Each code cell and GenePattern analysis will be executed in sequence. Please wait.</p><br/>" +
                       "<div id='workflow_queue_alert' class='alert alert-info'><h4>Running Step: <span id='workflow_queue_step'>" + 1 + "</span> / <span id='workflow_queue_step_total'>" + step_count + "</span></h4><div id='workflow_queue_description'>Initializing...</div></div>"),
                buttons : {
                    "Cancel" : {
                        "click": function() {
                            // Set status to canceled and close the dialog
                            if (workflow_queue.status === 'running') workflow_queue.status = 'canceled';
                        },
                        "class": "btn-default dialog-btn-cancel"
                    },
                    "Complete" : {
                        "click": function() {},
                        "class": "btn-primary dialog-btn-complete"
                    }
                }
            });

            // Disable the complete button
            setTimeout(function() {
                $(".dialog-btn-complete").hide();
            }, 200)
        },

        _description_from_markdown: function(cell) {
            const to_display = "<strong>Markdown Cell</strong><div><em>. . .</em></div>";
            $("#workflow_queue_description").html(to_display);
        },

        _description_from_code: function(cell) {
            const lines = cell.get_text().split('\n');
            const display_code = lines.length > 1 ? lines[0] + '\n...' : lines[0];
            const to_display = "<strong>Code Cell</strong><div><em>" + display_code + "</em></div>";

            $("#workflow_queue_description").html(to_display);
        },

        _description_from_genepattern: function(cell) {
            let name = cell.element.find(".gp-widget-task-name, .gp-widget-job-task").first().text();
            if (!name) name = "Verifying Authentication";
            const to_display = "<strong>GenePattern Cell</strong><div><em>" + name + "</em></div>";

            $("#workflow_queue_description").html(to_display);
        },

        _update_step_display: function() {
            const step_count = Jupyter.notebook.get_cells().length;

            // Update current step
            $("#workflow_queue_step").text(this.step_index + 1);

            // Update step total
            $("#workflow_queue_step_total").text(step_count);
        },

        /**
         * Determine if the code cell has returned an error
         *
         * @param cell
         * @returns {boolean}
         * @private
         */
        _has_code_error: function(cell) {
            // If not a code cell, there is no code error
            if (cell.cell_type !== 'code') return false;

            // If the output cannot be read, log and continue
            if (!cell.output_area || !cell.output_area.outputs) {
                console.log("Unable to read output area to detect error in cell");
                return false;
            }

            let error_found  = false;
            cell.output_area.outputs.forEach(function(o) {
                if (o.output_type === 'error') error_found = true;
            });

            return error_found;
        },

        /**
         * Determine if the cell is a GenePattern cell with an error returned
         *
         * @param cell
         * @returns {boolean}
         * @private
         */
        _has_genepattern_error: function(cell) {
            // If not a GenePattern cell, there is no GenePattern error
            if (!this._is_genepattern_cell(cell)) return false;

            // Detect error messages
            return !!$(cell.element).find(".alert-danger:visible").length;
        },

        /**
         * Determine if the indicated cell is a GenePattern cell
         *
         * @param cell
         * @returns {boolean}
         * @private
         */
        _is_genepattern_cell: function(cell) {
            return !!(cell.metadata && cell.metadata.genepattern)
        },

        _handle_genepattern_step: function(cell) {
            const workflow_queue = this;
            const gp_cell_type = cell.metadata.genepattern.type;
            let job_event_created = false;

            // Job widgets can appear in task cells or job cells. Define how to handle them.
            const handle_job_widget = function() {
                // Get the job status
                const widget = cell.element.find(".gp-widget:last").data("widget");
                const job = widget ? widget.options.job : null;
                const finished = widget && job ? job.status().isFinished : null;

                // If is the job has already finished, move on if running
                if (finished && workflow_queue.status === 'running') workflow_queue.step_completed();

                // Otherwise wait until the completion event
                if (!job_event_created) {
                    job_event_created = true; // Only create this event once per job
                    widget.element.one("gp.jobComplete", function(event, job) {
                        // Check for a job error and stop execution if one is found
                        if (job && job.status && job.status().hasError) workflow_queue.error_encountered("GenePattern job encountered an error. Stopping execution.");

                        // Make sure the status is still running and complete the step
                        if (workflow_queue.status === 'running') workflow_queue.step_completed();
                    });
                }

            };

            // Go through each GenePattern cell type and handle it
            if (gp_cell_type === "auth") {
                // If not authenticated, give an error
                const widget = cell.element.find(".gp-widget").data("widget");
                const authenticated = widget && widget.options.session && widget.options.session.authenticated;
                if (!authenticated) this.error_encountered("Missing GenePattern server credentials. Stopping execution.");

                // Otherwise, complete the step and move on if running
                if (this.status === 'running') this.step_completed();
            }
            else if (gp_cell_type === "task") {
                // Run the analysis
                cell.element.find(".gp-widget-task-run-button:first").click();

                // Wait until the job is submitted and continue
                cell.element.on("nbtools.widget_rendered", function() {
                    setTimeout(function() {
                        if (workflow_queue._has_genepattern_error(cell)) {
                            workflow_queue.error_encountered("GenePattern analysis encountered an error. Stopping execution.");
                        }

                        if (workflow_queue.status === 'running') handle_job_widget();
                    }, 1000);
                });

                // If job wasn't submitted because of an error, stop workflow
                setTimeout(function() {
                    if (workflow_queue._has_genepattern_error(cell)) {
                        workflow_queue.error_encountered("GenePattern analysis encountered an error. Stopping execution.");
                    }
                }, 1000);
            }
            else if (gp_cell_type === "job") {
                handle_job_widget();
            }
            else if (gp_cell_type === "uibuilder") {
                // Run the UI Builder function
                cell.element.find(".gp-widget-task-run-button:first").click();

                // Wait three seconds and continue
                setTimeout(function() {
                    if (workflow_queue.status === 'running') workflow_queue.step_completed();
                }, 3000);
            }
            else {
                // Log a warning an move on
                console.log("Unknown GenePattern cell type detected: " + gp_cell_type);

                // Make sure the status is still running and complete the step
                if (this.status === 'running') this.step_completed();
            }
        }
    };

    const AuthWidgetView = widgets.DOMWidgetView.extend({
        render: function () {
            const widget = this;
            let cell = widget.options.cell;

            // Ugly hack for getting the Cell object in ipywidgets 7
            if (!cell) cell = widget.options.output.element.closest(".cell").data("cell");

            // Protect against double-rendering
            if (cell.element.find(".gp-widget-auth").length > 0) return;

            // Check to see if this auth widget was manually created, if so replace with full code
            if (!('genepattern' in cell.metadata) && cell.code_mirror.getValue().trim() !== "") {
                GPNotebook.init.build_code(cell, GENEPATTERN_SERVERS[0][1], "", "");
            }

            // Render the view.
            if (!widget.el) widget.setElement($('<div></div>'));

            // Render the cell and hide code by default
            const element = this.$el;
            const hideCode = function() {
                const cell_div = element.closest(".cell");
                if (cell_div.length > 0) {
                    // Render the widget
                    $(widget.$el).auth({
                        cell: cell
                    });

                    // Hide the code
                    cell_div.find(".input").hide();
                }
                else {
                    setTimeout(hideCode, 10);
                }
            };
            setTimeout(hideCode, 1);

            // Double-check to make sure the widget renders
            Utils.ensure_rendering(cell);
        }
    });

    const AuthWidgetTool = new NBToolManager.NBTool({
        origin: "+",
        id: "authentication",
        name: "GenePattern Login",
        // tags: ["GenePattern", "Authentication"],
        description: "Sign into a GenePattern Server",
        load: function() { return true; },
        render: function() {
            let cell = Jupyter.notebook.get_selected_cell();
            const is_empty = cell.get_text().trim() === "";

            // If this cell is not empty, insert a new cell and use that
            // Otherwise just use this cell
            if (!is_empty) {
                cell = Jupyter.notebook.insert_cell_below();
                Jupyter.notebook.select_next();
            }

            GPNotebook.slider.create_authentication_cell(cell);
            return cell;
        }
    });

    return {
        AuthWidgetView: AuthWidgetView,
        AuthWidgetTool: AuthWidgetTool,
        WorkflowQueue: WorkflowQueue
    }
});