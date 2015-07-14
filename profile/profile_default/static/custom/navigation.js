/*
 * Navigation widgets
 */

var GenePattern = GenePattern || {};

GenePattern.notebook = GenePattern.notebook || {};

/**
 * Attaches the loading screen
 *
 * @returns {*|jQuery}
 */
GenePattern.notebook.loadingScreen = function() {
    return $("<div></div>")
        .addClass("loading-screen")
        .append(
            $("<img/>")
                .attr("src", "/static/custom/GP_logo_on_black.png")
        );
};

/**
 * Attach the bottom "Add Cell" buttons
 * @returns {*|jQuery}
 */
GenePattern.notebook.bottomButton = function() {
    var auth_view = GenePattern.authenticated ? "visible" : "hidden";
    return $("<div></div>")
            .addClass("container add-cell-container")
            .append(
                $("<span></span>")
                    .addClass("fa fa-paragraph add-cell-button")
                    .attr("title", "Add Markdown Cell")
                    .attr("data-toggle", "tooltip")
                    .attr("data-placement", "top")
                    .click(function() {
                        var index = IPython.notebook.get_selected_index();
                        IPython.notebook.insert_cell_below('markdown', index);
                        IPython.notebook.select_next();
                    })
            )
            .append(
                $("<span></span>")
                    .addClass("fa fa-terminal add-cell-button")
                    .attr("title", "Add Code Cell")
                    .attr("data-toggle", "tooltip")
                    .attr("data-placement", "top")
                    .click(function() {
                        var index = IPython.notebook.get_selected_index();
                        IPython.notebook.insert_cell_below('code', index);
                        IPython.notebook.select_next();
                    })
            )
            .append(
                $("<span></span>")
                    .addClass("fa fa-th add-cell-button gp-cell-button")
                    .attr("title", "Add GenePattern Cell")
                    .css("padding-left", "1px")
                    .css("visibility", auth_view)
                    .attr("data-toggle", "tooltip")
                    .attr("data-placement", "top")
                    .click(function() {
                        var index = IPython.notebook.get_selected_index();
                        var cell = IPython.notebook.insert_cell_below('code', index);
                        IPython.notebook.select_next();
                        GenePattern.notebook.widgetSelectDialog(cell);
                    })
            );
};

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
            .attr("data-toggle", "tooltip")
            .attr("data-placement", "right")
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

        // Append the navigation tab
        .append(
            $("<span></span>")
                .addClass("fa fa-th sidebar-button sidebar-button-slider")
                .attr("title", "GenePattern Options")
                .attr("data-toggle", "tooltip")
                .attr("data-placement", "right")
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
            var tags = module['categories'];
            $.each(module['tags'], function(i, e) {
                tags.push(e['tag'])
            });
            tags.sort();
            var option = GenePattern.notebook.sliderOption(module['lsid'], module['name'], "v" + module['version'], module['description'], tags);
            option.click(function() {
                var index = IPython.notebook.get_selected_index();
                IPython.notebook.insert_cell_below('code', index);
                IPython.notebook.select_next();
                var cell = IPython.notebook.get_selected_cell();
                var code = GenePattern.notebook.buildModuleCode(module);
                cell.set_text(code);
                setTimeout(function() {
                    cell.execute();
                }, 10);

                // Close the slider
                $(".sidebar-button-slider").trigger("click");

                // Scroll to the new cell
                $('#site').animate({
                    scrollTop: $(IPython.notebook.get_selected_cell().element).position().top
                }, 500);
            });
            sliderModules.append(option);
        });
        sliderModules.append($("<p>&nbsp;</p>"))
    }
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

GenePattern.notebook.changeGenePatternPrompt = function() {
    var dialog = require('base/js/dialog');
    if (GenePattern.authenticated) {
        var cell = IPython.notebook.get_selected_cell();

        dialog.modal({
            notebook: IPython.notebook,
            keyboard_manager: this.keyboard_manager,
            title : "Change to GenePattern Widget?",
            body : "Are you sure you want to change this cell's type to a GenePattern widget? This will cause " +
                    "you to lose any code or other information already entered into the cell.",
            buttons : {
                "Cancel" : {},
                "Change Cell Type" : {
                    "class" : "btn-danger",
                    "click" : function() {
                        GenePattern.notebook.widgetSelectDialog(cell);
                    }
                }
            }
        });
    }
    else {
        dialog.modal({
            notebook: IPython.notebook,
            keyboard_manager: this.keyboard_manager,
            title : "Authentication Required",
            body : "You must first authenticate with a GenePattern server before creating a GenePattern widget.",
            buttons : {
                "OK" : {}
            }
        });
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
            console.log(element);
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
        notebook: IPython.notebook,
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
    GenePattern.notebook.init.launch_init.done_init = true;
};

/**
 * Initialize GenePattern Notebook from the notebook page
 */
GenePattern.notebook.init.notebook_init_wrapper = function () {
    if (!GenePattern.notebook.init.launch_init.done_init  && IPython.notebook.kernel) {
        // Call the core init function
        GenePattern.notebook.init.launch_init();

        // If no auth widget exists, add it
        setTimeout(function() {
            var authWidgetFound = $(".gp-widget-auth").length >= 1;

            // If jQuery didn't find the widget, does it exist as code?
            if (!authWidgetFound) {
                var cells = IPython.notebook.get_cells();
                $.each(cells, function(i, cell) {
                    var code = cell.get_text();
                    if (IPython.notebook.get_cells()[0].get_text().indexOf("GPAuthWidget(") > -1) {
                        authWidgetFound = true;
                    }
                });
            }

            // Add a new auth widget
            if (!authWidgetFound) {
                var cell = IPython.notebook.insert_cell_above("code", 0);
                var code = GenePattern.notebook.init.buildCode("http://genepattern.broadinstitute.org/gp", "", "");
                cell.code_mirror.setValue(code);
                cell.execute();
            }
        }, 1000);

        // Mark init as done
        GenePattern.notebook.init.launch_init.done_init = true;
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
%reload_ext gp\n\
%reload_ext gp_widgets\n\
%reload_ext gp_magics\n\
\n\
# Don\'t have the GenePattern library? It can be downloaded from: \n\
# http://genepattern.broadinstitute.org/gp/downloads/gp-python.zip \n\
# or installed through PIP: pip install genepattern-python \n\
import gp\n\
\n\
# The following widgets are components of the GenePattern Notebook extension.\n\
try:\n\
    from gp_widgets import GPAuthWidget, GPJobWidget, GPTaskWidget\n\
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
    // Change the logo
    $("#ipython_notebook").find("img").attr("src", "/static/custom/GP_logo_on_black.png");

    // Add the bottom buttons
    $("#notebook-container").append(GenePattern.notebook.bottomButton());

    // Add the sidebar
    var body = $("body");
    body.append(GenePattern.notebook.sliderTab());
    body.append(GenePattern.notebook.slider());

    // Initialize tooltips
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    });

    // Auto-run widgets
    $(function () {
        $.each($(".cell"), function(index, val) {
            if ($(val).html().indexOf("# !AUTOEXEC") > -1) {
                IPython.notebook.get_cell(index).execute();
            }
        });
    });

    // Add GenePattern "cell type"
    $("#cell_type")
        .append(
            $("<option value='code'>GenePattern</option>")
                .click(function() {
                    GenePattern.notebook.changeGenePatternPrompt();
                })
        );
    $("#change_cell_type").find("ul.dropdown-menu")
        .append(
            $("<li id='to_genepattern' title='Insert a GenePattern widget cell'><a href='#'>GenePattern</a></option>")
                .click(function() {
                    GenePattern.notebook.changeGenePatternPrompt();
                })
        );

    // Hide the loading screen
    setTimeout(function () {
        $(".loading-screen").toggle("fade");
    }, 100);
};

require(["jquery"], function() {
    // Add the loading screen
    $("body").append(GenePattern.notebook.loadingScreen());

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