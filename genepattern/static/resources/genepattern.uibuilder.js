/**
 * Define the UI Builder widget for Jupyter Notebook
 *
 * @author Thorin Tabor
 * @requires - jQuery, genepattern.navigation.js, genepattern.task.js
 *
 * Copyright 2017 Regents of the University of California and the Broad Institute
 */

define("genepattern/uibuilder", ["base/js/namespace",
                            "nbextensions/jupyter-js-widgets/extension",
                            "genepattern/navigation",
                            "genepattern/task",
                            "nbtools"], function (Jupyter, widgets, GPNotebook, tasks, NBToolManager) {

    /**
     * Widget for turning any Python function into a interactive forms
     */
    $.widget("gp.buildUI", {
        // Flags for whether events have been called on the widget
        _widgetRendered: false,
        _paramsLoaded: false,

        options: {
            name: null,
            description: null,
            output_var: null,
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
            const widget = this;
            const identifier = this.options.name;

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
                                    .append(identifier + " { }")
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
                                    .addClass("form-horizontal gp-widget-ui-output")
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
                            )
                            .append(
                                $("<div></div>").css("clear", "both")
                            )
                    )
            );

            // Make call to build the header & form
            widget._buildHeader();
            widget._buildForm();
            widget._buildFooter();
            widget._handle_metadata();

            // Register the widget with the Tool Manager
            widget.register_tool();

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
            const widget = this;
            widget._buildHeader();
            widget._buildForm();
            widget._buildFooter();
            widget._handle_metadata();
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
         * Register the widget with the Tool Manager
         */
        register_tool: function() {
            const widget = this;
            const code = widget.options.cell.get_text();

            const UIBuilderTool = new NBToolManager.NBTool({
                origin: "Notebook",
                id: widget.options.name,
                name: widget.options.name,
                description: widget.options.description,
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

                    cell.set_text(code);
                    cell.execute();

                    return cell;
                }
            });

            // Does a UI Builder tool by this name already exist?
            Object.keys(NBToolManager.instance()._tools).forEach(function(key) {
                let tool = NBToolManager.instance()._tools[key];

                // If so, unregister that tool first
                if (tool.origin === "Notebook" && tool.id === widget.options.name) {
                    NBToolManager.instance().unregister(key);
                }
            });

            // Register the tool
            NBToolManager.instance().register(UIBuilderTool);
        },

        /**
         * Receives a file of the specified kind and sets the first matching param of that type
         * Report an error to the console if no matching parameter found.
         *
         * @param url
         * @param kind
         */
        receiveFile: function(url, kind) {
            const uiParams = this.element.find(".gp-widget-task-param");
            let matched = false;
            $.each(uiParams, function(i, uiParam) {
                const paramWidget = $(uiParam).find(".gp-widget-task-param-input").data("widget");
                const param = paramWidget._param;
                if (param.kinds !== undefined) {
                    const kinds = param.kinds();
                    if (kinds !== undefined && kinds !== null) {
                        if (kinds.indexOf(kind) !== -1) {
                            // Found a match!
                            matched = true;
                            // Set the value
                            paramWidget.value(url);
                            // Update the code
                            paramWidget._updateCode();
                            // Return and stop looping
                            return false;
                        }
                    }
                }
            });

            // No match was found
            if (!matched) {
                const name = this.options.name;
                console.log("ERROR: No kind match found for " + url + " of kind " + kind + " in " + name);
            }
        },

        /**
         * Returns a list of allkKinds accepted by the function.
         *
         * @returns {Array}
         */
        acceptedKinds: function() {
            const kinds = new Set();

            this.options.params.forEach(function(param) {
                if (param.kinds) for (let k of param.kinds) kinds.add(k)
            });
            return Array.from(kinds);
        },

        reset_parameters: function() {
            const widget = this;

            // Reset each of the input variables
            const param_doms = widget.element.find(".gp-widget-task-form").find(".text-widget, .file-widget, .choice-widget");
            param_doms.each(function(i, dom) {
                const param_widget = $(dom).data("widget");
                if (param_widget) {
                    let default_value = param_widget.options.param.defaultValue().toString();
                    const param_name = param_widget.options.param.name();

                    param_widget.value(default_value, true);
                    widget._set_parameter_metadata(param_name, default_value);
                }
                else {
                    console.log("ERROR: Unknown widget in reset_parameters()");
                }
            });

            // Reset the output variable
            const output_dom = widget.element.find(".gp-widget-ui-output").find(".text-widget");
            const output_widget = $(output_dom).data("widget");
            let default_value = output_widget.options.param.defaultValue().toString();

            // Special case for blank default values
            if (default_value === "") default_value = " ";

            output_widget.value(default_value);
            GPNotebook.slider.set_metadata(widget.options.cell, "output_variable", default_value.trim());
        },

        _get_parameter: function(name) {
            const param_dom = this.element.find(".gp-widget-task-param[name='" + name + "']").find(".text-widget, .choice-widget, .file-widget");
            if (param_dom) return param_dom.data("widget");
            else console.log("Parameter cannot be found to obtain value: " + name);
        },

        _handle_metadata: function() {
            const widget = this;
            const cell = this.options.cell;

            // If the metadata has not been set, set it
            if (!GPNotebook.init.is_gp_cell(cell)) {
                GPNotebook.slider.make_genepattern_cell(cell, "uibuilder", {
                    show_code: false
                });
            }

            // Read the metadata and alter the widget accordingly

            // Hide or show code
            if (!cell.metadata.genepattern.show_code) {
                cell.element.find(".input").hide();
            }

            // Current values of parameters
            if (cell.metadata.genepattern.param_values) {
                const params = Object.keys(cell.metadata.genepattern.param_values);
                params.forEach(function(key) {
                    const value = cell.metadata.genepattern.param_values[key];
                    const param = widget._get_parameter(key);
                    if (param) param.value(value);
                });
            }

            // Set the output variable, if defined
            if (cell.metadata.genepattern.output_variable) {
                const value = cell.metadata.genepattern.output_variable;
                const param = widget._get_parameter("_output_variable");
                if (param) param.value(value);
            }
        },

        toggle_code: function() {
            // Get the code block
            const code = this.element.closest(".cell").find(".input");
            const is_hidden = code.is(":hidden");
            const cell = this.options.cell;

            if (is_hidden) {
                // Show the code block
                //code.removeAttr("style");
                code.slideDown();
                GPNotebook.slider.set_metadata(cell, "show_code", true);
            }
            else {
                // Hide the code block
                //code.css("height", "0").css("overflow", "hidden");
                code.slideUp();
                GPNotebook.slider.set_metadata(cell, "show_code", false);
            }
        },

        module_dialog: function() {
            const dialog = require('base/js/dialog');
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
            const widget = this;

            // Handle the case when the import couldn't be found
            const code = this.options.function_import === '' ? this.options.name + '?' : this.options.function_import + '?';

            // Display the help pager
            Jupyter.notebook.kernel.execute(
                code,
                {
                    shell : {
                        payload : {
                            page : function(payload) { widget.options.cell.events.trigger('open_with_text.Pager', payload); }
                        }
                    }
                }
            );
        },

        /**
         * Expand or collapse the task widget
         *
         *     expand - optional parameter used to force an expand or collapse,
         *         leave undefined to toggle back and forth
         */
        expandCollapse: function(expand) {
            const toSlide = this.element.find(".panel-body");
            const indicator = this.element.find(".widget-slide-indicator").find("span");
            const isHidden = toSlide.is(":hidden");

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
            const widget = this;

            // Trim lengthy docstrings
            let lines = widget.options.description.split('\n');
            if (lines.length > 10) {
                lines = lines.slice(0,10);
                lines.push("...");
            }
            const description = lines.join("\n");

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
            const widget = this;
            const params = widget.options.params;
            const form = widget.element.find(".gp-widget-task-form");

            for (let i = 0; i < params.length; i++) {
                const p = params[i];

                // Special case for output_var
                if (p['name'] === 'output_var') continue;

                try {
                    const param = {
                        _name: p["name"],
                        _label: p["label"],
                        _optional: p["optional"],
                        _description: p["description"],
                        _defaultValue: p["default"],
                        _hidden: p["hide"],
                        _choices: p["choices"] && Object.keys(p["choices"]).length ? p["choices"] : false,
                        _type: p["type"],
                        _maxValues: 1,
                        _kinds: p["kinds"],

                        name: function() { return this._name; },
                        label: function() { return this._label; },
                        optional: function() { return this._optional; },
                        type: function() { return this._type; },
                        description: function() { return this._description; },
                        choices: function() { return this._choices; },
                        defaultValue: function() { return this._defaultValue; },
                        hidden: function() { return this._hidden; },
                        maxValues: function() { return this._maxValues; },
                        kinds: function() { return this._kinds; }
                    };

                    const pDiv = widget._addParam(param, form);
                }
                catch(exception) {
                    console.log(exception);
                }
            }

            $(widget.element).trigger("runTask.paramLoad");
        },

        /**
         * Adds the output variable field to the footer
         *
         * @private
         */
        _buildFooter: function() {
            const widget = this;

            // Get the output_var parameter, if defined
            let output_var_param = null;
            widget.options.params.forEach(function(p) {
                if (p['name'] === 'output_var') output_var_param = p;
            });

            const v_label = output_var_param && output_var_param['label'] ? output_var_param['label'] : 'output_variable';
            const v_desc = output_var_param && output_var_param['description'] ? output_var_param['description'] : "The returned value of the function will be assigned to this variable, if provided.";
            const v_hide = output_var_param && output_var_param['hide'] ? output_var_param['hide'] : false;
            const v_default = output_var_param && output_var_param['default'] ? output_var_param['default'] : widget.options.output_var;

            try {
                const output_param = {
                    name: function() {return "output_var"; },
                    label: function() {return v_label; },
                    optional: function() {return true; },
                    type: function() {return "text"; },
                    description: function() {return v_desc; },
                    choices: function() {return false; },
                    defaultValue: function() { return v_default; },
                    hidden: function() { return v_hide; }
                };

                const footer = this.element.find(".gp-widget-ui-output");
                const pDiv = this._addParam(output_param, footer);
            }
            catch(exception) {
                console.log(exception);
            }
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
         * Mirrors updateCode() in GPTaskWidget, named for compatibility
         * Actually updates the parameter value in the cell metadata
         *
         * @param paramName
         * @param value
         */
        updateCode: function(paramName, value) {
            // Special case for the output variable
            if (paramName === "_output_variable") {
                GPNotebook.slider.set_metadata(this.options.cell, "output_variable", value);
            }

            // Otherwise just set the parameter metadata
            else {
                this._set_parameter_metadata(paramName, value);
            }
        },

        /**
         * Set the new value in the cell metadata
         *
         * @param param_name
         * @param value
         * @private
         */
        _set_parameter_metadata: function(param_name, value) {
            const cell = this.options.cell;

            // Get the existing param values
            let params = GPNotebook.slider.get_metadata(cell, "param_values");

            // Initialize the parameter map if not defined
            if (!params) params = {};

            // Set the new value
            params[param_name] = value;

            // Write to the cell metadata
            GPNotebook.slider.set_metadata(cell, "param_values", params)
        },

        /**
         * Add the parameter to the form and return the widget
         *
         * @param param
         * @param addTo
         * @private
         */
        _addParam: function(param, addTo) {
            const required = param.optional() ? "" : "*";

            const paramBox = $("<div></div>")
                .addClass(" form-group gp-widget-task-param")
                .attr("name", param.name())
                .attr("title", param.name())
                .append(
                    $("<label></label>")
                        .addClass("col-sm-3 control-label gp-widget-task-param-name")
                        .text(GPNotebook.util.display_name(param.label()) + required)
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
            if (param.type() === "java.io.File" || param.type() === "file") {
                paramBox.find(".gp-widget-task-param-input").fileInput({
                    runTask: this,
                    allowJobUploads: false,
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
            else if (param.type() === "password") {
                paramBox.find(".gp-widget-task-param-input").textInput({
                    runTask: this,
                    param: param,
                    default: param.defaultValue(),
                    type: "password"
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

            // Hide the parameter if param.hidden() is true
            if (param.hidden()) {
                paramBox.hide();
            }

            addTo.append(paramBox);
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
         * Validate the current Call form
         */
        validate: function() {
            let validated = true;
            const missing = [];
            const params = this.element.find(".gp-widget-task-param");

            // Validate each required parameter
            for (let i = 0; i < params.length; i++) {
                const param = $(params[i]);
                const required = param.hasClass("gp-widget-task-required");
                if (required) {
                    const input = param.find(".gp-widget-task-param-input");
                    let value = this._getInputValue(input);
                    if (typeof value === "string") value = value.trim();
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

        escape_quotes: function(str) {
            return str.replace(/\"/g, '\\"').replace(/\'/g, '\\\'');
        },

        buildFunctionCode: function(input, output_variable) {
            let import_path = null;
            let toReturn = '';

            if (output_variable) {
                toReturn += output_variable + " = ";
            }

            // Handle the case when the import couldn't be found
            if (this.options.function_import === '') {
                // toReturn += '# Unable to determine function import path. Please manually correct.\n';
                import_path = this.options.name
            }
            else {
                import_path = this.options.function_import;
            }

            toReturn += import_path + "(";
            let values = [];
            for (let i = 0; i < input.length; i++) {
                // Read the input object
                const in_obj = input[i];
                let value = in_obj.value[0];
                let reference = in_obj.reference;
                let literal = in_obj.string_literal;

                // Handle numbers
                if (!isNaN(parseFloat(value))) {
                    reference = true;
                }

                // Handle booleans
                try {
                    if (typeof JSON.parse(value.toLowerCase()) === "boolean") {
                        value = JSON.parse(value.toLowerCase()) ? "True" : "False";
                        reference = true;
                    }
                }
                catch (e) {} // Not a boolean, do nothing

                // Handle strings
                if (literal || (typeof value === "string" && !reference)) value = '"' + this.escape_quotes(value) + '"';

                // Hack fix for empty lists
                if (value === undefined) value = '[]';

                values.push(in_obj.name + "=" + value);
            }

            toReturn += values.join(", ");
            toReturn += ")";

            return toReturn;
        },

        /**
         * Retrieves the output variable from metadata and escapes invalid characters
         * Returns null if no valid value is defined.
         *
         * @private
         */
        _get_valid_output_variable: function() {
            // Get the output in the metadata
            let output = GPNotebook.slider.get_metadata(this.options.cell, "output_variable");

            // Return null if the value is not defined
            if (output === null || output === undefined) return null;

            // Convert to string and trim
            output = output.toString().trim();

            // Remove invalid characters
            output = output.replace(/\W/g, '');

            // Return null if the converted value is the empty string
            if (output === "") return null;

            // Return null for the special cases of None, True, False
            if (output === "None" || output === "True" || output === "False") return null;

            // Return null for numerical values
            if (/^\d+$/.test(output)) return null;

            return output;
        },

        /**
         * Submit the Call form to the kernel
         */
        submit: function() {
            const widget = this;

            widget.evaluateAllVars({
                success: function(globals) {
                    // Get the output variable, if one is defined
                    const funcOutput = widget._get_valid_output_variable();

                    // Assign values from the inputs to the job input
                    let funcInput = [];
                    const uiParams = widget.element.find(".gp-widget-task-form").find(".gp-widget-task-param");
                    for (let i = 0; i < uiParams.length; i++) {
                        const uiParam = $(uiParams[i]);
                        const uiInput = uiParam.find(".gp-widget-task-param-input");
                        let uiValue = widget._getInputValue(uiInput);

                        // Handle leading and trailing whitespace
                        if (typeof uiValue === "string") uiValue = uiValue.trim();

                        let name = uiParam.attr("name");
                        let quotes = widget.is_string_literal(uiInput.find("input:last, select").val());

                        // Check for variable references
                        let reference = false;
                        if (typeof uiValue === "string") reference = globals.indexOf(uiValue) >= 0 && !quotes;          // Handle string values
                        if (uiValue.constructor === Array) reference = globals.indexOf(uiValue[0]) >= 0 && !quotes;     // Handle array values

                        if (uiValue !== null) {
                            // Wrap value in list if not already wrapped
                            if (uiValue.constructor !== Array) {
                                uiValue = [uiValue];
                            }

                            funcInput.push({
                                name: name,
                                value: uiValue,
                                reference: reference,
                                string_literal: quotes
                            });
                        }
                    }

                    // Scroll to the new cell
                    $('#site').animate({
                        scrollTop: $(widget.options.cell.element).position().top
                    }, 500);

                    widget.expandCollapse();
                    const index = GPNotebook.util.cell_index(widget.options.cell) + 1;
                    const cell = Jupyter.notebook.insert_cell_at_index("code", index);
                    const code = widget.buildFunctionCode(funcInput, funcOutput);
                    cell.code_mirror.setValue(code);
                    cell.execute();
                },
                error: function(exception) {
                    widget.errorMessage("Error evaluating kernel variables in preparation of job submission: " + exception.statusText);
                }
            });
        },

        /**
         * Query the kernel for the list of global names, then make a callback,
         *      passing as a parameter the list of global names
         *
         * @param callback
         */
        get_globals: function(callback) {
            const code = "import json\njson.dumps(list(globals().keys()))";

            tasks.VariableManager.getKernelValue(code, function(raw_text) {
                let globals = [];

                try {
                    globals = JSON.parse(raw_text);
                }
                catch (e) {
                    console.log("Error parsing JSON from globals()");
                }

                callback(globals);
            });
        },

        /**
         * Test if the value is surrounded by matching quotes
         *
         * @param test_string
         * @returns {boolean}
         */
        is_string_literal: function(test_string) {
            if (test_string === null) return false;
            const quote_test = new RegExp("^\'.*\'$|^\".*\"$");
            return quote_test.test(test_string.trim())
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
            const widget = this;
            const inputWidgets = this.element.find(".gp-widget-task-form").find(".gp-widget-task-param-input");
            let evalCallsFinished = false;
            let evalsNeeded = 0;
            let evalsFinished = 0;

            widget.get_globals(function(globals) {
                // Iterate over each widget
                for (let i = 0; i < inputWidgets.length; i++) {
                    const iWidget = $(inputWidgets[i]).data("widget");
                    iWidget.element.find("input").change(); // Update widget values
                    let value = iWidget.value();

                    // Protect against nulls
                    if (value === null || value === undefined) value = [];

                    const makeCall = function(iWidget, value, valueIndex) {
                        // If surrounding quote, treat as string literal and skip variable evaluation
                        if (widget.is_string_literal(value)) {
                            const evalValue = value.trim().substring(1, value.trim().length-1);
                            if (valueIndex === undefined) iWidget._value = evalValue;
                            else iWidget._values[valueIndex] = evalValue;

                            // Count this as an eval finished
                            evalsFinished++;

                            // Make the final callback once ready
                            if (evalCallsFinished && evalsFinished === evalsNeeded) pObj.success(globals);
                            return; // Return now, don't evaluate the string literal for variables
                        }

                        // Otherwise, evaluate the variables
                        tasks.VariableManager.evaluateVariables(value, function(evalValue) {
                            if (valueIndex === undefined) iWidget._value = evalValue;
                            else iWidget._values[valueIndex] = evalValue;

                            // Count this as an eval finished
                            evalsFinished++;

                            // Make the final callback once ready
                            if (evalCallsFinished && evalsFinished === evalsNeeded) pObj.success(globals);
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

                        for (let j = 0; j < value.length; j++) {
                            const valueIndex = j;
                            const innerValue = value[j];

                            makeCall(iWidget, innerValue.toString(), valueIndex);
                        }
                    }
                }

                // All calls for evaluation have been made
                evalCallsFinished = true;

                // Check one last time to see if we need to make the final callback
                if (evalCallsFinished && evalsFinished === evalsNeeded) pObj.success(globals);
            });
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

    const UIBuilderView = widgets.DOMWidgetView.extend({
        render: function () {
            let cell = this.options.cell;

            // Ugly hack for getting the Cell object in ipywidgets 7
            if (!cell) cell = this.options.output.element.closest(".cell").data("cell");

            // Render the view.
            if (!this.el) this.setElement($('<div></div>'));

            const name = this.model.get('name');
            const description = this.model.get('description');
            const output_var = this.model.get('output_var');
            const params = this.model.get('params');
            const function_import = this.model.get('function_import');

            // Initialize the widget
            $(this.$el).buildUI({
                name: name,
                description: description,
                output_var: output_var,
                params: params,
                function_import: function_import,
                cell: cell
            });

            // Hide the code by default
            const element = this.$el;
            const hideCode = function() {
                const cell = element.closest(".cell");
                if (cell.length > 0) {
                    // Protect against the "double render" bug in Jupyter 3.2.1
                    element.parent().find(".gp-widget-call:not(:first-child)").remove();
                }
                else {
                    setTimeout(hideCode, 10);
                }
            };
            setTimeout(hideCode, 1);
        }
    });

    return {
        UIBuilderView: UIBuilderView
    }
});