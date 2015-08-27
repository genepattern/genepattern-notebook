/**
 * Define the IPython GenePattern Job widget
 */
require(["widgets/js/widget", "widgets/js/manager", "jqueryui"], function (widget, manager) {
    /**
     * Widget for viewing the job results of a launched job.
     *
     * Supported Features:
     *      Job Status
     *      Access to Job Results
     *      Access to Logs
     *      Job Sharing & Permissions
     *
     * Non-Supported Features:
     *      Access to Job Inputs
     *      Visibility into Child Jobs
     *      Batch Jobs
     */
    $.widget("gp.jobResults", {
        options: {
            jobNumber: null,    // The job number
            poll: true,         // Poll to refresh running jobs
            job: null           // Job object this represents
        },

        /**
         * Constructor
         *
         * @private
         */
        _create: function() {
            var widget = this;

            // Ensure the job number is defined
            if (typeof this.options.jobNumber !== 'number' && !this.options.json) {
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
                                            .addClass("btn btn-default btn-sm gp-widget-job-share")
                                            .css("padding", "2px 7px")
                                            .attr("title", "Share Job")
                                            .attr("data-toggle", "tooltip")
                                            .attr("data-placement", "bottom")
                                            .attr("disabled", "disabled")
                                            .append(
                                                $("<span></span>")
                                                    .addClass("fa fa-share")
                                            )
                                            .tooltip()
                                            .click(function() {
                                                widget.toggleShareJob();
                                            })
                                    )
                                    .append(" ")
                                    .append(
                                        $("<button></button>")
                                            .addClass("btn btn-default btn-sm gp-widget-job-reload")
                                            .css("padding", "2px 7px")
                                            .attr("title", "Reload Task Form")
                                            .attr("data-toggle", "tooltip")
                                            .attr("data-placement", "bottom")
                                            .append(
                                                $("<span></span>")
                                                    .addClass("fa fa-refresh")
                                            )
                                            .tooltip()
                                            .click(function() {
                                                widget.reloadJob();
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
                    )
                    .append(
                        $("<img/>")
                            .addClass("gp-widget-logo")
                            .attr("src", "/static/genepattern/GP_logo_on_black.png")
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
                    )
                    .append(
                        $("<div></div>")
                            .addClass("widget-code gp-widget-job-code")
                            .css("display", "none")
                    )
            );

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
         * Construct the sharing panel from the job permissions
         *
         * @param job
         */
        buildSharingPanel: function(job) {
            var widget = this;
            var optionsPane = this.element.find(".gp-widget-job-share-options");
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

            // Build the header
            optionsPane.append(
                $("<h4></h4>").text("Job Sharing")
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

            // Attach button group
            optionsPane
                .append(
                    $("<button></button>")
                        .addClass("btn btn-success")
                        .text("Save")
                        .click(function() {
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
                                    widget.toggleShareJob();
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
                        })
                )
                .append(" ")
                .append(
                    $("<button></button>")
                        .addClass("btn btn-default")
                        .text("Cancel")
                        .click(function() {
                            // Hide sharing panel
                            widget.toggleShareJob();
                        })
                )
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
            var rawGroups = this.element.find(".gp-widget-job-share-table").find("tr");
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
         * Prompt for sharing the job
         */
        toggleShareJob: function() {
            var sharePanel = this.element.find(".gp-widget-job-share-options");

            if (sharePanel.is(":visible")) {
                // Hide sharing panel
                sharePanel.slideUp();

                // Display other parts of the panel
                this.element.find(".gp-widget-job-submitted").slideDown();
                this.element.find(".gp-widget-job-outputs-list").slideDown();
                this.element.find(".gp-widget-job-visualize").slideDown();
            }
            else {
                // Display sharing panel
                sharePanel.slideDown();

                // Hide other parts of the panel
                this.element.find(".gp-widget-job-submitted").slideUp();
                this.element.find(".gp-widget-job-outputs-list").slideUp();
                this.element.find(".gp-widget-job-visualize").slideUp();
            }
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
         * Reloads the job in a Task widget
         */
        reloadJob: function() {
            var dialog = require('base/js/dialog');
            var job = this.options.job;
            var widget = this;
            //var cell = this.element.closest(".cell").data("cell");

            dialog.modal({
                notebook: IPython.notebook,
                keyboard_manager: this.keyboard_manager,
                title : "Reload Job?",
                body : "Are you sure you want to reload the job? This will leave the current " +
                       "job widget in place and insert a copy of its task widget below.",
                buttons : {
                    "Cancel" : {},
                    Reload : {
                        "class" : "btn-danger",
                        "click" : function() {
                            job.code("Python").done(function(code) {
                                code = widget._stripUnwantedCode(code);
                                var cell = IPython.notebook.insert_cell_below();

                                // Put the code in the cell
                                cell.code_mirror.setValue(code);

                                // Execute the cell
                                cell.execute();
                            });
                        }
                    }
                }
            });
        },

        /**
         * Toggle the code view on or off
         */
        toggleCode: function() {
            var code = this.element.find(".gp-widget-job-code");
            var view = this.element.find(".gp-widget-job-body-wrapper");

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
            // Clean the old data
            this._clean();

            // Set the job number
            this.element.attr("name", job.jobNumber());

            // Display the job number and task name
            var taskText = " " + job.jobNumber() + ". " + job.taskName();
            this.element.find(".gp-widget-job-task").text(taskText);

            // Display the user and date submitted
            var submittedText = "Submitted by " + job.userId() + " on " + job.dateSubmitted();
            this.element.find(".gp-widget-job-submitted").text(submittedText);

            // Display the status
            var statusText = this._statusText(job.status());
            this.element.find(".gp-widget-job-status").text(statusText);

            // Display the job results
            var outputsList = this._outputsList(job.outputFiles(), true);
            this.element.find(".gp-widget-job-outputs").append(outputsList);

            // Display the log files
            var logList = this._outputsList(job.logFiles(), false);
            this.element.find(".gp-widget-job-outputs").append(logList);

            // Enable sharing button, if necessary
            var permissions = job.permissions();
            if (permissions !== undefined && permissions !== null && permissions['canSetPermissions']) {
                this.element.find(".gp-widget-job-share").removeAttr("disabled");
            }

            // Display error if Java visualizer
            var task = job.task();
            if (task !== null && task !== undefined) {
                var categories = task.categories();
                if (categories.indexOf("Visualizer") !== -1) {
                    this.errorMessage("This job appears to be a deprecated Java-based visualizer. These visualizers are not supported in the GenePattern Notebook.");
                }
            }

            // Build the sharing pane
            this.buildSharingPanel(job);

            // Build the visualizer display, if necessary
            var launchUrl = job.launchUrl();
            if (launchUrl !== undefined && launchUrl !== null) {
                this._displayVisualizer(launchUrl);
            }

            // Initialize status polling
            this._initPoll(job.status());
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
            var viewerDiv = this.element.find(".gp-widget-job-visualize");

            // Check if the visualizer has already been displayed
            var displayed = viewerDiv.find("iframe").length > 0;

            // Display the visualizer if not already displayed
            if (!displayed) {
                viewerDiv.append(
                    $("<iframe/>")
                        .css("width", "100%")
                        .css("height", "500px")
                        .css("overflow", "auto")
                        .css("margin-top", "10px")
                        .css("border", "1px solid rgba(10, 45, 105, 0.80)")
                        .attr("src", launchUrl + "#" + GenePattern.token)
                );
            }
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
         * Construct and return a file menu for the provided output file
         *
         * @param link - Link to attach menu to
         * @param output - Data structure for the output file
         * @param indexString - String containing output file index
         * @param fullMenu - Whether this is a full menu or a log file menu
         * @returns {*|jQuery|HTMLElement}
         * @private
         */
        _buildMenu: function(link, output, indexString, fullMenu) {
            var widget = this;

            // Attach simple menu
            if (!fullMenu) {
                link.popover({
                    title: "",
                    content: $("<div></div>")
                        .addClass("list-group")
                        .append(
                            $("<label></label>")
                                .text(output["link"]["name"])
                        )
                        .append(
                            $("<a></a>")
                                .addClass("list-group-item")
                                .text("Open in New Tab")
                                .attr("href", output["link"]["href"])
                                .attr("target", "_blank")
                        ),
                    html: true,
                    placement: "right",
                    trigger: "click"
                });
            }
            // Attach advanced menu
            else {
                var popover = $("<div></div>")
                    .addClass("list-group")
                    .append(
                        $("<label></label>")
                            .text(output["link"]["name"])
                    )
                    .append(
                        $("<a></a>")
                            .addClass("list-group-item")
                            .text("Open in New Tab")
                            .attr("href", output["link"]["href"])
                            .attr("target", "_blank")
                    )
                    .append(
                        $("<a></a>")
                            .addClass("list-group-item gp-widget-job-view-code")
                            .text("View Code Use")
                            .attr("href", "#")
                    )
                    .append(
                        $("<div></div>")
                            .append(
                                $("<label></label>")
                                    .css("padding-top", "10px")
                                    .text("Send to Downstream Task")
                            )
                            .append(
                                $("<select></select>")
                                    .addClass("form-control gp-widget-job-existing-task")
                                    .css("margin-left", "0")
                                    .append(
                                        $("<option></option>")
                                            .text("----")
                                    )
                            )
                    )
                    .append(
                        $("<div></div>")
                            .append(
                                $("<label></label>")
                                    .css("padding-top", "10px")
                                    .text("Send to New Task")
                            )
                            .append(
                                $("<select></select>")
                                    .addClass("form-control gp-widget-job-new-task")
                                    .css("margin-left", "0")
                                    .append(
                                        $("<option></option>")
                                            .text("----")
                                    )
                            )
                    );

                link.popover({
                    title: "",
                    content: popover,
                    html: true,
                    placement: "right",
                    trigger: "click"
                });

                // Add options to "Send to New Task" dropdown, or hide if none
                var modules = null;
                var kind = Array.isArray(output['kind']) ? output['kind'][0] : output['kind'];
                var sendToNewTask = popover.find('.gp-widget-job-new-task');
                var kindsMap = GenePattern.kinds();
                if (kindsMap !==  null && kindsMap !== undefined) {
                    modules = kindsMap[kind];
                    $.each(modules, function(i, module) {
                        sendToNewTask.append(
                            $("<option></option>")
                                .attr("data-lsid", module.lsid())
                                .text(module.name())
                        )
                    });
                }
                if (modules === null || modules.length === 0) {
                    sendToNewTask.parent().hide();
                }

                // Attach methods in a way that will not break when popover is hidden
                link.on('shown.bs.popover', function () {
                    // Attach the click method to "view code"
                    link.parent().find(".gp-widget-job-view-code").click(function() {
                        widget.codeDialog(widget.options.job, indexString);
                        $(".popover").popover("hide");
                    });

                    // Attach "Send to New Task" clicks
                    link.parent().find(".gp-widget-job-new-task").change(function(event) {
                        var option = $(event.target).find(":selected");
                        var lsid = option.attr("data-lsid");
                        if (lsid === undefined || lsid === null) return;
                        var name = option.text();
                        var cell = IPython.notebook.insert_cell_at_bottom();
                        var code = GenePattern.notebook.buildModuleCode({"lsid":lsid, "name": name});
                        cell.set_text(code);

                        // Execute the cell
                        setTimeout(function() {
                            cell.element.on("gp.widgetRendered", function() {
                                var widgetElement = cell.element.find(".gp-widget");
                                var widget = widgetElement.data("widget");
                                widgetElement.on("runTask.paramLoad", function() {
                                    widget.receiveFile(link.attr("href"), kind);
                                });
                            });
                            cell.execute();
                        }, 10);

                        // Hide the popover
                        $(".popover").popover("hide");

                        // Scroll to the new cell
                        $('#site').animate({
                            scrollTop: $(cell.element).position().top
                        }, 500);
                    });

                    // Dynamically add options to "Send to Downstream Task" dropdown
                    var sendToExistingTask = link.parent().find('.gp-widget-job-existing-task');
                    var matchingTasks = GenePattern.notebook.taskWidgetsForKind(kind);
                    sendToExistingTask
                        .empty()
                        .append(
                            $("<option></option>")
                                .text("----")
                        );
                    $.each(matchingTasks, function(i, pairing) {
                        var cellIndex = pairing[0];
                        var taskWidget = pairing[1];
                        sendToExistingTask
                            .append(
                                $("<option></option>")
                                    .text(taskWidget._task.name() + " [Cell " + cellIndex + "]")
                                    .data("widget", taskWidget)
                            );
                    });

                    // Add event to hand changes on the "Send to Downstream Task" dropdown
                    sendToExistingTask.change(function() {
                        var option = $(this).find(":selected");
                        var theWidget = option.data("widget");
                        theWidget.receiveFile(link.attr("href"), kind);

                        // Hide the popover
                        $(".popover").popover("hide");

                        // Scroll to the new cell
                        $('#site').animate({
                            scrollTop: $(theWidget.element).position().top
                        }, 500);
                    });
                });
            }

            // Make the "i" icon open the menus as well
            var icon = link.find(".fa-info-circle");
            icon.click(function(event) {
                $(this).parent().popover("show");
                event.preventDefault();
                event.stopPropagation();
            });

            return link;
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
                    widget._buildMenu(link, output, indexString, fullMenu);

                    link.appendTo(outputsList);
                }
            }
            else {
                outputsList.text("No output files.");
            }

            return outputsList;
        },

        /**
         * Display a dialog containing code for the job or output file
         *
         * @param job - the Job object
         * @param fileIndex - index for which output file this is
         */
        codeDialog: function(job, fileIndex) {
            var dialog = require('base/js/dialog');
            var jobCode = "thisJob = job" + job.jobNumber();
            var fileCode = "thisFile = job" + job.jobNumber() + ".get_output_files()[" + fileIndex + "]";

            dialog.modal({
                notebook: IPython.notebook,
                keyboard_manager: this.keyboard_manager,
                title : "Python Code",
                body : $("<div></div>")
                    .append(
                        $("<p></p>")
                            .text("The GenePattern jobs and files referenced by this widget can be accessed programmatically. "
                                + "To obtain a reference to the GPJob object, copy and paste the following code:")
                    )
                    .append(
                        $("<blockquote></blockquote>")
                            .append(
                                $("<code></code>")
                                    .text(jobCode)
                            )
                    )
                    .append(
                        $("<p></p>")
                            .text("To obtain a reference to the output file, the code below can be used:")
                    )
                    .append(
                        $("<blockquote></blockquote>")
                            .append(
                                $("<code></code>")
                                    .text(fileCode)
                            )
                    )
                    .append(
                        $("<p></p>")
                            .html("More documentation can be obtained at the GenePattern website, or by calling <code>help(job" + job.jobNumber() + ")</code>.")
                    ),
                buttons : {
                    "Close" : {}
                }
            });
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

    var JobWidgetView = widget.DOMWidgetView.extend({
        render: function () {
            // Double check to make sure that this is the correct cell
            if ($(this.options.cell.element).hasClass("running")) {
                // Render the view.
                this.setElement($('<div></div>'));
                var jobNumber = this.model.get('job_number');
                this.$el.jobResults({
                    jobNumber: jobNumber
                });

                // Hide the code by default
                var element = this.$el;
                setTimeout(function() {
                    // Protect against the "double render" bug in Jupyter 3.2.1
                    element.parent().find(".gp-widget-job:not(:first-child)").remove();

                    // Hide the code
                    element.closest(".cell").find(".input")
                        .css("height", "0")
                        .css("overflow", "hidden");
                }, 1);
            }
        }
    });

    // Register the JobWidgetView with the widget manager.
    manager.WidgetManager.register_widget_view('JobWidgetView', JobWidgetView);
});