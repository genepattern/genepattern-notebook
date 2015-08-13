/**
 * Apply the GenePattern Notebook theme's JavaScript
 *
 * @requires - jQuery, navigation.js, gp-theme.css
 */

require(["jquery"], function() {
    // Add the loading screen
    $("body").append(GenePattern.notebook.loadingScreen());

    // Change the logo
    $("#ipython_notebook").find("img").attr("src", "/static/custom/GP_logo_on_black.png");

    // Auto-add the GP Auth Widget if one does not already exist in the Notebook
    $([IPython.events]).on('kernel_ready.Kernel kernel_created.Session notebook_loaded.Notebook', function() {
        // If no auth widget exists, add it
        setTimeout(function() {
            var authWidgetFound = $(".gp-widget-auth").length >= 1;

            // If jQuery didn't find the widget, does it exist as code?
            if (!authWidgetFound) {
                var cells = IPython.notebook.get_cells();
                $.each(cells, function(i, cell) {
                    var code = cell.get_text();
                    if (IPython.notebook.get_cells()[0].get_text().indexOf("GPAuthWidget(") > -1) {
                        authWidgetFound = true;
                    }
                });
            }

            // Add a new auth widget
            if (!authWidgetFound) {
                var cell = IPython.notebook.insert_cell_above("code", 0);
                var code = GenePattern.notebook.init.buildCode("http://genepattern.broadinstitute.org/gp", "", "");
                cell.code_mirror.setValue(code);
                cell.execute();
            }
        }, 1);
    });
});