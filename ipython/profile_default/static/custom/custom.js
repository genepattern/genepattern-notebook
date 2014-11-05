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


// Import the GenePattern JavaScript client library, widgets and associated CSS
jQuery.getScript("/static/custom/gp.js").done(function() {
    gp.setServer("http://127.0.0.1:8080/gp");
});
jQuery.getScript("/static/custom/gp-widget.js");
$('head')
    .append($('<link rel="stylesheet" type="text/css" />')
    .attr('href', '/static/custom/jquery-ui.css'));
$('head')
    .append($('<link rel="stylesheet" type="text/css" />')
    .attr('href', '/static/custom/gp-widget.css'));
$('body')
    .append(
    	$('<div></div>')
    		.attr("id", "left-nav")
    		.addClass("left-nav")
    		.hide()
    		.append(
    			$('<ul></ul>')
    				.addClass("nav nav-tabs left-nav-tabs")
    				.attr("role", "tablist")
    				.append(
    					$('<li></li>')
    						.addClass("active left-nav-modules-tab")
    						.attr("role", "presentation")
    						.append(
    							$('<a></a>')
    								.attr("href", "#left-nav-modules")
    								.attr("role", "tab")
    								.attr("data-toggle", "tab")
    								.text("Modules")
    								.click(function() {
    									$(".left-nav-tab").hide();
    									$($(this).attr("href")).show();
    								})
    						)
    				)
    				.append(
    					$('<li></li>')
    						.addClass("left-nav-jobs-tab")
    						.attr("role", "presentation")
    						.append(
    							$('<a></a>')
    								.attr("href", "#left-nav-jobs")
    								.attr("role", "tab")
    								.attr("data-toggle", "tab")
    								.text("Jobs")
    								.click(function() {
    									$(".left-nav-tab").hide();
    									$($(this).attr("href")).show();
    								})
    						)
    				)
    				.append(
    					$('<li></li>')
    						.addClass("left-nav-files-tab")
    						.attr("role", "presentation")
    						.append(
    							$('<a></a>')
    								.attr("href", "#left-nav-files")
    								.attr("role", "tab")
    								.attr("data-toggle", "tab")
    								.text("Files")
    								.click(function() {
    									$(".left-nav-tab").hide();
    									$($(this).attr("href")).show();
    								})
    						)
    				)
    		)
    		.append(
    			$('<div></div>')
    				.addClass("tab-content")
	    			.append(
    					$('<div></div>')
    						.attr("id", "left-nav-modules")
    						.addClass("tab-pane active left-nav-tab")
    						.attr("role", "tabpanel")
    						.append(
    							$('<div></div>')
    							.addClass("left-nav-top")
	    						.append(
    								$('<div></div>')
    									.addClass("module-search-block")
    									.append(
    										$('<input></input>')
    											.addClass("module-search-box")
    											.attr("type", "search")
    											.attr("placeholder", "Search Modules & Pipelines")
    									)
	    						)
    							.append(
    								$('<div></div>')
    									.addClass("module-browse-button")
    									.append(
    										$('<button></button>')
    											.addClass("btn")
    											.text("Browse Modules ›")
    									)
	    						)
    						)
    				)
    				.append(
    					$('<div></div>')
    						.attr("id", "left-nav-jobs")
	    					.addClass("tab-pane left-nav-tab")
	    					.attr("role", "tabpanel")
    				)
    				.append(
    					$('<div></div>')
    						.attr("id", "left-nav-files")
    						.addClass("tab-pane left-nav-tab")
    						.attr("role", "tabpanel")
    				)
    		)
    );
$(".left-nav").show();
$(".left-nav").find(".active").show();

/**
 * Define the IPython GenePattern Job widget
 */
require(["widgets/js/widget"], function (WidgetManager) {

    var JobWidgetView = IPython.WidgetView.extend({
        render: function () {
            // Render the view.
            this.setElement($('<div/></div>'));
            var json = this.model.get('json');
            this.$el.jobResults({
                json: json
            });
        },

        events: {
            // List of events and their handlers.
            'click': 'handle_click'
        },

        handle_click: function (evt) {
            console.log("Clicked!");
        }
    });

    // Register the JobWidgetView with the widget manager.
    WidgetManager.register_widget_view('JobWidgetView', JobWidgetView);
});

require(["widgets/js/widget"], function (WidgetManager) {

    var TaskWidgetView = IPython.WidgetView.extend({
        render: function () {
            // Render the view.
            this.setElement($('<div/></div>'));
            var json = this.model.get('json');
            this.$el.runTask({
                json: json,
                view: this
            });
        },

        events: {
            // List of events and their handlers.
            'click': 'handle_click'
        },

        handle_click: function (evt) {
            console.log("Clicked!");
        }
    });

    // Register the TaskWidgetView with the widget manager.
    WidgetManager.register_widget_view('TaskWidgetView', TaskWidgetView);
});