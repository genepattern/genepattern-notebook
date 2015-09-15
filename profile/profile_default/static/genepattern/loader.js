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
$('head')
    // Import styles used by GenePattern navigation
    .append(
        $('<link rel="stylesheet" type="text/css" />')
            .attr("rel", "stylesheet")
            .attr("type", "text/css")
            .attr('href', '/static/genepattern/gp-navigation.css')
    )
    // Import styles used by GenePattern widgets
    .append(
        $('<link rel="stylesheet" type="text/css" />')
            .attr("rel", "stylesheet")
            .attr("type", "text/css")
            .attr('href', '/static/genepattern/gp-widget.css')
    );

/*
 * Load the required JavaScript files and init
 */

requirejs([
    "jquery",
    "/static/genepattern/gp.js",
    "/static/genepattern/navigation.js",
    "/static/genepattern/auth-widget.js",
    "/static/genepattern/job-widget.js",
    "/static/genepattern/task-widget.js"], function() {

    // Initiate the GenePattern Notebook extension
    // If reloading a notebook, display with the full event model
    $([IPython.events]).on('kernel_ready.Kernel kernel_created.Session notebook_loaded.Notebook', GenePattern.notebook.init.notebook_init_wrapper);

    // Otherwise, if not initialized after two seconds, manually init
    setTimeout(function() {
        if (!GenePattern.notebook.init.launch_init.done_init  && IPython.notebook.kernel) {
            GenePattern.notebook.init.notebook_init_wrapper();
        }
    }, 2000);
});