/**
 * Widgets for use in GenePattern Notebook or in other apps.
 *
 * @requires jQuery 1.5+, jQuery UI, gp.js
 *
 * @author Thorin Tabor
 */

/**
 * Widget for file input into a GenePattern Notebook.
 * Used for file inputs by the runTask widget.
 *
 * Supported Features:
 *      External URLs
 *      Uploading New Files
 *      Pasted Internal File Paths
 *      Pasted Job Result URLs
 *
 * Non-Supported Features:
 *      GenomeSpace Files
 *      GenePattern Uploaded Files
 */
$.widget("gp.fileInput", {
    options: {
        allowFilePaths: true,
        allowExternalUrls: true,
        allowJobUploads: true,

        // Pointers to associated runTask widget
        runTask: null,
        param: null
    },

    /**
     * Constructor
     *
     * @private
     */
    _create: function() {
        // Save pointers to associated Run Task widget or parameter
        this._setPointers();

        // Set variables
        var widget = this;
        this._value = null;
        this._display = null;

        // Add classes and child elements
        this.element.addClass("file-widget");
        this.element.append(
            $("<div></div>")
                .addClass("file-widget-upload")
                .append(
                    $("<button></button>")
                        .addClass("file-widget-upload-file")
                        .text("Upload File...")
                        .button()
                        .click(function () {
                            $(this).parents(".file-widget").find(".file-widget-input-file").click();
                        })
                )
                .append(
                    $("<input />")
                        .addClass("file-widget-input-file")
                        .attr("type", "file")
                        .change(function () {
                            var newValue = widget.element.find(".file-widget-input-file")[0].files[0];
                            widget.value(newValue);
                        })
                )
                .append(
                    $("<button></button>")
                        .addClass("file-widget-url")
                        .addClass("file-widget-button")
                        .text("Add Path or URL...")
                        .button()
                        .click(function() {
                            widget._pathBox(true);
                        })
                )
                .append(
                    $("<span></span>")
                        .addClass("file-widget-drop")
                        .text("Drag Files Here")
                )
                .append(
                    $("<div></div>")
                        .addClass("file-widget-size")
                        .text(" 2GB file upload limit using the Upload File... button.")
                )
        );
        this.element.append(
            $("<div></div>")
                .addClass("file-widget-listing")
                .css("display", "none")
                .append(
                    $("<div></div>")
                        .addClass("file-widget-value")
                        .append(
                            $("<div></div>")
                                .addClass("file-widget-value-erase")
                                .append(
                                    $("<a></a>")
                                        .html("&times;")
                                        .click(function() {
                                            widget.clear();
                                        })
                                )
                        )
                        .append(
                            $("<span></span>")
                                .addClass("file-widget-value-text")
                        )
                )
        );
        this.element.append(
            $("<div></div>")
                .addClass("file-widget-path")
                .css("display", "none")
                .append(
                    $("<div></div>")
                        .addClass("file-widget-path-label")
                        .text("Enter Path or URL")
                )
                .append(
                    $("<input />")
                        .addClass("file-widget-path-input")
                        .attr("type", "text")
                )
                .append(
                    $("<div></div>")
                        .addClass("file-widget-path-buttons")
                        .append(
                            $("<button></button>")
                                .addClass("file-widget-button")
                                .text("Select")
                                .button()
                                .click(function() {
                                    var boxValue = widget.element.find(".file-widget-path-input").val();
                                    widget.element.find(".file-widget-path-input").val("");
                                    widget._pathBox(false);
                                    widget.value(boxValue);
                                })
                        )
                        .append(" ")
                        .append(
                            $("<button></button>")
                                .addClass("file-widget-button")
                                .text("Cancel")
                                .button()
                                .click(function() {
                                    widget._pathBox(false);
                                    widget.element.find(".file-widget-path-input").val("");
                                })
                        )
                )
        );

        // Initialize the drag & drop functionality
        if (this.options.allowJobUploads) {
            this._initDragDrop();
        }

        // Hide elements if not in use by options
        this._setDisplayOptions();
    },

    /**
     * Destructor
     *
     * @private
     */
    _destroy: function() {
        this.element.removeClass("file-widget");
        this.element.empty();
    },

    /**
     * Initializes the drag & drop functionality in the widget
     *
     * @private
     */
    _initDragDrop: function() {
        var widget = this;
        var dropTarget = this.element[0];

        dropTarget.addEventListener("dragenter", function(event) {
            widget.element.css("background-color", "#dfeffc");
            event.stopPropagation();
            event.preventDefault();
        }, false);
        dropTarget.addEventListener("dragexit", function(event) {
            widget.element.css("background-color", "");
            event.stopPropagation();
            event.preventDefault();
        }, false);
        dropTarget.addEventListener("dragover", function(event) {
            event.stopPropagation();
            event.preventDefault();
        }, false);
        dropTarget.addEventListener("drop", function(event) {
            var files = event['dataTransfer'].files;
            if (files.length > 0) {
                widget.value(files[0]);
            }
            widget.element.css("background-color", "");
            event.stopPropagation();
            event.preventDefault();
        }, false);
    },

    /**
     * Shows or hides the box of selected files
     *
     * @param file - A string if to show, undefined or null if to hide
     * @private
     */
    _fileBox: function(file) {
        if (file) {
            this.element.find(".file-widget-value-text").text(file);
            this.element.find(".file-widget-listing").show();
            this.element.find(".file-widget-upload").hide();
        }
        else {
            this.element.find(".file-widget-upload").show();
            this.element.find(".file-widget-listing").hide();
        }
    },

    /**
     * Takes a value and returns the display string for the value
     *
     * @param value - the value, either a string or File object
     * @returns {string} - the display value
     * @private
     */
    _valueToDisplay: function(value) {
        if (typeof value === 'string') {
            return value;
        }
        else {
            return value.name;
        }
    },

    /**
     * Displays the select path or URL box
     *
     * @param showPathBox - Whether to display or hide the path box
     * @private
     */
    _pathBox: function(showPathBox) {
        if (showPathBox) {
            this.element.find(".file-widget-path").show();
            this.element.find(".file-widget-upload").hide();
        }
        else {
            this.element.find(".file-widget-path").hide();
            this.element.find(".file-widget-upload").show();
        }
    },

    /**
     * Update the pointers to the Run Task widget and parameter
     *
     * @private
     */
    _setPointers: function() {
        if (this.options.runTask) { this._runTask = this.options.runTask; }
        if (this.options.param) { this._param = this.options.param; }
    },

    /**
     * Update the display of the UI to match current options
     *
     * @private
     */
    _setDisplayOptions: function() {
        if (!this.options.allowJobUploads) {
            this.element.find(".file-widget-upload-file").hide();
            this.element.find(".file-widget-drop").hide();
            this.element.find(".file-widget-size").hide();
        }
        else {
            this.element.find(".file-widget-upload-file").show();
            this.element.find(".file-widget-drop").show();
            this.element.find(".file-widget-size").show();
        }
        if (!this.options.allowExternalUrls && !this.options.allowFilePaths) {
            this.element.find(".file-widget-url").hide();
        }
        else if (!this.options.allowExternalUrls && this.options.allowFilePaths) {
            this.element.find(".file-widget-url").show();
            this.element.find(".file-widget-url").button("option", "label", "Add Path...");
            this.element.find(".file-widget-path-label").text("Enter Path");
        }
        else if (this.options.allowExternalUrls && !this.options.allowFilePaths) {
            this.element.find(".file-widget-url").show();
            this.element.find(".file-widget-url").button("option", "label", "Add URL...");
            this.element.find(".file-widget-path-label").text("Enter URL");
        }
        else if (this.options.allowExternalUrls && this.options.allowFilePaths) {
            this.element.find(".file-widget-url").show();
            this.element.find(".file-widget-url").button("option", "label", "Add Path or URL...");
            this.element.find(".file-widget-path-label").text("Enter Path or URL");
        }
    },

    /**
     * Update all options
     *
     * @param options - Object contain options to update
     * @private
     */
    _setOptions: function(options) {
        this._superApply(arguments);
        this._setPointers();
        this._setDisplayOptions();
    },

    /**
     * Update individual option
     *
     * @param key - The name of the option
     * @param value - The new value of the option
     * @private
     */
    _setOption: function(key, value) {
        this._super(key, value);
        this._setPointers();
        this._setDisplayOptions();
    },

    /**
     * Upload the selected file to the server
     *
     * @param pObj - Object containing the following params:
     *                  success: Callback for success, expects url to file
     *                  error: Callback on error, expects exception
     * @returns {boolean} - Whether an upload was just initiated or not
     */
    upload: function(pObj) {
        var currentlyUploading = null;
        var widget = this;

        // Value is a File object
        if (typeof this.value() === 'object' && this.value()) {
            gp.upload({
                file: this.value(),
                success: function(response, url) {
                    widget._value = url;
                    if (pObj.success) {
                        pObj.success(response, url);
                    }
                },
                error: function(exception) {
                    console.log("Error uploading file from file input widget: " + exception.statusText);
                    if (pObj.error) {
                        pObj.error(exception);
                    }
                }
            });
            currentlyUploading = true;
        }
        // If the value is not ste, give an error
        else if (!this.value()) {
            console.log("Cannot upload from file input: value is null.");
            currentlyUploading = false;
            if (pObj.error) {
                pObj.error({statusText: "Cannot upload from file input: value is null."});
            }
        }
        // If the value is a string, do nothing
        else {
            // Else assume we have a non-upload value selected
            currentlyUploading = false;
        }
        return currentlyUploading;
    },

    /**
     * Getter for associated RunTask object
     *
     * @returns {object|null}
     */
    runTask: function() {
        return this._runTask;
    },

    /**
     * Getter for associated parameter
     * @returns {string|null|object}
     */
    param: function() {
        return this._param;
    },

    /**
     * Gets or sets the value of this widget
     *
     * @param [val=optional] - String value for file (undefined is getter)
     * @returns {object|string|null} - The value of this widget
     */
    value: function(val) {
        // Do setter
        if (val) {
            this._value = val;
            this._display = this._valueToDisplay(val);
            this._fileBox(this._display);
        }
        // Do getter
        else {
            return this._value;
        }
    },

    /**
     * Clears the current value of the widget and hides file box
     * @private
     */
    clear: function() {
        this._value = null;
        this._fileBox(null);
    }
});


/**
 * Widget for text input into a GenePattern Notebook.
 * Used for text, number and password inputs by the runTask widget.
 *
 * Supported Features:
 *      Text input
 *      Password input
 *      Number input
 *
 * Non-Supported Features:
 *      Directory input
 */
$.widget("gp.textInput", {
    options: {
        type: "text", // Accepts: text, number, password
        default: "",

        // Pointers to associated runTask widget
        runTask: null,
        param: null
    },

    /**
     * Constructor
     *
     * @private
     */
    _create: function() {
        // Save pointers to associated Run Task widget or parameter
        this._setPointers();

        // Set variables
        var widget = this;
        //noinspection JSValidateTypes
        this._value = this.options.default;

        // Clean the type option
        this._cleanType();

        // Add classes and child elements
        this.element.addClass("text-widget");
        this.element.append(
            $("<input />")
                .addClass("text-widget-input")
                .attr("type", this.options.type)
                .val(this._value)
                .change(function() {
                    widget._value = $(this).val();
                })
        );

        // Hide elements if not in use by options
        this._setDisplayOptions();
    },

    /**
     * Destructor
     *
     * @private
     */
    _destroy: function() {
        this.element.removeClass("text-widget");
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
        this._setPointers();
        this._setDisplayOptions();
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
        this._setPointers();
        this._setDisplayOptions();
    },

    /**
     * Update the pointers to the Run Task widget and parameter
     *
     * @private
     */
    _setPointers: function() {
        if (this.options.runTask) { this._runTask = this.options.runTask; }
        if (this.options.param) { this._param = this.options.param; }
    },

    /**
     * Update the display of the UI to match current options
     *
     * @private
     */
    _setDisplayOptions: function() {
        this._cleanType();
        this.element.find(".text-widget-input").prop("type", this.options.type);
    },

    /**
     * Removes bad type listings, defaulting to text
     *
     * @private
     */
    _cleanType: function() {
        if (typeof this.options.type !== 'string') {
            console.log("Type option for text input is not a string, defaulting to text");
            this.options.type = "text";
        }
        if (this.options.type.toLowerCase() !== "text" &&
            this.options.type.toLowerCase() !== "password" &&
            this.options.type.toLowerCase() !== "number") {
            console.log("Type option for text input is not 'text', 'password' or 'number', defaulting to text");
            this.options.type = "text";
        }
    },

    /**
     * Gets or sets the value of the input
     *
     * @param val - the value for the setter
     * @returns {_value|string}
     */
    value: function(val) {
        // Do setter
        if (val) {
            this._value = val;
            this.element.find(".text-widget-input").val(val);
        }
        // Do getter
        else {
            return this._value;
        }
    }
});


/**
 * Widget for choice input into a GenePattern Notebook.
 * Used for choice inputs by the runTask widget.
 *
 * Supported Features:
 *      Simple Choice Input
 *
 * Non-Supported Features:
 *      File choice input
 *      Dynamic choice parameters
 */
$.widget("gp.choiceInput", {
    options: {
        choices: [], // Assumes an object of key, value pairs
        default: null,

        // Pointers to associated runTask widget
        runTask: null,
        param: null
    },

    /**
     * Constructor
     *
     * @private
     */
    _create: function() {
        // Save pointers to associated Run Task widget or parameter
        this._setPointers();

        // Set variables
        var widget = this;

        // Add classes and child elements
        this.element.addClass("choice-widget");
        this.element.append(
            $("<select></select>")
                .addClass("choice-widget-select")
                .change(function() {
                    widget._value = $(this).val();
                })
        );

        // Hide elements if not in use by options
        this._setDisplayOptions();
    },

    /**
     * Destructor
     *
     * @private
     */
    _destroy: function() {
        this.element.removeClass("choice-widget");
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
        this._setPointers();
        this._setDisplayOptions();
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
        this._setPointers();
        this._setDisplayOptions();
    },

    /**
     * Update the pointers to the Run Task widget and parameter
     *
     * @private
     */
    _setPointers: function() {
        if (this.options.runTask) { this._runTask = this.options.runTask; }
        if (this.options.param) { this._param = this.options.param; }
    },

    /**
     * Update the display of the UI to match current options
     *
     * @private
     */
    _setDisplayOptions: function() {
        this._applyChoices();
        this._applyDefault();
    },

    /**
     * Applies the choices options, setting them to the provided values
     *
     * @private
     */
    _applyChoices: function() {
        if (typeof this.options.choices !== 'object') {
            console.log("Error reading choices in Choice Input, aborting");
            return;
        }

        var select = this.element.find(".choice-widget-select");
        select.empty();

        for (var key in this.options.choices) {
            if (this.options.choices.hasOwnProperty(key)) {
                var value = this.options.choices[key];

                select.append(
                    $("<option></option>")
                        .text(key)
                        .val(value)
                );
            }
        }
    },

    /**
     * Applies the option for default, resetting the selected option
     *
     * @private
     */
    _applyDefault: function() {
        this.element.find(".choice-widget-select").val(this.options.default);
        this._value = this.element.find(".choice-widget-select").val();
    },

    /**
     * Gets or sets the value of the input
     *
     * @param val - the value for the setter
     * @returns {_value|string}
     */
    value: function(val) {
        // Do setter
        if (val) {
            this._value = val;
            this.element.find(".choice-widget-select").val(val);
        }
        // Do getter
        else {
            return this._value;
        }
    }
});


/**
 * Widget for entering parameters and launching a job from a task.
 *
 * Supported Features:
 *      File Inputs
 *      Text Inputs
 *      Choice Inputs
 *
 * Non-Supported Features:
 *      Batch Parameters
 *      EULA support
 *      Dynamic Dropdowns
 *      Reloaded Jobs
 *      File Lists
 *      Task Source
 */
$.widget("gp.runTask", {
    options: {
        lsid: null,
        name: null
    },

    /**
     * Constructor
     *
     * @private
     */
    _create: function() {
        // Set variables
        var widget = this;
        var identifier = this._getIdentifier();
        this._task = this._loadTask(identifier);

        // Add classes and scaffolding
        this.element.addClass("task-widget");
        this.element.append( // Attach header
            $("<div></div>")
                .addClass("task-widget-header")
                .append(
                    $("<span></span>")
                        .addClass("task-widget-name")
                )
                .append(
                    $("<span></span>")
                        .addClass("task-widget-version")
                )
                .append(
                    $("<a></a>")
                        .addClass("task-widget-doc")
                        .attr("target", "_blank")
                        .text("Documentation")
                )
        );
        this.element.append( // Attach message box
            $("<div></div>")
                .addClass("task-widget-message")
                .css("display", "none")
        );
        this.element.append( // Attach subheader
            $("<div></div>")
                .addClass("task-widget-subheader")
                .append(
                    $("<div></div>")
                        .addClass("task-widget-desc")
                )
                .append(
                    $("<div></div>")
                        .addClass("task-widget-run")
                        .append(
                            $("<button></button>")
                                .addClass("task-widget-run-button")
                                .text("Run")
                                .button()
                                .click(function() {
                                    if (widget.validate()) {
                                        widget.submit();
                                    }
                                })
                        )
                        .append("* Required Field")
                )
        );
        this.element.append( // Attach form placeholder
            $("<div></div>")
                .addClass("task-widget-form")
        );
        this.element.append( // Attach footer
            $("<div></div>")
                .addClass("task-widget-footer")
                .append(
                    $("<div></div>")
                        .addClass("task-widget-run")
                        .append(
                            $("<button></button>")
                                .addClass("task-widget-run-button")
                                .text("Run")
                                .button()
                                .click(function() {
                                    if (widget.validate()) {
                                        widget.submit();
                                    }
                                })
                        )
                        .append("* Required Field")
                )
        );

        // Make call to build the header & form
        this._buildHeader();
        this._buildForm();
    },

    /**
     * Destructor
     *
     * @private
     */
    _destroy: function() {
        this.element.removeClass("task-widget");
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
        var identifier = this._getIdentifier();
        this._task = this._loadTask(identifier);
        this._buildHeader();
        this._buildForm();
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
     * Returns an identifier for attaining the Task object from the server
     *
     * @returns {string|null}
     * @private
     */
    _getIdentifier: function() {
        if (this.options.lsid) { return this.options.lsid; }
        else if (this.options.name) { return this.options.name }
        else {
            throw "Error creating Run Task widget! No LSID or name!";
        }
    },

    /**
     * Returns the Task object based on the identifier
     *
     * @param identifier - String containing name or LSID
     * @returns {gp.Task|null}
     * @private
     */
    _loadTask: function(identifier) {
        return gp.task(identifier);
    },

    /**
     * Build the header and return the Task object
     *
     * @private
     */
    _buildHeader: function() {
        this.element.find(".task-widget-name").empty().text(this._task.name());
        this.element.find(".task-widget-version").empty().text("Version " + this._task.version());
        this.element.find(".task-widget-doc").attr("href", this._task.documentation());
        this.element.find(".task-widget-desc").empty().text(this._task.description());
    },

    /**
     * Make the call to the server to get the params and build the form
     *
     * @private
     */
    _buildForm: function() {
        var widget = this;
        this.element.find(".task-widget-form").empty();

        this._task.params({
            success: function(response, params) {
                for (var i = 0; i < params.length; i++) {
                    var param = params[i];
                    widget._addParam(param);
                }
            },
            error: function(exception) {
                widget.errorMessage("Could not load task: " + exception.statusText);
            }
        });
    },

    /**
     * Add the parameter to the form
     *
     * @param param {gp.Param}
     * @private
     */
    _addParam: function(param) {
        var form = this.element.find(".task-widget-form");
        var required = param.optional() ? "" : "*";

        var paramBox = $("<div></div>")
            .addClass("task-widget-param")
            .attr("name", param.name())
            .append(
                $("<div></div>")
                    .addClass("task-widget-param-name")
                    .text(param.name() + required)
            )
            .append(
                $("<div></div>")
                    .addClass("task-widget-param-wrapper")
                    .append(
                    $("<div></div>")
                        .addClass("task-widget-param-input")
                    )
                    .append(
                    $("<div></div>")
                        .addClass("task-widget-param-desc")
                        .text(param.description())
                    )
            );
        if (required) paramBox.addClass("task-widget-required");
        form.append(paramBox);

        // Add the correct input widget
        if (param.type() === "java.io.File") {
            paramBox.find(".task-widget-param-input").fileInput({
                runTask: this,
                param: param
            });
        }
        else if (param.choices()) {
            paramBox.find(".task-widget-param-input").choiceInput({
                runTask: this,
                param: param,
                choices: param.choices(),
                default: param.defaultValue()
            });
        }
        else if (param.type() === "java.lang.String") {
            paramBox.find(".task-widget-param-input").textInput({
                runTask: this,
                param: param,
                default: param.defaultValue()
            });
        }
        else if (param.type() === "java.lang.Integer") {
            paramBox.find(".task-widget-param-input").textInput({
                runTask: this,
                param: param,
                default: param.defaultValue(),
                type: "number"
            });
        }
        else {
            console.log("Unknown input type for Run Task widget");
        }
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
        var messageBox = this.element.find(".task-widget-message");
        messageBox.removeClass("task-widget-message-error");
        messageBox.addClass("task-widget-message-success");
        messageBox.text(message);
        messageBox.show("shake", {}, 500);
    },

    /**
     * Show an error message to the user
     *
     * @param message - String containing the message to show
     */
    errorMessage: function(message) {
        var messageBox = this.element.find(".task-widget-message");
        messageBox.removeClass("task-widget-message-success");
        messageBox.addClass("task-widget-message-error");
        messageBox.text(message);
        messageBox.show("shake", {}, 500);
    },

    /**
     * Validate the current Run Task form
     */
    validate: function() {
        var validated = true;
        var missing = [];
        var params = this.element.find(".task-widget-param");

        // Validate each required parameter
        for (var i = 0; i < params.length; i++) {
            var param = $(params[i]);
            var required = param.hasClass("task-widget-required");
            if (required) {
                var input = param.find(".task-widget-param-input");
                var value = this._getInputValue(input);
                if (value === null || value === "") {
                    param.addClass("task-widget-param-missing");
                    missing.push(param.attr("name"));
                    validated = false;
                }
                else {
                    param.removeClass("task-widget-param-missing");
                }
            }
        }

        // Display message to user
        if (validated) {
            this.successMessage("All required parameters present.");
        }
        else {
            this.errorMessage("Missing required parameters: " + missing.join(", "));
        }

        return validated;
    },

    /**
     * Submit the Run Task form to the server
     */
    submit: function() {
        // Create the job input
        var jobInput = this._task.jobInput();
        var widget = this;

        this.uploadAll({
            success: function() {
                // Assign values from the inputs to the job input
                var uiParams = widget.element.find(".task-widget-param");
                for (var i = 0; i < uiParams.length; i++) {
                    var uiParam = $(uiParams[i]);
                    var uiInput = uiParam.find(".task-widget-param-input");
                    var uiValue = widget._getInputValue(uiInput);

                    if (uiValue !== null) {
                        var objParam = jobInput.params()[i];
                        objParam.values([uiValue]);
                    }
                }

                // Submit the job input
                jobInput.submit({
                    success: function(response, jobNumber) {
                        widget.successMessage("Job successfully submitted! Job ID: " + jobNumber);
                    },
                    error: function(exception) {
                        widget.errorMessage("Error submitting job: " + exception.statusText);
                    }
                });
            },
            error: function(exception) {
                widget.errorMessage("Error uploading in preparation of job submission: " + exception.statusText);
            }
        });
    },

    /**
     * Upload all the file inputs that still need uploading
     *
     * @param pObj - Object containing the following params:
     *                  success: Callback for success, expects no arguments
     *                  error: Callback on error, expects exception
     * @returns {boolean} - Whether an upload was just initiated or not
     */
    uploadAll: function(pObj) {
        var files = this.element.find(".file-widget");
        var widget = this;

        // Cycle through all files
        for (var i = 0; i < files.length; i++) {
            var fileWidget = $(files[i]);
            var value = fileWidget.fileInput("value");

            // If one needs to be uploaded, upload, recheck
            if (typeof value === 'object' && value !== null) {
                widget.successMessage("Uploading file: " + value.name);
                fileWidget.fileInput("upload", {
                    success: function() {
                        widget.uploadAll(pObj);
                    },
                    error: pObj.error
                });
                return true
            }
        }

        // If none need to be uploaded, call success function
        pObj.success();
        return false;
    }
});


/**
 * Widget for viewing the job results of a launched job.
 *
 * Supported Features:
 *      Job Status
 *      Access to Job Results
 *      Access to Logs
 *
 * Non-Supported Features:
 *      Job Sharing & Permissions
 *      Access to Job Inputs
 *      Visibility into Child Jobs
 *      Batch Jobs
 */
$.widget("gp.jobResults", {
    options: {
        jobNumber: null,    // The job number
        poll: true,         // Poll to refresh running jobs
        json: null          // JSON to load from
    },

    /**
     * Constructor
     *
     * @private
     */
    _create: function() {
        // Ensure the job number is defined
        if (typeof this.options.jobNumber !== 'number') {
            throw "The job number is not correctly defined, cannot create job results widget";
        }

        // Add class and child elements
        this.element.addClass("job-widget");
        this.element.append(
            $("<div></div>")
                .addClass("job-widget-header")
                .append(
                    $("<div></div>")
                        .addClass("job-widget-status")
                )
                .append(
                    $("<div></div>")
                        .addClass("job-widget-task")
                )
                .append(
                    $("<div></div>")
                        .addClass("job-widget-submitted")
                )
        );
        this.element.append(
            $("<div></div>")
                .addClass("job-widget-outputs")
        );

        // Load job status
        this._loadJobStatus();
    },

    /**
     * Destructor
     *
     * @private
     */
    _destroy: function() {
        this.element.removeClass("job-widget-widget");
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
     * Make a quest to the server to update the job status, and then update the UI
     *
     * @private
     */
    _loadJobStatus: function() {
        // If JSON already loaded
        if (this.options.json) {
            var jsonObj = JSON.parse(this.options.json);
            var job = new gp.Job(jsonObj);
            this._displayJob(job);
        }
        // If we need to load the JSON from the server
        else {
            var widget = this;

            gp.job({
                jobNumber: this.options.jobNumber,
                forceRefresh: true,
                success: function(response, job) {
                    widget._displayJob(job);
                },
                error: function() {
                    // Clean the old data
                    widget._clean();

                    // Display the error
                    widget.element.find(".job-widget-task").text("Error loading job: " + widget.options.jobNumber);
                }
            });
        }
    },

    /**
     * Display the widget from the job object
     *
     * @param job
     * @private
     */
    _displayJob: function(job) {
        // Clean the old data
        this._clean();

        // Display the job number and task name
        var taskText = job.jobNumber() + ". " + job.taskName();
        this.element.find(".job-widget-task").text(taskText);

        // Display the user and date submitted
        var submittedText = "Submitted by " + job.userId() + " on " + job.dateSubmitted();
        this.element.find(".job-widget-submitted").text(submittedText);

        // Display the status
        var statusText = widget._statusText(job.status());
        this.element.find(".job-widget-status").text(statusText);

        // Display the job results
        var outputsList = widget._outputsList(job.outputFiles());
        this.element.find(".job-widget-outputs").append(outputsList);

        // Display the log files
        var logList = widget._outputsList(job.logFiles());
        this.element.find(".job-widget-outputs").append(logList);

        // Initialize status polling
        this._initPoll(job.status());
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
     * @param outputs
     * @returns {*|jQuery|HTMLElement}
     * @private
     */
    _outputsList: function(outputs) {
        var outputsList = $("<div></div>")
            .addClass("job-widget-outputs-list");

        if (outputs) {
            for (var i = 0; i < outputs.length; i++) {
                var output = outputs[i];
                $("<a></a>")
                    .text(output["link"]["name"])
                    .attr("href", output["link"]["href"])
                    .attr("target", "_blank")
                    .appendTo(outputsList);
            }
        }
        else {
            outputsList.text("No output files.");
        }

        return outputsList;
    },

    /**
     * Remove the display data from the widget
     *
     * @private
     */
    _clean: function() {
        this.element.find(".job-widget-task").empty();
        this.element.find(".job-widget-submitted").empty();
        this.element.find(".job-widget-status").empty();
        this.element.find(".job-widget-outputs").empty();
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