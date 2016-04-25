/**
 * Apply the GenePattern Notebook theme's JavaScript
 *
 * @author Thorin Tabor
 * @requires - jQuery, navigation.js, gp-theme.css
 *
 * Copyright 2015 The Broad Institute, Inc.
 *
 * SOFTWARE COPYRIGHT NOTICE
 * This software and its documentation are the copyright of the Broad Institute, Inc. All rights are reserved.
 * This software is supplied without any warranty or guaranteed support whatsoever. The Broad Institute is not
 * responsible for its use, misuse, or functionality.
 */
var GenePattern = GenePattern || {};
GenePattern.notebook = GenePattern.notebook || {};

// Add shim to support Jupyter 4.x
var Jupyter = Jupyter || IPython || {};

// Add file path shim for Jupyter 3/4
var STATIC_PATH = location.origin + Jupyter.contents.base_url + "nbextensions/genepattern/resources/";

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
                .attr("src", STATIC_PATH + "GP_logo_on_black.png")
        );
};

require(["jquery"], function() {
    $("head")
    // Import styles used by GenePattern theme
    .append(
        $('<link rel="stylesheet" type="text/css" />')
            .attr("rel", "stylesheet")
            .attr("type", "text/css")
            .attr('href', STATIC_PATH + 'gp-theme.css')
    );

    // Add the loading screen
    $("body").append(GenePattern.notebook.loadingScreen());

    // Change the logo
    $("#ipython_notebook").find("img").attr("src", STATIC_PATH + "GP_logo_on_black.png");

    // Auto-add the GP Auth Widget if one does not already exist in the Notebook
    $([Jupyter.events]).on('kernel_ready.Kernel kernel_created.Session notebook_loaded.Notebook', function() {
        // If no auth widget exists, add it
        setTimeout(function() {
            var authWidgetFound = $(".gp-widget-auth").length >= 1;

            // If jQuery didn't find the widget, does it exist as code?
            if (!authWidgetFound) {
                var cells = Jupyter.notebook.get_cells();
                $.each(cells, function(i, cell) {
                    var code = cell.get_text();
                    if (Jupyter.notebook.get_cells()[0].get_text().indexOf("%reload_ext genepattern") > -1) {
                        authWidgetFound = true;
                    }
                });
            }

            // Add a new auth widget
            if (!authWidgetFound) {
                var cell = Jupyter.notebook.insert_cell_above("code", 0);
                var code = "%reload_ext genepattern";
                cell.code_mirror.setValue(code);
                setTimeout(function () {
                    Jupyter.notebook.get_cell(0).execute();
                }, 1000);
            }
        }, 1);
    });

    // If the notebook listing page, display with alternate event model
    if ($(document).find("#notebooks").length > 0 || $("#texteditor-container").length > 0) {
        // Hide the loading screen
        setTimeout(function () {
            $(".loading-screen").hide("fade");
        }, 100);
    }

    // Backup attempt to fade loading screen if it's still up after two seconds
    setTimeout(function () {
        $(".loading-screen").hide("fade");
    }, 2000);
});