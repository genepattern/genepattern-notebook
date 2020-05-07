/**
 * Define the IPython GenePattern Job widget
 *
 * @author Thorin Tabor
 * @requires - jQuery, navigation.js
 *
 * Copyright 2015-2020 Regents of the University of California & The Broad Institute
 */

define("genepattern/job", ["base/js/namespace",
                  "nbextensions/jupyter-js-widgets/extension",
                  "genepattern/navigation",
                  "jquery",
                  "nbtools/utils",], function (Jupyter, widgets, GPNotebook, $, Utils) {

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
            childJob: false,    // If this is a child job
            cell: null,
            session: null,
            session_index: null
        },

        /**
         * Constructor
         *
         * @private
         */
        _create: function() {
            const widget = this;
            const cell = this.options.cell;

            // Ensure the job number is defined
            if ((isNaN(this.options.jobNumber) || this.options.jobNumber === null) && !this.options.json) {
                throw "The job number is not correctly defined, cannot create job results widget";
            }

            // Add data pointer
            this.element.data("widget", this);

             // Attach the session, if necessary and possible
            if (!this.options.session && this.options.cell) {
                this.options.session_index = this._session_index_from_code();
                this.options.session = this._session_from_index(this.options.session_index);
            }

            // Add class and child elements
            this.element.addClass("panel panel-default nbtools-widget gp-widget gp-widget-job");
            this.element.append(
                $("<div></div>")
                    .addClass("gp-widget-job-float-right")
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
                    )
            );

            this._create_gear_menu(this.element.find(".gp-widget-job-buttons"));

            this.element.append(
                $("<div></div>")
                    .addClass("panel-heading gp-widget-job-header")
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
                                    .addClass("gp-widget-job-number")
                            )
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
                                    .addClass("row")
                                    .append(
                                        $("<div></div>")
                                            .addClass("gp-widget-job-status col-md-3")
                                    )
                                    .append(
                                        $("<div></div>")
                                            .addClass("col-md-9")
                                            .append(
                                                $("<span></span>")
                                                    .addClass("gp-widget-job-submitted")
                                            )
                                            .append(
                                                $("<span></span>")
                                                    .addClass("gp-widget-job-sharing")
                                            )
                                    )
                                    .append(
                                        $("<div></div>")
                                            .addClass("gp-widget-job-outputs col-md-9")
                                    )
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
            );

            // Set as child job, if necessary
            if (this.options.childJob) {
                this.element.find(".gp-widget-job-share").hide();
                this.element.find(".gp-widget-job-reload").hide();
                this.element.find(".gp-widget-logo").hide();
            }

            // Apply server color scheme if authenticated
            if (widget.options.session !== null && widget.options.session.authenticated) {
                GPNotebook.slider.apply_colors(widget.element, widget.options.session.server());
            }

            // Check to see if the user is authenticated yet
            if (widget.options.session && widget.options.session.authenticated) {
                // If placeholder cell (job number is -1), display placeholder
                if (this._is_placeholder()) this._load_placeholder();

                // Otherwise, if authenticated, load job status
                else this._loadJobStatus();
            }
            else {
                // If not authenticated, display message
                this._showAuthenticationMessage();
                this._pollForAuth();
            }

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
         * Appends the options to the gear menu, creating a new menu, if appropriate
         *
         * @private
         */
        _create_gear_menu: function(button_area) {
            const widget = this;
            const combined_cell = widget.element.closest(".cell").find(".nbtools-widget").length > 1;
            const task_gear_menu = widget.element.closest(".cell").find(".gp-widget-task").find(".gear-menu");

            // Given an event launched from a cell, return the job widget in that cell
            function _get_job_widget(event) {
                return $(event.target).closest(".cell").find(".gp-widget-job").data("widget");
            }

            // Given an event launched from a cell, return the job widget in that cell
            function _get_task_widget(event) {
                return $(event.target).closest(".cell").find(".gp-widget-task").data("widget");
            }

            function _create_remove_job() {
                return $("<li></li>")
                    .addClass("gp-widget-job-remove")
                    .append(
                        $("<a></a>")
                            .attr("title", "Clear Job Results")
                            .attr("href", "#")
                            .append("Clear Job Results")
                            .click(function(event) {
                                _get_task_widget(event).remove_job();
                            })
                    );
            }

            function _create_share_job() {
                return $("<li></li>")
                    .addClass("gp-widget-job-share")
                    .append(
                        $("<a></a>")
                            .attr("title", "Share Job")
                            .attr("href", "#")
                            .append("Share Job")
                            .click(function(event) {
                                _get_job_widget(event).buildSharingPanel();
                            })
                    );
            }

            function _create_duplicate_analysis() {
                return $("<li></li>")
                    .addClass("gp-widget-job-duplicate")
                    .append(
                        $("<a></a>")
                            .attr("title", "Duplicate Analysis")
                            .attr("href", "#")
                            .append("Duplicate Analysis")
                            .click(function(event) {
                                _get_job_widget(event).reloadJob();
                            })
                    );
            }

            // Append to gear menu if associated task cell, if necessary
            if (combined_cell && !!task_gear_menu && !task_gear_menu.find(".gp-widget-job-remove").length) {
                task_gear_menu.find("li:last").before(_create_remove_job());
            }
            if (combined_cell && !!task_gear_menu && !task_gear_menu.find(".gp-widget-job-share").length) {
                task_gear_menu.find("li:last").before(_create_share_job());
            }
            if (combined_cell && !!task_gear_menu && !task_gear_menu.find(".gp-widget-job-duplicate").length) {
                task_gear_menu.find("li:last").before(_create_duplicate_analysis());
            }

            // Create the gear menu for the job widget
            const gear_menu = $("<div></div>")
                .addClass("btn-group gp-widget-job-group")
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
                        .append(_create_share_job())
                        .append(_create_duplicate_analysis())
                        .append(
                            $("<li></li>")
                                .append(
                                    $("<a></a>")
                                        .attr("title", "Toggle Code View")
                                        .attr("href", "#")
                                        .append("Toggle Code View")
                                        .click(function(event) {
                                            _get_job_widget(event).toggle_code();
                                        })
                                )
                        )
                );

            // Add the gear menu to the job widget
            button_area.append(" ").append(gear_menu);

            // Hide the gear menu if this is a combined cell
            if (combined_cell) gear_menu.hide();
        },

        /**
         * Walks the DOM and gets the task name associated with this job cell.
         * Returns null if no associated task name was found.
         *
         * @private
         */
        _get_task_from_dom: function() {
            const prev_cells = $(this.options.cell.element).prevAll(".cell");
            let task_name = null;

            // For each previous cell, look for a task widget and get the name
            prev_cells.each(function(i, cell) {
                const task_element = $(cell).find(".gp-widget-task");
                if (task_element.length > 0) {
                    const task_widget = task_element.data("widget");
                    task_name = task_widget.options.task.name();
                    return false;
                }
            });

            return task_name
        },

        /**
         * Load the placeholder cell interface
         *
         * @private
         */
        _load_placeholder: function() {
            // Get the task name
            let task_name = this._get_task_from_dom();
            if (task_name === null) task_name = "Unknown";

            // Set the job number
            this.element.attr("name", "-1");

            // Display the task name
            this.element.find(".gp-widget-job-task:first").text(task_name + " Job");

            // Display the placeholder message
            this.infoMessage("Job status and results will display here once you begin the " + task_name + " analysis above.")
        },

        /**
         * Show an info message to the user
         *
         * @param message - String containing the message to show
         */
        infoMessage: function(message) {
            const messageBox = this.element.find(".gp-widget-job-message");
            messageBox.removeClass("alert-success");
            messageBox.removeClass("alert-danger");
            messageBox.addClass("alert-info");
            messageBox.text(message);
            messageBox.show("shake", {}, 500);
        },

        /**
         * Determine if this cell is a placeholder job cell (job number is -1)
         *
         * @private
         */
        _is_placeholder: function() {
            return this.options.jobNumber === -1;
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
            let task = this.options.job.task();
            if (task !== null) {
                done(task);
                return task;
            }

            // Otherwise check the general GenePattern cache
            const identifier = this.options.job.taskLsid();
            task = this.options.session.task(identifier);
            if (task !== null) {
                this.options.job._task = task; // Associate this task with the widget
                done(task);
                return task;
            }

            // Otherwise call back to the server
            const widget = this;
            this.options.session.taskQuery({
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
            const toSlide = this.element.find("> .panel-body");
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

        /**
         * Construct the sharing panel from the job permissions
         */
        buildSharingPanel: function() {
            // Display error and exit if not authenticated or a placeholder job
            if (!this.options.session || !this.options.session.authenticated || this._is_placeholder()) {
                const dialog = require('base/js/dialog');
                dialog.modal({
                    notebook: Jupyter.notebook,
                    keyboard_manager: this.keyboard_manager,
                    title : "Sharing Error",
                    body : "To share you must be authenticated and have successfully launched the job.",
                    buttons : {
                        "OK" : {
                            "click": function() {
                            }
                        }
                    }
                });

                return;
            }

            const widget = this;
            const job = this.options.job;
            const optionsPane = $("<div></div>");
            const permissions = job.permissions();

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
            const table = $("<table></table>")
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

            const groups = permissions['groups'];
            $.each(groups, function(i, e) {
                let groupDisplayName = e['id'];
                if (groupDisplayName === "*") {
                    groupDisplayName = "Public";
                }
                const row = $("<tr></tr>")
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
            optionsPane.append(
                $("<p style='margin-top: 10px;'>For more information about sharing GenePattern jobs, see the <a href='http://software.broadinstitute.org/cancer/software/genepattern/user-guide#working-with-analysis-results-sharing-analysis-results' target='_blank'>User Guide</a>.</p>")
            );

            const dialog = require('base/js/dialog');
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
                            const bundle = widget._bundlePermissions();

                            // Call to save permissions
                            widget._savePermissions(bundle,
                                // On success
                                function() {
                                    // Assign the bundle to permissions
                                    widget.options.job.permissions().groups = bundle;
                                    widget.options.job.permissions().isPublic = widget._determine_public(bundle);
                                    widget.options.job.permissions().isShared = widget._determine_shared(bundle);

                                    // Update the sharing icon
                                    const sharing_status = widget._create_sharing_indicator();
                                    const sharing_icon = widget.element.find(".gp-widget-job-sharing:first");
                                    sharing_icon.empty();
                                    sharing_icon.append(sharing_status);
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

        _determine_public: function(bundle) {
            for (let i = 0; i < bundle.length; i++) {
                let group = bundle[i];
                if (group['id'] === "*") return group['read'] || group['write'];
            }

            // Assume false if no public group found
            return false;
        },

        _determine_shared: function(bundle) {
            for (let i = 0; i < bundle.length; i++) {
                let group = bundle[i];

                // Return true if sharing was found
                if (group['id'] !== "*" && (group['read'] || group['write'])) return true;
            }

            // No sharing was found
            return false;
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
            const rawGroups = $(".gp-widget-job-share-table").find("tr");
            const toReturn = [];
            $.each(rawGroups, function(i, e) {
                const name = $(e).attr("name");
                // Skip the header row
                if (name === undefined || name === null || name === "") {
                    return;
                }
                // Get the radio value
                const group = {"id": name};
                const value = $(e).find("input:radio:checked").val();
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
                else {
                    group["read"] = false;
                    group["write"] = false;
                    toReturn.push(group);
                }
            });

            return toReturn;
        },

        /**
         * Remove unwanted code from reload, such as import statements and run_job
         *
         * @param cell
         * @param code
         * @private
         */
        _stripUnwantedCode: function(cell, code) {
            const lines = code.split("\n");
            let newCode = "";
            let taskVar = null;

            // Iterate over each line
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                let skip = false;

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

                // Replace gpserver variable with session
                if (line.indexOf("gpserver") !== -1) {
                    line = line.replace("gpserver", "genepattern.session.get(" + this.options.session_index + ")")
                }

                // Append the code if it's not a skipped line
                if (!skip) {
                    newCode += line.trim() + "\n"
                }
            }

            // Append the widget view
            newCode += "\ngenepattern.display(" + taskVar + ")";

            // Put the code in the cell
            cell.code_mirror.setValue(newCode);
        },

        /**
         * Reloads the job in a Task widget
         */
        reloadJob: function() {
            // Display error and exit if not authenticated or a placeholder job
            if (!this.options.session || !this.options.session.authenticated || this._is_placeholder()) {
                const dialog = require('base/js/dialog');
                dialog.modal({
                    notebook: Jupyter.notebook,
                    keyboard_manager: this.keyboard_manager,
                    title : "Duplication Error",
                    body : "To duplicate an analysis you must be authenticated and have an analysis to duplicate.",
                    buttons : {
                        "OK" : {
                            "click": function() {
                            }
                        }
                    }
                });

                return;
            }

            const job = this.options.job;
            const widget = this;

            job.code("Python").done(function(code) {
                const cell = Jupyter.notebook.insert_cell_below();
                widget._stripUnwantedCode(cell, code);

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
         * Initialize polling as appropriate for options and status
         *
         * @param statusObj
         * @private
         */
        _initPoll: function(statusObj) {
            const running = !statusObj["hasError"] && !statusObj["completedInGp"];
            const widget = this;

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
         * Show the message about authentication
         *
         * @private
         */
        _showAuthenticationMessage: function() {
            this.element.find(".gp-widget-job-number").text("Not Authenticated");
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
                const jsonObj = JSON.parse(this.options.json);
                const job = new this.options.session.Job(jsonObj);
                this._displayJob(job);
            }
            // If we need to load the JSON from the server
            else {
                const widget = this;

                this.options.session.job({
                    jobNumber: this.options.jobNumber,
                    force: true,
                    permissions: true,
                    success: function(response, job) {
                        // Check to see if the job just completed and send a notification if it has
                        if (widget.options.job && widget._statusText(job.status()) === "Completed") {
                            widget.send_notification(error=false);

                            // Trigger a gp.jobComplete event
                            widget.element.trigger("gp.jobComplete", job);
                        }
                        else if (widget.options.job && widget._statusText(job.status()) === "Error") {
                            widget.send_notification(error=true);

                            // Trigger a gp.jobComplete event
                            widget.element.trigger("gp.jobComplete", job);
                        }

                        // Set the job object
                        widget.options.job = job;

                        // Update the widget
                        widget._displayJob(job);

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
         * Return a locked or unlocked icon with explanatory title
         *
         * @private
         */
        _create_sharing_indicator: function() {
            const widget = this;
            const permissions = this.options.job.permissions();
            const icon = permissions.isPublic || permissions.isShared ? 'fa-unlock' : 'fa-lock';

            // Create title
            let title = "Sharing: Private";
            if (permissions.isPublic) title = "Sharing: Public";
            else if (permissions.isShared) title = "Sharing: Shared with Group";

            return $("<i></i>")
                .addClass("fa " + icon)
                .attr("title", title)
                .click(function() {
                    if (permissions['canSetPermissions']) widget.buildSharingPanel();
                });
        },

        /**
         * Display the widget for the job object
         *
         * @param job
         * @private
         */
        _displayJob: function(job) {
            const widget = this;

            // Clean the old data
            this._clean();

            // Set the job number and data attributes
            this.element.attr("name", job.jobNumber());
            this.element.attr("data-job-number", job.jobNumber());
            this.element.attr("data-task-name", job.taskName());

            // Display the job number and task name
            const job_number_text = " Job #" + job.jobNumber() + " ";
            this.element.find(".gp-widget-job-number:first").text(job_number_text);
            this.element.find(".gp-widget-job-task:first").text(job.taskName());

            // Display the user and date submitted
            const submittedText = "Submitted by " + job.userId() + " on " + job.dateSubmitted();
            this.element.find(".gp-widget-job-submitted:first").text(submittedText);

            // Display the sharing status
            const sharing_status = widget._create_sharing_indicator();
            this.element.find(".gp-widget-job-sharing:first").empty().append(sharing_status);

            // Display the status
            const statusText = this._statusText(job.status());
            this.element.find(".gp-widget-job-status:first").text(statusText);

            // Display the job results
            const outputsList = this._outputsList(job.outputFiles(), true);
            this.element.find(".gp-widget-job-outputs:first").append(outputsList);

            // Display the log files
            const logList = this._outputsList(job.logFiles(), false);
            this.element.find(".gp-widget-job-outputs:first").append(logList);

            // Enable sharing button, if necessary
            const permissions = job.permissions();
            if (permissions !== undefined && permissions !== null && !permissions['canSetPermissions']) {
                this.element.find(".gp-widget-job-share:first").remove();
            }

            // Display error if Java visualizer
            this.getTask(function(task) {
                if (task !== null && task !== undefined) {
                    const categories = task.categories();
                    if (categories.indexOf("Visualizer") !== -1) {
                        widget.errorMessage("This job appears to be a deprecated Java-based visualizer. These visualizers are not supported in the GenePattern Notebook.");
                        widget.element.find(".gp-widget-job-submitted").hide();
                        widget.element.find(".gp-widget-job-status").hide();
                    }
                }
            });

            // Build the visualizer display, if necessary
            let launchUrl = job.launchUrl(); // Get the JSViewer URL
            if (!launchUrl) launchUrl = this.get_index_page(); // Get the URL to index.html if no JSViewer URL
            if (launchUrl !== undefined && launchUrl !== null) {
                this._displayVisualizer(launchUrl);
            }

            // Build the display of child jobs, if necessary
            const children = job.children();
            if (children !== undefined && children !== null && children.length > 0) {
                this._displayChildren(children);
            }

            // Initialize status polling if top-level job
            if (!this.options.childJob) {
                this._initPoll(job.status());
            }
        },

        get_index_page: function() {
            const job = this.options.job;
            const outputs = job.outputFiles();

            // Iterate over each file looking for index.html
            for (let i = 0; i < outputs.length; i++) {
                let file = outputs[i];
                if (file.link.name === "index.html") return file.link.href;
            }

            // No index.html found, return null
            return null;
        },

        /**
         * Show a success message to the user
         *
         * @param message - String containing the message to show
         */
        successMessage: function(message) {
            const messageBox = this.element.find(".gp-widget-job-message");
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
            const messageBox = this.element.find(".gp-widget-job-message");
            messageBox.removeClass("alert-success");
            messageBox.removeClass("alert-info");
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
            const viewerDiv = this.element.find(".gp-widget-job-visualize:first");

            // Check if the visualizer has already been displayed
            const displayed = viewerDiv.find("iframe").length > 0;

            // Check whether the launchUrl is relative
            if (launchUrl.indexOf("/") === 0) {
                // Get server launchUrl without /gp
                launchUrl = launchUrl.slice(3);

                // Make into a full URL
                launchUrl = this.options.session.server() + launchUrl;
            }

            // Display the visualizer if not already displayed
            if (!displayed) {
                const urlWithToken = launchUrl + "#" + this.options.session.token;

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
                const toggle_code_option = this.element.closest(".cell").find(".gear-menu:first > li:last");
                toggle_code_option.before(
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
            const widget = this;
            const childrenDiv = this.element.find(".gp-widget-job-children:first");
            childrenDiv.css("margin-top", "10px");
            childrenDiv.empty();

            // For each child, append a widget
            children.forEach(function(child) {
                const childWidget = $("<div></div>")
                    .addClass("gp-widget-job-child")
                    .jobResults({
                        jobNumber: child.jobNumber(),
                        cell: widget.options.cell,
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
            const widget = this;
            const outputsList = $("<div></div>")
                .addClass("gp-widget-job-outputs-list");

            if (outputs) {
                for (let i = 0; i < outputs.length; i++) {
                    const wrapper = $("<div></div>");
                    const output = outputs[i];
                    const link = $("<a></a>")
                        .text(output["link"]["name"] + " ")
                        .addClass("nbtools-widget-job-output-file")
                        .attr("data-kind", output["kind"])
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
                    GPNotebook.menus.build_menu(widget, link, output["link"]["name"], output["link"]["href"], output["kind"], fullMenu);

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
         * @param file_name
         */
        code_cell: function(job, file_name) {
            const var_name = Utils.make_python_safe(file_name.toLowerCase() + "_" + job.jobNumber());
            const code = "# More documentation can be obtained at the GenePattern website, or by calling help(job" + job.jobNumber() + ").\n" +
                       var_name + " = " + "job" + job.jobNumber() + ".get_file(\"" + file_name.split('/').pop() + "\")\n" +
                       var_name;
            const cell = Jupyter.notebook.insert_cell_below();
            cell.code_mirror.setValue(code);

            // Select and run the cell
            cell.execute();
            setTimeout(function() {
                $(cell.element).click();
            }, 100);
        },

        dataframe_cell: function(job, file_name, kind) {
            const var_name = Utils.make_python_safe(file_name.toLowerCase() + "_" + job.jobNumber());
            const kind_import = kind === "gct" ? "gct" : "odf";
            const code = "# The code below will only run if pandas is installed: http://pandas.pydata.org\n" +
                       "from gp.data import " + kind_import.toUpperCase() + "\n" +
                       var_name + " = " + kind_import.toUpperCase() + "(job" + job.jobNumber() + ".get_file(\"" + file_name.split('/').pop() + "\"))\n" +
                       var_name;
            const cell = Jupyter.notebook.insert_cell_below();
            cell.code_mirror.setValue(code);

            // Select and run the cell
            cell.execute();
            setTimeout(function() {
                $(cell.element).click();
            }, 100);
        },

        /**
         * Send a notification to the browser that the job is complete or has an error
         */
        send_notification: function(error = false) {
            GPNotebook.util.send_notification(this.options.job.taskName() + " job #" + this.options.job.jobNumber() +
                (error ? " has an error!" : " complete!"));
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
        },

        _session_index_from_code: function() {
            // Make sure that this is a task or job cell
            if ('genepattern' in this.options.cell.metadata && this.options.cell.metadata.genepattern.type !== "job" && this.options.cell.metadata.genepattern.type !== "task") {
                console.log("Attempting to extract session index from non-job cell");
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
        }
    });

    const JobWidgetView = widgets.DOMWidgetView.extend({
        render: function () {
            const widget = this;
            let cell = this.options.cell;

            // Ugly hack for getting the Cell object in ipywidgets 7
            if (!cell) cell = widget.options.output.element.closest(".cell").data("cell");

            // Get the job number
            const jobNumber = widget.model.get('job_number');

            // Check to see if this is a legacy job widget, if so replace with full code
            if (!('genepattern' in cell.metadata)) {
                cell.set_text(''); // Remove the old code
                GPNotebook.slider.build_job_code(cell, 0, jobNumber);
            }

            // Fix for old-style non-combined task cells
            if (cell.get_text().indexOf("genepattern.GPTaskWidget") > -1) {
                const code = cell.get_text().replace("genepattern.GPTaskWidget", "genepattern.display");
                cell.set_text(code);
            }

            // Render the view.
            if (!widget.el) widget.setElement($('<div></div>'));

            // Render the cell and hide code by default
            const element = this.$el;
            const hideCode = function() {
                const cell_div = element.closest(".cell");
                if (cell_div.length > 0) {
                    // Render the widget
                    $(widget.$el).jobResults({
                        jobNumber: jobNumber,
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

    return {
        JobWidgetView: JobWidgetView
    }
});