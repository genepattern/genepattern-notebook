/**
 * @author Thorin Tabor
 *
 * Loads the GenePattern Notebook extension for Jupyter Notebook
 *
 * Copyright 2015-2017, Regents of the University of California & Broad Institute
 */

define([
    // Load the dependencies
    "base/js/namespace", "base/js/events", "jquery",

    // Bootstrap loading the GenePattern requirejs modules
    "nbextensions/genepattern/resources/gp",
    "nbextensions/genepattern/resources/navigation",
    "nbextensions/genepattern/resources/auth-widget",
    "nbextensions/genepattern/resources/job-widget",
    "nbextensions/genepattern/resources/task-widget",
    "nbextensions/genepattern/resources/ui-builder"], function(Jupyter, events, $) {

    function load_ipython_extension() {
        var STATIC_PATH = Jupyter.notebook.base_url + "nbextensions/genepattern/resources/";

        $('head')
            // Import styles used by GenePattern navigation
            .append(
                $('<link rel="stylesheet" type="text/css" />')
                    .attr("rel", "stylesheet")
                    .attr("type", "text/css")
                    .attr('href', STATIC_PATH + 'navigation.css')
            )
            // Import styles used by GenePattern widgets
            .append(
                $('<link rel="stylesheet" type="text/css" />')
                    .attr("rel", "stylesheet")
                    .attr("type", "text/css")
                    .attr('href', STATIC_PATH + 'widget.css')
            );

        // Wait for the kernel to be ready and then initialize the widgets
        require(["genepattern/navigation"], function(GPNotebook) {
            var interval = setInterval(function() {
                GPNotebook.init.wait_for_kernel(interval);
            }, 500);
        });
    }

    return {
        load_ipython_extension: load_ipython_extension
    };
});