/**
 * Navigation widgets
 *
 * @author Thorin Tabor
 * @requires - jQuery
 *
 */

// Add shim to support Jupyter 3.x and 4.x
var Jupyter = Jupyter || IPython || {};

define(["base/js/namespace",
        "nbextensions/jupyter-js-widgets/extension",
        "nbtools",
        "nbextensions/genepattern/resources/gp"], function (Jupyter, widgets, NBToolManager, gp) {

    var slider = {};
    var init = {};
    var util = {};
    var session_manager = {
        sessions: []
    };

    /**
     * Attach the left-hand slider tab
     *
     * @returns {*|jQuery}
     */
    slider.sliderTab = function() {
        var auth_view = session_manager.sessions.length > 0 ? "inline-block" : "none";
        return $("<span></span>")
                .addClass("fa fa-th sidebar-button sidebar-button-main")
                .attr("title", "GenePattern")
                .css("display", auth_view)
                .click(function() {
                    $("#nbtools-toolbar").trigger("click");
                });
    };

    util.getDomain = function(url) {
        var a = document.createElement('a');
        a.href = url;
        return a.hostname;
    };

    slider.registerModule = function(session, module) {
        // Prepare the origin
        var origin = null;
        var gp_url = session.server();
        if (gp_url === "https://genepattern.broadinstitute.org/gp") origin = "GenePattern Public";
        else if (gp_url === "https://gp.indiana.edu/gp") origin = "GenePattern Indiana";
        else if (gp_url === "https://gpbroad.broadinstitute.org/gp") origin = "GenePattern Broad";
        else origin = util.getDomain(gp_url);

        // Prepare tags
        var tags = module['categories'];
        $.each(module['tags'], function(i, e) {
            tags.push(e['tag'])
        });
        tags.sort();

        // Prepare the session index
        var index = session_manager.get_session_index(session.server());

        var ModuleTool = new NBToolManager.NBTool({
            origin: origin,
            id: module['lsid'],
            name: module['name'],
            version: "v" + module['version'],
            tags: tags,
            description: module['description'],
            load: function() { return true; },
            render: function() {
                var cell = Jupyter.notebook.get_selected_cell();
                var is_empty = cell.get_text().trim() == "";

                // If this cell is not empty, insert a new cell and use that
                // Otherwise just use this cell
                if (!is_empty) {
                    cell = Jupyter.notebook.insert_cell_below();
                    Jupyter.notebook.select_next();
                }

                slider.buildModuleCode(cell, index, module);
                setTimeout(function() {
                    cell.execute();
                }, 10);

                return cell;
            }
        });

        NBToolManager.instance().register(ModuleTool);
    };

    slider.registerAllModules = function(session, modules) {
        modules.forEach(function(module) {
            // Only add module if it is not a Java visualizer
            if (module['categories'].indexOf("Visualizer") !== -1) return;
            slider.registerModule(session, module);
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
        var dropdowns = $(".gp-widget-auth").find("[name=server]");
        dropdowns.find("option[value='" + GenePattern.server() + "']").prop("disabled", true);
        dropdowns.each(function(i, dropdown) {
            // If disabled server is selected, select a different one
            if ($(dropdown).find("option:selected").attr("value") === GenePattern.server()) {
                var enabled_list = $(dropdown).find("option:enabled");
                if (enabled_list.length > 0) $(enabled_list[0]).prop('selected', true);
            }
        });

        // Register all modules with the tool manager
        if (data['all_modules']) {
            slider.registerAllModules(GenePattern, data['all_modules']);
        }
    };

    slider.output_files_by_kind = function(kinds) {
        var matches = [];
        var kind_list = kinds;

        // Handle the special case of * (match all)
        var match_all = kinds === "*";

        // If passing in a single kind as a string, wrap it in a list
        if (typeof kinds === 'string') {
            kind_list = [kinds];
        }

        // For each out file, see if it is the right kind
        $(".gp-widget-job-output-file").each(function(index, output) {
            var kind = $(output).data("kind");
            if (match_all || kind_list.indexOf(kind) >= 0) {
                var job_desc = $(output).closest(".gp-widget").find(".gp-widget-job-task").text().trim();
                matches.push({
                    name: $(output).text().trim(),
                    url: $(output).attr("href"),
                    job: job_desc
                });
            }
        });

        return matches;
    };

    /**
     * Returns structure containing all task widgets currently in the notebook, which accept the
     * indicated kind. Structure is a list of pairings with the cell index and the widget object.
     * Ex: [[1, gp.runTask()], [9, gp.runTask()], [12, gp.runTask()]]
     *
     * @param kind
     * @returns {Array}
     */
    slider.taskWidgetsForKind = function(kind) {
        var matches = [];

        $(".cell").each(function(index, node) {
            var widgetNode = $(node).find(".gp-widget-task");

            if (widgetNode.length > 0) {
                var widget = widgetNode.data("widget");
                if (widget !== undefined && widget !== null) {
                    var accepted = widget.acceptedKinds();
                    if (accepted !== undefined && accepted !== null) {
                        if (accepted.indexOf(kind) !== -1) {
                            // Found a match!
                            matches.push([index, widget]);
                        }
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
    slider.removeKindVisualizers = function(kindMap) {
        $.each(kindMap, function(kind, taskList) {
            var currentLength = taskList.length;
            for (var i = 0; i < currentLength; i++) {
                var task = taskList[i];
                var categories = task.categories();
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
    util.stripVersion = function(lsid) {
        var parts = lsid.split(':');
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
    slider.buildModuleCode = function(cell, session, module) {
        var baseName = module["name"].toLowerCase().replace(/\./g, '_');
        var taskName = baseName + "_task";
        var specName = baseName + "_job_spec";
        var baseLsid = util.stripVersion(module["lsid"]);

        // Build the code
        var code = taskName + " = gp.GPTask(genepattern.get_session(" + session + "), '" + baseLsid + "')\n" +
                   specName + " = " + taskName + ".make_job_spec()\n" +
                   "genepattern.GPTaskWidget(" + taskName + ")";

        // Add the metadata
        slider.makeGPCell(cell, "task");

        // Add the code to the cell
        cell.set_text(code);
    };

    /**
     * Build the basic code for displaying a job widget
     *
     * @param cell
     * @param session
     * @param jobNumber
     */
    slider.buildJobCode = function(cell, session, jobNumber) {
        var code = "job" + jobNumber + " = gp.GPJob(genepattern.get_session(" + session + "), " + jobNumber + ")\n" +
                   "genepattern.GPJobWidget(job" + jobNumber + ")";

        // Add the metadata
        slider.makeGPCell(cell, "job");

        // Add the code to the cell
        cell.set_text(code);
    };

    /**
     * Return the name of a file from its url
     *
     * @param url
     * @returns {string}
     */
    util.nameFromUrl = function(url) {
        var parts = url.split("/");
        return decodeURIComponent(parts[parts.length - 1]);
    };

    /**
     * Encode text for HTML display
     *
     * @param text
     * @returns {string}
     */
    util.htmlEncode = function(text) {
        return text.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    };

    slider.detectKernelDisconnect = function() {
        var disconnectCurrentlyDetected = false;

        // Run check every minute
        setInterval(function() {
            var disconnected = Jupyter.notebook.kernel._reconnect_attempt === Jupyter.notebook.kernel.reconnect_limit;

            // If we've just become disconnected, display modal dialog
            if (disconnected && !disconnectCurrentlyDetected) {
                var dialog = require('base/js/dialog');
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

    slider.createAuthCell = function(cell) {
        // Get the auth widget code
        init.buildCode(cell, "https://genepattern.broadinstitute.org/gp", "", "");

        function isWidgetPresent() { return cell.element.find(".gp-widget").length > 0; }
        function isRunning() { return cell.element.hasClass("running") }

        var widgetPresent = isWidgetPresent();
        var running = isRunning();

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

    slider.toGenePatternCell = function() {
        if (session_manager.sessions.length > 0) {
            $("#nbtools-toolbar").trigger("click");
        }
        else {
            var cell = Jupyter.notebook.get_selected_cell();
            var contents = cell.get_text().trim();

            // Insert a new cell if the current one has contents
            if (contents !== "") {
                cell = Jupyter.notebook.insert_cell_below();
                Jupyter.notebook.select_next();
            }
            slider.createAuthCell(cell);
        }
    };

    /**
     * Construct and return a file menu for the provided output file
     *
     * @param widget - the job widget pointed to by this menu
     * @param element - HTML element to attach menu to
     * @param name - The file name
     * @param href - The URL of the file
     * @param kind - The GenePattern kind of the file
     * @param indexString - String containing output file index
     * @param fullMenu - Whether this is a full menu or a log file menu
     * @returns {*|jQuery|HTMLElement}
     */
    slider.buildMenu = function(widget, element, name, href, kind, indexString, fullMenu) {

        // Attach simple menu
        if (!fullMenu) {
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
        }
        // Attach advanced menu
        else {
            var popover = $("<div></div>")
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

            // Attach "Send to DataFrame" if GCT
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
            var modules = null;
            var fixedKind = Array.isArray(kind) ? kind[0] : kind;
            var sendToNewTask = popover.find('.gp-widget-job-new-task');
            var kindsMap = widget.options.session.kinds();
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
                var sendCodeButton = element.parent().find(".gp-widget-job-send-code");
                var sendDataFrameButton = element.parent().find(".gp-widget-job-send-dataframe");
                var newTaskDropdown = element.parent().find(".gp-widget-job-new-task");
                var sendToExistingTask = element.parent().find('.gp-widget-job-existing-task');

                // Unbind old click events so they aren't double-bound
                sendCodeButton.unbind("click");
                if (sendDataFrameButton) sendDataFrameButton.unbind("click");
                newTaskDropdown.unbind("change");
                sendToExistingTask.unbind("change");

                // Attach the click method to "send to code"
                sendCodeButton.click(function() {
                    widget.codeCell(widget.options.job, name);
                    $(".popover").popover("hide");
                });

                // Attach the click method to "send to dataframe"
                if (sendDataFrameButton) {
                    sendDataFrameButton.click(function() {
                        widget.dataFrameCell(widget.options.job, name, fixedKind);
                        $(".popover").popover("hide");
                    });
                }

                // Attach "Send to New Task" clicks
                newTaskDropdown.change(function(event) {
                    var option = $(event.target).find(":selected");
                    var lsid = option.attr("data-lsid");
                    var server = option.attr("data-server");
                    if (lsid === undefined || lsid === null) return;
                    var name = option.text();
                    var cell = Jupyter.notebook.insert_cell_at_bottom();
                    slider.buildModuleCode(cell, widget.options.session_index, {"lsid":lsid, "name": name});

                    // Execute the cell
                    setTimeout(function() {
                        cell.element.on("gp.widgetRendered", function() {
                            var widgetElement = cell.element.find(".gp-widget");
                            var widget = widgetElement.data("widget");

                            // Define what to do to receive the file
                            var receiveFile = function() {
                                setTimeout(function() {
                                    widget.receiveFile(element.attr("href"), fixedKind);
                                }, 100);
                            };

                            // Check to see whether params have already been loaded
                            var alreadyLoaded = widget._paramsLoaded;

                            // If already loaded, receive file
                            if (alreadyLoaded) {
                                receiveFile();
                            }

                            // Otherwise wait until they are loaded.
                            widgetElement.on("runTask.paramLoad", receiveFile);
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
                var matchingTasks = slider.taskWidgetsForKind(fixedKind);
                sendToExistingTask
                    .empty()
                    .append(
                        $("<option></option>")
                            .text("----")
                    );
                $.each(matchingTasks, function(i, pairing) {
                    var cellIndex = pairing[0];
                    var taskWidget = pairing[1];
                    var task = widget.options.session.task(taskWidget.options.lsid);
                    var name = task !== null ? task.name() : null;

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
                    var option = $(this).find(":selected");
                    var theWidget = option.data("widget");
                    theWidget.receiveFile(element.attr("href"), fixedKind);

                    // Hide the popover
                    $(".popover").popover("hide");

                    // Scroll to the new cell
                    $('#site').animate({
                        scrollTop: $(theWidget.element).position().top
                    }, 500);

                    // Expand the cell, if necessary
                    theWidget.expandCollapse(true);
                });
            });
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
        var icon = element.find(".fa-info-circle");
        icon.click(function(event) {
            $(this).parent().trigger("click");
            event.preventDefault();
            event.stopPropagation();
        });

        return element;
    };

    /**
     * Wait for kernel and then init notebook widgets
     */
    init.wait_for_kernel = function (id) {
        if (!init.done_init  && Jupyter.notebook.kernel) {
            init.notebook_init_wrapper();
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
                            slider.toGenePatternCell();
                            return false;
                        }
                    }
                );

                // Add GenePattern help link
                $("#kernel-help-links").before($("<li><a href='http://genepattern.org/genepattern-notebooks' target='_blank'>GenePattern Help <i class='fa fa-external-link menu-icon pull-right'></i></a></li>"));

                // Start kernel disconnect detection
                slider.detectKernelDisconnect();

                // Set event for hiding popovers & slider when user clicks away
                $(document).on("click", function (e) {
                    var target = $(e.target);

                    // Handle hiding popovers
                    var isPopover = target.is("[data-toggle=popover]");
                    var inPopover = target.closest(".popover").length > 0;

                    // Hide popover only if click not inside popover
                    if (!isPopover && !inPopover) {
                        $(".popover").popover("hide");
                    }

                    // Handle hiding the slider
                    var inSlider = target.closest("#slider").length > 0;
                    var inTab = target.is(".sidebar-button-main");
                    var sliderVisible = $("#slider:visible").length > 0;

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
    init.buildCode = function(cell, server, username, password) {
        var code = '# Requires GenePattern Notebook: pip install genepattern-notebook\n' +
                   'import gp\n' +
                   'import genepattern\n' +
                   '\n' +
                   '# Username and password removed for security reasons.\n' +
                   'genepattern.GPAuthWidget(genepattern.register_session("' + server + '", "' + username + '", "' + password + '"))';

        if (cell.cell_type === 'markdown') {
            console.log("ERROR: Attempting to turn markdown cell into widget in authWidget.buildCode()")
        }
        else if (cell.cell_type == 'code') {
            slider.makeGPCell(cell, "auth", server);
            cell.code_mirror.setValue(code);
        }
        else {
            console.log("ERROR: Unknown cell type sent to authWidget.buildCode()");
        }
    };

    /**
     * Automatically run all GenePattern widgets
     */
    init.auto_run_widgets = function() {
        require(["nbextensions/jupyter-js-widgets/extension"], function() {
            var all_cells = Jupyter.notebook.get_cells();
            all_cells.forEach(function(cell) {
                // Skip GenePattern cells that are already rendered
                if (cell.element.find(".gp-widget").length > 0) return;

                if ('genepattern' in cell.metadata) {
                    cell.execute();
                    return;
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
                 "gp_auth"],
                  function(NBToolManager, auth) {
            NBToolManager.instance().register(auth.AuthWidgetTool);
        });

        // Add the sidebar
        $("body").append(slider.sliderTab());

        // Hide or show the slider tab if a GenePattern cell is highlighted
        $([Jupyter.events]).on('select.Cell', function() {
            var cell = Jupyter.notebook.get_selected_cell();
            var isGPCell = cell.element.find(".gp-widget").length > 0;

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

        // Auto-run widgets
        $(function () {
            init.auto_run_widgets();
        });

        // Add GenePattern "cell type" if not already in menu
        var dropdown = $("#cell_type");
        var gpInDropdown = dropdown.find("option:contains('GenePattern')").length > 0;
        if (!gpInDropdown) {
            dropdown.append(
                    $("<option value='code'>GenePattern</option>")
                );

            dropdown.change(function(event) {
                var type = $(event.target).find(":selected").text();
                if (type === "GenePattern") {
                    var former_type = Jupyter.notebook.get_selected_cell().cell_type;
                    slider.toGenePatternCell(former_type);
                }
            });

            // Reverse the ordering of events so we check for ours first
            $._data($("#cell_type")[0], "events").change.reverse();
        }

        var cellMenu = $("#change_cell_type");
        var gpInMenu = cellMenu.find("#to_genepattern").length > 0;
        if (!gpInMenu) {
            cellMenu.find("ul.dropdown-menu")
                .append(
                    $("<li id='to_genepattern' title='Insert a GenePattern widget cell'><a href='#'>GenePattern</a></option>")
                        .click(function() {
                            slider.toGenePatternCell();
                        })
                );
        }
    };

    slider.makeGPCell = function (cell, type, server) {
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
        if (server) {
            cell.metadata.genepattern.server = server;
        }
    };

    slider.applyColors = function(element, url) {
        var theme = "gp-server-custom";

        // GenePattern Public
        if (url === GENEPATTERN_SERVERS[0][1]) {
            theme = "gp-server-public";
        }

        // GenePattern Indiana
        if (url === GENEPATTERN_SERVERS[1][1]) {
            theme = "gp-server-indiana";
        }

        // GenePattern Broad
        if (url === GENEPATTERN_SERVERS[2][1]) {
            theme = "gp-server-broad";
        }

        element.addClass(theme);
    };

    session_manager.register_session = function(server, username, password) {
        // Create the session
        var session = new gp.GenePattern();
        session.server(server);
        session.username = username;
        session.password = password;

        // Validate username if not empty
        var valid_username = username !== "" && username !== null && username !== undefined;

        // Validate that the server is not already registered
        var index = session_manager.get_session_index(server);
        var new_server = index === -1;

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
        var index = session_manager.get_session_index(server);
        if (index === -1) return null;
        else return session_manager.sessions[index];
    };

    /**
     * Gets the index of the session matching the provided GenePattern server URL
     * Returns -1 if a matching session was not found
     *
     * @param url
     * @returns {string}
     */
    session_manager.get_session_index = function(url) {
        for (var i in session_manager.sessions) {
            var session = session_manager.sessions[i];
            if (session.server() === url) {
                return i;
            }
        }
        return -1;
    };

    return {
        slider: slider,
        init: init,
        util: util,
        session_manager: session_manager
    }
});
