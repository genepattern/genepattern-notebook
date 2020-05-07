/**
 * Define the Module Bundler widget for Jupyter Notebook
 *
 * @author Thorin Tabor
 * @requires - jQuery, navigation.js
 *
 * Copyright 2020 Regents of the University of California and the Broad Institute
 */

define("genepattern/modulebundler", ["base/js/namespace",
                            "nbextensions/jupyter-js-widgets/extension",
                            "genepattern/navigation",
                            "genepattern/task",
                            "nbtools",
                            "nbtools/utils"], function (Jupyter, widgets, GPNotebook, tasks, NBToolManager, Utils) {

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
            const widget = this;

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
                            .attr("src", Jupyter.notebook.base_url + "nbextensions/genepattern/resources/" + "gp-logo.png")
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
                widget.element.closest(".cell").trigger("nbtools.widget_rendered");
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
            const session = GPNotebook.session_manager.get_session(0);

            const name = Jupyter.notebook.get_notebook_name();
            const description = this.options.description;
            const user = session ? session.username : null;

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
            const prevButton = this.element.find(".gp-widget-module-previous-button");
            const nextButton = this.element.find(".gp-widget-module-next-button");

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
            const form = this.element.find(".gp-widget-task-form");
            const required = param.optional() ? "" : "*";

            const paramBox = $("<div></div>")
                .addClass(" form-group gp-widget-task-param")
                .attr("name", param.name())
                .attr("title", param.name())
                .append(
                    $("<label></label>")
                        .addClass("col-sm-3 control-label gp-widget-task-param-name")
                        .text(Utils.display_name(param.name()) + required)
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

    const ModuleWidgetView = widgets.DOMWidgetView.extend({
        render: function () {
            let cell = this.options.cell;

            // Ugly hack for getting the Cell object in ipywidgets 7
            if (!cell) cell = this.options.output.element.closest(".cell").data("cell");

            // Render the view.
            if (!this.el) this.setElement($('<div></div>'));

            const lsid = this.model.get('lsid');

            // Initialize the widget
            $(this.$el).createModule({
                lsid: lsid
            });

            // Hide the code by default
            const element = this.$el;
            const hideCode = function() {
                const cell = element.closest(".cell");
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
        ModuleWidgetView: ModuleWidgetView
    }
});