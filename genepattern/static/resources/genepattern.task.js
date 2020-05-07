/**
 * Define the Jupyter GenePattern Task widget
 *
 * @author Thorin Tabor
 * @requires - jQuery, genepattern.navigation.js
 *
 * Copyright 2015-2020 Regents of the University of California & The Broad Institute
 */

define("genepattern/task", ["base/js/namespace",
                            "nbextensions/jupyter-js-widgets/extension",
                            "jquery",
                            "genepattern/navigation",
                            "nbtools/variables",
                            "nbtools/utils",
                            "genepattern/job",
                            "nbtools/text",
                            "nbtools/choice",
                            "nbtools/file",
                            "nbtools/typeahead"], function (Jupyter, widgets, $, GPNotebook, VariableManager, Utils) {

    /**
     * Widget for entering parameters and launching a job from a task.
     *
     * Supported Features:
     *      File Inputs
     *      Text Inputs
     *      Choice Inputs
     *      EULA support
     *      Reloaded Jobs
     *      File Lists
     *
     * Non-Supported Features:
     *      Batch Parameters
     *      Dynamic Dropdowns
     */
    $.widget("gp.runTask", {
        // Flags for whether events have been called on the widget
        _widgetRendered: false,
        _paramsLoaded: false,

        options: {
            lsid: null,
            name: null,
            task: null,
            session: null,
            session_index: null,
            cell: null
        },

        /**
         * Constructor
         *
         * @private
         */
        _create: function() {
            // Set variables
            const widget = this;
            const identifier = this._getIdentifier();

            // Add data pointer
            this.element.data("widget", this);

            // Attach the session, if necessary and possible
            if (!this.options.session && this.options.cell) {
                this.options.session_index = this._session_index_from_code();
                this.options.session = this._session_from_index(this.options.session_index);
            }

            // By default the list of accepted kinds is null
            this._kinds = null;

            // Add classes and scaffolding
            this.element.addClass("panel panel-default nbtools-widget gp-widget gp-widget-task");
            this.element.append( // Attach header
                $("<div></div>")
                    .addClass("panel-heading gp-widget-task-header")
                    .append(
                        $("<div></div>")
                            .addClass("widget-float-right")
                            .append(
                                $("<span></span>")
                                    .addClass("gp-widget-task-version")
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
                                            .addClass("dropdown-menu gear-menu")
                                            .append(
                                                $("<li></li>")
                                                    .append(
                                                        $("<a></a>")
                                                            .addClass("gp-widget-task-doc")
                                                            .attr("title", "Documentation")
                                                            .attr("href", "#")
                                                            .append("Documentation")
                                                            .click(function(event) {
                                                                const url = $(event.target).attr("data-href");
                                                                window.open(url,'_blank');
                                                            })
                                                    )
                                            )
                                            .append(
                                                $("<li></li>")
                                                    .append(
                                                        $("<a></a>")
                                                            .attr("title", "Reset Parameters")
                                                            .attr("href", "#")
                                                            .append("Reset Parameters")
                                                            .click(function() {
                                                                widget.reset_parameters();
                                                            })
                                                    )
                                            )
                                            .append(
                                                $("<li></li>")
                                                    .append(
                                                        $("<a></a>")
                                                            .attr("title", "Toggle Job Options")
                                                            .attr("href", "#")
                                                            .append("Advanced Options")
                                                            .click(function() {
                                                                widget.toggle_job_options();
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
                                    .addClass("gp-widget-task-name")
                            )
                    )
            );
            this.element.append( // Attach header
                $("<div></div>")
                    .addClass("panel-body")
                    .css("position", "relative")
                    .append( // Attach message box
                        $("<div></div>")
                            .addClass("alert gp-widget-task-message")
                            .css("display", "none")
                    )
                    .append( // Attach subheader
                        $("<div></div>")
                            .addClass("gp-widget-task-subheader")
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-task-run")
                                    .append(
                                        $("<button></button>")
                                            .addClass("btn btn-primary gp-widget-task-run-button")
                                            .text("Run")
                                            .click(function() {
                                                if (widget.validate()) {
                                                    widget.submit();
                                                }
                                            })
                                    )
                            )
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-task-desc")
                            )
                            .append(
                                $("<div></div>").css("clear", "both")
                            )
                    )
                    .append(
                        $("<div></div>") // Attach form placeholder
                            .addClass("form-horizontal gp-widget-task-form")
                    )
                    .append( // Attach footer
                        $("<div></div>")
                            .addClass("gp-widget-task-footer")
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-task-run")
                                    .append(
                                        $("<button></button>")
                                            .addClass("btn btn-primary gp-widget-task-run-button")
                                            .text("Run")
                                            .click(function() {
                                                if (widget.validate()) {
                                                    widget.submit();
                                                }
                                            })
                                    )
                            )
                            .append(
                                $("<div></div>").css("clear", "both")
                            )
                    )
                    .append(
                        $("<div></div>")
                            .addClass("gp-widget-logged-in gp-widget-task-eula")
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
                                    .text("You must agree to the following End-User license agreements before you can run this task.")
                            )
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-task-eula-box")
                            )
                            .append(
                                $("<div></div>")
                                    .text("Do you accept the license agreements?")
                            )
                            .append(
                                $("<div></div>")
                                    .append(
                                        $("<button></button>")
                                            .addClass("btn btn-warning btn-lg gp-widget-task-eula-accept")
                                            .text("Accept")
                                            .click(function() {
                                                const success = function() {
                                                    widget.element.find(".gp-widget-task-eula").hide();
                                                };
                                                const error = function(xhr, error) {
                                                    widget.errorMessage(error);
                                                };

                                                widget.getTask(function(task) {
                                                    if (task === null) {
                                                        console.log("Error getting task for EULA acceptance");
                                                        return;
                                                    }
                                                    task.acceptEula(success, error);
                                                });
                                            })
                                    )
                            )
                            .hide()
                    )
            );

            // Apply server color scheme if authenticated
            if (widget.options.session !== null && widget.options.session.authenticated) {
                GPNotebook.slider.apply_colors(widget.element, widget.options.session.server());
            }

            // Check to see if the user is authenticated yet
            if (widget.options.session && widget.options.session.authenticated) {
                // Make call to build the header & form
                this.getTask(function(task) {
                    if (task !== null) {
                        widget._buildHeader();
                        widget._buildForm();
                    }
                    else {
                        widget._showUninstalledMessage();
                    }
                });
            }
            else {
                this._showAuthenticationMessage();
                this._pollForAuth();
            }

            // Trigger gp.widgetRendered event on cell element
            setTimeout(function() {
                widget._widgetRendered = true;
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
            this.element.removeClass("gp-widget-task");
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
            const widget = this;
            const identifier = this._getIdentifier();

            this.getTask(function(task) {
                if (task !== null) {
                    widget._buildHeader();
                    widget._buildForm();
                }
                else {
                    widget._showUninstalledMessage();
                }
            });
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
         * Retrieves the associated Task object from cache, or from the server if necessary
         *
         * @param done - Function to call once the task is loaded
         *      Passes the Task() object in as a parameter, or null if in error
         *
         * @returns {GenePattern.Task|null} - Returns null if task had to be retrieved
         *      from the server, otherwise returns the Task() object
         */
        getTask: function(done) {
            // First check for the associated task, return if found
            let task = this.options.task;
            if (task !== null) {
                done(task);
                return task;
            }

            // Otherwise check the general GenePattern cache
            const identifier = this._getIdentifier();
            task = this.options.session.task(identifier);
            if (task !== null) {
                this.options.task = task; // Associate this task with the widget
                done(task);
                return task;
            }

            // Otherwise call back to the server
            const widget = this;
            this.options.session.taskQuery({
                lsid: identifier,
                success: function(newTask) {
                    widget.options.task = newTask; // Associate this task with the widget
                    done(newTask);
                },
                error: function(error) {
                    console.log(error);
                    done(null);
                }
            });
            return null;
        },

        /**
         * If this cell also contains a job widget, removed that widget from both the UI and the code
         */
        remove_job: function() {
            const cell = this.options.cell;

            // Remove the widget
            cell.element.find(".gp-widget-job").remove();

            // If necessary, remove the parent output_area
            const output_areas = cell.element.find(".output_area");
            if (output_areas.length > 2) {
                output_areas.each(function(i, area) {
                    const contains_widget = $(area).find(".gp-widget").length > 0;
                    if (!contains_widget) $(area).css("height", 0); // If empty, hide
                })
            }

            // Remove the job options from the gear menu
            this.element.find(".gear-menu").find(".gp-widget-job-share").remove();
            this.element.find(".gear-menu").find(".gp-widget-job-duplicate").remove();

            // Update the code
            let existing_code = cell.get_text();
            if (existing_code.indexOf('gp.GPJob(') > -1) { // Does this cell have a job appended already?
                const lines = existing_code.split('\n'); // Divide the code into lines

                // Find the line to display the task widget
                let display_line = lines.length - 1;
                for (let i = 0; i < lines.length; i++) {
                    let line = lines[i];
                    if (line.indexOf('GPTaskWidget') > -1 || line.indexOf('genepattern.display') > -1) {
                        display_line = i;
                        break;
                    }
                }

                // Cut all lines after the task display line and join as a string
                existing_code = lines.slice(0, display_line+1).join('\n').trim();
            }

            // Append the code
            cell.set_text(existing_code);

        },

        /**
         * Returns the associated job widget for output
         */
        add_job_widget: function(cell, session, job_number) {
            let output_subarea = null;

            // Is the task widget displayed the old "return the widget" way?
            let code = cell.get_text();
            const return_old_way = code.indexOf('genepattern.GPTaskWidget') >= 0;

            // If so, make it display the new way
            if (return_old_way) {
                code = code.replace('genepattern.GPTaskWidget', 'genepattern.display');
                cell.set_text(code);
            }

            // Does a job widget already exist in this cell?
            let job_widget = cell.element.find(".gp-widget-job");

            // If so, get the parent output_subarea and remove the widget
            if (job_widget.length) {
                output_subarea = job_widget.parent();
                this.remove_job();
            }

            // If not, create the output_subarea
            else {
                output_subarea = $("<div></div>")
                    .addClass("output_subarea jupyter-widgets-view");

                const output = cell.element.find(".output");
                output.append(
                    $("<div></div>")
                        .addClass("output_area")
                        .append($("<div></div>").addClass("prompt"))
                        .append(output_subarea)
                );
            }

            // Add the new widget to the output_subarea
            job_widget = $("<div></div>");
            output_subarea.parent().css("height", "auto");
            output_subarea.append(job_widget);

            $(job_widget).jobResults({
                jobNumber: job_number,
                cell: cell
            });
        },

        /**
         * Expand or collapse the task widget
         *
         *     expand - optional parameter used to force an expand or collapse,
         *         leave undefined to toggle back and forth
         */
        expandCollapse: function(expand) {
            const toSlide = this.element.find(".panel-body:first");
            const indicator = this.element.find(".widget-slide-indicator").find("span");
            const isHidden = toSlide.is(":hidden");

            if (expand !== true && (expand === false || !isHidden)) {
                toSlide.slideUp();
                indicator.removeClass("fa-minus");
                indicator.addClass("fa-plus");
            }
            else if (isHidden || expand) {
                toSlide.slideDown();
                indicator.removeClass("fa-plus");
                indicator.addClass("fa-minus");
            }
        },

        /**
         * Returns an identifier for attaining the Task object from the server
         *
         * @returns {string|null}
         * @private
         */
        _getIdentifier: function() {
            if (this.options.lsid) { return this.options.lsid; }
            else if (this.options.name) { return this.options.name }
            else {
                throw "Error creating Run Task widget! No LSID or name!";
            }
        },

        _session_index_from_code: function() {
            // Make sure that this is a task cell
            if ('genepattern' in this.options.cell.metadata && this.options.cell.metadata.genepattern.type !== "task") {
                console.log("Attempting to extract session index from non-task cell");
                return 0;
            }

            const code = this.options.cell.get_text();
            let index = 0;
            try {
                index = Number.parseInt(code.split("genepattern.session.get(")[1].split(")")[0]);
            }
            catch (e) {
                console.log("Cannot extract GenePattern session index, defaulting to 0");
            }
            return index;
        },

        _session_from_index: function(index) {
            return GPNotebook.session_manager.get_session(index);
        },

        /**
         * Display module not installed message
         *
         * @private
         */
        _showUninstalledMessage: function() {
            // Show the message
            this.element.find(".gp-widget-task-name").empty().text("Module Not Installed");
            this.errorMessage("This module is not installed on this GenePattern server.");
            this.element.find(".gp-widget-task-subheader").hide();
            this.element.find(".gp-widget-task-footer").hide();
        },

        /**
         * Display the not authenticated message
         *
         * @private
         */
        _showAuthenticationMessage: function() {
            // Create message title
            let title = "Not Authenticated";
            if (this.options.session_index !== 0) title += " - Secondary Server";

            // Create message text
            let text = "You must be authenticated before the analysis can be displayed. After you authenticate it may take a few seconds for the information to appear.";
            if (this.options.session_index !== 0) text += " This analysis is configured to run on a seconday GenePattern server. You will need to sign into an additional server before its information can be displayed.";

            // Display the message
            this.element.find(".gp-widget-task-name").empty().text(title);
            this.element.find(".gp-widget-task-form").empty()
                .addClass("alert alert-danger")
                .text(text);
            this.element.find(".gp-widget-task-subheader").hide();
            this.element.find(".gp-widget-task-footer").hide();

            // Update the doc button
            this.element.find(".gp-widget-task-doc").attr("disabled", "disabled");
        },

        /**
         * Polls every few seconds to see if the notebook is authenticated, and gets task info once authenticated
         *
         * @private
         */
        _pollForAuth: function() {
            const widget = this;
            setTimeout(function() {
                // Try to grab the session again
                widget.options.session = widget._session_from_index(widget.options.session_index);

                // Check to see if the user is authenticated yet
                if (widget.options.session && widget.options.session.authenticated) {
                    // If authenticated, execute cell again
                    const cellElement = widget.element.closest(".cell");
                    if (cellElement.length > 0) {
                        const cellObject = cellElement.data("cell");
                        if (cellObject) {
                            cellObject.execute();
                        }
                    }
                }
                else {
                    // If not authenticated, poll again
                    widget._pollForAuth();
                }
            }, 1000);
        },

        /**
         * Build the EULA pane and display if necessary
         *
         * @private
         */
        _buildEula: function() {
            const widget = this;
            this.getTask(function(task) {
                // Handle error
                if (task === null) {
                    console.log("Task error in _buildEula()");
                    return
                }

                const eula = task.eula();   // Get the EULAs
                // Only build the EULA display if necessary
                if (eula !== undefined && eula !== null && eula['pendingEulas'] !== undefined && eula['pendingEulas'].length > 0) {
                    const box = widget.element.find(".gp-widget-task-eula-box");

                    // Attach each of the EULAs
                    for (let i = 0; i < eula['pendingEulas'].length; i++) {
                        const license = eula['pendingEulas'][i];
                        const licenseBox = $("<pre></pre>")
                            .addClass("gp-widget-task-eula-license")
                            .text(license['content']);
                        box.append(licenseBox);
                    }

                    widget.element.find(".gp-widget-task-eula").show();
                }
            });
        },

        /**
         * Build the header and return the Task object
         *
         * @private
         */
        _buildHeader: function() {
            const widget = this;
            this.getTask(function(task) {
                // Handle error
                if (task === null) {
                    console.log("Task error in _buildEula()");
                    return
                }

                widget.element.find(".gp-widget-task-subheader").show();
                widget.element.find(".gp-widget-task-footer").show();

                widget.element.find(".gp-widget-task-name").empty().text(" " + task.name());
                widget.element.find(".gp-widget-task-version").empty().text("Version " + task.version());
                widget.element.find(".gp-widget-task-doc").attr("data-href", widget.options.session.server() + task.documentation().substring(3));
                widget.element.find(".gp-widget-task-desc").empty().html(task.description());

                // Display error if Java visualizer
                const categories = task.categories();
                if (categories.indexOf("Visualizer") !== -1) {
                    widget.errorMessage("This job appears to be a deprecated Java-based visualizer. These visualizers are not supported in the GenePattern Notebook.");
                }
            });
        },

        /**
         * Parse the code for the job spec and return the values of the inputs in a dictionary
         *
         * @private
         */
        _parseJobSpec: function() {
            const dict = {};
            const code = this.options.cell.code_mirror.getValue();
            const lines = code.split("\n");

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                // Here is a line to parse
                if (line.indexOf(".set_parameter") !== -1) {
                    const key = this._parseKeyFromLine(line);
                    const value = this._parseValueFromLine(line);
                    dict[key] = value;
                }
            }

            return dict;
        },

        /**
         * Given a line of code with job_spec.set_parameter, parse and return the value
         *
         * @param line
         * @returns {object}
         * @private
         */
        _parseValueFromLine: function(line) {
            // Pull the text out of the parentheses
            const pullFromParen = /\(([^)]+)\)/;
            const match = line.match(pullFromParen);
            const insideParen = match && match[1];

            // If it couldn't find the correct text, abort
            if (insideParen === null) {
                console.log("Couldn't find parameters in: " + line);
                return null;
            }

            // Pull out the value substring
            const commaIndex = insideParen.indexOf(",");
            const valueStr = insideParen.substring(commaIndex+1).trim();

            // Determine whether this represents a list or not
            const firstChar = valueStr.charAt(0);
            const isList = firstChar === "[";

            // If not, trim the quotes and return the unescaped string
            if (!isList) {
                const withoutQuotes = valueStr.substring(1, valueStr.length-1);
                return this._unescapeQuotes(withoutQuotes);
            }

            // If this is a list, parse into constituent strings
            if (isList) {
                try {
                    const valueList = eval(valueStr);
                    return valueList;
                }
                catch (e) {
                    console.log("Error parsing list from: " + valueStr);
                    return null;
                }
            }
        },

        /**
         * Given a line of code with job_spec.set_parameter, parse and return the key
         *
         * @param line
         * @returns {string}
         * @private
         */
        _parseKeyFromLine: function(line) {
            const parts = line.split(",");
            const first = parts[0].split("\"");
            return first[1];
        },

        _buildParamGroupHeader: function(group) {
            return $("<div></div>")
                .addClass("gp-widget-task-group")
                .css("margin-bottom", "10px")
                .append(
                    $("<div></div>")
                        .addClass("panel-heading gp-widget-task-group-title")
                        .css("display", group.name ? "block" : "none")
                        .text(group.name)
                        .append(
                            $("<div></div>")
                                .addClass("widget-float-right")
                                .append(
                                    $("<button></button>")
                                        .addClass("btn btn-default btn-sm widget-slide-indicator")
                                        .attr("title", "Expand or Collapse")
                                        .attr("data-toggle", "tooltip")
                                        .attr("data-placement", "bottom")
                                        .css("padding", "2px 7px")
                                        .append(
                                            $("<span></span>")
                                                .addClass(group.hidden ? "fa fa-plus" : "fa fa-minus")
                                        )
                                        .click(function() {
                                            const toSlide = $(this).closest(".gp-widget-task-group").find(".gp-widget-task-group-params");
                                            const indicator = $(this).find("span");
                                            const isHidden = toSlide.is(":hidden");

                                            if (isHidden) {
                                                toSlide.slideDown();
                                                indicator.removeClass("fa-plus");
                                                indicator.addClass("fa-minus");
                                            }
                                            else if (!isHidden) {
                                                toSlide.slideUp();
                                                indicator.removeClass("fa-minus");
                                                indicator.addClass("fa-plus");
                                            }
                                        })
                                )
                        )
                )
                .append(
                    $("<div></div>")
                        .addClass("gp-widget-task-group-params")
                        .css("display", group.hidden ? "none" : "block")
                        .append(
                            $("<div></div>")
                                .addClass("panel-body gp-widget-task-group-description")
                                .css("display", group.description ? "block" : "none")
                                .html(group.description)
                        )
                )

        },

        _addParamGroup: function(group, allParams, reloadVals) {
            function getParam(name) {
                for (let i = 0; i < allParams.length; i++) {
                    if (allParams[i].name() === name) return allParams[i];
                }
                throw "no matching param name found: " + name;
            }

            // Handle groups without any parameters
            if (!group.parameters) return;

            // Add the parameter header
            const form = this.element.find(".gp-widget-task-form");
            const groupDiv = this._buildParamGroupHeader(group);

            // Hide job options group by default
            if (group.name === "Job Options") {
                groupDiv.addClass("gp-widget-task-job-options");
                groupDiv.hide();
            }

            // Append the group to the form
            form.append(groupDiv);

            // Add widgets for all parameters in the group
            for (let i = 0; i < group.parameters.length; i++) {
                try {
                    // Get the Param object
                    let param = null;
                    if (typeof group.parameters[i] !== "string") {
                        param = group.parameters[i];
                    }
                    else {
                        param = getParam(group.parameters[i]);
                    }

                    // Add the parameter widget
                    const pDiv = this._addParam(param, groupDiv.find(".gp-widget-task-group-params"));

                    // Add to the metadata
                    GPNotebook.slider.set_parameter_metadata(this.options.cell, param.name(), param.values());

                    if (reloadVals[param.name()] !== undefined) {
                        const pWidget = pDiv.data("widget");
                        pWidget.value(reloadVals[param.name()]);
                    }
                }
                catch(exception) {
                    console.log(exception);
                }
            }

            // If job options, remove custom values
            if (group.name === "Job Options") {
                groupDiv.find(".nbtools-custom-value").remove();
            }
        },

        /**
         * Make the call to the server to get the params and build the form
         *
         * @private
         */
        _buildForm: function() {
            const widget = this;
            this.getTask(function(task) {
                // Handle error
                if (task === null) {
                    console.log("Task error in _buildEula()");
                    return
                }

                widget.element.find(".gp-widget-task-form").empty();

                task.params({
                    success: function(response, params) {
                        const reloadVals = widget._parseJobSpec();

                        // Iterate over parameter groups
                        if (task.paramGroups()) {
                            // Iterate over groups and add params
                            const groups = task.paramGroups();
                            for (let i = 0; i < groups.length; i++) {
                                widget._addParamGroup(groups[i], params, reloadVals);
                            }
                        }
                        else {
                            // Assume one blank group if not defined
                            widget._addParamGroup({
                                name: "",
                                description: "",
                                parameters: params
                            }, params, reloadVals);
                        }

                        // Build the accepted kinds list
                        widget._createKindsList(params);

                        // Build the EULA, too
                        widget._buildEula();

                        // Build the job_spec if necessary
                        if (Object.keys(reloadVals).length === 0) {
                            widget._addJobSpec(params);
                        }
                        widget._paramsLoaded = true;
                        $(widget.element).trigger("runTask.paramLoad");
                    },
                    error: function(exception) {
                        widget.errorMessage("Could not load task: " + exception.statusText);
                    }
                });
            });
        },

        /**
         * Escape the quotes in a string so it can be safely included in code generation
         *
         * @param srcString
         * @returns {string}
         * @private
         */
        _escapeQuotes: function(srcString) {
            return (srcString + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
        },

        /**
         * Unescape quotes in a string so an escaped value can be retrieved from code
         *
         * @param srcString
         * @returns {string}
         * @private
         */
        _unescapeQuotes: function(srcString) {
            return (srcString + '').replace(/\\/g, "");
        },

        /**
         * Adds parameters to job_spec in the code for the widget
         *
         * @param params
         * @private
         */
        _addJobSpec: function(params) {
            let code = this.options.cell.code_mirror.getValue();
            const lines = code.split("\n");
            let jobSpecName = null;
            let insertAfter = null;

            // Get the job_spec name and _task name
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                let parts = null;

                // Obtain the variable name of the job_spec
                if (line.indexOf("_job_spec = ") !== -1) {
                    parts = line.split(" ");
                    jobSpecName = parts[0];
                    insertAfter = i;
                    continue;
                }
            }

            // If job_spec name is still null, return
            if (jobSpecName === null) {
                console.log("Error setting job_spec params, no job_spec name found");
                return;
            }

            // Generate the .set_parameter code
            const newLines = [];
            for (let i = 0; i < params.length; i++) {
                const param = params[i];
                const newLine = jobSpecName + '.set_parameter("' + param.name() + '", "' + this._escapeQuotes(param.defaultValue()) + '")';
                newLines.unshift(newLine);
            }

            // Insert the generated code
            $.each(newLines, function(i, line) {
                lines.splice(insertAfter+1, 0, line);
            });

            // Set the new code
            code = lines.join("\n");
            this.options.cell.code_mirror.setValue(code);

            return code;
        },

        /**
         * Updates the parameter value in the code's job_spec
         *
         * @param paramName
         * @param value
         */
        updateCode: function(paramName, value) {
            let code = this.options.cell.code_mirror.getValue();
            const lines = code.split("\n");
            let jobSpecName = null;
            const codeToLookFor = '.set_parameter("' + paramName + '"';
            let lineToSwap = null;

            // Get the job_spec name
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                // Obtain the variable name of the job_spec
                if (line.indexOf("_job_spec = ") !== -1) {
                    const parts = line.split(" ");
                    jobSpecName = parts[0];
                    break;
                }
            }

            // If job_spec name is still null, return
            if (jobSpecName === null) {
                console.log("Error setting job_spec params, no job_spec name found");
                return;
            }

            // Find correct line to replace
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                // Found the line!
                if (line.indexOf(codeToLookFor) !== -1) {
                    lineToSwap = i;
                }
            }

            // If the line wasn't found, error and return
            if (lineToSwap === null) {
                console.log("Could not find code line to update: " + paramName);
                return;
            }

            // Convert values to a string for inclusion
            let valueString = null;
            if (value.constructor === Array && value.length > 1) {
                const escapedStrings = [];
                valueString = '[';
                for (let i = 0; i < value.length; i++) {
                    const aValue = value[i];
                    escapedStrings.push('"' + this._escapeQuotes(aValue) + '"');
                }
                valueString += escapedStrings.join(", ") + ']';
            }
            else {
                valueString = '"' + this._escapeQuotes(value) + '"';
            }

            // Generate new code line
            const newLine = jobSpecName + '.set_parameter("' + paramName + '", ' + valueString + ')';

            // Add new code to lines
            lines.splice(lineToSwap, 1, newLine);

            // Set the new code
            code = lines.join("\n");
            this.options.cell.code_mirror.setValue(code);

            // Update the metadata
            GPNotebook.slider.set_parameter_metadata(this.options.cell, paramName, value);

            return code;
        },

        /**
         * Toggle the code view on or off
         */
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

        /**
         * Add the parameter to the form and return the widget
         *
         * @param param {GenePattern.Param}
         * @private
         */
        _addParam: function(param, form) {
            const required = param.optional() ? "" : "*";

            const paramBox = $("<div></div>")
                .addClass(" form-group gp-widget-task-param")
                .attr("name", param.name())
                .attr("title", param.name() + (required ? " (required)" : ""))
                .append(
                    $("<label></label>")
                        .addClass("col-sm-3 control-label gp-widget-task-param-name")
                        .text(Utils.display_name(param.name()) + required)
                )
                .append(
                    $("<div></div>")
                        .addClass("col-sm-9 gp-widget-task-param-wrapper")
                        .append(
                            $("<div></div>")
                                .addClass("gp-widget-task-param-input")
                        )
                        .append(
                            $("<div></div>")
                                .addClass("gp-widget-task-param-desc")
                                .html(param.description())
                        )
                );
            if (required) paramBox.addClass("gp-widget-task-required");

            // Add the correct input widget
            if (param.type() === "java.io.File" || param.type() === "file") {
                paramBox.find(".gp-widget-task-param-input").fileInput({
                    runTask: this,
                    param: param
                });
            }
            else if (param.choices() || param.type() === "choice") {
                paramBox.find(".gp-widget-task-param-input").choiceInput({
                    runTask: this,
                    param: param,
                    choices: param.choices(),
                    default: param.defaultValue()
                });
            }
            else if (param.type() === "java.lang.String" || param.type() === "text") {
                paramBox.find(".gp-widget-task-param-input").textInput({
                    runTask: this,
                    param: param,
                    default: param.defaultValue()
                });
            }
            else if (param.type() === "java.lang.Integer" || param.type() === "java.lang.Float" || param.type() === "number") {
                paramBox.find(".gp-widget-task-param-input").textInput({
                    runTask: this,
                    param: param,
                    default: param.defaultValue(),
                    type: "number"
                });
            }
            else if (param.type().toLowerCase() === "password") {
                paramBox.find(".gp-widget-task-param-input").textInput({
                    runTask: this,
                    param: param,
                    default: param.defaultValue(),
                    type: "password"
                });
            }
            else {
                console.log("Unknown input type for Run Task widget: " + param.name() + " " + param.type());
                this.errorMessage("Type error in parameter " + param.name() + ", defaulting to text input.");

                paramBox.find(".gp-widget-task-param-input").textInput({
                    runTask: this,
                    param: param,
                    default: param.defaultValue()
                });
            }

            form.append(paramBox);
            return paramBox.find(".gp-widget-task-param-input");
        },

        /**
         * From the input widget's element get the input widget's value
         *
         * @param inputDiv - The element that has been made into the widget
         * @returns {*}
         * @private
         */
        _getInputValue: function(inputDiv) {
            if ($(inputDiv).hasClass("nbtools-file")) {
                return $(inputDiv).fileInput("value");
            }
            else if ($(inputDiv).hasClass("nbtools-text")) {
                return $(inputDiv).textInput("value");
            }
            else if ($(inputDiv).hasClass("nbtools-choice")) {
                return $(inputDiv).choiceInput("value");
            }
            else {
                console.log("Unknown input widget type.");
                return null;
            }
        },

        /**
         * Show a success message to the user
         *
         * @param message - String containing the message to show
         */
        successMessage: function(message) {
            const messageBox = this.element.find(".gp-widget-task-message");
            messageBox.removeClass("alert-danger");
            messageBox.addClass("alert-success");
            messageBox.text(message);
            messageBox.show("shake", {}, 500);
        },

        /**
         * Show an error message to the user
         *
         * @param message - String containing the message to show
         */
        errorMessage: function(message) {
            const messageBox = this.element.find(".gp-widget-task-message");
            messageBox.removeClass("alert-success");
            messageBox.addClass("alert-danger");
            messageBox.text(message);
            messageBox.show("shake", {}, 500);
        },

        /**
         * Validate the current Run Task form
         */
        validate: function() {
            // Clear any existing error messages
            this.element.find(".gp-widget-task-message")
                .removeClass("alert-danger alert-success")
                .hide();

            let validated = true;
            const missing = [];
            const params = this.element.find(".gp-widget-task-param");

            // Validate each required parameter
            for (let i = 0; i < params.length; i++) {
                const param = $(params[i]);
                const required = param.hasClass("gp-widget-task-required");
                if (required) {
                    const input = param.find(".gp-widget-task-param-input");
                    const value = this._getInputValue(input);
                    if (value === null || value === "" || value.length === 0) {
                        param.addClass("gp-widget-task-param-missing");
                        missing.push(param.attr("name"));
                        validated = false;
                    }
                    else {
                        param.removeClass("gp-widget-task-param-missing");
                    }
                }
            }

            // Display message to user
            if (validated) {
                //this.successMessage("All required parameters present.");
            }
            else {
                this.errorMessage("Missing required parameters: " + missing.join(", "));
            }

            return validated;
        },

        /**
         * Creates the list of accepted kinds for the task
         *
         * @param params - List of gp.Param() objects
         * @private
         */
        _createKindsList: function(params) {
            const kindsSet = new Set();

            // Protect against null and undefined
            if (params === undefined || params === null) return [];

            $.each(params, function(index, param) {
                const kinds = param.kinds();
                if (kinds !== null && kinds !== undefined) {
                    kinds.forEach(function(kind) {
                        kindsSet.add(kind);
                    });
                }
            });

            // Transform Set() to Array() in way that is browser compatible
            const kindsArray = [];
            kindsSet.forEach(function(i) {
                kindsArray.push(i);
            });

            this._kinds = kindsArray;
        },

        /**
         * Returns a list of all Kinds accepted by the task. If the params for the task have not
         * been loaded yet, a null value will be returned.
         *
         * @returns {Array}
         */
        acceptedKinds: function() {
            return this._kinds;
        },

        toggle_job_options: function() {
            // Show the job options
            this.element.find(".gp-widget-task-job-options").slideToggle();

            // Show custom values in dropdowns
            this.element.find(".nbtools-custom-value").toggle();
        },

        reset_parameters: function() {
            const widget = this;

            // Reset each of the input variables
            const param_doms = widget.element.find(".gp-widget-task-form").find(".nbtools-text, .nbtools-file, .nbtools-choice");
            param_doms.each(function(i, dom) {
                const param_widget = $(dom).data("widget");
                if (param_widget) {
                    let default_value = param_widget.options.param.defaultValue().toString();
                    const param_name = param_widget.options.param.name();

                    param_widget.value(default_value, true);

                    // Update the code
                    param_widget._updateCode();
                }
                else {
                    console.log("ERROR: Unknown widget in reset_parameters()");
                }
            });
        },

        /**
         * Receives a file of the specified kind and sets the first matching param of that type
         * Report an error to the console if no matching parameter found.
         *
         * @param url
         * @param kind
         */
        receive_file: function(url, name, kind) {
            const uiParams = this.element.find(".gp-widget-task-param");
            let matched = false;
            $.each(uiParams, function(i, uiParam) {
                const paramWidget = $(uiParam).find(".gp-widget-task-param-input").data("widget");
                const param = paramWidget._param;
                if (param.kinds !== undefined) {
                    const kinds = param.kinds();
                    if (kinds !== undefined && kinds !== null) {
                        kinds.every(function (k) {
                            if (Utils.wildcard_match(name, k)) {
                                // Found a match!
                                matched = true;
                                // Set the value
                                paramWidget.value(url);
                                // Update the code
                                paramWidget._updateCode();
                                // Return and stop looping
                                return false;
                            }
                            else return true;
                        });
                        // Break from the $.each loop if a match has been found
                        if (matched) return false;
                    }
                }
            });

            // No match was found
            if (!matched) {
                const task = this.options.session.task(this.options.lsid);
                console.log("ERROR: No kind match found for " + url + " of kind " + kind + " in " + task.name());
            }
        },

        /**
         * Given the DOM node for a parameter, obtain and return the parameter's name
         * @param uiParam
         * @private
         */
        _getParamName: function(uiParam) {
            return $(uiParam).attr("name");
        },

        /**
         * Submit the Run Task form to the server
         */
        submit: function() {
            const widget = this;

            // Create the job input
            widget.getTask(function(task) {
                const jobInput = task.jobInput();

                widget.uploadAll({
                    success: function() {
                        widget.evaluateAllVars({
                            success: function() {
                                // Assign values from the inputs to the job input
                                const uiParams = widget.element.find(".gp-widget-task-param");
                                for (let i = 0; i < uiParams.length; i++) {
                                    const uiParam = $(uiParams[i]);
                                    const uiInput = uiParam.find(".gp-widget-task-param-input");
                                    let uiValue = widget._getInputValue(uiInput);
                                    const uiName = widget._getParamName(uiParam);

                                    if (uiValue !== null) {
                                        // Wrap value in list if not already wrapped
                                        if (uiValue.constructor !== Array) {
                                            uiValue = [uiValue];
                                        }

                                        const objParam = jobInput.param(uiName);
                                        objParam.values(uiValue);
                                    }
                                }

                                // Submit the job input
                                jobInput.submit({
                                    success: function(response, jobNumber) {
                                        // Trigger the job submitted custom event
                                        widget.element.closest(".cell").trigger("gp.jobSubmitted");

                                        // Was a new cell created?
                                        let cell_created = false;

                                        // Collapse the task widget
                                        widget.expandCollapse(false);

                                        // Find the associated job widget and add the job output section, if necessary
                                        let cell = widget.options.cell;
                                        widget.add_job_widget(cell, widget.options.session_index, jobNumber);

                                        // Create a new cell for the job widget, if necessary
                                        if (!cell) {
                                            cell_created = true;
                                            cell = Jupyter.notebook.insert_cell_below();
                                        }

                                        // Set the code for the job widget
                                        const code = GPNotebook.slider.build_job_code(cell, widget.options.session_index, jobNumber);

                                        // Execute if the cell if a new one was created
                                        if (cell_created) cell.execute();

                                        // Otherwise, run the code in the background
                                        else Jupyter.notebook.kernel.execute(code, {});
                                    },
                                    error: function(exception) {
                                        widget.errorMessage("Error submitting job: " + exception.statusText);
                                    }
                                });
                            },
                            error: function(exception) {
                                widget.errorMessage("Error evaluating kernel variables in preparation of job submission: " + exception.statusText);
                            }
                        });
                    },
                    error: function(exception) {
                        widget.errorMessage("Error uploading in preparation of job submission: " + exception.statusText);
                    }
                });
            });
        },

        /**
         * Iterate through every input parameter and evaluate any kernel variables
         * found, then make a callback
         *
         * @param pObj - Object containing the following params:
         *                  success: Callback for success, expects no arguments
         *                  error: Callback on error, expects exception
         */
        evaluateAllVars: function(pObj) {
            const inputWidgets = this.element.find(".gp-widget-task-param-input");
            let evalCallsFinished = false;
            let evalsNeeded = 0;
            let evalsFinished = 0;

            // Iterate over each widget
            for (let i = 0; i < inputWidgets.length; i++) {
                const iWidget = $(inputWidgets[i]).data("widget");
                let value = iWidget.value();

                // Protect against nulls
                if (value === null || value === undefined) value = [];

                const makeCall = function(iWidget, value, valueIndex) {
                    VariableManager.evaluateVariables(value, function(evalValue) {
                        if (valueIndex === undefined) iWidget._value = evalValue;
                        else iWidget._values[valueIndex] = evalValue;

                        // Count this as an eval finished
                        evalsFinished++;

                        // Make the final callback once ready
                        if (evalCallsFinished && evalsFinished === evalsNeeded) pObj.success();
                    });
                };

                // If value is not a list, evaluate and set
                if (!Array.isArray(value)) {
                    // Count this as an eval needed
                    evalsNeeded++;

                    makeCall(iWidget, value);
                }
                // Otherwise, iterate over the list, evaluate and set
                else {
                    evalsNeeded += value.length;

                    for (let j = 0; j < value.length; j++) {
                        const valueIndex = j;
                        const innerValue = value[j];

                        makeCall(iWidget, innerValue, valueIndex);
                    }
                }
            }

            // All calls for evaluation have been made
            evalCallsFinished = true;

            // Check one last time to see if we need to make the final callback
            if (evalCallsFinished && evalsFinished === evalsNeeded) pObj.success();
        },

        /**
         * Upload all the file inputs that still need uploading
         *
         * @param pObj - Object containing the following params:
         *                  success: Callback for success, expects no arguments
         *                  error: Callback on error, expects exception
         * @returns {boolean} - Whether an upload was just initiated or not
         */
        uploadAll: function(pObj) {
            const fileWidgets = this.element.find(".nbtools-file");
            const widget = this;
            const uploadList = [];
            let error = false;

            // Create upload list
            for (let i = 0; i < fileWidgets.length; i++) {
                const fileWidget = $(fileWidgets[i]).data("widget");
                let values = fileWidget.values();

                // Protect against nulls
                if (values === null || values === undefined) values = [];

                $.each(values, function(i, e) {
                    if (typeof e === 'object') {
                        uploadList.push({
                            file: e,
                            widget: fileWidget
                        });
                    }
                });
            }

            // Declare finalizeUploads()
            const finalizeUploads = function() {
                if (error) {
                    pObj.error(error);
                }
                else {
                    pObj.success();
                }
            };

            // Declare grabNextUpload()
            const grabNextUpload = function() {
                // Pop the upload off the list
                const upload = uploadList.shift();

                // If it's not undefined, upload
                if (upload !== undefined) {
                    widget.successMessage("Uploading file " + upload.file.name);
                    upload.widget.upload({
                        file: upload.file,
                        success: function(response, url) {
                            // On the success callback call grabNextUpload()
                            grabNextUpload();
                        },
                        error: function(exception) {
                            // On the error callback set the error and call finalize
                            error = exception;
                            finalizeUploads();
                        }
                    });
                }

                // If it is undefined, call finalizeUploads()
                else {
                    finalizeUploads();
                }
            };

            // Start the uploads
            grabNextUpload();
        }
    });

    const TaskWidgetView = widgets.DOMWidgetView.extend({
        render: function () {
            const widget = this;
            let cell = this.options.cell;

            // Ugly hack for getting the Cell object in ipywidgets 7
            if (!cell) cell = widget.options.output.element.closest(".cell").data("cell");

            let code = null;

            // Protect against double-rendering
            if (cell.element.find(".gp-widget").length > 0) return;

            const lsid = widget.model.get('lsid');
            const name = widget.model.get('name');

            // Check to see if this is a legacy task widget, if so update the code
            if (!('genepattern' in cell.metadata) ||
                cell.get_text().indexOf("gp.GPTask(gpserver") > -1 ||
                cell.get_text().indexOf("genepattern.GPTaskWidget") > -1) {
                code = cell.get_text().replace("genepattern.GPTaskWidget", "genepattern.display");
                code = code.replace("# !AUTOEXEC\n\n", "");

                // Add the metadata
                GPNotebook.slider.make_genepattern_cell(cell, "task", {}); // Task name unknown

                // Add the code to the cell
                cell.set_text(code);
            }

            // Render the view.
            if (!this.el) widget.setElement($('<div></div>'));


            // Render the cell and hide code by default
            const element = this.$el;
            const hideCode = function() {
                const cell_div = element.closest(".cell");
                if (cell_div.length > 0) {
                    // Determine which identifier is used and render the cell
                    if (lsid) {
                        $(widget.$el).runTask({
                            lsid: lsid,
                            cell: cell
                        });
                    }
                    else {
                        $(widget.$el).runTask({
                            name: name,
                            cell: cell
                        });
                    }

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

    return {
        TaskWidgetView: TaskWidgetView
    }
});