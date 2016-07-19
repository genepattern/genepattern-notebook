// Add shim to support Jupyter 3.x and 4.x
var Jupyter = Jupyter || IPython || {};

if ($("#ipython-main-app").length > 0) {
    // Add file path shim for Jupyter 3/4
    // var WEBTOUR_PATH = location.origin + Jupyter.contents.base_url + "nbextensions/webtour/introjs/";
    var WEBTOUR_PATH = location.origin + "/" + "nbextensions/webtour/introjs/";

    require([
        WEBTOUR_PATH + "intro.js"
        ], function(introJs){

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

        /**
         * Tour for inside a directory
         */
        function dirTour() {
            // Declare setup and cleanup functions
            function tour_setup() {
                // Add the mockup elements for selection, if missing
                if ($(".fakeout").length < 1) {
                    var first_checkbox = $(".list_item.row").find("input[type='checkbox']").first();
                    var is_checked = first_checkbox.prop("checked");
                    if (!is_checked) {
                        $(".list_item.row").find("input[type='checkbox']").first().click();
                    }

                    // Add the fakeout element
                    $("<div></div>")
                        .addClass("fakeout")
                        .appendTo("body");
                }
            }
            function tour_cleanup() {
                // Remove the mockup elements
                $(".fakeout").remove();
            }

            window.tour_setup = tour_setup;

            // Set up the tour
            tour_setup();

            // Create the step selectors
            var selectors = [];
            selectors.push( $(".list_item.row")[0] );                    // step 1
            selectors.push( $("#new-buttons")[0] );                      // step 2
            selectors.push( $(".list_item.row:contains('.ipynb')")[0] ); // step 3
            selectors.push( $("#alternate_upload")[0] );                 // step 4
            selectors.push( $(".dynamic-buttons")[0] );                  // step 5

            // Define the tour
            var intro = introJs();
            intro.setOptions({
                showStepNumbers: false,
                skipLabel: "End Tour",
                steps: [
                    {
                        intro: "<h4>GenePattern Notebook</h4><p>Welcome to the GenePattern Notebook environment! This is a brief tour of how to get started.</p>"
                    },
                    {
                        element: selectors[0],
                        intro: "<h4>Notebook Files</h4>Your notebook directory contains a list of available notebook files, as well as other supporting files."
                    },
                    {
                        element: selectors[1],
                        intro: "<h4>Create a New Notebook</h4>To create a new notebook click here and select the scripting environment that you prefer. If you do not know which environment you would prefer, we recommend Python 2."
                    },
                    {
                        element: selectors[2],
                        intro: "<h4>Run an Existing Notebook</h4>You can launch an existing notebook simply by clicking on the name of one of the notebook files in the list.<br><br><b>We recommend starting with the GenePattern Notebook Tutotial notebook.</b>"
                    },
                    {
                        element: selectors[3],
                        intro: "<h4>Upload a Notebook File</h4>To upload a notebook file or other supporting file, click the upload button and select the file on your computer.</b>"
                    },
                    {
                        element: selectors[4],
                        intro: "<h4>File Actions</h4>Checking a file will provide a number of actions that can be taken on the selected files. These will be displayed here when a file is checked."
                    }
                ]
              });

            intro.onexit(function() {
                tour_cleanup();
            });
            intro.oncomplete(function() {
                tour_cleanup();
            });

            intro.start();
        }

        window.dirTour = dirTour;
    });
}