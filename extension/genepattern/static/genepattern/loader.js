/**
 * Load required CSS files
 *
 * @author Thorin Tabor
 * @requires - jQuery, navigation.js
 *
 * Copyright 2015 The Broad Institute, Inc.
 *
 * SOFTWARE COPYRIGHT NOTICE
 * This software and its documentation are the copyright of the Broad Institute, Inc. All rights are reserved.
 * This software is supplied without any warranty or guaranteed support whatsoever. The Broad Institute is not
 * responsible for its use, misuse, or functionality.
 */

// Add shim to support Jupyter 3.x and 4.x
var Jupyter = Jupyter || IPython || {};

// Add file path shim for Jupyter 3/4
var STATIC_PATH = location.origin;
if (Jupyter.version >= "4.0.0") {
    STATIC_PATH += Jupyter.contents.base_url + "custom/genepattern/";
}
else STATIC_PATH += "/static/genepattern/";

$('head')
    // Import styles used by GenePattern navigation
    .append(
        $('<link rel="stylesheet" type="text/css" />')
            .attr("rel", "stylesheet")
            .attr("type", "text/css")
            .attr('href', STATIC_PATH + 'gp-navigation.css')
    )
    // Import styles used by GenePattern widgets
    .append(
        $('<link rel="stylesheet" type="text/css" />')
            .attr("rel", "stylesheet")
            .attr("type", "text/css")
            .attr('href', STATIC_PATH + 'gp-widget.css')
    );

/*
 * Load the required JavaScript files and init
 */

requirejs([
    "jquery",
    STATIC_PATH + "gp.js",
    STATIC_PATH + "navigation.js",
    STATIC_PATH + "auth-widget.js",
    STATIC_PATH + "job-widget.js",
    STATIC_PATH + "task-widget.js"], function() {

    // Initiate the GenePattern Notebook extension
    // If reloading a notebook, display with the full event model
    $([Jupyter.events]).on('kernel_ready.Kernel kernel_created.Session notebook_loaded.Notebook', GenePattern.notebook.init.notebook_init_wrapper);

    // Otherwise, if not initialized after two seconds, manually init
    setTimeout(function() {
        if (!GenePattern.notebook.init.done_init  && Jupyter.notebook.kernel) {
            GenePattern.notebook.init.notebook_init_wrapper();
        }
    }, 2000);
});