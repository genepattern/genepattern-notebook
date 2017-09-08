/**
 * Define the GenePattern Call widget for Jupyter Notebook
 *
 * @author Thorin Tabor
 * @requires - jQuery, navigation.js
 *
 * Copyright 2016 The Broad Institute, Inc.
 *
 * SOFTWARE COPYRIGHT NOTICE
 * This software and its documentation are the copyright of the Broad Institute, Inc. All rights are reserved.
 * This software is supplied without any warranty or guaranteed support whatsoever. The Broad Institute is not
 * responsible for its use, misuse, or functionality.
 */

define("genepattern/call", ["base/js/namespace",
                            "nbextensions/jupyter-js-widgets/extension",
                            "genepattern/navigation",
                            "genepattern/task"], function (Jupyter, widgets, GPNotebook, tasks) {

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
    $.widget("gp.callCode", {
        // Flags for whether events have been called on the widget
        _widgetRendered: false,
        _paramsLoaded: false,

        options: {
            name: null,
            description: null,
            params: null,
            function_import: null,
            cell: null
        },

        /**
         * Constructor
         *
         * @private
         */
        _create: function() {
            // Set variables
            var widget = this;
            var identifier = this.options.name;

            // Add data pointer
            this.element.data("widget", this);

            // Add classes and scaffolding
            this.element.addClass("panel panel-default gp-widget gp-widget-call gp-server-local");
            this.element.append( // Attach header
                $("<div></div>")
                    .addClass("panel-heading gp-widget-task-header")
                    .append(
                        $("<div></div>")
                            .addClass("widget-float-right")
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
                                                                .attr("title", "View Documentation")
                                                                .attr("href", "#")
                                                                .append("Documentation")
                                                                .click(function() {
                                                                    widget.show_documentation();
                                                                })
                                                        )
                                                )
                                                // TODO: Uncomment once module widget is finished
                                                // .append(
                                                //     $("<li></li>")
                                                //         .append(
                                                //             $("<a></a>")
                                                //                 .attr("title", "Create GenePattern Module")
                                                //                 .attr("href", "#")
                                                //                 .append("Create Module")
                                                //                 .click(function() {
                                                //                     widget.module_dialog();
                                                //                 })
                                                //         )
                                                // )
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
                                    .addClass("gp-widget-task-name")
                                    .append(identifier + " { }")
                            )
                    )
            );
            this.element.append( // Attach header
                $("<div></div>")
                    .addClass("panel-body")
                    .css("position", "relative")
                    .append(
                        $("<div></div>")
                            .addClass("widget-code gp-widget-task-code")
                            .css("display", "none")
                    )
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
                                    .addClass("gp-widget-task-desc")
                            )
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
                                    .append("* Required Field")
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
                                    .append("* Required Field")
                            )
                    )
            );

            // Make call to build the header & form
            widget._buildHeader();
            widget._buildForm();

            // Trigger gp.widgetRendered event on cell element
            setTimeout(function() {
                widget._widgetRendered = true;
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
            this.element.removeClass("gp-widget-call");
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
            var widget = this;
            widget._buildHeader();
            widget._buildForm();
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

        module_dialog: function() {
            var dialog = require('base/js/dialog');
            dialog.modal({
                notebook: Jupyter.notebook,
                keyboard_manager: this.keyboard_manager,
                title : "Create GenePattern Module",
                body : "This will attempt to convert the notebook into a GenePattern module using the parameters of the selected function.",
                buttons : {
                    "Cancel" : {
                        "click": function() {}
                    },
                    "Create Module" : {
                        "class" : "btn-primary",
                        "click" : function() {
                            // TODO: Implement
                        }
                    }
                }
            });
        },

        /**
         * Displays the Python help doc for the function
         */
        show_documentation: function() {
            var widget = this;
            var index = GPNotebook.util.cell_index(widget.options.cell) + 1;
            var cell = Jupyter.notebook.insert_cell_at_index("code", index);
            cell.set_text("help(" + widget.options.name + ")");
            cell.execute();

            // Scroll to the new cell
            $('#site').animate({
                scrollTop: $(cell.element).position().top
            }, 500);
        },

        /**
         * Expand or collapse the task widget
         *
         *     expand - optional parameter used to force an expand or collapse,
         *         leave undefined to toggle back and forth
         */
        expandCollapse: function(expand) {
            var toSlide = this.element.find(".panel-body");
            var indicator = this.element.find(".widget-slide-indicator").find("span");
            var isHidden = toSlide.is(":hidden");

            if (isHidden || expand) {
                toSlide.slideDown();
                indicator.removeClass("fa-plus");
                indicator.addClass("fa-minus");
            }
            else if (expand === false || !isHidden) {
                toSlide.slideUp();
                indicator.removeClass("fa-minus");
                indicator.addClass("fa-plus");
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
                throw "Error creating Call widget! No LSID or name!";
            }
        },

        /**
         * Display module not installed message
         *
         * @private
         */
        _showUninstalledMessage: function() {
            // Mark the module as not installed
            this._installed = false;

            // Show the message
            this.element.find(".gp-widget-task-name").empty().text("Module Not Installed");
            this.errorMessage("This module is not installed on this GenePattern server.");
            this.element.find(".gp-widget-task-subheader").hide();
            this.element.find(".gp-widget-task-footer").hide();
        },

        /**
         * Build the header and return the Task object
         *
         * @private
         */
        _buildHeader: function() {
            var widget = this;

            // Trim lengthy docstrings
            var lines = widget.options.description.split('\n');
            if (lines.length > 10) {
                lines = lines.slice(0,10);
                lines.push("...");
            }
            var description = lines.join("\n");

            widget.element.find(".gp-widget-task-subheader").show();
            widget.element.find(".gp-widget-task-footer").show();
            widget.element.find(".gp-widget-task-desc").empty().text(description);
        },

        /**
         * Make the call to the server to get the params and build the form
         *
         * @private
         */
        _buildForm: function() {
            var widget = this;
            var params = widget.options.params;

            for (var i = 0; i < params.length; i++) {
                try {
                    var param = {
                        _name: params[i][0],
                        _optional: params[i][1],
                        _description: params[i][3],
                        _defaultValue: params[i][2],

                        name: function() {return this._name },
                        optional: function() {return this._optional },
                        type: function() {return "java.lang.String" },
                        description: function() {return this._description },
                        choices: function() {return false },
                        defaultValue: function() {return this._defaultValue }
                    };

                    var pDiv = widget._addParam(param);
                }
                catch(exception) {
                    console.log(exception);
                }
            }

            $(widget.element).trigger("runTask.paramLoad");
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
         * No op function for compatibility with textInput
         * Mirrors updateCode() in GPTaskWidget
         *
         * @param paramName
         * @param value
         */
        updateCode: function(paramName, value) {},

        /**
         * Add the parameter to the form and return the widget
         *
         * @param param
         * @private
         */
        _addParam: function(param) {
            var form = this.element.find(".gp-widget-task-form");
            var required = param.optional() ? "" : "*";

            var paramBox = $("<div></div>")
                .addClass(" form-group gp-widget-task-param")
                .attr("name", param.name())
                .attr("title", param.name())
                .append(
                    $("<label></label>")
                        .addClass("col-sm-3 control-label gp-widget-task-param-name")
                        .text(GPNotebook.util.display_name(param.name()) + required)
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
                                .text(param.description())
                        )
                );
            if (required) paramBox.addClass("gp-widget-task-required");

            // Add the correct input widget
            if (param.type() === "java.io.File") {
                paramBox.find(".gp-widget-task-param-input").fileInput({
                    runTask: this,
                    param: param
                });
            }
            else if (param.choices()) {
                paramBox.find(".gp-widget-task-param-input").choiceInput({
                    runTask: this,
                    param: param,
                    choices: param.choices(),
                    default: param.defaultValue()
                });
            }
            else if (param.type() === "java.lang.String") {
                paramBox.find(".gp-widget-task-param-input").textInput({
                    runTask: this,
                    param: param,
                    default: param.defaultValue()
                });
            }
            else if (param.type() === "java.lang.Integer" || param.type() === "java.lang.Float") {
                paramBox.find(".gp-widget-task-param-input").textInput({
                    runTask: this,
                    param: param,
                    default: param.defaultValue(),
                    type: "number"
                });
            }
            else {
                console.log("Unknown input type for Call widget: " + param.name() + " " + param.type());
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
            if ($(inputDiv).hasClass("file-widget")) {
                return $(inputDiv).fileInput("value");
            }
            else if ($(inputDiv).hasClass("text-widget")) {
                return $(inputDiv).textInput("value");
            }
            else if ($(inputDiv).hasClass("choice-widget")) {
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
            var messageBox = this.element.find(".gp-widget-task-message");
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
            var messageBox = this.element.find(".gp-widget-task-message");
            messageBox.removeClass("alert-success");
            messageBox.addClass("alert-danger");
            messageBox.text(message);
            messageBox.show("shake", {}, 500);
        },

        /**
         * Validate the current Call form
         */
        validate: function() {
            var validated = true;
            var missing = [];
            var params = this.element.find(".gp-widget-task-param");

            // Validate each required parameter
            for (var i = 0; i < params.length; i++) {
                var param = $(params[i]);
                var required = param.hasClass("gp-widget-task-required");
                if (required) {
                    var input = param.find(".gp-widget-task-param-input");
                    var value = this._getInputValue(input);
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
                this.clearError();
            }
            else {
                this.errorMessage("Missing required parameters: " + missing.join(", "));
            }

            return validated;
        },

        clearError: function() {
            const messageBox = this.element.find(".gp-widget-task-message");
            messageBox.removeClass("alert-danger");
            messageBox.hide();
        },

        buildFunctionCode: function(input) {
            console.log(input);
            var import_path = null;
            var toReturn = '';

            // Handle the case when the import couldn't be found
            if (this.options.function_import === '') {
                // toReturn += '# Unable to determine function import path. Please manually correct.\n';
                import_path = this.options.name
            }
            else {
                import_path = this.options.function_import;
            }

            toReturn += import_path + "(";
            var values = [];
            for (var i = 0; i < input.length; i++) {
                var value = input[i][0];
                if (!isNaN(parseFloat(value))) value = parseFloat(value);
                if (typeof value === "string") value = '"' + value + '"';
                if (typeof value === "boolean") value = value ? "True" : "False";
                if (value === undefined) value = '[]'; // Hack fix for empty lists
                values.push(value);
            }

            toReturn += values.join(", ");

            toReturn += ")";

            console.log(toReturn);

            return toReturn
        },

        /**
         * Submit the Call form to the kernel
         */
        submit: function() {
            var widget = this;

            widget.evaluateAllVars({
                success: function() {
                    // Assign values from the inputs to the job input
                    var funcInput = [];
                    var uiParams = widget.element.find(".gp-widget-task-param");
                    for (var i = 0; i < uiParams.length; i++) {
                        var uiParam = $(uiParams[i]);
                        var uiInput = uiParam.find(".gp-widget-task-param-input");
                        var uiValue = widget._getInputValue(uiInput);

                        if (uiValue !== null) {
                            // Wrap value in list if not already wrapped
                            if (uiValue.constructor !== Array) {
                                uiValue = [uiValue];
                            }

                            funcInput.push(uiValue);
                        }
                    }

                    // Scroll to the new cell
                    $('#site').animate({
                        scrollTop: $(widget.options.cell.element).position().top
                    }, 500);

                    widget.expandCollapse();
                    var index = GPNotebook.util.cell_index(widget.options.cell) + 1;
                    var cell = Jupyter.notebook.insert_cell_at_index("code", index);
                    var code = widget.buildFunctionCode(funcInput);
                    cell.code_mirror.setValue(code);
                    cell.execute();
                },
                error: function(exception) {
                    widget.errorMessage("Error evaluating kernel variables in preparation of job submission: " + exception.statusText);
                }
            });
        },

        /**
         * Iterate through every input parameter and replace input string with
         * kernel variables, if any, then make a callback
         *
         * @param pObj - Object containing the following params:
         *                  success: Callback for success, expects no arguments
         *                  error: Callback on error, expects exception
         */
        evaluateAllVars: function(pObj) {
            var widget = this;
            var inputWidgets = this.element.find(".gp-widget-task-param-input");
            var evalCallsFinished = false;
            var evalsNeeded = 0;
            var evalsFinished = 0;

            // Iterate over each widget
            for (var i = 0; i < inputWidgets.length; i++) {
                var iWidget = $(inputWidgets[i]).data("widget");
                var value = iWidget.value();

                // Protect against nulls
                if (value === null || value === undefined) value = [];

                var makeCall = function(iWidget, value, valueIndex) {
                    tasks.VariableManager.evaluateVariables(value, function(evalValue) {
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

                    makeCall(iWidget, value.toString());
                }
                // Otherwise, iterate over the list, evaluate and set
                else {
                    evalsNeeded += value.length;

                    for (var j = 0; j < value.length; j++) {
                        var valueIndex = j;
                        var innerValue = value[j];

                        makeCall(iWidget, innerValue.toString(), valueIndex);
                    }
                }
            }

            // All calls for evaluation have been made
            evalCallsFinished = true;

            // Check one last time to see if we need to make the final callback
            if (evalCallsFinished && evalsFinished === evalsNeeded) pObj.success();
        },

        /**
         * Extract a list of kernel variables from the given string
         *
         * @param raw_string
         * @returns {*}
         */
        _getVariableList: function(raw_string) {
            // Handle the case of not being a string
            if (typeof raw_string !== "string") return [];

            // Handle the case of there being no variables
            if (!raw_string.includes("{{") || !raw_string.includes("}}")) return [];

            return raw_string
                .match(/{{\s*[\w\.]+\s*}}/g)
               .map(function(x) { return x.match(/[\w\.]+/)[0]; });
        },

        _prepare_variables: function(value) {
            // Handle numbers
            if (!isNaN(parseFloat(value))) return parseFloat(value);

            console.log(value);

            // Handle booleans
            if ((typeof value === "boolean" && value) || value.toLowerCase() === "true") return true;
            if ((typeof value === "boolean" && !value) || value.toLowerCase() === "false") return false;

            // Handle strings
            if (typeof value === "string") return this._escapeQuotes(value);
        }
    });

    var CallWidgetView = widgets.DOMWidgetView.extend({
        render: function () {
            var cell = this.options.cell;

            // Render the view.
            if (!this.el) this.setElement($('<div></div>'));

            var name = this.model.get('name');
            var description = this.model.get('description');
            var params = this.model.get('params');
            var function_import = this.model.get('function_import');

            console.log(params);

            // Initialize the widget
            $(this.$el).callCode({
                name: name,
                description: description,
                params: params,
                function_import: function_import,
                cell: this.options.cell
            });

            // Hide the close button
            cell.element.find(".close").hide();

            // Hide the code by default
            var element = this.$el;
            var hideCode = function() {
                var cell = element.closest(".cell");
                if (cell.length > 0) {
                    // Protect against the "double render" bug in Jupyter 3.2.1
                    element.parent().find(".gp-widget-call:not(:first-child)").remove();

                    // element.closest(".cell").find(".input")
                    //     .css("height", "0")
                    //     .css("overflow", "hidden");
                }
                else {
                    setTimeout(hideCode, 10);
                }
            };
            setTimeout(hideCode, 1);
        }
    });

    $.widget("gp.createModule", {
        // Flags for whether events have been called on the widget
        _widgetRendered: false,
        _currentPage: 0,

        options: {
            name: null,
            description: null,
            version_commend: null,
            author: null,
            institution: null,
            categories: null,
            privacy: null,
            quality: null,
            file_format: null,
            os: null,
            cpu: null,
            language: null,
            user: null,
            support_files: null,
            documentation: null,
            license: null,
            lsid: null,
            version: null,
            lsid_authority: null,
            command_line: null,
            parameters: null
        },

        /**
         * Constructor
         *
         * @private
         */
        _create: function () {
            // Set variables
            var widget = this;

            // Add data pointer
            this.element.data("widget", this);

            // Add classes and scaffolding
            this.element.addClass("panel panel-default gp-widget gp-widget-module");
            this.element.append( // Attach header
                $("<div></div>")
                    .addClass("panel-heading gp-widget-task-header")
                    .append(
                        $("<div></div>")
                            .addClass("widget-float-right")
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
                                    .click(function () {
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
                                                            .attr("title", "GParc")
                                                            .attr("href", "#")
                                                            .append("GParc Repository")
                                                            .click(function () {
                                                                window.open("http://gparc.org/");
                                                            })
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
                                    .addClass("gp-widget-task-name")
                                    .append("Module Creation Wizard")
                            )
                    )
            );
            this.element.append( // Attach header
                $("<div></div>")
                    .addClass("panel-body")
                    .css("position", "relative")
                    .append(
                        $("<div></div>")
                            .addClass("widget-code gp-widget-task-code")
                            .css("display", "none")
                    )
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
                                    .addClass("gp-widget-task-desc")
                                    .append("Fill out the form below to create a GenePattern module. This will create a zip file, which can be uploaded and excuted on a GenePattern server.")
                            )
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-task-run")
                                    .append(
                                        $("<button></button>")
                                            .addClass("btn btn-primary gp-widget-module-next-button")
                                            .text("Next")
                                            .click(function () {
                                                if (widget.validate()) {
                                                    widget.next();
                                                }
                                            })
                                    )
                                    .append(
                                        $("<button></button>")
                                            .addClass("btn btn-primary gp-widget-module-previous-button")
                                            .text("Previous")
                                            .click(function () {
                                                widget.previous();
                                            })
                                    )
                                    .append("* Required Field")
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
                                            .addClass("btn btn-primary gp-widget-module-next-button")
                                            .text("Next")
                                            .click(function () {
                                                if (widget.validate()) {
                                                    widget.next();
                                                }
                                            })
                                    )
                                    .append(
                                        $("<button></button>")
                                            .addClass("btn btn-primary gp-widget-module-previous-button")
                                            .text("Previous")
                                            .click(function () {
                                                widget.previous();
                                            })
                                    )
                                    .append("* Required Field")
                            )
                    )
            );

            // Build the first page
            widget._buildPage();

            // Trigger gp.widgetRendered event on cell element
            setTimeout(function () {
                widget._widgetRendered = true;
                widget.element.closest(".cell").trigger("gp.widgetRendered");
            }, 10);

            return this;
        },

        /**
         * Destructor
         *
         * @private
         */
        _destroy: function () {
            this.element.removeClass("gp-widget-module");
            this.element.empty();
        },

        /**
         * Update all options
         *
         * @param options - Object contain options to update
         * @private
         */
        _setOptions: function (options) {
            this._superApply(arguments);
        },

        /**
         * Update for single options
         *
         * @param key - The name of the option
         * @param value - The new value of the option
         * @private
         */
        _setOption: function (key, value) {
            this._super(key, value);
        },

        /**
         * Gathers and returns metadata which is used when converting the notebook into a GenePattern module
         */
        module_metadata: function() {
            var session = GPNotebook.session_manager.get_session(0);

            var name = Jupyter.notebook.get_notebook_name();
            var description = this.options.description;
            var user = session ? session.username : null;

            return {
                name: name,
                user: user,
                description: description
            };
        },

        validate: function() {
            // TODO: Implement
            return true;
        },

        savePage: function() {
            // TODO: Implement
        },

        previous: function() {
            this.savePage();
            this._currentPage--;
            this._buildPage();
            this._scroll();
        },

        next: function() {
            this.savePage();
            this._currentPage++;
            this._buildPage();
            this._scroll();
        },

        _cleanPage: function() {
            this.element.find(".gp-widget-task-form").empty();
        },

        _updateButtons() {
            var prevButton = this.element.find(".gp-widget-module-previous-button");
            var nextButton = this.element.find(".gp-widget-module-next-button");

            // Disable previous on first page
            if (this._currentPage === 0) {
                prevButton.attr("disabled", "disabled");
            }
            else { // Enable previous on all other pages
                prevButton.removeAttr("disabled");
            }

            // Change Next to Finish on the last page
            if (this._currentPage === (this.pages.length-1)) {
                nextButton.text("Finish");
                nextButton.removeClass("btn-primary");
                nextButton.addClass("btn-warning");
            }
            else { // Otherwise change Finish back to Next
                nextButton.text("Next");
                nextButton.addClass("btn-primary");
                nextButton.removeClass("btn-warning");
            }

        },

        _scroll: function() {
            $('#site').animate({
                scrollTop: $(this.element).closest(".cell").position().top - 10
            }, 500);
        },

        _buildPage: function() {
            this._cleanPage();
            this._updateButtons();
            this.pages[this._currentPage](this);
        },

        _addParam: function(param) {
            var form = this.element.find(".gp-widget-task-form");
            var required = param.optional() ? "" : "*";

            var paramBox = $("<div></div>")
                .addClass(" form-group gp-widget-task-param")
                .attr("name", param.name())
                .attr("title", param.name())
                .append(
                    $("<label></label>")
                        .addClass("col-sm-3 control-label gp-widget-task-param-name")
                        .text(GPNotebook.util.display_name(param.name()) + required)
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
                                .text(param.description())
                        )
                );
            if (required) paramBox.addClass("gp-widget-task-required");

            // Add the correct input widget
            if (param.type() === "java.io.File") {
                paramBox.find(".gp-widget-task-param-input").fileInput({
                    runTask: this,
                    param: param
                });
            }
            else if (param.choices()) {
                paramBox.find(".gp-widget-task-param-input").choiceInput({
                    runTask: this,
                    param: param,
                    choices: param.choices(),
                    default: param.defaultValue()
                });
            }
            else if (param.type() === "java.lang.String") {
                paramBox.find(".gp-widget-task-param-input").textInput({
                    runTask: this,
                    param: param,
                    default: param.defaultValue()
                });
            }
            else if (param.type() === "java.lang.Integer" || param.type() === "java.lang.Float") {
                paramBox.find(".gp-widget-task-param-input").textInput({
                    runTask: this,
                    param: param,
                    default: param.defaultValue(),
                    type: "number"
                });
            }
            else {
                console.log("Unknown input type for Call widget: " + param.name() + " " + param.type());
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

        pages: [
            // Page 0
            function(widget) {
                widget._addParam({
                    name: function() { return "Name" },
                    optional: function() { return false },
                    type: function() { return "java.lang.String" },
                    description: function() { return "The name of a GenePattern module should be unique and cannot contain spaces or most other special characters." },
                    choices: function() { return false },
                    defaultValue: function() { return "" }
                });
                widget._addParam({
                    name: function() { return "Description" },
                    optional: function() { return false },
                    type: function() { return "java.lang.String" },
                    description: function() { return "This should be a concise and useful description of the module's functionality." },
                    choices: function() { return false },
                    defaultValue: function() { return "" }
                });
                widget._addParam({
                    name: function() { return "Authors" },
                    optional: function() { return true },
                    type: function() { return "java.lang.String" },
                    description: function() { return "The authors of the GenePattern module or wrapped method." },
                    choices: function() { return false },
                    defaultValue: function() { return "" }
                });
                widget._addParam({
                    name: function() { return "Institution" },
                    optional: function() { return true },
                    type: function() { return "java.lang.String" },
                    description: function() { return "The institutions to which the module authors belong." },
                    choices: function() { return false },
                    defaultValue: function() { return "" }
                });
            },

            // Page 1
            function(widget) {
                // categories
                // file formats
                // documentation
                // license
                // quality
            },

            // Page 2
            function(widget) {
                widget._addParam({
                    name: function() { return "OS" },
                    optional: function() { return false },
                    type: function() { return "java.lang.String" },
                    description: function() { return "The operating systems on which the module works." },
                    choices: function() {
                        return {
                            "Any": "any",
                            "Linux": "linux",
                            "Mac": "mac",
                            "Windows": "windows"
                        }
                    },
                    defaultValue: function() { return "any" }
                });
                widget._addParam({
                    name: function() { return "CPU" },
                    optional: function() { return false },
                    type: function() { return "java.lang.String" },
                    description: function() { return "The architecture on which the module works." },
                    choices: function() {
                        return {
                            "Any": "any",
                            "Alpha": "alpha",
                            "Intel": "intel",
                            "PowerPC": "powerpc",
                            "Sparc": "sparc"
                        }
                    },
                    defaultValue: function() { return "any" }
                });
                widget._addParam({
                    name: function() { return "Language" },
                    optional: function() { return false },
                    type: function() { return "java.lang.String" },
                    description: function() { return "The primary language used by the module." },
                    choices: function() {
                        return {
                            "Any": "any",
                            "C": "C",
                            "C++": "C++",
                            "Java": "Java",
                            "MATLAB": "MATLAB",
                            "Perl": "Perl",
                            "Python": "Python",
                            "R": "R"
                        }
                    },
                    defaultValue: function() { return "Python" }
                });
                widget._addParam({
                    name: function() { return "Privacy" },
                    optional: function() { return false },
                    type: function() { return "java.lang.String" },
                    description: function() { return "Whether the module is accessible only to you or to all users." },
                    choices: function() {
                        return {
                            "Private": "private",
                            "Public": "public"
                        }
                    },
                    defaultValue: function() { return "private" }
                });
            },

            // Page 3
            function(widget) {
                // parameters
                // support files
                // version
                // version comment
            },

            // Page 4 - confirmation page
            function(widget) {
                // AUTOMATIC
                // user
                // lsid
                // command line

                // Create the module zip file
                // Provide a "module created" message with a link to the file
            },
        ]
    });

    var ModuleWidgetView = widgets.DOMWidgetView.extend({
        render: function () {
            var cell = this.options.cell;

            // Render the view.
            if (!this.el) this.setElement($('<div></div>'));

            var lsid = this.model.get('lsid');

            // Initialize the widget
            $(this.$el).createModule({
                lsid: lsid
            });

            // Hide the close button
            cell.element.find(".close").hide();

            // Hide the code by default
            var element = this.$el;
            var hideCode = function() {
                var cell = element.closest(".cell");
                if (cell.length > 0) {
                    // Protect against the "double render" bug in Jupyter 3.2.1
                    element.parent().find(".gp-widget-module:not(:first-child)").remove();

                    // element.closest(".cell").find(".input")
                    //     .css("height", "0")
                    //     .css("overflow", "hidden");
                }
                else {
                    setTimeout(hideCode, 10);
                }
            };
            setTimeout(hideCode, 1);
        }
    });

    return {
        CallWidgetView: CallWidgetView,
        ModuleWidgetView: ModuleWidgetView
    }
});