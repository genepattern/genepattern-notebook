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
jQuery.getScript("/static/custom/jquery.leftnav.js");
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
    											.keyup(function(event) {
    												// Handle backspace
    												if (event.keyCode === 8) {
    													$(this).val($(this).val().substring(0, $(this).val().length-1));
    												}
    												
    												// Handle standard characters 
    												if (event.key.length === 1) {
    													$(this).val($(this).val() + event.key);
    												}
    											
	                    							if ($(".search-widget:visible").length === 0) {
	                    								$("#module-search").searchslider("show");
	                        							setModuleSearchTitle($(this).val());
	                    							}
	                    							$("#module-search").searchslider("show");
	                    							$("#module-search").searchslider("filter", $(this).val());
	                    							setModuleSearchTitle($(this).val());
	                    							
	                    							event.stopImmediatePropagation();
	                    							event.stopPropagation();
    												event.preventDefault();
    											})
    											.keypress(function(event) {
    												event.stopImmediatePropagation();
	                    							event.stopPropagation();
    												event.preventDefault();
    											})
    											.keydown(function(event) {
    												console.log(event);
    												event.stopImmediatePropagation();
    												event.stopPropagation();
    												event.preventDefault();
    											})
    									)
	    						)
    							.append(
    								$('<div></div>')
    									.addClass("module-browse-button")
    									.append(
    										$('<button></button>')
    											.addClass("btn")
    											.text("Browse Modules ›")
    											.click(function() {
    												$(".module-search-box").val("");
	                								$("#module-browse").searchslider("show");
    											})
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

$('body')
    .append(
    	$('<div></div>')
    		.attr("id", "module-search")
    		.hide()
    ) 
$('body')
    .append(
    	$('<div></div>')
    		.attr("id", "module-browse")
    		.hide()
    )


// Load the modules
var all_modules = null;
var kindToModules = null;
var all_categories = null;
var all_suites = null;
var all_modules_map = null;


function setModuleSearchTitle(filter) {
    if (filter === '') {
        $("#module-search").searchslider("set_title", "Search: Modules &amp; Pipelines");
    }
    else {
        $("#module-search").searchslider("set_title", "Search: " + filter);
    }
}


function initAllModulesMap(all_modules) {
    var modMap = {};

    for (var i = 0; i < all_modules.length; i++) {
        var mod = all_modules[i];
        modMap[mod.lsid] = mod;
    }

    all_modules_map = modMap;
}

function addTaskCell(lsid) {
	var selectedIndex = IPython.notebook.get_selected_index();
	var cell = IPython.notebook.insert_cell_at_index("code", selectedIndex + 1);
	var textArea = $(cell.element).find("textarea");
	cell.set_text("%get_task http://127.0.0.1:8080/gp tabor \"\" " + lsid);
	cell.execute();
	$(".search-widget").searchslider("hide");
}

function initSearchSlider() {
    var still_loading = false;

    var search = $('<div id="module-list-search"></div>').modulelist({
        title: 'Search: Modules &amp; Pipelines',
        data: all_modules,
        droppable: false,
        draggable: true,
        click: function(event) {
            var lsid = $(event.target).closest(".module-listing").module("get_lsid");
            if (!still_loading) {
                still_loading = true;
                setTimeout(function() {
                    console.log(still_loading);
                    still_loading = false;
                }, 400);
                addTaskCell(lsid);
            }
        }
    });

    $('#module-search').searchslider({
        lists: [search]
    });
}

function initBrowseTop() {
    return $('<div id="module-list-allnsuite"></div>').modulelist({
        title: 'Browse Modules &amp; Pipelines',
        data: [
            {
                "lsid": "",
                "name": "All Modules",
                "description": "Browse an alphabetical listing of all installed GenePattern modules and pipelines.",
                "version": "",
                "documentation": "http://genepattern.org",
                "categories": [],
                "suites": [],
                "tags": []
            },

            {
                "lsid": "",
                "name": "Browse by Suite",
                "description": "Browse available modules and pipelines by associated suites.",
                "version": "",
                "documentation": "http://genepattern.org",
                "categories": [],
                "suites": [],
                "tags": []
            }
        ],
        droppable: false,
        draggable: false,
        click: function(event) {
            var button = $(event.currentTarget).find(".module-name").text();
            if (button == 'All Modules') {
                var modSearch = $("#module-search");
                modSearch.searchslider("show");
                modSearch.searchslider("filter", '');
                modSearch.searchslider("set_title", '<a href="#" onclick="$(\'#module-browse\').searchslider(\'show\');">Browse Modules</a> &raquo; All Modules');
            }
            else {
                $("#module-suites").searchslider("show");
            }
        }
    });
}

function initBrowseModules() {
    return $('<div id="module-list-browse"></div>').modulelist({
        title: 'Browse Modules by Category',
        data: all_categories,
        droppable: false,
        draggable: false,
        click: function(event) {
            var filter = $(event.currentTarget).find(".module-name").text();
            var modSearch = $("#module-search");
            modSearch.searchslider("show");
            modSearch.searchslider("tagfilter", filter);
            modSearch.searchslider("set_title", '<a href="#" onclick="$(\'#module-browse\').searchslider(\'show\');">Browse Modules</a> &raquo; ' + filter);
        }
    });
}

function initBrowseSuites() {
    var browse = $('<div id="module-list-suites"></div>').modulelist({
        title: '<a href="#" onclick="$(\'#module-browse\').searchslider(\'show\');">Browse Modules</a> &raquo; Browse Suites',
        data: all_suites,
        droppable: false,
        draggable: false,
        click: function(event) {
            var filter = $(event.currentTarget).find(".module-name").text();
            var modSearch = $("#module-search");
            modSearch.searchslider("show");
            modSearch.searchslider("tagfilter", filter);
            modSearch.searchslider("set_title", '<a href="#" onclick="$(\'#module-browse\').searchslider(\'show\');">Browse Modules</a> &raquo; <a href="#" onclick="$(\'#module-suites\').searchslider(\'show\');">Browse Suites</a> &raquo; ' + filter);
        }
    });

    $('#module-suites').searchslider({
        lists: [browse]
    });
}



	            	$.ajax({
                        cache: false,
	                    url: 'http://127.0.0.1:8080/gp/rest/v1/tasks/all.json',
	                    dataType: 'json',
	                    xhrFields: {
                    		withCredentials: true
                		},
	                    //beforeSend: function (xhr) {
    					//	xhr.setRequestHeader ("Authorization", "Basic " + btoa("tabor"));
						//},
	                    success: function(data, status, xhr) {
	                    	all_modules = data.all_modules;
                            initAllModulesMap(all_modules);
                            kindToModules = data.kindToModules;
	                    	
	                    	// Initialize the displays on the left nav bar
	                    	//$("#loading-modules").hide();
	                    	//initPinned();
	                    	//initRecent();

	                    	// Initialize the search slider
	                    	initSearchSlider();
	                    	
	                    	all_categories = data.all_categories;
	                        // Initialize the module browse button and slider
	                        var allnsuite = initBrowseTop();
	                        var browse = initBrowseModules();
	                                
	                        // Initialize the slider
	                        var modbrowse = $('#module-browse').searchslider({
	                            lists: [allnsuite, browse]
	                        });
	                        
	                        // Initialize the suites slider
	                        all_suites = data.all_suites;
	                        initBrowseSuites();
	                    },
                        error: function(data) {
                            var userAborted = !data.getAllResponseHeaders();
                            if (!userAborted) {
                                $("#loading-modules").text("Error Loading Modules");
                                $("#loading-modules").css("color", "red");
                                $("#loading-modules").css("font-size", "14pt");
                            }
                        }
	                });


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