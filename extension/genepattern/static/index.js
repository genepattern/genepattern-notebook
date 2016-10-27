// Add shim to support Jupyter 3.x and 4.x
var Jupyter = Jupyter || IPython || {};

// Add file path shim for Jupyter 3/4
var STATIC_PATH = location.origin + Jupyter.contents.base_url + "nbextensions/genepattern/resources/";

define([
    "base/js/namespace",
    'base/js/events',
    "jquery",
    STATIC_PATH + "gp.js",
    STATIC_PATH + "navigation.js",
    STATIC_PATH + "auth-widget.js",
    STATIC_PATH + "job-widget.js",
    STATIC_PATH + "task-widget.js"], function(Jupyter, events) {

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