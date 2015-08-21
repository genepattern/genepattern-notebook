/*
 * Load required CSS files
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
    "/static/genepattern/task-widget.js"], function(util) {

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