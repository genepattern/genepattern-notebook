// Add shim to support Jupyter 3.x and 4.x
var Jupyter = Jupyter || IPython || {};

// Add file path shim for Jupyter 3/4
var STATIC_PATH = location.origin + Jupyter.contents.base_url + "nbextensions/genepattern/resources/";

define([
    "base/js/namespace",
    'base/js/events',
    "jquery",
    "nbextensions/genepattern/resources/gp",
    "nbextensions/genepattern/resources/navigation",
    "nbextensions/genepattern/resources/auth-widget",
    "nbextensions/genepattern/resources/job-widget",
    "nbextensions/genepattern/resources/task-widget"], function(Jupyter, events) {

    function load_ipython_extension() {
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

        // Wait for the kernel to be ready and then initialize the widgets
        var interval = setInterval(function() {
            GenePattern.notebook.init.wait_for_kernel(interval);
        }, 500);
    }

    return {
        load_ipython_extension: load_ipython_extension
    };
});