/**
 * Define the IPython GenePattern Job widget
 *
 * @author Thorin Tabor
 * @requires - jQuery, navigation.js
 *
 * Copyright 2015 The Broad Institute, Inc.
 *
 * SOFTWARE COPYRIGHT NOTICE
 * This software and its documentation are the copyright of the Broad Institute, Inc. All rights are reserved.
 * This software is supplied without any warranty or guaranteed support whatsoever. The Broad Institute is not
 * responsible for its use, misuse, or functionality.
 */

define("gp_job", ["base/js/namespace",
                  "nbextensions/jupyter-js-widgets/extension",
                  "nbextensions/genepattern/index",
                  "jqueryui"], function (Jupyter, widgets) {

    /**
     * Widget for viewing the job results of a launched job.
     *
     * Supported Features:
     *      Job Status
     *      Access to Job Results
     *      Access to Logs
     *      Job Sharing & Permissions
     *      Visibility into Child Jobs
     *
     * Non-Supported Features:
     *      Access to Job Inputs
     *      Batch Jobs
     */
    $.widget("gp.jobResults", {
        options: {
            jobNumber: null,    // The job number
            poll: true,         // Poll to refresh running jobs
            job: null,          // Job object this represents
            childJob: false     // If this is a child job
        },

        /**
         * Constructor
         *
         * @private
         */
        _create: function() {
            var widget = this;

            // Ensure the job number is defined
            if ((isNaN(this.options.jobNumber) || this.options.jobNumber === null) && !this.options.json) {
                throw "The job number is not correctly defined, cannot create job results widget";
            }

            // Add data pointer
            this.element.data("widget", this);

            // Add class and child elements
            this.element.addClass("panel panel-default gp-widget gp-widget-job");
            this.element.append(
                $("<div></div>")
                    .addClass("panel-heading gp-widget-job-header")
                    .append(
                        $("<div></div>")
                            .addClass("widget-float-right")
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-job-buttons")
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
                                                                    .attr("title", "Share Job")
                                                                    .attr("href", "#")
                                                                    .append("Share Job")
                                                                    .click(function() {
                                                                        widget.buildSharingPanel();
                                                                    })
                                                            )
                                                    )
                                                    .append(
                                                        $("<li></li>")
                                                            .append(
                                                                $("<a></a>")
                                                                    .attr("title", "Duplicate Analysis")
                                                                    .attr("href", "#")
                                                                    .append("Duplicate Analysis")
                                                                    .click(function() {
                                                                        widget.reloadJob();
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
                                                                        widget.toggleCode();
                                                                    })
                                                            )
                                                    )
                                            )
                                    )
                            )
                    )
                    .append(
                        $("<img/>")
                            .addClass("gp-widget-logo")
                            .attr("src", Jupyter.notebook.base_url + "nbextensions/genepattern/resources/" + "GP_logo_on_black.png")
                    )
                    .append(
                        $("<h3></h3>")
                            .addClass("panel-title")
                            .append(
                                $("<span></span>")
                                    .addClass("gp-widget-job-task")
                            )
                    )
            );
            this.element.append(
                $("<div></div>")
                    .addClass("panel-body")
                    .append(
                        $("<div></div>")
                            .addClass("gp-widget-job-body-wrapper")
                            .append( // Attach message box
                                $("<div></div>")
                                    .addClass("alert gp-widget-job-message")
                                    .css("display", "none")
                            )
                            .append(
                                $("<div></div>")
                                    .addClass("widget-float-right gp-widget-job-status")
                            )
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-job-share-options")
                                    .css("display", "none")
                            )
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-job-submitted")
                            )
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-job-outputs")
                            )
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-job-visualize")
                            )
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-job-children")
                            )
                    )
                    .append(
                        $("<div></div>")
                            .addClass("widget-code gp-widget-job-code")
                            .css("display", "none")
                    )
            );

            // Set as child job, if necessary
            if (this.options.childJob) {
                this.element.find(".gp-widget-job-share").hide();
                this.element.find(".gp-widget-job-reload").hide();
                this.element.find(".gp-widget-job-codetoggle").hide();
                this.element.find(".gp-widget-logo").hide();
            }

            // Check to see if the user is authenticated yet
            if (GenePattern.authenticated) {
                // If authenticated, load job status
                this._loadJobStatus();
            }
            else {
                // If not authenticated, display message
                this._showAuthenticationMessage();
                this._pollForAuth();
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
            this._updateSlider("destroy");
            this.element.removeClass("gp-widget gp-widget-job panel panel-default");
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
            this._loadJobStatus();
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
            var task = this.options.job.task();
            if (task !== null) {
                done(task);
                return task;
            }

            // Otherwise check the general GenePattern cache
            var identifier = this.options.job.taskLsid();
            task = GenePattern.task(identifier);
            if (task !== null) {
                this.options.job._task = task; // Associate this task with the widget
                done(task);
                return task;
            }

            // Otherwise call back to the server
            var widget = this;
            GenePattern.taskQuery({
                lsid: identifier,
                success: function(newTask) {
                    widget.options.job._task = newTask; // Associate this task with the widget
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
         * Expand or collapse the job widget
         */
        expandCollapse: function() {
            var toSlide = this.element.find("> .panel-body");
            var indicator = this.element.find(".widget-slide-indicator").find("span");
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

        /**
         * Construct the sharing panel from the job permissions
         *
         * @param job
         */
        buildSharingPanel: function() {
            var widget = this;
            var job = this.options.job;
            var optionsPane = $("<div></div>");
            var permissions = job.permissions();

            // Make sure that the permissions exist, if not return an error
            if (permissions === undefined || permissions === null) {
                optionsPane
                    .addClass("alert alert-danger")
                    .text("Job Permissions Not Found");
                return;
            }

            // Build alert box
            optionsPane.append(
                $("<div></div>").addClass("gp-widget-job-share-alert")
            );

            // Build the permissions table
            var table = $("<table></table>")
                .addClass("gp-widget-job-share-table");
            table.append(
                $("<tr></tr>")
                    .append(
                        $("<th></th>")
                            .text("Group")
                    )
                    .append(
                        $("<th></th>")
                            .text("Permissions")
                    )
            );

            var groups = permissions['groups'];
            $.each(groups, function(i, e) {
                var groupDisplayName = e['id'];
                if (groupDisplayName === "*") {
                    groupDisplayName = "Public";
                }
                var row = $("<tr></tr>")
                    .attr('name', e['id']);
                row.append(
                    $("<td></td>")
                        .text(groupDisplayName)
                );
                row.append(
                    $("<td></td>")
                        .append(
                            $("<input/>")
                                .attr("type", "radio")
                                .attr("name", e['id'])
                                .attr("id", "radio-" + job.jobNumber() + "-" + i + "-None")
                                .val("None")
                        )
                        .append(
                            $("<label></label>")
                                .attr("for", "radio-" + job.jobNumber() + "-" + i + "-None")
                                .text("None")
                        )
                        .append(
                            $("<input/>")
                                .attr("type", "radio")
                                .attr("name", e['id'])
                                .attr("id", "radio-" + job.jobNumber() + "-" + i + "-Read")
                                .val("Read")
                        )
                        .append(
                            $("<label></label>")
                                .attr("for", "radio-" + job.jobNumber() + "-" + i + "-Read")
                                .text("Read")
                        )
                        .append(
                            $("<input/>")
                                .attr("type", "radio")
                                .attr("name", e['id'])
                                .attr("id", "radio-" + job.jobNumber() + "-" + i + "-Write")
                                .val("Write")
                        )
                        .append(
                            $("<label></label>")
                                .attr("for", "radio-" + job.jobNumber() + "-" + i + "-Write")
                                .text("Read & Write")
                        )
                );
                table.append(row);

                // Select the right radio buttons
                if (!e["read"]) {
                    row.find("#radio-" + job.jobNumber() + "-" + i + "-None")
                        .attr("checked", "checked")
                }
                else if (e["read"] && !e["write"]) {
                    row.find("#radio-" + job.jobNumber() + "-" + i + "-Read")
                        .attr("checked", "checked")
                }
                else if (e["write"]) {
                    row.find("#radio-" + job.jobNumber() + "-" + i + "-Write")
                        .attr("checked", "checked")
                }
            });
            optionsPane.append(table);

            var dialog = require('base/js/dialog');
            dialog.modal({
                notebook: Jupyter.notebook,
                keyboard_manager: this.keyboard_manager,
                title : "Job Sharing",
                body : optionsPane,
                buttons : {
                    "Cancel" : {
                        "click": function() {
                        }
                    },
                    "Save" : {
                        "class" : "btn-primary",
                        "click" : function() {
                            // Bundle up permissions to save
                            var bundle = widget._bundlePermissions();

                            // Call to save permissions
                            widget._savePermissions(bundle,
                                // On success
                                function() {
                                    // Success message
                                    widget.element.find(".gp-widget-job-share-alert")
                                        .removeClass("alert-danger")
                                        .addClass("alert alert-success")
                                        .text("Permissions saved!");
                                    widget.options.job.permissions().groups = bundle;
                                },
                                // On fail
                                function() {
                                    // Error message
                                    widget.element.find(".gp-widget-job-share-alert")
                                        .removeClass("alert-success")
                                        .addClass("alert alert-danger")
                                        .text("Error saving permissions.")
                                        .show("shake", {}, 500);
                                });
                        }
                    }
                }
            });
        },

        /**
         * Save the permissions bundle back to the GenePattern server
         *
         * @private
         */
        _savePermissions: function(bundle, success, fail) {
            this.options.job.savePermissions({
                bundle: bundle,
                success: success,
                error: fail
            });
        },

        /**
         * Bundle the sharing permissions into a JSON object
         *
         * @private
         */
        _bundlePermissions: function() {
            var rawGroups = $(".gp-widget-job-share-table").find("tr");
            var toReturn = [];
            $.each(rawGroups, function(i, e) {
                var name = $(e).attr("name");
                // Skip the header row
                if (name === undefined || name === null || name === "") {
                    return;
                }
                // Get the radio value
                var group = {"id": name};
                var value = $(e).find("input:radio:checked").val();
                if (value === "Read") {
                    group["read"] = true;
                    group["write"] = false;
                    toReturn.push(group);
                }
                else if (value === "Write") {
                    group["read"] = true;
                    group["write"] = true;
                    toReturn.push(group);
                }
            });

            return toReturn;
        },

        /**
         * Remove unwanted code from reload, such as import statements and run_job
         *
         * @param code
         * @private
         */
        _stripUnwantedCode: function(code) {
            var lines = code.split("\n");
            var newCode = "# !AUTOEXEC\n\n";
            var taskVar = null;

            // Iterate over each line
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                var skip = false;

                // Determine if this is a skipped line
                if (line.trim().indexOf("import gp") === 0) { skip = true; }
                if (line.trim().indexOf("gpserver = ") === 0) { skip = true; }
                if (line.trim().indexOf("# Load the parameters") === 0) { skip = true; }
                if (line.trim().indexOf("gpserver.run_job") !== -1) { skip = true; }
                if (line.trim().indexOf(".param_load()") !== -1) { skip = true; }
                if (line.trim().length === 0) { skip = true; }

                // Identify taskVar if necessary
                if (taskVar === null && line.trim().indexOf("gp.GPTask") !== -1) {
                    taskVar = line.split(" ")[0];
                }

                // Append the code if it's not a skipped line
                if (!skip) {
                    newCode += line.trim() + "\n"
                }
            }

            // Append the widget view
            newCode += "\nGPTaskWidget(" + taskVar + ")";

            return newCode;
        },

        /**
         * Makes a duplicate of the job widget
         */
        cloneJob: function() {
            // Get the cell to clone
            var cell = this.element.closest(".cell").data("cell");

            // Get the job widget code
            var code = cell.code_mirror.getValue();

            // Create a new cell for the cloned job widget
            var clone = Jupyter.notebook.insert_cell_below();

            // Set the code for the job widget
            clone.code_mirror.setValue(code);

            // Execute cell
            clone.execute();
        },

        /**
         * Reloads the job in a Task widget
         */
        reloadJob: function() {
            var job = this.options.job;
            var widget = this;

            job.code("Python").done(function(code) {
                code = widget._stripUnwantedCode(code);
                var cell = Jupyter.notebook.insert_cell_below();

                // Put the code in the cell
                cell.code_mirror.setValue(code);

                // Execute the cell
                cell.execute();

                // Scroll to the new cell
                $('#site').animate({
                    scrollTop: $(cell.element).position().top
                }, 500);
            });
        },

        /**
         * Toggle the code view on or off
         */
        toggleCode: function() {
            var code = this.element.find(".gp-widget-job-code:last");
            var view = this.element.find(".gp-widget-job-body-wrapper:first");

            if (code.is(":hidden")) {
                this.element.closest(".cell").data("cell").code_mirror.refresh();
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
                view.slideDown();
                code.slideUp();
            }

            var collapsed = this.element.find(".widget-slide-indicator:first").find(".fa-plus").length > 0;
            if (collapsed) {
                this.expandCollapse();
            }
        },

        /**
         * Initialize polling as appropriate for options and status
         *
         * @param statusObj
         * @private
         */
        _initPoll: function(statusObj) {
            var running = !statusObj["hasError"] && !statusObj["completedInGp"];
            var widget = this;

            // If polling is turned on, attach the event
            if (this.options.poll && running) {
                setTimeout(function() {
                    widget._loadJobStatus();
                }, 10000);
            }
        },

        /**
         * Polls every few seconds to see if the notebook is authenticated, and gets job info once authenticated
         *
         * @private
         */
        _pollForAuth: function() {
            var widget = this;
            setTimeout(function() {
                // Check to see if the user is authenticated yet
                if (GenePattern.authenticated) {
                    // If authenticated, execute cell again
                    var cellElement = widget.element.closest(".cell");
                    if (cellElement.length > 0) {
                        var cellObject = cellElement.data("cell");
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
         * Update the left-hand slider with job information
         *
         * @private
         */
        _updateSlider: function(method) {
            if (method.toLowerCase() == "destroy") {
                // Remove only if this is the last instance of the job in the notebook
                var JobInstanceNum = $(".gp-widget-job[name='" + this.options.jobNumber + "']").length;
                if (JobInstanceNum === 1) {
                    GenePattern.notebook.removeSliderJob(this.options.jobNumber);
                }
            }
            // Else assume "update"
            else {
                GenePattern.notebook.updateSliderJob(this.options.job);
            }
        },

        /**
         * Show the message about authentication
         *
         * @private
         */
        _showAuthenticationMessage: function() {
            this.element.find(".gp-widget-job-task").text("Not Authenticated");
            this.errorMessage("You must be authenticated before the job information can be displayed. After you authenticate it may take a few seconds for the job information to appear.");

            // Update the reload button
            this.element.find(".gp-widget-job-reload").attr("disabled", "disabled");
        },

        /**
         * Make a quest to the server to update the job status, and then update the UI
         *
         * @private
         */
        _loadJobStatus: function() {
            // If JSON already loaded
            if (this.options.json) {
                var jsonObj = JSON.parse(this.options.json);
                var job = new GenePattern.Job(jsonObj);
                this._displayJob(job);
            }
            // If we need to load the JSON from the server
            else {
                var widget = this;

                GenePattern.job({
                    jobNumber: this.options.jobNumber,
                    force: true,
                    permissions: true,
                    success: function(response, job) {
                        // Set the job object
                        widget.options.job = job;

                        // Update the widget
                        widget._displayJob(job);

                        // Update the slider
                        widget._updateSlider("update");

                        // Enable the code button
                        widget.element.find(".gp-widget-job-reload").removeAttr("disabled");
                    },
                    error: function() {
                        // Clean the old data
                        widget._clean();

                        // Display the error
                        widget.element.find(".gp-widget-job-task").text("Error");
                        widget.errorMessage("Error loading job: " + widget.options.jobNumber);

                        // Update the code button
                        widget.element.find(".gp-widget-job-reload").attr("disabled", "disabled");
                    }
                });
            }
        },

        /**
         * Display the widget for the job object
         *
         * @param job
         * @private
         */
        _displayJob: function(job) {
            var widget = this;

            // Clean the old data
            this._clean();

            // Set the job number
            this.element.attr("name", job.jobNumber());

            // Display the job number and task name
            var taskText = " " + job.jobNumber() + ". " + job.taskName();
            this.element.find(".gp-widget-job-task:first").text(taskText);

            // Display the user and date submitted
            var submittedText = "Submitted by " + job.userId() + " on " + job.dateSubmitted();
            this.element.find(".gp-widget-job-submitted:first").text(submittedText);

            // Display the status
            var statusText = this._statusText(job.status());
            this.element.find(".gp-widget-job-status:first").text(statusText);

            // Display the job results
            var outputsList = this._outputsList(job.outputFiles(), true);
            this.element.find(".gp-widget-job-outputs:first").append(outputsList);

            // Display the log files
            var logList = this._outputsList(job.logFiles(), false);
            this.element.find(".gp-widget-job-outputs:first").append(logList);

            // Enable sharing button, if necessary
            var permissions = job.permissions();
            if (permissions !== undefined && permissions !== null && permissions['canSetPermissions']) {
                this.element.find(".gp-widget-job-share:first").removeAttr("disabled");
            }

            // Display error if Java visualizer
            this.getTask(function(task) {
                if (task !== null && task !== undefined) {
                    var categories = task.categories();
                    if (categories.indexOf("Visualizer") !== -1) {
                        widget.errorMessage("This job appears to be a deprecated Java-based visualizer. These visualizers are not supported in the GenePattern Notebook.");
                        widget.element.find(".gp-widget-job-submitted").hide();
                        widget.element.find(".gp-widget-job-status").hide();
                    }
                }
            });

            // Build the visualizer display, if necessary
            var launchUrl = job.launchUrl();
            if (launchUrl !== undefined && launchUrl !== null) {
                this._displayVisualizer(launchUrl);
            }

            // Build the display of child jobs, if necessary
            var children = job.children();
            if (children !== undefined && children !== null && children.length > 0) {
                this._displayChildren(children);
            }

            // Initialize status polling if top-level job
            if (!this.options.childJob) {
                this._initPoll(job.status());
            }
        },

        /**
         * Show a success message to the user
         *
         * @param message - String containing the message to show
         */
        successMessage: function(message) {
            var messageBox = this.element.find(".gp-widget-job-message");
            messageBox.removeClass("alert-danger");
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
            var messageBox = this.element.find(".gp-widget-job-message");
            messageBox.removeClass("alert-success");
            messageBox.addClass("alert-danger");
            messageBox.text(message);
            messageBox.show("shake", {}, 500);
        },

        /**
         * Build the display of the JavaScript Visualizer
         *
         * @param launchUrl - The URL to visualize
         * @private
         */
        _displayVisualizer: function(launchUrl) {
            var viewerDiv = this.element.find(".gp-widget-job-visualize:first");

            // Check if the visualizer has already been displayed
            var displayed = viewerDiv.find("iframe").length > 0;

            // Check whether the launchUrl is relative
            if (launchUrl.indexOf("/") === 0) {
                // Get server launchUrl without /gp
                launchUrl = launchUrl.slice(3);

                // Make into a full URL
                launchUrl = GenePattern.server() + launchUrl;
            }

            // Display the visualizer if not already displayed
            if (!displayed) {
                var urlWithToken = launchUrl + "#" + GenePattern.token;

                viewerDiv.append(
                    $("<iframe/>")
                        .css("width", "100%")
                        .css("height", "500px")
                        .css("overflow", "auto")
                        .css("margin-top", "10px")
                        .css("border", "1px solid rgba(10, 45, 105, 0.80)")
                        .attr("src", urlWithToken)
                );

                // Add the pop out button
                var gearMenu = this.element.find(".gear-menu");
                gearMenu.prepend(
                    $("<li></li>")
                        .append(
                            $("<a></a>")
                                .attr("title", "Pop Out Visualizer")
                                .attr("href", "#")
                                .append("Pop Out Visualizer")
                                .click(function() {
                                    window.open(urlWithToken);
                                })
                        )
                );
            }
        },

        /**
         * Build the display of child widgets
         *
         * @param children - List of Job() objects for children
         * @private
         */
        _displayChildren: function(children) {
            var childrenDiv = this.element.find(".gp-widget-job-children:first");
            childrenDiv.css("margin-top", "10px");
            childrenDiv.empty();

            // For each child, append a widget
            children.forEach(function(child) {
                var childWidget = $("<div></div>")
                    .addClass("gp-widget-job-child")
                    .jobResults({
                        jobNumber: child.jobNumber(),
                        childJob: true
                    });
                childrenDiv.append(childWidget);
            });
        },

        /**
         * Return the display of the job's status
         *
         * @param statusObj - The status object returned by the server
         * @returns {string} - Display text of the status
         * @private
         */
        _statusText: function(statusObj) {
            if (statusObj["hasError"]) {                // Error
                return "Error";
            }
            else if (statusObj["completedInGp"]) {      // Complete
                return "Completed"
            }
            else if (statusObj["isPending"]) {          // Pending
                return "Pending";
            }
            else {                                      // Running
                return "Running";
            }
        },

        /**
         * Return a div containing the file outputs formatted for display
         *
         * @param outputs - structure containing the output file data
         * @param fullMenu - whether to include more menu options than simple viewing
         * @returns {*|jQuery|HTMLElement}
         * @private
         */
        _outputsList: function(outputs, fullMenu) {
            var widget = this;
            var outputsList = $("<div></div>")
                .addClass("gp-widget-job-outputs-list");

            if (outputs) {
                for (var i = 0; i < outputs.length; i++) {
                    var wrapper = $("<div></div>");
                    var indexString = i.toString();
                    var output = outputs[i];
                    var link = $("<a></a>")
                        .text(output["link"]["name"] + " ")
                        .attr("href", output["link"]["href"])
                        .attr("onclick", "return false;")
                        .attr("data-toggle", "popover")
                        .append(
                            $("<i></i>")
                                .addClass("fa fa-info-circle")
                                .css("color", "gray")
                        )
                        .click(function() {
                            $(".popover").popover("hide");
                        });

                    // Build and attach the file menu
                    GenePattern.notebook.buildMenu(widget, link, output["link"]["name"], output["link"]["href"], output["kind"], indexString, fullMenu);

                    link.appendTo(wrapper);
                    wrapper.appendTo(outputsList);
                }
            }
            else {
                outputsList.text("No output files.");
            }

            return outputsList;
        },

        /**
         * Insert a cell with code referencing the output file
         *
         * @param job
         * @param fileName
         */
        codeCell: function(job, fileName) {
            var var_name = fileName.toLowerCase().replace(/\./g, '_') + "_" + job.jobNumber();
            var code = "# More documentation can be obtained at the GenePattern website, or by calling help(job" + job.jobNumber() + ").\n" +
                       var_name + " = " + "job" + job.jobNumber() + ".get_file(\"" + fileName + "\")\n" +
                       var_name;
            var cell = Jupyter.notebook.insert_cell_below();
            cell.code_mirror.setValue(code);
        },

        dataFrameCell: function(job, fileName, kind) {
            var var_name = fileName.toLowerCase().replace(/\./g, '_') + "_" + job.jobNumber();
            var kind_import = kind === "gct" ? "gct" : "odf";
            var code = "# The code below will only run if pandas is installed: http://pandas.pydata.org\n" +
                       "from gp.data import " + kind_import.toUpperCase() + "\n" +
                       var_name + " = " + kind_import.toUpperCase() + "(job" + job.jobNumber() + ".get_file(\"" + fileName + "\"))\n" +
                       var_name;
            var cell = Jupyter.notebook.insert_cell_below();
            cell.code_mirror.setValue(code);
        },

        /**
         * Remove the display data from the widget
         *
         * @private
         */
        _clean: function() {
            this.element.find(".gp-widget-job-task").empty();
            this.element.find(".gp-widget-job-submitted").empty();
            this.element.find(".gp-widget-job-status").empty();
            this.element.find(".gp-widget-job-outputs").empty();
        },

        /**
         * Getter for the associated job number
         *
         * @returns {null|number}
         */
        jobNumber: function() {
            return this.options.jobNumber;
        }
    });

    var JobWidgetView = widgets.DOMWidgetView.extend({
        render: function () {
            // Render the view.
            this.setElement($('<div></div>'));
            var jobNumber = this.model.get('job_number');
            $(this.$el).jobResults({
                jobNumber: jobNumber
            });

            // Hide the code by default
            var element = this.$el;
            var hideCode = function() {
                var cell = element.closest(".cell");
                if (cell.length > 0) {
                    // Protect against the "double render" bug in Jupyter 3.2.1
                    element.parent().find(".gp-widget-job:not(:first-child)").remove();

                    element.closest(".cell").find(".input")
                    .css("height", "0")
                    .css("overflow", "hidden");
                }
                else {
                    setTimeout(hideCode, 10);
                }
            };
            setTimeout(hideCode, 1);
        }
    });

    return {
        JobWidgetView: JobWidgetView
    }
});