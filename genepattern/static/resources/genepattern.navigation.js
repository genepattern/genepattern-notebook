/**
 * Navigation functionality
 *
 * @author Thorin Tabor
 * @requires - jQuery, requirejs
 *
 * Copyright 2015-2020 Regents of the University of California & The Broad Institute
 */

define("genepattern/navigation", ["base/js/namespace",
        "nbextensions/jupyter-js-widgets/extension",
        "nbtools",
        "nbtools/metadata",
        "nbtools/utils",
        "genepattern"], function (Jupyter, widgets, NBToolManager, MetadataManager, Utils, gp) {

    const slider = {};
    const menus = {};
    const init = {};
    const util = {};
    const session_manager = {
        sessions: []
    };

    /**
     * Attach the left-hand slider tab
     *
     * @returns {*|jQuery}
     */
    slider.slider_tab = function() {
        const auth_view = session_manager.sessions.length > 0 ? "inline-block" : "none";
        return $("<span></span>")
                .addClass("fa fa-th sidebar-button sidebar-button-main")
                .attr("title", "GenePattern")
                .css("display", auth_view)
                .click(function() {
                    $("#nbtools-toolbar").trigger("click");
                });
    };

    /**
     * Extract the domain from the provided URL
     *
     * @param url
     * @returns {string}
     */
    util.get_domain = function(url) {
        const a = document.createElement('a');
        a.href = url;
        return a.hostname;
    };

    /**
     * Send a browser notification
     *
     * @param message
     */
    util.send_notification = function(message) {
        // Internal function to display the notification
        function notification() {
            new Notification("GenePattern Notebook", {
                body: message,
                badge: Jupyter.notebook.base_url + "nbextensions/genepattern/resources/gp-icon.png",
                icon: Jupyter.notebook.base_url + "nbextensions/genepattern/resources/gp-icon.png",
                silent: true
            });
        }

        // Browser supports notifications and permission is granted
        if ("Notification" in window && Notification.permission === "granted") {
            notification()
        }

        // Otherwise, we need to ask the user for permission
        else if ("Notification" in window && Notification.permission !== "denied") {
            Notification.requestPermission(function (permission) {
                // If the user accepts, let's create a notification
                if (permission === "granted") {
                    notification()
                }
            });
        }
    };

    /**
     * Select the specified cell in the notebook
     *
     * @param cell
     */
    util.select_cell = function(cell) {
        // Unselect existing selected cells
        Jupyter.notebook.get_selected_cells().forEach(function(c) {
            c.unselect();
        });

        // Select provided cell
        cell.select();
    };

    /**
     * Register the GenePattern module with the Notebook Tool Manager
     *
     * @param session
     * @param module
     */
    slider.register_module = function(session, module) {
        // Prepare the origin
        let origin = null;
        const gp_url = session.server();
        if (gp_url === "https://gp.indiana.edu/gp") origin = "GenePattern Indiana";
        else if (gp_url === "https://gpbroad.broadinstitute.org/gp") origin = "GenePattern Broad";
        else if (gp_url === "https://cloud.genepattern.org/gp") origin = "GenePattern Cloud";
        else origin = util.get_domain(gp_url);

        // Prepare tags
        const tags = module['categories'];
        $.each(module['tags'], function(i, e) {
            tags.push(e['tag'])
        });
        tags.sort();

        // Prepare the session index
        const index = session_manager.get_session_index(session.server());

        const ModuleTool = new NBToolManager.NBTool({
            origin: origin,
            id: module['lsid'],
            name: module['name'],
            version: "v" + module['version'],
            tags: tags,
            description: module['description'],
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

                slider.build_module_code(cell, index, module);
                setTimeout(function() {
                    cell.execute();
                }, 10);

                return cell;
            }
        });

        NBToolManager.instance().register(ModuleTool);
    };

    /**
     * Register all modules on this server with the Notebook Tool Manager
     *
     * @param session
     * @param modules
     */
    slider.register_all_modules = function(session, modules) {
        modules.forEach(function(module) {
            // Only add module if it is not a Java visualizer
            if (module['categories'].indexOf("Visualizer") !== -1) return;
            slider.register_module(session, module);
        });
    };

    /**
     * Authenticate the notebook & change nav accordingly
     *
     * @param GenePattern - GenePattern server session
     * @param data
     */
    slider.authenticate = function(GenePattern, data) {
        // Show the GenePattern cell button
        $(".gp-cell-button").css("visibility", "visible");

        // Show the slider tab
        $(".sidebar-button-main").show("slide", {"direction": "left"});

        // Disable same server on all authentication widgets
        const dropdowns = $(".gp-widget-auth").find("[name=server]");
        dropdowns.find("option[value='" + GenePattern.server() + "']").prop("disabled", true);
        dropdowns.each(function(i, dropdown) {
            // If disabled server is selected, select a different one
            if ($(dropdown).find("option:selected").attr("value") === GenePattern.server()) {
                const enabled_list = $(dropdown).find("option:enabled");
                if (enabled_list.length > 0) $(enabled_list[0]).prop('selected', true);
            }
        });

        // Register all modules with the tool manager
        if (data['all_modules']) {
            slider.register_all_modules(GenePattern, data['all_modules']);
        }
    };

    /**
     * Returns structure containing all task widgets currently in the notebook, which accept the
     * indicated file (kind). Structure is a list of pairings with the cell index and the widget object.
     * Ex: [[1, gp.runTask()], [9, gp.runTask()], [12, gp.runTask()]]
     *
     * @param kind
     * @returns {Array}
     */
    slider.task_widgets_for_file = function(file_name) {
        const matches = [];

        $(".cell").each(function(index, node) {
            const widgetNode = $(node).find(".gp-widget-task, .nbtools-uibuilder");

            if (widgetNode.length > 0) {
                const widget = widgetNode.data("widget");
                if (widget !== undefined && widget !== null) {
                    const accepted = widget.acceptedKinds();
                    if (accepted !== undefined && accepted !== null) {
                        accepted.every(function(kind) {
                            if (Utils.wildcard_match(file_name, kind)) {
                                // Match found!
                                matches.push([index, widget]);

                                // Break
                                return false;
                            }
                            else return true;
                        });
                    }
                }
            }
        });

        return matches;
    };

    /**
     * Removes all visualizers from the kind to tasks map so that Java visualizers are not suggested
     * from the Send to new Modules menus.
     *
     * @param kindMap
     */
    slider.remove_kind_visualizers = function(kindMap) {
        $.each(kindMap, function(kind, taskList) {
            let currentLength = taskList.length;
            for (let i = 0; i < currentLength; i++) {
                const task = taskList[i];
                const categories = task.categories();
                if (categories.indexOf("Visualizer") !== -1) {
                    // This is a visualizer
                    taskList.splice(i, 1);
                    currentLength--;
                    i--;
                }
            }
        });
    };

    /**
     * Strip version number from the LSID, if present
     *
     * @param lsid
     */
    util.strip_version = function(lsid) {
        const parts = lsid.split(':');
        if (parts.length === 6) {
            parts.pop();
            return parts.join(':');
        }
        else {
            return lsid;
        }
    };

    /**
     * Build the basic code for displaying a module widget
     * Add that code to a cell and set the metadata
     *
     * @param cell
     * @param session
     * @param module
     */
    slider.build_module_code = function(cell, session, module) {
        const baseName = module["name"].toLowerCase().replace(/\./g, '_');
        const taskName = baseName + "_task";
        const specName = baseName + "_job_spec";
        const baseLsid = util.strip_version(module["lsid"]);

        // Build the code
        const code = taskName + " = gp.GPTask(genepattern.session.get(" + session + "), '" + baseLsid + "')\n" +
                   specName + " = " + taskName + ".make_job_spec()\n" +
                   "genepattern.display(" + taskName + ")\n";

        // Add the metadata
        slider.make_genepattern_cell(cell, "task", {
            "name": module["name"],
            "description": module["description"]
        });

        // Add the code to the cell
        cell.set_text(code);
    };

    /**
     * Set the new value in the cell metadata
     *
     * @param cell
     * @param param_name
     * @param value
     * @private
     */
    slider.set_parameter_metadata = function(cell, param_name, value) {
        // Get the existing param values
        let params = slider.get_metadata(cell, "param_values");

        // Initialize the parameter map if not defined
        if (!params) params = {};

        // Set the new value
        params[param_name] = value;

        // Write to the cell metadata
        slider.set_metadata(cell, "param_values", params)
    };

    /**
     * Build the basic code for displaying a job widget
     *
     * @param cell
     * @param session
     * @param jobNumber
     * @returns {string}
     */
    slider.build_job_code = function(cell, session, jobNumber) {
        const code = "job" + jobNumber + " = gp.GPJob(genepattern.session.get(" + session + "), " + jobNumber + ")\n" +
                   "genepattern.display(job" + jobNumber + ")";

        // Add the metadata if this is a standalone cell
        if (!('genepattern' in cell.metadata)) {
            slider.make_genepattern_cell(cell, "job", {
                "name": "Job #" + jobNumber
            });
        }

        // Remove previous jobs and append the code to the cell
        slider._append_job_code(cell, code);

        return code;
    };

    slider._append_job_code = function(cell, job_code) {
        let existing_code = cell.get_text();

        // Is this a combined task / job cell?
        if (existing_code.indexOf('gp.GPTask(') > -1) cell.set_text(existing_code + '\n\n' + job_code);

        // If not, this is a job cell. Just replace the code.
        else cell.set_text(job_code);
    };

    /**
     * Return the name of a file from its url
     *
     * @param url
     * @returns {string}
     */
    util.name_from_url = function(url) {
        const parts = url.split("/");
        return decodeURIComponent(parts[parts.length - 1]);
    };

    /**
     * Encode text for HTML display
     *
     * @param text
     * @returns {string}
     */
    util.html_encode = function(text) {
        return text.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    };

    /**
     * Begin checking every minute to see if the kernel has disconnected and display a dialog informing the user if a disconnect has happened.
     */
    slider.detect_kernel_disconnect = function() {
        let disconnectCurrentlyDetected = false;

        // Run check every minute
        setInterval(function() {
            const disconnected = Jupyter.notebook.kernel._reconnect_attempt === Jupyter.notebook.kernel.reconnect_limit;

            // If we've just become disconnected, display modal dialog
            if (disconnected && !disconnectCurrentlyDetected) {
                const dialog = require('base/js/dialog');
                dialog.modal({
                    notebook: Jupyter.notebook,
                    keyboard_manager: this.keyboard_manager,
                    title : "Kernel Disconnected",
                    body : "The notebook is having difficulties connecting to the server. Perhaps your session has timed out? Please refresh the page to reconnect.",
                    buttons : {
                        "OK" : {
                            "class" : "btn-default",
                            "click" : function() {}
                        }
                    }
                });
            }

            // Update connection status
            disconnectCurrentlyDetected = disconnected;
        }, 60 * 1000);
    };

    /**
     * Create a new GenePattern authentication widget in the indicated cell
     *
     * @param cell
     */
    slider.create_authentication_cell = function(cell) {
        // Get the auth widget code
        init.build_code(cell, "https://cloud.genepattern.org/gp", "", "");

        function isWidgetPresent() { return cell.element.find(".gp-widget").length > 0; }
        function isRunning() { return cell.element.hasClass("running") }

        let widgetPresent = isWidgetPresent();
        let running = isRunning();

        function ensure_widget() {
            if (!widgetPresent && !running) {
                cell.execute();
            }
            if (!widgetPresent) {
                setTimeout(function() {
                    widgetPresent = isWidgetPresent();
                    running = isRunning();
                    ensure_widget();
                }, 500);
            }
        }

        ensure_widget();
    };

    /**
     * In unauthenticated, change the currently selected cell to a GenePattern authentication cell.
     * If authenticated, open the Notebook Tool Manager to prompt the user to select a module.
     */
    slider.to_genepattern_cell = function() {
        if (session_manager.sessions.length > 0) {
            $("#nbtools-toolbar").trigger("click");
        }
        else {
            let cell = Jupyter.notebook.get_selected_cell();
            const contents = cell.get_text().trim();

            // Insert a new cell if the current one has contents
            if (contents !== "") {
                cell = Jupyter.notebook.insert_cell_below();
                Jupyter.notebook.select_next();
            }
            slider.create_authentication_cell(cell);
        }
    };

    /**
     * Construct and return a file menu for the provided output file
     *
     * @param widget - the job or output widget pointed to by this menu
     * @param element - HTML element to attach menu to
     * @param name - The file name
     * @param href - The URL of the file
     * @param kind - The GenePattern kind of the file
     * @param fullMenu - Whether this is a full menu or a log file menu
     * @returns {*|jQuery|HTMLElement}
     */
    menus.build_menu = function(widget, element, name, href, kind, fullMenu) {
        // Attach simple menu
        if (!fullMenu) {
            menus._build_basic_menu(widget, element, name, href);
        }

        // Attach UI Builder output menu
        else if (widget.options.jobNumber === undefined) {
            menus._build_output_menu(widget, element, name, href, kind);
        }

        // Attach job result menu
        else {
            menus._build_job_menu(widget, element, name, href, kind);
        }

        // Ensure that the popover showed
        element.click(function() {
            setTimeout(function() {
                if ($(".popover:visible").length === 0) {
                    element.trigger("click");
                }
            }, 400);
        });

        // Make the "i" icon open the menus as well
        const icon = element.find(".fa-info-circle");
        icon.click(function(event) {
            $(this).parent().trigger("click");
            event.preventDefault();
            event.stopPropagation();
        });

        return element;
    };

    menus._build_output_menu = function(widget, element, name, href, kind) {
        const popover = $("<div></div>")
            .addClass("list-group")
            .append(
                $("<label></label>")
                    .text(name)
            )
            .append(
                $("<a></a>")
                    .addClass("list-group-item")
                    .text("Open in New Tab")
                    .attr("href", href)
                    .attr("target", "_blank")
            )
            .append(
                $("<a></a>")
                    .addClass("list-group-item gp-widget-job-send-code")
                    .text("Send to Code")
                    .attr("href", "#")
            )
            .append(
                $("<div></div>")
                    .append(
                        $("<label></label>")
                            .css("padding-top", "10px")
                            .text("Send to Existing GenePattern Cell")
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
            );

        // Attach "Send to DataFrame" if GCT or ODF
        if (name.endsWith(".gct") || name.endsWith(".odf")) {
            popover.find(".gp-widget-job-send-code").after(
                $("<a></a>")
                    .addClass("list-group-item gp-widget-job-send-dataframe")
                    .text("Send to DataFrame")
                    .attr("href", "#")
            );
        }

        element.popover({
            title: "",
            content: popover,
            html: true,
            placement: "right",
            trigger: "click"
        });

        // Attach methods in a way that will not break when popover is hidden
        element.on('shown.bs.popover', function () {
            const sendCodeButton = element.parent().find(".gp-widget-job-send-code");
            const sendDataFrameButton = element.parent().find(".gp-widget-job-send-dataframe");
            const sendToExistingTask = element.parent().find('.gp-widget-job-existing-task');

            // Unbind old click events so they aren't double-bound
            sendCodeButton.unbind("click");
            if (sendDataFrameButton) sendDataFrameButton.unbind("click");
            sendToExistingTask.unbind("change");

            // Attach the click method to "send to code"
            sendCodeButton.click(function() {
                widget.code_cell(href, name);
                $(".popover").popover("hide");
            });

            // Attach the click method to "send to dataframe"
            if (sendDataFrameButton) {
                sendDataFrameButton.click(function() {
                    widget.dataframe_cell(href, name, kind);
                    $(".popover").popover("hide");
                });
            }

            // Dynamically add options to "Send to Existing GenePattern Cell" dropdown
            const matching_functions = slider.task_widgets_for_file(name);
            sendToExistingTask
                .empty()
                .append(
                    $("<option></option>")
                        .text("----")
                );
            $.each(matching_functions, function(i, pairing) {
                const cellIndex = pairing[0];
                const ui_widget = pairing[1];
                const task = null;

                // Extract the task name from the widget
                let name = $(ui_widget.element).find(".gp-widget-task-name").text().trim();

                // If this is a UI Builder widget, not a task widget, append
                if (!ui_widget.options.lsid) {
                    sendToExistingTask
                        .append(
                            $("<option></option>")
                                .text(name + " [Cell " + cellIndex + "]")
                                .data("widget", ui_widget)
                        );
                }
            });

            // Add event to handle changes on the "Send to Downstream Task" dropdown
            sendToExistingTask.change(function() {
                const option = $(this).find(":selected");
                const the_widget = option.data("widget");
                the_widget.receive_file(element.attr("href"), name, kind);

                // Hide the popover
                $(".popover").popover("hide");

                // Scroll to the new cell
                const site_div = $('#site');
                const current_offset = Math.abs(site_div.find(".container").offset().top);
                const cell_offset = $(the_widget.element).offset().top;
                site_div.animate({
                    scrollTop: current_offset + cell_offset
                }, 500);

                // Expand the cell, if necessary
                the_widget.expandCollapse(true);
            });
        });
    };

    menus._build_basic_menu = function(widget, element, name, href) {
        element.popover({
            title: "",
            content: $("<div></div>")
                .addClass("list-group")
                .append(
                    $("<label></label>")
                        .text(name)
                )
                .append(
                    $("<a></a>")
                        .addClass("list-group-item")
                        .text("Download File")
                        .attr("href", href + "?download")
                        .attr("target", "_blank")
                )
                .append(
                    $("<a></a>")
                        .addClass("list-group-item")
                        .text("Open in New Tab")
                        .attr("href", href)
                        .attr("target", "_blank")
                ),
            html: true,
            placement: "right",
            trigger: "click"
        });
    };

    menus._build_job_menu = function(widget, element, name, href, kind) {
        const popover = $("<div></div>")
            .addClass("list-group")
            .append(
                $("<label></label>")
                    .text(name)
            )
            .append(
                $("<a></a>")
                    .addClass("list-group-item")
                    .text("Download File")
                    .attr("href", href + "?download")
                    .attr("target", "_blank")
                )
            .append(
                $("<a></a>")
                    .addClass("list-group-item")
                    .text("Open in New Tab")
                    .attr("href", href)
                    .attr("target", "_blank")
            )
            .append(
                $("<a></a>")
                    .addClass("list-group-item gp-widget-job-send-code")
                    .text("Send to Code")
                    .attr("href", "#")
            )
            .append(
                $("<div></div>")
                    .append(
                        $("<label></label>")
                            .css("padding-top", "10px")
                            .text("Send to Existing GenePattern Cell")
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
                            .text("Send to New GenePattern Cell")
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

        // Attach "Send to DataFrame" if GCT or ODF
        if (kind.indexOf("gct") !== -1 || name.endsWith(".odf")) {
            popover.find(".gp-widget-job-send-code").after(
                $("<a></a>")
                    .addClass("list-group-item gp-widget-job-send-dataframe")
                    .text("Send to DataFrame")
                    .attr("href", "#")
            );
        }

        element.popover({
            title: "",
            content: popover,
            html: true,
            placement: "right",
            trigger: "click"
        });

        // Add options to "Send to New Task" dropdown, or hide if none
        let modules = null;
        const fixedKind = Array.isArray(kind) ? kind[0] : kind;
        const sendToNewTask = popover.find('.gp-widget-job-new-task');
        const kindsMap = widget.options.session.kinds();
        if (kindsMap !==  null && kindsMap !== undefined) {
            modules = kindsMap[fixedKind];
            if (modules === null || modules === undefined) { modules = []; } // Protect against undefined & null
            $.each(modules, function(i, module) {
                sendToNewTask.append(
                    $("<option></option>")
                        .attr("data-lsid", module.lsid())
                        .attr("data-server", widget.options.session.server())
                        .text(module.name())
                )
            });
        }
        if (modules === null || modules.length === 0) {
            sendToNewTask.parent().hide();
        }

        // Attach methods in a way that will not break when popover is hidden
        element.on('shown.bs.popover', function () {
            const sendCodeButton = element.parent().find(".gp-widget-job-send-code");
            const sendDataFrameButton = element.parent().find(".gp-widget-job-send-dataframe");
            const newTaskDropdown = element.parent().find(".gp-widget-job-new-task");
            const sendToExistingTask = element.parent().find('.gp-widget-job-existing-task');

            // Unbind old click events so they aren't double-bound
            sendCodeButton.unbind("click");
            if (sendDataFrameButton) sendDataFrameButton.unbind("click");
            newTaskDropdown.unbind("change");
            sendToExistingTask.unbind("change");

            // Attach the click method to "send to code"
            sendCodeButton.click(function() {
                widget.code_cell(widget.options.job, name);
                $(".popover").popover("hide");
            });

            // Attach the click method to "send to dataframe"
            if (sendDataFrameButton) {
                sendDataFrameButton.click(function() {
                    widget.dataframe_cell(widget.options.job, name, fixedKind);
                    $(".popover").popover("hide");
                });
            }

            // Attach "Send to New Task" clicks
            newTaskDropdown.change(function(event) {
                const option = $(event.target).find(":selected");
                const lsid = option.attr("data-lsid");
                if (lsid === undefined || lsid === null) return;
                const module_name = option.text();
                const cell = Jupyter.notebook.insert_cell_at_bottom();
                slider.build_module_code(cell, widget.options.session_index, {"lsid":lsid, "name": module_name});

                // Execute the cell
                setTimeout(function() {
                    cell.element.on("nbtools.widget_rendered", function() {
                        const widgetElement = cell.element.find(".gp-widget");
                        const widget = widgetElement.data("widget");

                        // Define what to do to receive the file
                        const receive_from_upstream = function() {
                            setTimeout(function() {
                                widget.receive_file(element.attr("href"), name, fixedKind);
                            }, 100);
                        };

                        // Check to see whether params have already been loaded
                        const alreadyLoaded = widget._paramsLoaded;

                        // If already loaded, receive file
                        if (alreadyLoaded) {
                            receive_from_upstream();
                        }

                        // Otherwise wait until they are loaded.
                        widgetElement.on("runTask.paramLoad", receive_from_upstream);
                    });
                    cell.execute();
                }, 10);

                // Hide the popover
                $(".popover").popover("hide");

                // Scroll to the new cell
                const site_div = $('#site');
                const current_offset = Math.abs(site_div.find(".container").offset().top);
                const cell_offset = $(cell.element).offset().top;
                site_div.animate({
                    scrollTop: current_offset + cell_offset
                }, 500);
            });

            // Dynamically add options to "Send to Downstream Task" dropdown
            const matchingTasks = slider.task_widgets_for_file(name);
            sendToExistingTask
                .empty()
                .append(
                    $("<option></option>")
                        .text("----")
                );
            $.each(matchingTasks, function(i, pairing) {
                const cellIndex = pairing[0];
                const taskWidget = pairing[1];
                const task = taskWidget.options.lsid ? widget.options.session.task(taskWidget.options.lsid) : null;
                let name = task !== null ? task.name() : null;

                // If task is null, extract the task name from the widget
                if (task === null) name = $(taskWidget.element).find(".gp-widget-task-name").text().trim();

                sendToExistingTask
                    .append(
                        $("<option></option>")
                            .text(name + " [Cell " + cellIndex + "]")
                            .data("widget", taskWidget)
                    );
            });

            // Add event to hand changes on the "Send to Downstream Task" dropdown
            sendToExistingTask.change(function() {
                const option = $(this).find(":selected");
                const theWidget = option.data("widget");
                theWidget.receive_file(element.attr("href"), name, fixedKind);

                // Hide the popover
                $(".popover").popover("hide");

                // Scroll to the new cell
                const site_div = $('#site');
                const current_offset = Math.abs(site_div.find(".container").offset().top);
                const cell_offset = $(theWidget.element).offset().top;
                site_div.animate({
                    scrollTop: current_offset + cell_offset
                }, 500);

                // Expand the cell, if necessary
                theWidget.expandCollapse(true);
            });
        });
    };

    /**
     * Initialize the cell templates
     */
    init.cell_templates = function() {
        // Basic cell template functionality
        function to_cell_template(cell, prepend, append) {
            // Get the cell and text
            if (cell === undefined) cell = Jupyter.notebook.get_selected_cell();
            let old_text = cell.get_text().trim();

            // Add default message, if blank
            if (old_text === "") old_text = 'Edit this cell to insert your text here.';

            // Change to a markdown cell, if necessary
            if (cell.cell_type !== "Markdown") {
                Jupyter.notebook.cells_to_markdown();
                cell = Jupyter.notebook.get_selected_cell();
            }

            // Insert the template in the cell
            cell.set_text(prepend + old_text + append);

            return cell;
        }

        // Template functions

        function to_instruction_cell(cell) {
            return to_cell_template(cell,
                '<div class="alert alert-info">\n<p class="lead"> Instructions <i class="fa fa-info-circle"></i></p>\n',
                '\n</div>');
        }

        function to_warning_cell(cell) {
            return to_cell_template(cell,
                '<div class="alert alert-warning">\n<p class="lead"> Warning <i class="fa fa-exclamation-triangle"></i></p>\n',
                '\n</div>');
        }

        function to_error_cell(cell) {
            return to_cell_template(cell,
                '<div class="alert alert-danger">\n<p class="lead"> Error <i class="fa fa-exclamation-circle"></i></p>\n',
                '\n</div>');
        }

        function to_callout_cell(cell) {
            return to_cell_template(cell,
                '<div class="well well-sm">\n',
                '\n</div>');
        }

        // Add the keyboard shortcuts

        Jupyter.keyboard_manager.command_shortcuts.add_shortcut('i', {
                help: 'to Instruction Cell',
                help_index: 'cc',
                handler: function () {
                    to_instruction_cell();
                    return false;
                }
            }
        );

        Jupyter.keyboard_manager.command_shortcuts.add_shortcut('w', {
                help: 'to Warning Cell',
                help_index: 'cc',
                handler: function () {
                    to_warning_cell();
                    return false;
                }
            }
        );

        Jupyter.keyboard_manager.command_shortcuts.add_shortcut('e', {
                help: 'to Error Cell',
                help_index: 'cc',
                handler: function () {
                    to_error_cell();
                    return false;
                }
            }
        );

        Jupyter.keyboard_manager.command_shortcuts.add_shortcut('c', {
                help: 'to Callout Cell',
                help_index: 'cc',
                handler: function () {
                    to_callout_cell();
                    return false;
                }
            }
        );

        // Add the tools

        const instruction_cell_tool = new NBToolManager.NBTool({
            origin: "+",
            id: "cell_instruction",
            name: "Template: Instruction Cell",
            tags: ["template", "cell"],
            description: "Create a new instruction cell template.",
            load: () => true,
            render: to_instruction_cell
        });
        NBToolManager.instance().register(instruction_cell_tool);

        const warning_cell_tool = new NBToolManager.NBTool({
            origin: "+",
            id: "cell_warning",
            name: "Template: Warning Cell",
            tags: ["template", "cell"],
            description: "Create a new warning cell template.",
            load: () => true,
            render: to_warning_cell
        });
        NBToolManager.instance().register(warning_cell_tool);

        const error_cell_tool = new NBToolManager.NBTool({
            origin: "+",
            id: "cell_error",
            name: "Template: Error Cell",
            tags: ["template", "cell"],
            description: "Create a new error cell template.",
            load: () => true,
            render: to_error_cell
        });
        NBToolManager.instance().register(error_cell_tool);

        const callout_cell_tool = new NBToolManager.NBTool({
            origin: "+",
            id: "cell_callout",
            name: "Template: Callout Cell",
            tags: ["template", "cell"],
            description: "Create a new callout cell template.",
            load: () => true,
            render: to_callout_cell
        });
        NBToolManager.instance().register(callout_cell_tool);
    };

    /**
     * Wait for kernel and then init notebook widgets
     */
    init.wait_for_kernel = function (id) {
        const query_kernel = function() {
            // If this is not a Python kernel, exit
            if (!Jupyter.notebook.kernel.name.toLowerCase().includes("python")) return;

            Jupyter.notebook.kernel.kernel_info(function(reply) {
                if (reply.content && reply.content.status === "ok") init.notebook_init_wrapper();
                else setTimeout(query_kernel, 500);
            });
        };

        if (!init.done_init  && Jupyter.notebook.kernel) {
            query_kernel();
        }
        else if (init.done_init) {
            clearInterval(id);
        }
    };

    /**
     * Initialize GenePattern Notebook from the notebook page
     */
    init.notebook_init_wrapper = function () {
        if (!init.done_init  && Jupyter.notebook.kernel) {
            try {
                // Call the core init function
                init.launch_init();

                // Initialize the GenePattern cell type keyboard shortcut
                Jupyter.keyboard_manager.command_shortcuts.add_shortcut('g', {
                        help: 'to GenePattern',
                        help_index: 'cc',
                        handler: function () {
                            slider.to_genepattern_cell();
                            return false;
                        }
                    }
                );

                // Add GenePattern help link
                function add_help_link() {
                    const help_section = $("#kernel-help-links");
                    const library_section = $("#help_menu").find(".divider:last");
                    if (help_section.length > 0) {
                        help_section.before($("<li><a href='https://groups.google.com/forum/#!forum/genepattern-help' target='_blank'><i class='fa fa-external-link menu-icon pull-right'></i>GenePattern Help</a></li>"));
                        library_section.before($("<li><a href='http://genepattern-notebook.org' target='_blank'><i class='fa fa-external-link menu-icon pull-right'></i>GenePattern</a></li>"));
                    }
                    else setTimeout(add_help_link, 200);
                }
                add_help_link();

                // Initialize the cell templates
                init.cell_templates();

                // Start kernel disconnect detection
                slider.detect_kernel_disconnect();

                // Set event for hiding popovers & slider when user clicks away
                $(document).on("click", function (e) {
                    const target = $(e.target);

                    // Handle hiding popovers
                    const isPopover = target.is("[data-toggle=popover]");
                    const inPopover = target.closest(".popover").length > 0;

                    // Hide popover only if click not inside popover
                    if (!isPopover && !inPopover) {
                        $(".popover").popover("hide");
                    }

                    // Handle hiding the slider
                    const inSlider = target.closest("#slider").length > 0;
                    const inTab = target.is(".sidebar-button-main");
                    const sliderVisible = $("#slider:visible").length > 0;

                    // Hide slider only if click not inside slider
                    if (!inSlider && !inTab && sliderVisible) {
                        $("#slider").hide("slide");
                    }
                });

                // Mark init as done
                init.done_init = true;
            }
            catch(e) {
                console.log(e);
                init.wait_for_kernel();
            }
        }
    };

    /**
     * Build the Python code used to authenticate GenePattern
     *
     * @param cell
     * @param server
     * @param username
     * @param password
     */
    init.build_code = function(cell, server, username, password) {
        const code = '# Requires GenePattern Notebook: pip install genepattern-notebook\n' +
                   'import gp\n' +
                   'import genepattern\n' +
                   '\n' +
                   '# Username and password removed for security reasons.\n' +
                   'genepattern.display(genepattern.session.register("' + server + '", "' + username + '", "' + password + '"))';

        if (cell.cell_type === 'markdown') {
            console.log("ERROR: Attempting to turn markdown cell into widget in authWidget.build_code()")
        }
        else if (cell.cell_type === 'code') {
            slider.make_genepattern_cell(cell, "auth", {
                "server": server,
                "name": "Login"
            });
            cell.code_mirror.setValue(code);
        }
        else {
            console.log("ERROR: Unknown cell type sent to authWidget.build_code()");
        }
    };

    /**
     * Ensure that the genepattern and gp Python libraries have been loaded
     */
    init.load_genepattern_py = function(callback) {
        // The print() is necessary to force the callback
        Jupyter.notebook.kernel.execute('import gp\nimport nbtools\nimport genepattern\nprint("OK")',
            {
                iopub: {
                    output: function(response) {
                        // console.log(response.content.data["text/plain"]);
                        if (callback) callback();
                    }
                }
            },
            {
                silent: false,
                store_history: false,
                stop_on_error: true
            });
    };

    /**
     * Check the cell metadata to determine if this cell is a GenePattern cell
     *
     * @param cell
     * @returns {boolean}
     */
    init.is_gp_cell = function (cell) {
        // Check for valid input
        if (typeof cell !== 'object' || cell.metadata === undefined) {
            console.log('ERROR reading cell metadata');
            return;
        }

        return 'genepattern' in cell.metadata;
    };

    /**
     * Automatically run all GenePattern widgets
     */
    init.auto_run_widgets = function() {
        require(["nbextensions/jupyter-js-widgets/extension"], function() {
            const all_cells = Jupyter.notebook.get_cells();
            let genepattern_loaded = false;

            all_cells.forEach(function(cell) {
                // Skip GenePattern cells that are already rendered
                if (cell.element.find(".gp-widget, .nbtools-widget").length > 0) return;

                if (init.is_gp_cell(cell) || MetadataManager.is_tool_cell(cell)) {
                    // Do we need to load the genepattern library first?
                    if (MetadataManager.get_metadata(cell, "type") === "uibuilder" && !genepattern_loaded) {
                        init.load_genepattern_py(function() {
                            genepattern_loaded = true;
                            cell.execute();
                        });
                        return;
                    }
                    else {
                        cell.execute();
                        return;
                    }
                }

                // Legacy support for # !AUTOEXEC
                if (cell.get_text().indexOf("# !AUTOEXEC") > -1) {
                    cell.execute();
                }
            });
        });
    };

    /**
     * Initialize GenePattern Notebook core functionality
     */
    init.launch_init = function() {
        // Register authentication widget with Tool Manager
        require(["nbtools",
                 "genepattern/authentication"],
                  function(NBToolManager, auth) {
            NBToolManager.instance().register(auth.AuthWidgetTool);
        });

        // Add the sidebar
        $("body").append(slider.slider_tab());

        // Hide or show the slider tab if a GenePattern cell is highlighted
        $([Jupyter.events]).on('select.Cell', function() {
            const cell = Jupyter.notebook.get_selected_cell();
            const isGPCell = cell.element.find(".gp-widget, .nbtools-widget").length > 0;

            // If authenticated and the selected cell is a GenePattern cell, show
            if (session_manager.sessions.length > 0 && isGPCell) {
                $(".sidebar-button-main").show();
            }

            // Else, hide
            else {
                $(".sidebar-button-main").hide();
            }
        });

        // Initialize tooltips
        $(function () {
            $('[data-toggle="tooltip"]').tooltip();
        });

        // Load genepattern library and auto-run widgets
        $(function () {
            init.auto_run_widgets();
        });

        // Add GenePattern "cell type" if not already in menu
        const dropdown = $("#cell_type");
        const gpInDropdown = dropdown.find("option:contains('GenePattern')").length > 0;
        if (!gpInDropdown) {
            dropdown.append(
                    $("<option value='code'>GenePattern</option>")
                );

            dropdown.change(function(event) {
                const type = $(event.target).find(":selected").text();
                if (type === "GenePattern") {
                    const former_type = Jupyter.notebook.get_selected_cell().cell_type;
                    slider.to_genepattern_cell(former_type);
                }
            });

            // Reverse the ordering of events so we check for ours first
            $._data(dropdown[0], "events").change.reverse();
        }

        const cellMenu = $("#change_cell_type");
        const gpInMenu = cellMenu.find("#to_genepattern").length > 0;
        if (!gpInMenu) {
            cellMenu.find("ul.dropdown-menu")
                .append(
                    $("<li id='to_genepattern' title='Insert a GenePattern widget cell'><a href='#'>GenePattern</a></option>")
                        .click(function() {
                            slider.to_genepattern_cell();
                        })
                );
        }
    };

    /**
     * Add the metadata to this cell to identify it as a GenePattern cell
     *
     * Valid types:
     *      auth - auth cell
     *      task - task cell
     *      job - job cell
     *      uibuilder - UI builder cell
     *
     * Valid options:
     *      server: default GP server URL (used in auth cell)
     *      show_code: hide or show the input code (default is false)
     *      param_values: a map of the current parameter values (used in uibuilder) (not set means use the function's default)
     *      hide_params: a map of whether parameters are hidden (default is false)
     *      name: The name of the GenePattern cell
     *      description: Description of the widget
     *
     * @param cell
     * @param type
     * @param options
     */
    slider.make_genepattern_cell = function(cell, type, options) {
        // Check for valid input
        if (typeof cell !== 'object') {
            console.log('ERROR applying metadata to cell');
            return;
        }

        // Add GenePattern metadata if it is missing
        if (!('genepattern' in cell.metadata)) {
            cell.metadata.genepattern = {};
        }

        // Set the GenePattern cell type
        cell.metadata.genepattern.type = type;

        // If the server has been passed in, set it too
        if (options) {
            const opts = Object.keys(options);
            opts.forEach(function(key) {
                cell.metadata.genepattern[key] = options[key];
            });
        }
    };

    /**
     * Return the value matching the provided key from the GenePattern cell metadata
     *
     * @param cell
     * @param key
     * @returns {*}
     */
    slider.get_metadata = function(cell, key) {
        // Check for valid input
        if (typeof cell !== 'object') {
            console.log('ERROR reading cell to get metadata');
            return null;
        }

        // Check if GenePattern metadata is missing
        if (!('genepattern' in cell.metadata)) {
            console.log('ERROR metadata missing genepattern flag');
            return null;
        }

        return cell.metadata.genepattern[key];
    };

    /**
     * Set the value matching the provided key in the GenePattern cell metadata
     *
     * @param cell
     * @param key
     * @param value
     */
    slider.set_metadata = function(cell, key, value) {
        // Check for valid input
        if (typeof cell !== 'object') {
            console.log('ERROR reading cell to set metadata');
            return;
        }

        // Add GenePattern metadata if it is missing
        if (!('genepattern' in cell.metadata)) {
            cell.metadata.genepattern = {};
        }

        // Set the value
        cell.metadata.genepattern[key] = value;
    };

    /**
     * Set the GenePattern widget theme based on the authenticated server
     *
     * @param element
     * @param url
     */
    slider.apply_colors = function(element, url) {
        let theme = "gp-server-custom";

        // GenePattern Cloud
        if (url === "https://cloud.genepattern.org/gp") {
            theme = "gp-server-public";
        }

        // GenePattern Indiana
        if (url === 'https://gp.indiana.edu/gp') {
            theme = "gp-server-indiana";
        }

        // GenePattern Broad
        if (url === "https://gpbroad.broadinstitute.org/gp") {
            theme = "gp-server-broad";
        }

        element.addClass(theme);
    };

    /**
     * Register the GenePattern session with the session manager
     *
     * @param server
     * @param username
     * @param password
     * @returns {GenePattern}
     */
    session_manager.register_session = function(server, username, password) {
        // Create the session
        const session = new gp.GenePattern();
        session.server(server);
        session.username = username;
        session.password = password;

        // Validate username if not empty
        const valid_username = username !== "" && username !== null && username !== undefined;

        // Validate that the server is not already registered
        const index = session_manager.get_session_index(server);
        const new_server = index === -1;

        // Add the new session to the list
        if (valid_username && new_server) {
            session_manager.sessions.push(session);
        }

        // Replace old session is one exists
        if (valid_username && !new_server) {
            session_manager.sessions[index] = session;
        }

        return session;
    };

    /**
     * Return the matching session based on providing an index number or GenePattern server URL
     * Return null if no matching session is found.
     *
     * @param server
     * @returns {*}
     */
    session_manager.get_session = function(server) {
        // Handle indexes
        if (Number.isInteger(server)) {
            if (server >= session_manager.sessions.length) return null;
            else return session_manager.sessions[server];
        }

        // Handle server URLs
        const index = session_manager.get_session_index(server);
        if (index === -1) return null;
        else return session_manager.sessions[index];
    };

    /**
     * Gets the index of the session matching the provided GenePattern server URL
     * Returns -1 if a matching session was not found
     *
     * @param url
     * @returns {number}
     */
    session_manager.get_session_index = function(url) {
        for (let i in session_manager.sessions) {
            const session = session_manager.sessions[i];
            if (session.server() === url) {
                return parseInt(i);
            }
        }
        return -1;
    };

    /**
     * Expose these properties in the AMD module
     */
    return {
        slider: slider,
        menus: menus,
        init: init,
        util: util,
        session_manager: session_manager
    }
});