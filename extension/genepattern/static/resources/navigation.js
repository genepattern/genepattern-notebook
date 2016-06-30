/**
 * Navigation widgets
 *
 * @author Thorin Tabor
 * @requires - jQuery
 *
 * Copyright 2015 The Broad Institute, Inc.
 *
 * SOFTWARE COPYRIGHT NOTICE
 * This software and its documentation are the copyright of the Broad Institute, Inc. All rights are reserved.
 * This software is supplied without any warranty or guaranteed support whatsoever. The Broad Institute is not
 * responsible for its use, misuse, or functionality.
 */
var GenePattern = GenePattern || {};
GenePattern.notebook = GenePattern.notebook || {};

// Add shim to support Jupyter 3.x and 4.x
var Jupyter = Jupyter || IPython || {};

// Add file path shim for Jupyter 3/4
var STATIC_PATH = location.origin + Jupyter.contents.base_url + "nbextensions/genepattern/resources/";

/**
 * Attach the left-hand slider tab
 *
 * @returns {*|jQuery}
 */
GenePattern.notebook.sliderTab = function() {
    var auth_view = GenePattern.authenticated ? "inline-block" : "none";
    return $("<span></span>")
            .addClass("fa fa-th sidebar-button sidebar-button-main")
            .attr("title", "GenePattern Options")
            .css("display", auth_view)
            .click(function() {
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
GenePattern.notebook.sliderOption = function(id, name, anno, desc, tags) {
    var tagString = tags.join(", ");
    return $("<div></div>")
        .addClass("well well-sm slider-option")
        .attr("name", id)
        .attr("data-id", id)
        .attr("data-name", name)
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
GenePattern.notebook.slider = function() {
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
                                        .attr("href", "#slider-modules")
                                        .text("Modules")
                                )
                        )
                        .append(
                            $("<li></li>")
                                .append(
                                    $("<a></a>")
                                        .attr("data-toggle", "tab")
                                        .attr("href", "#slider-data")
                                        .text("Data")
                                        .hide()
                                )
                        )
                        .append(
                            $("<li></li>")
                                .append(
                                    $("<a></a>")
                                        .attr("data-toggle", "tab")
                                        .attr("href", "#slider-jobs")
                                        .text("Jobs")
                                )
                        )
                )
                .append(
                    $("<div></div>")
                        .addClass("tab-content")
                        .append(
                            $("<div></div>")
                                .attr("id", "slider-modules")
                                .addClass("tab-pane active")
                        )
                        .append(
                            $("<div></div>")
                                .attr("id", "slider-data")
                                .addClass("tab-pane")
                                .hide()
                        )
                        .append(
                            $("<div></div>")
                                .attr("id", "slider-jobs")
                                .addClass("tab-pane")
                        )
                )
        );
};

/**
 * Authenticate the notebook & change nav accordingly
 *
 * @param data
 */
GenePattern.notebook.authenticate = function(data) {
    // Show the GenePattern cell button
    $(".gp-cell-button").css("visibility", "visible");

    // Show the slider tab
    $(".sidebar-button-main").show("slide", {"direction": "left"});

    // Clear and add the modules to the slider
    var sliderModules = $("#slider-modules");
    sliderModules.empty();
    if (data['all_modules']) {
        $.each(data['all_modules'], function(index, module) {
            // Only add module if it is not a Java visualizer
            if (module['categories'].indexOf("Visualizer") === -1) {
                var tags = module['categories'];
                $.each(module['tags'], function(i, e) {
                    tags.push(e['tag'])
                });
                tags.sort();
                var option = GenePattern.notebook.sliderOption(module['lsid'], module['name'], "v" + module['version'], module['description'], tags);
                option.click(function() {
                    var index = Jupyter.notebook.get_selected_index();
                    Jupyter.notebook.insert_cell_below('code', index);
                    Jupyter.notebook.select_next();
                    var cell = Jupyter.notebook.get_selected_cell();
                    var code = GenePattern.notebook.buildModuleCode(module);
                    cell.set_text(code);
                    setTimeout(function() {
                        cell.execute();
                    }, 10);

                    // Close the slider
                    $(".sidebar-button-slider").trigger("click");

                    // Scroll to the new cell
                    $('#site').animate({
                        scrollTop: $(Jupyter.notebook.get_selected_cell().element).position().top
                    }, 500);
                });
                sliderModules.append(option);
            }
        });
        sliderModules.append($("<p>&nbsp;</p>"))
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
GenePattern.notebook.taskWidgetsForKind = function(kind) {
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
GenePattern.notebook.removeKindVisualizers = function(kindMap) {
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
 * Build the basic code for displaying a module widget
 *
 * @param module
 */
GenePattern.notebook.buildModuleCode = function(module) {
    var baseName = module["name"].toLowerCase().replace(/\./g, '_');
    var taskName = baseName + "_task";
    var specName = baseName + "_job_spec";

    return "# !AUTOEXEC\n\n" +
            taskName + " = gp.GPTask(gpserver, '" + module["lsid"] + "')\n" +
            specName + " = " + taskName + ".make_job_spec()\n" +
            "GPTaskWidget(" + taskName + ")";
};

/**
 * Build the basic code for displaying a job widget
 *
 * @param jobNumber
 * @returns {string}
 */
GenePattern.notebook.buildJobCode = function(jobNumber) {
    return "# !AUTOEXEC\n\n" +
            "job" + jobNumber + " = gp.GPJob(gpserver, " + jobNumber + ")\n" +
            "job" + jobNumber + ".job_number = " + jobNumber + "\n" +
            "GPJobWidget(job" + jobNumber + ")";
};

/**
 * Convert a status object from a Job object to a display string
 *
 * @param statusObj
 * @returns {string}
 */
GenePattern.notebook.statusIndicator = function(statusObj) {
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
GenePattern.notebook.fileLocationType = function(value) {
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
GenePattern.notebook.nameFromUrl = function(url) {
    var parts = url.split("/");
    return decodeURIComponent(parts[parts.length - 1]);
};

/**
 * Encode text for HTML display
 *
 * @param text
 * @returns {string}
 */
GenePattern.notebook.htmlEncode = function(text) {
    return text.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
};

/**
 * Remove a slider option representing a job from the slider
 *
 * @param jobNumber
 */
GenePattern.notebook.removeSliderJob = function(jobNumber) {
    // Remove from jobs list
    for (var i = 0; i < GenePattern._jobs.length; i++) {
        var job = GenePattern._jobs[i];
        if (job.jobNumber() === jobNumber) {
            GenePattern._jobs.splice(i, 1);
        }
    }

    // Update the UI
    $("#slider-jobs").find(".slider-option[name='" + jobNumber + "']").remove();
};

/**
 * Update a slider option representing a job on the slider
 *
 * @param job
 */
GenePattern.notebook.updateSliderJob = function(job) {
    // If the job does not yet exist in the list, add it
    var jobsSlider = $("#slider-jobs");
    var existingOption = jobsSlider.find(".slider-option[name='" + job.jobNumber() + "']");
    if (existingOption.length < 1) {
        // Add to jobs list
        GenePattern._jobs.push(job);

        // Update the UI
        var option = GenePattern.notebook.sliderOption(job.jobNumber(), job.jobNumber() + ". " + job.taskName(),
            GenePattern.notebook.statusIndicator(job.status()), "Submitted: " + job.dateSubmitted(), []);
        option.click(function() {
            $('#site').animate({
                scrollTop: $(".gp-widget-job[name='" + job.jobNumber() + "']").position().top
            }, 500);

            // Close the slider
            $(".sidebar-button-slider").trigger("click");
        });
        jobsSlider.append(option);
    }
    // Otherwise update the view
    else {
        // Update in jobs list
        for (var i = 0; i < GenePattern._jobs.length; i++) {
            var jobInList = GenePattern._jobs[i];
            if (jobInList.jobNumber() === job.jobNumber()) {
                GenePattern._jobs.splice(i, 1, job);
            }
        }

        // Update the UI
        existingOption.find(".slider-option-anno").text(GenePattern.notebook.statusIndicator(job.status()));
    }
};

/**
 * Remove a slider option representing data from the slider
 *
 * @param name
 */
GenePattern.notebook.removeSliderData = function(name) {
    // Update the UI
    $("#slider-data").find(".slider-option[name='" + name + "']").remove();
};

/**
 * Update a slider option representing data on the slider
 *
 * @param url
 * @param value
 */
GenePattern.notebook.updateSliderData = function(url, value) {
    // If the data does not yet exist in the list, add it
    var dataSlider = $("#slider-data");
    var existingOption = dataSlider.find(".slider-option[name='" + url + "']");
    if (existingOption.length < 1) {
        // Update the UI
        var type = GenePattern.notebook.fileLocationType(value);
        var name = GenePattern.notebook.nameFromUrl(url);
        var urlWithPrefix = type === "Upload" ? "Ready to Upload: " + GenePattern.notebook.htmlEncode(url) : GenePattern.notebook.htmlEncode(url);
        var option = GenePattern.notebook.sliderOption(url, name, type, urlWithPrefix, []);
        option.click(function() {
            // Close the slider
            $(".sidebar-button-slider").trigger("click");

            var fileOffset = $(".file-widget-value-text:contains('" + url + "')").offset().top;
            var notebookOffset = $("#notebook").offset().top;

            $('#site').animate({
                scrollTop: fileOffset - notebookOffset - 50
            }, 500);
        });
        dataSlider.append(option);
    }
};

GenePattern.notebook.toGenePatternCell = function() {
    var dialog = require('base/js/dialog');
    var cell = Jupyter.notebook.get_selected_cell();
    var contents = cell.get_text().trim();

    // Define cell change internal function
    var cellChange = function(cell) {
        if (GenePattern.authenticated) {
            GenePattern.notebook.widgetSelectDialog(cell);
        }
        else {
            // Get the auth widget code
            var code = GenePattern.notebook.init.buildCode("http://genepattern.broadinstitute.org/gp", "", "");

            // Put the code in the cell
            cell.code_mirror.setValue(code);

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

    // Prompt for change if the cell has contents
    if (contents !== "") {
        dialog.modal({
            notebook: Jupyter.notebook,
            keyboard_manager: this.keyboard_manager,
            title : "Change to GenePattern Cell?",
            body : "Are you sure you want to change this to a GenePattern cell? This will cause " +
                "you to lose any code or other information already entered into the cell.",
            buttons : {
                "Cancel" : {},
                "Change Cell Type" : {
                    "class" : "btn-warning",
                    "click" : function() {
                        cellChange(cell);
                    }
                }
            }
        });
    }
    else {
        cellChange(cell);
    }

};

/**
 * Display the dialog for selecting a GenePattern widget to add
 *
 * @param cell
 */
GenePattern.notebook.widgetSelectDialog = function(cell) {
    var modules = $("#slider-modules").clone();
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
            var code = GenePattern.notebook.buildModuleCode({"lsid":lsid, "name": name});
            cell.set_text(code);
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
GenePattern.notebook.buildMenu = function(widget, element, name, href, kind, indexString, fullMenu) {

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
                    .addClass("list-group-item gp-widget-job-view-code")
                    .text("View Code Use")
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
                        .text(module.name())
                )
            });
        }
        if (modules === null || modules.length === 0) {
            sendToNewTask.parent().hide();
        }

        // Attach methods in a way that will not break when popover is hidden
        element.on('shown.bs.popover', function () {
            var viewCodeButton = element.parent().find(".gp-widget-job-view-code");
            var newTaskDropdown = element.parent().find(".gp-widget-job-new-task");
            var sendToExistingTask = element.parent().find('.gp-widget-job-existing-task');

            // Unbind old click events so they aren't double-bound
            viewCodeButton.unbind("click");
            newTaskDropdown.unbind("change");
            sendToExistingTask.unbind("change");

            // Attach the click method to "view code"
            viewCodeButton.click(function() {
                widget.codeDialog(widget.options.job, indexString);
                $(".popover").popover("hide");
            });

            // Attach "Send to New Task" clicks
            newTaskDropdown.change(function(event) {
                var option = $(event.target).find(":selected");
                var lsid = option.attr("data-lsid");
                if (lsid === undefined || lsid === null) return;
                var name = option.text();
                var cell = Jupyter.notebook.insert_cell_at_bottom();
                var code = GenePattern.notebook.buildModuleCode({"lsid":lsid, "name": name});
                cell.set_text(code);

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
            var matchingTasks = GenePattern.notebook.taskWidgetsForKind(fixedKind);
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
                sendToExistingTask
                    .append(
                        $("<option></option>")
                            .text(task.name() + " [Cell " + cellIndex + "]")
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

GenePattern.notebook.init = GenePattern.notebook.init || {};

/**
 * Initialize GenePattern Notebook from the main notebook listing page
 *
 * @param evt
 */
GenePattern.notebook.init.main_init_wrapper = function(evt) {
    GenePattern.notebook.init.launch_init(evt);

    // Mark init as done
    GenePattern.notebook.init.done_init = true;
};

/**
 * Initialize GenePattern Notebook from the notebook page
 */
GenePattern.notebook.init.notebook_init_wrapper = function () {
    if (!GenePattern.notebook.init.done_init  && Jupyter.notebook.kernel) {
        // Mark init as done
        GenePattern.notebook.init.done_init = true;

        // Call the core init function
        GenePattern.notebook.init.launch_init();

        // Initialize the GenePattern cell type keyboard shortcut
        Jupyter.keyboard_manager.command_shortcuts.add_shortcut('g', {
            help : 'to GenePattern',
            help_index : 'cc',
            handler : function () {
                GenePattern.notebook.toGenePatternCell();
                return false;
            }}
        );

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
    }
};

/**
 * Build the Python code used to authenticate GenePattern
 *
 * @param server
 * @param username
 * @param password
 */
GenePattern.notebook.init.buildCode = function(server, username, password) {
    return '# !AUTOEXEC\n\
\n\
%reload_ext genepattern\n\
\n\
# Don\'t have the GenePattern Notebook? It can be installed from PIP: \n\
# pip install genepattern-notebook \n\
import gp\n\
\n\
# The following widgets are components of the GenePattern Notebook extension.\n\
try:\n\
    from genepattern import GPAuthWidget, GPJobWidget, GPTaskWidget\n\
except:\n\
    def GPAuthWidget(input):\n\
        print("GP Widget Library not installed. Please visit http://genepattern.org")\n\
    def GPJobWidget(input):\n\
        print("GP Widget Library not installed. Please visit http://genepattern.org")\n\
    def GPTaskWidget(input):\n\
        print("GP Widget Library not installed. Please visit http://genepattern.org")\n\
\n\
# The gpserver object holds your authentication credentials and is used to\n\
# make calls to the GenePattern server through the GenePattern Python library.\n\
# Your actual username and password have been removed from the code shown\n\
# below for security reasons.\n\
gpserver = gp.GPServer("' + server + '", "' + username + '", "' + password + '")\n\
\n\
# Return the authentication widget to view it\n\
GPAuthWidget(gpserver)';
};

/**
 * Initialize GenePattern Notebook core functionality
 */
GenePattern.notebook.init.launch_init = function() {
    // Add the sidebar
    var body = $("body");
    body.append(GenePattern.notebook.sliderTab());
    body.append(GenePattern.notebook.slider());

    // Hide or show the slider tab if a GenePattern cell is highlighted
    $([Jupyter.events]).on('select.Cell', function() {
        var cell = Jupyter.notebook.get_selected_cell();
        var isGPCell = cell.element.find(".gp-widget").length > 0;

        // If authenticated and the selected cell is a GenePattern cell, show
        if (GenePattern.authenticated && isGPCell) {
            $(".sidebar-button-main").show();
        }

        // Else, hide
        else {
            $(".sidebar-button-main").hide();
        }
    });

    // Initialize tooltips
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    });

    // Auto-run widgets
    $(function () {
        $.each($(".cell"), function(index, val) {
            if ($(val).html().indexOf("# !AUTOEXEC") > -1) {
                Jupyter.notebook.get_cell(index).execute();
            }
        });
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
                // DO ACTION
                GenePattern.notebook.toGenePatternCell();
            }
        });

        // Reverse the ordering of events so we check for ours first
        $._data( $("#cell_type")[0], "events" ).change.reverse();
    }

    var cellMenu = $("#change_cell_type");
    var gpInMenu = cellMenu.find("#to_genepattern").length > 0;
    if (!gpInMenu) {
        cellMenu.find("ul.dropdown-menu")
            .append(
                $("<li id='to_genepattern' title='Insert a GenePattern widget cell'><a href='#'>GenePattern</a></option>")
                    .click(function() {
                        GenePattern.notebook.toGenePatternCell();
                    })
            );
    }

    // Hide the loading screen
    setTimeout(function () {
        $(".loading-screen").hide("fade");
    }, 100);
};

requirejs([
    "jquery",
    STATIC_PATH + "gp.js",
    STATIC_PATH + "navigation.js",
    STATIC_PATH + "auth-widget.js",
    STATIC_PATH + "job-widget.js",
    STATIC_PATH + "task-widget.js"], function() {
    // If in a notebook, display with the full event model
    $([IPython.events]).on('kernel_ready.Kernel kernel_created.Session notebook_loaded.Notebook', GenePattern.notebook.init.notebook_init_wrapper);

    // If the notebook listing page, display with alternate event model
    if ($(document).find("#notebooks").length > 0) {
        setTimeout(GenePattern.notebook.init.main_init_wrapper, 100);
    }

    // If the notebook text edit page, display with alternate event model
    if ($("#texteditor-container").length > 0) {
        setTimeout(GenePattern.notebook.init.main_init_wrapper, 100);
    }
});