/**
 * Navigation widgets
 *
 * @author Thorin Tabor
 * @requires - jQuery
 *
 */
var GenePattern = GenePattern || {};

// Add shim to support Jupyter 3.x and 4.x
var Jupyter = Jupyter || IPython || {};

define(["base/js/namespace",
        "nbextensions/jupyter-js-widgets/extension",
        "nbtools",
        "nbextensions/genepattern/index",
        "jqueryui"], function (Jupyter, widgets, NBToolManager, auth) {

    var slider = {};
    var init = {};

    /**
     * Attach the left-hand slider tab
     *
     * @returns {*|jQuery}
     */
    slider.sliderTab = function() {
        var auth_view = GenePattern.authenticated ? "inline-block" : "none";
        return $("<span></span>")
                .addClass("fa fa-th sidebar-button sidebar-button-main")
                .attr("title", "GenePattern Options")
                .css("display", auth_view)
                .click(function() {
                    // See if the tools cache needs updated
                    slider.updateTools();

                    // Show the slider
                    $("#slider").show("slide");
                });
    };

    /**
     * Create a slider option object
     *
     * @param id - ID of the object (usually LSID)
     * @param name - Name of the object (module name)
     * @param anno - Annotation (version number)
     * @param desc - Description
     * @param tags - List of tags
     * @returns {*|jQuery}
     */
    slider.sliderOption = function(id, name, origin, anno, desc, tags) {
        var tagString = tags.join(", ");
        return $("<div></div>")
            .addClass("well well-sm slider-option")
            .attr("name", id)
            .attr("data-id", id)
            .attr("data-name", name)
            .attr("data-origin", origin)
            .append(
                $("<h4></h4>")
                    .addClass("slider-option-name")
                    .append(name)
            )
            .append(
                $("<h5></h5>")
                    .addClass("slider-option-anno")
                    .append(anno)
            )
            .append(
                $("<span></span>")
                    .addClass("slider-option-desc")
                    .append(desc)
            )
            .append(
                $("<span></span>")
                    .addClass("slider-option-tags")
                    .append(tagString)
            );
    };

    /**
     * Attach the GenePattern left-hand slider
     *
     * @returns {*|jQuery}
     */
    slider.slider = function() {
        return $("<div></div>")
            .attr("id", "slider")
            .hide()

            // Append the navigation tab
            .append(
                $("<span></span>")
                    .addClass("fa fa-th sidebar-button sidebar-button-slider")
                    .attr("title", "GenePattern Options")
                    .click(function() {
                        $("#slider").hide("slide");
                    })
            )

            // Append the filter box
            .append(
                $("<div></div>")
                    .attr("id", "slider-filter-box")
                    .append(
                        $("<input/>")
                            .attr("id", "slider-filter")
                            .attr("type", "search")
                            .attr("placeholder", "Type to Filter")
                            .keydown(function(event) {
                                event.stopPropagation();
                            })
                            .keyup(function() {
                                var search = $("#slider-filter").val().toLowerCase();
                                $.each($("#slider-tabs").find(".slider-option"), function(index, element) {
                                    var raw = $(element).text().toLowerCase();
                                    if (raw.indexOf(search) === -1) {
                                        $(element).hide();
                                    }
                                    else {
                                        $(element).show();
                                    }
                                })
                            })
                    )
            )

            // Append the internal tabs
            .append(
                $("<div></div>")
                    .attr("id", "slider-tabs")
                    .addClass("tabbable")
                    .append(
                        $("<ul></ul>")
                            .addClass("nav nav-tabs")
                            .append(
                                $("<li></li>")
                                    .addClass("active")
                                    .append(
                                        $("<a></a>")
                                            .attr("data-toggle", "tab")
                                            .attr("href", "#slider-Tools")
                                            .attr("name", "Tools")
                                            .text("Tools")
                                    )
                            )
                    )
                    .append(
                        $("<div></div>")
                            .addClass("tab-content")
                            .append(
                                $("<div></div>")
                                    .attr("id", "slider-Tools")
                                    .addClass("tab-pane active")
                            )
                    )
            );
    };

    slider.getDomain = function(url) {
        var a = document.createElement('a');
        a.href = url;
        return a.hostname;
    };

    slider.domEncode = function(str) {
        return str.replace(/^[^a-z]+|[^\w:.-]+/gi, "");
    };

    slider.getSliderTab = function(origin) {
        var tab_id = "slider-" + slider.domEncode(origin);
        return $("#" + tab_id);
    };

    slider.sliderTabExists = function(origin) {
        return slider.getSliderTab(origin).length > 0;
    };

    slider.addSliderTab = function(origin) {
        // Check to see if the tab already exists
        var tab_id = "slider-" + slider.domEncode(origin);
        if (slider.sliderTabExists(origin)) {
            console.log("WARNING: Attempting to add slider tab that already exists");
            return;
        }

        // Add the tab
        var slider_tabs = $("#slider-tabs");
        var tabs = slider_tabs.find(".nav-tabs");
        var new_tab = $("<li></li>").append(
            $("<a></a>")
                .attr("data-toggle", "tab")
                .attr("href", "#" + tab_id)
                .attr("name", origin)
                .text(origin)
        );
        tabs.append(new_tab);

        // Add the content pane
        var contents = slider_tabs.find(".tab-content");
        contents.append(
            $("<div></div>")
                .attr("id", tab_id)
                .addClass("tab-pane")
        );
    };

    slider.removeSliderTab = function(origin) {
        // Check to see if the tab exists
        var tab_id = "slider-" + slider.domEncode(origin);
        if (!slider.sliderTabExists(origin)) {
            console.log("WARNING: Attempting to remove slider tab that doesn't exists");
            return;
        }

        // Remove the tab
        var slider_tabs = $("#slider-tabs");
        slider_tabs.find(".nav-tabs").find("[name=" + origin + "]").parent().remove();

        // Remove the content pane
        slider_tabs.find("#" + tab_id).remove();
    };

    slider.registerModule = function(module) {
        // Prepare the origin
        var origin = null;
        var gp_url = GenePattern.server();
        if (gp_url === "https://genepattern.broadinstitute.org/gp") origin = "GenePattern Public";
        else if (gp_url === "https://gp.indiana.edu/gp") origin = "GenePattern Indiana";
        else if (gp_url === "https://gpbroad.broadinstitute.org/gp") origin = "GenePattern Broad";
        else origin = slider.getDomain(gp_url);

        // Prepare tags
        var tags = module['categories'];
        $.each(module['tags'], function(i, e) {
            tags.push(e['tag'])
        });
        tags.sort();

        var ModuleTool = new NBToolManager.NBTool({
            origin: origin,
            id: module['lsid'],
            name: module['name'],
            version: "v" + module['version'],
            tags: tags,
            description: module['description'],
            load: function() { return true; },
            prepare: function() {
                var cell = Jupyter.notebook.get_selected_cell();
                var is_empty = cell.get_text().trim() == "";

                // If this cell is not empty, insert a new cell and use that
                if (!is_empty) {
                    cell = Jupyter.notebook.insert_cell_below();
                    Jupyter.notebook.select_next();
                }

                // Otherwise just use this cell
                return cell;
            },
            render: function(cell) {
                slider.buildModuleCode(cell, 0, module);
                setTimeout(function() {
                    cell.execute();
                }, 10);

                return true;
            }
        });

        NBToolManager.instance().register(ModuleTool);
    };

    slider.registerAllModules = function(modules) {
        modules.forEach(function(module) {
            // Only add module if it is not a Java visualizer
            if (module['categories'].indexOf("Visualizer") !== -1) return;
            slider.registerModule(module);
        });
    };

    /**
     * Authenticate the notebook & change nav accordingly
     *
     * @param data
     */
    slider.authenticate = function(data) {
        // Show the GenePattern cell button
        $(".gp-cell-button").css("visibility", "visible");

        // Show the slider tab
        $(".sidebar-button-main").show("slide", {"direction": "left"});

        // Register all modules with the tool manager
        if (data['all_modules']) {
            slider.registerAllModules(data['all_modules']);
        }
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
    slider.stripVersion = function(lsid) {
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
        var baseLsid = slider.stripVersion(module["lsid"]);

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
                   "job" + jobNumber + ".job_number = " + jobNumber + "\n" +
                   "genepattern.GPJobWidget(job" + jobNumber + ")";

        // Add the metadata
        slider.makeGPCell(cell, "job");

        // Add the code to the cell
        cell.set_text(code);
    };

    /**
     * Convert a status object from a Job object to a display string
     *
     * @param statusObj
     * @returns {string}
     */
    slider.statusIndicator = function(statusObj) {
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
    };

    /**
     * Return whether the file URL is external, internal, upload
     *
     * @param value
     * @returns {string}
     */
    slider.fileLocationType = function(value) {
        if (typeof value === 'object') {
            return "Upload";
        }
        else if (value.indexOf(GenePattern.server()) !== -1 || value.indexOf("<GenePatternURL>") !== -1) {
            return "Internal"
        }
        else {
            return "External";
        }
    };

    /**
     * Return the name of a file from its url
     *
     * @param url
     * @returns {string}
     */
    slider.nameFromUrl = function(url) {
        var parts = url.split("/");
        return decodeURIComponent(parts[parts.length - 1]);
    };

    /**
     * Encode text for HTML display
     *
     * @param text
     * @returns {string}
     */
    slider.htmlEncode = function(text) {
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

    slider.toGenePatternCell = function(formerType) {
        var dialog = require('base/js/dialog');
        var cell = Jupyter.notebook.get_selected_cell();
        var index = Jupyter.notebook.get_selected_index();
        var contents = cell.get_text().trim();

        // Define cell change internal function
        var cellChange = function(cell) {
            if (GenePattern.authenticated) {
                slider.widgetSelectDialog(cell);
            }
            else {
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
            }
        };

        // Define cell type check
        var typeCheck = function(cell) {
            var cell_type = cell.cell_type;
            if (cell_type !== "code") {
                Jupyter.notebook.to_code(index);
            }
            setTimeout(function() {
                var cell = Jupyter.notebook.get_selected_cell();
                cellChange(cell);
            }, 10);
        };

        // Prompt for change if the cell has contents
        if (contents !== "") {
            dialog.modal({
                notebook: Jupyter.notebook,
                keyboard_manager: this.keyboard_manager,
                title : "Change to GenePattern Cell?",
                body : "Are you sure you want to change this to a GenePattern cell? This will cause " +
                    "you to lose any code or other information already entered into the cell.",
                buttons : {
                    "Cancel" : {
                        "click": function() {
                            if (formerType) $("#cell_type").val(formerType).trigger("change");
                        }
                    },
                    "Change Cell Type" : {
                        "class" : "btn-warning",
                        "click" : function() {
                            typeCheck(cell);
                        }
                    }
                }
            });
        }
        else {
            typeCheck(cell);
        }

    };

    /**
     * Display the dialog for selecting a GenePattern widget to add
     *
     * @param cell
     */
    slider.widgetSelectDialog = function(cell) {
        // See if we need to update the tools display before building the GUI
        slider.updateTools();

        var modules = $("#slider-tabs").find(".tab-pane:last").clone();
        modules.attr("id", "dialog-modules");
        modules.css("height", $(window).height() - 200);
        modules.css("overflow-y", "auto");
        modules.css("padding-right", "10px");

        // Create filter
        var filterBox = $("<div></div>")
            .css("position", "absolute")
            .css("right", "40px")
            .css("top", "14px")
            .hide();
        filterBox.append(
            $("<input/>")
                .attr("id", "dialog-slider-filter")
                .attr("type", "search")
                .attr("placeholder", "Type to Filter")
                .keydown(function(event) {
                    event.stopPropagation();
                })
                .keyup(function() {
                    var search = $("#dialog-slider-filter").val().toLowerCase();
                    $.each($(".modal-body").find(".slider-option"), function(index, element) {
                        var raw = $(element).text().toLowerCase();
                        if (raw.indexOf(search) === -1) {
                            $(element).hide();
                        }
                        else {
                            $(element).show();
                        }
                    });
                })
        );

        // Attach the click functionality to modules
        $.each(modules.find(".slider-option"), function(index, element) {
            $(element).click(function() {
                var lsid = $(element).attr("data-id");
                var name = $(element).attr("data-name");
                var server = $(element).attr("data-origin");
                slider.buildModuleCode(cell, 0, {"lsid":lsid, "name": name});
                setTimeout(function() {
                    cell.execute();
                }, 10);
                $(".modal-footer").find("button").trigger("click");
            });
        });

        // Create the dialog
        var dialog = require('base/js/dialog');
        dialog.modal({
            notebook: Jupyter.notebook,
            keyboard_manager: this.keyboard_manager,
            title : "Select Widget Type",
            body : modules,
            buttons : {
                "Cancel" : {}
            }
        });

        // Add the filter
        setTimeout(function() {
            $(".modal-header").append(filterBox);
            filterBox.show("fade");
            filterBox.find("#dialog-slider-filter").trigger("keyup");
            modules.scrollTop(0);
        }, 500);
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
            var kindsMap = GenePattern.kinds();
            if (kindsMap !==  null && kindsMap !== undefined) {
                modules = kindsMap[fixedKind];
                if (modules === null || modules === undefined) { modules = []; } // Protect against undefined & null
                $.each(modules, function(i, module) {
                    sendToNewTask.append(
                        $("<option></option>")
                            .attr("data-lsid", module.lsid())
                            .attr("data-server", GenePattern.server())
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
                    slider.buildModuleCode(cell, 0, {"lsid":lsid, "name": name});

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
                    var task = GenePattern.task(taskWidget.options.lsid);
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

        // Make the "i" icon open the menus as well
        var icon = element.find(".fa-info-circle");
        icon.click(function(event) {
            $(this).parent().popover("show");
            event.preventDefault();
            event.stopPropagation();
        });

        return element;
    };

    /*
     * Initialization functions
     */

    init = init || {};

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
            slider.makeGPCell(cell, "auth");
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

    slider.updateTools = function() {
        // Get the correct list divs
        var slider_div = $("#slider-tabs");
        // var list_divs = slider_div.find(".tab-content").children();

        // Do we need to refresh the cache?
        var refresh = slider_div.data("cached") !== NBToolManager.instance().modified().toString();

        // Refresh the cache, if necessary
        if (refresh) {
            // Empty the list divs
            slider_div.find(".tab-content").children().empty();
            // list_divs.forEach(function(div) {
            //     div.empty();
            // });

            // Write the new cache timestamp
            slider_div.data("cached", NBToolManager.instance().modified().toString());

            // Get the updated list of tools
            var tools = NBToolManager.instance().list();

            // Add the tools to the lists
            tools.forEach(function(tool) {
                var option = slider.sliderOption(
                    tool.id,
                    tool.name,
                    tool.origin,
                    tool.version ? tool.version : "",
                    tool.description ? tool.description : "",
                    tool.tags ? tool.tags : []);

                // Attach the click
                option.click(function() {
                    // Prepare the cell
                    var cell = tool.prepare();

                    // Render the tool
                    tool.render(cell);

                    // Scroll to the cell, if applicable
                    if (cell) {
                        $('#site').animate({
                            scrollTop: $(cell.element).position().top
                        }, 500);
                    }

                    // Close the slider
                    $(".sidebar-button-slider").trigger("click");
                });

                // Does the origin div exist?
                var tab_exists = slider.sliderTabExists(tool.origin);

                // If it doesn't exist, create it
                if (!tab_exists) slider.addSliderTab(tool.origin);

                // Get the slider tab and add the tool
                slider.getSliderTab(tool.origin).append(option);
            });
        }
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
        var body = $("body");
        body.append(slider.sliderTab());
        body.append(slider.slider());

        // Hide or show the slider tab if a GenePattern cell is highlighted
        $(".sidebar-button-main").show();
        // $([Jupyter.events]).on('select.Cell', function() {
        //     var cell = Jupyter.notebook.get_selected_cell();
        //     var isGPCell = cell.element.find(".gp-widget").length > 0;
        //
        //     // If authenticated and the selected cell is a GenePattern cell, show
        //     if (GenePattern.authenticated && isGPCell) {
        //         $(".sidebar-button-main").show();
        //     }
        //
        //     // Else, hide
        //     else {
        //         $(".sidebar-button-main").hide();
        //     }
        // });

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

        // Hide the loading screen
        setTimeout(function () {
            $(".loading-screen").hide("fade");
        }, 100);
    };

    slider.makeGPCell = function (cell, type) {
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
    };

    return {
        slider: slider,
        init: init
    }
});
