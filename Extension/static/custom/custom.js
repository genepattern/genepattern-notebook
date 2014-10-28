// leave at least 2 line with only a star on it below, or doc generation fails
/**
 *
 *
 * Placeholder for custom user javascript
 * mainly to be overridden in profile/static/custom/custom.js
 * This will always be an empty file in IPython
 *
 * User could add any javascript in the `profile/static/custom/custom.js` file
 * (and should create it if it does not exist).
 * It will be executed by the ipython notebook at load time.
 *
 * Same thing with `profile/static/custom/custom.css` to inject custom css into the notebook.
 *
 * Example :
 *
 * Create a custom button in toolbar that execute `%qtconsole` in kernel
 * and hence open a qtconsole attached to the same kernel as the current notebook
 *
 *    $([IPython.events]).on('app_initialized.NotebookApp', function(){
 *        IPython.toolbar.add_buttons_group([
 *            {
 *                 'label'   : 'run qtconsole',
 *                 'icon'    : 'icon-terminal', // select your icon from http://fortawesome.github.io/Font-Awesome/icons
 *                 'callback': function () {
 *                     IPython.notebook.kernel.execute('%qtconsole')
 *                 }
 *            }
 *            // add more button here if needed.
 *            ]);
 *    });
 *
 * Example :
 *
 *  Use `jQuery.getScript(url [, success(script, textStatus, jqXHR)] );`
 *  to load custom script into the notebook.
 *
 *    // to load the metadata ui extension example.
 *    $.getScript('/static/notebook/js/celltoolbarpresets/example.js');
 *    // or
 *    // to load the metadata ui extension to control slideshow mode / reveal js for nbconvert
 *    $.getScript('/static/notebook/js/celltoolbarpresets/slideshow.js');
 *
 *
 * @module IPython
 * @namespace IPython
 * @class customjs
 * @static
 */

jQuery.getScript("http://127.0.0.1:8080/gp/libraries/javascript/gp.js").done(function() {
    gp.setServer("http://127.0.0.1:8080/gp");
    gp.tasks();
});
jQuery.getScript("http://127.0.0.1:8080/gp/libraries/javascript/gp-widget.js");
$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', 'http://127.0.0.1:8080/gp/libraries/javascript/gp-widget.css'));

require(["widgets/js/widget"], function (WidgetManager) {

    var JobWidgetView = IPython.WidgetView.extend({
        render: function () {
            // Render the view.
            this.setElement($('<div/></div>'));
            this.$el.addClass("job-widget");
            this.$el.append(
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
            this.$el.append(
                $("<div></div>")
                    .addClass("job-widget-outputs")
            );

            // Load job status
            this._loadJobStatus();
        },

        _loadJobStatus: function() {
            var json = this.model.get('json');
            var job = new gp.Job(JSON.parse(json));

            // Clean the old data
            // TODO: this._clean();

            // Display the job number and task name
            var taskText = job.jobNumber() + ". " + job.taskName();
            this.$el.find(".job-widget-task").text(taskText);

            // Display the user and date submitted
            var submittedText = "Submitted by " + job.userId() + " on " + job.dateSubmitted();
            this.$el.find(".job-widget-submitted").text(submittedText);

            // Display the status
            var statusText = this._statusText(job.status());
            this.$el.find(".job-widget-status").text(statusText);

            // Display the job results
            var outputsList = this._outputsList(job.outputFiles());
            this.$el.find(".job-widget-outputs").append(outputsList);

            // Display the log files
            var logList = this._outputsList(job.logFiles());
            this.$el.find(".job-widget-outputs").append(logList);

            // Initialize status polling
            // TODO: this._initPoll(job.status());
        },

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

        events: {
            // List of events and their handlers.
            'click': 'handle_click'
        },

        handle_click: function (evt) {
//            // Handle when the user has changed the file.
//
//            // Retrieve the first (and only!) File from the FileList object
//            var file = evt.target.files[0];
//            if (file) {
//
//                // Read the file's textual content and set value to those contents.
//                var that = this;
//                var file_reader = new FileReader();
//                file_reader.onload = function (e) {
//                    that.model.set('value', e.target.result);
//                    that.touch();
//                };
//                file_reader.readAsText(file);
//            } else {
//
//                // The file couldn't be opened. Send an error msg to the
//                // back-end.
//                this.send({ 'event': 'error' });
//            }
//
//            // Set the filename of the file.
//            this.model.set('filename', file.name);
//            this.touch();
            alert("Clicked!");
            this._loadJobStatus();
        }
    });

    // Register the JobWidgetView with the widget manager.
    WidgetManager.register_widget_view('JobWidgetView', JobWidgetView);
});