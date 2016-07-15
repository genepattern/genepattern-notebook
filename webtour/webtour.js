// Add shim to support Jupyter 3.x and 4.x
var Jupyter = Jupyter || IPython || {};

// Add file path shim for Jupyter 3/4
var WEBTOUR_PATH = location.origin + Jupyter.contents.base_url + "nbextensions/webtour/introjs/";

define([
    WEBTOUR_PATH + "intro.js"
    ], function(introJs){

    function load_ipython_extension(){
        // Attach the intro.js styles
        $('head')
            // Import styles used by intro.js
            .append(
                $('<link rel="stylesheet" type="text/css" />')
                    .attr("rel", "stylesheet")
                    .attr("type", "text/css")
                    .attr('href', WEBTOUR_PATH + 'introjs.css')
            );

        // Make intro.js available at the top level
        window.introJs = introJs;
    }

    /**
     * Tour for inside a notebook
     */
    function nbTour() {
        // Declare setup and cleanup functions
        function tour_setup() {
            // Add the mockup elements for selection, if missing
            if ($(".fakeout").length < 1) {
                var add_cell = $("#insert_above_below");
                var fake_add_cell = $("<div></div>");
                fake_add_cell.attr("id", "fake_add_cell");
                fake_add_cell.addClass("fakeout");
                fake_add_cell.css("position", "absolute");
                fake_add_cell.css("top", add_cell.offset().top);
                fake_add_cell.css("left", add_cell.offset().left);
                fake_add_cell.css("height", add_cell.height());
                fake_add_cell.css("width", add_cell.width());

                var execute_cell = $("#run_int");
                var fake_execute_cell = $("<div></div>");
                fake_execute_cell.attr("id", "fake_execute_cell");
                fake_execute_cell.addClass("fakeout");
                fake_execute_cell.css("position", "absolute");
                fake_execute_cell.css("top", execute_cell.offset().top);
                fake_execute_cell.css("left", execute_cell.offset().left);
                fake_execute_cell.css("height", execute_cell.height());
                fake_execute_cell.css("width", execute_cell.width() / 3);

                var change_type = $("#cell_type");
                var fake_change_type = $("<div></div>");
                fake_change_type.attr("id", "fake_change_type");
                fake_change_type.addClass("fakeout");
                fake_change_type.css("position", "absolute");
                fake_change_type.css("top", change_type.offset().top);
                fake_change_type.css("left", change_type.offset().left);
                fake_change_type.css("height", change_type.height());
                fake_change_type.css("width", change_type.width());

                $("body")
                    .append(fake_add_cell)
                    .append(fake_execute_cell)
                    .append(fake_change_type);

                // Add a GenePattern cell for Step 6, if necessary
                var auth_widget_found = $(".gp-widget-auth").length > 0;
                if (!auth_widget_found) {
                    var cell = Jupyter.notebook.insert_cell_above(0);
                    setTimeout(function() {
                        Jupyter.notebook.select(0);
                        GenePattern.notebook.toGenePatternCell();
                    }, 10);
                }

                setTimeout(function() {
                    // Show the slider button
                    $(".sidebar-button-main").show();
                }, 1000);
            }
        }
        function tour_cleanup() {
            // Remove the mockup elements
            $(".fakeout").remove();

            // Hide the slider button, if not authenticated
            if (!GenePattern.authenticated) {
                $(".sidebar-button-main").hide();
            }
        }

        // Set up the tour
        tour_setup();

        // Define the tour
        var intro = introJs();
        intro.setOptions({
            showStepNumbers: false,
            skipLabel: "End Tour",
            steps: [
                {
                    intro: "<h4>GenePattern Notebook</h4><p>Welcome to the GenePattern Notebook environment! This is a brief tour of its most important features.</p>"
                },
                {
                    element: $(".cell")[0],
                    intro: "<h4>Notebook Cells</h4>All notebooks consist of some number of cells. These cells may interleave text, images, tables, code or interactive widgets."
                },
                {
                    element: $("#fake_add_cell")[0],
                    intro: "<h4>Insert Cells</h4>New cells can be inserted by clicking the Insert Cell button or by going to the Insert menu above."
                },
                {
                    element: $("#fake_execute_cell")[0],
                    intro: "<h4>Execute Cells</h4>Cells can be executed by clicking this button. When a cell executes it will run any code contained in the cell or render HTML/markdown as text."
                },
                {
                    element: $("#fake_change_type")[0],
                    intro: "<h4>Change Cell Type</h4>Every cell has a type. Types include code cells, markdown cells and GenePattern cells.<br><br><b>To get started using GenePattern features, first change a cell to the GenePattern type.</b>"
                },
                {
                    element: $(".gp-widget")[0],
                    intro: "<h4>GenePattern Cells</h4>GenePattern cells are interactive widgets that allow the notebook environment to access the hundreds of analytic modules available in GenePattern. There are three types of GenePattern cells: login cells, analysis cells and job cells.",
                    position: "top"
                },
                {
                    element: $(".gp-widget-auth")[0],
                    intro: "<h4>GenePattern Login</h4>In order to run analyses in GenePattern, you must first log into a GenePattern server. A GenePattern login cell allows you to select a server and enter your GenePattern username and password. If you don't have a GenePattern account, you can register an account by clicking the Register an Account button.",
                    position: "top"
                },
                {
                    element: $(".sidebar-button-main")[0],
                    intro: "<h4>GenePattern Modules</h4>Once you have logged into GenePattern, this slider button should appear. Clicking on the button will open a menu that will allow you to search for and add GenePattern analyses to your notebook."
                }
            ]
          });

        // Attach events
        intro.onbeforechange(function() {
            tour_setup();
        });
        intro.onexit(function() {
            tour_cleanup();
        });
        intro.oncomplete(function() {
            tour_cleanup();
        });

        // Start the tour
        intro.start();
    }

    // Attach to button
    $([Jupyter.events]).on('kernel_ready.Kernel kernel_created.Session notebook_loaded.Notebook', function() {
        $("#tour-button").click(function() {
            nbTour();
        });
    });

    // Make available at top namespace
    window.nbTour = nbTour;



    return {
        load_ipython_extension: load_ipython_extension
    };
});