function getScript(url, callback) {
    var head = document.getElementsByTagName("head")[0];
    var script = document.createElement("script");
    script.src = url;

    // Handle Script loading
    {
        var done = false;

        // Attach handlers for all browsers
        script.onload = script.onreadystatechange = function() {
            if ( !done && (!this.readyState || this.readyState == "loaded" || this.readyState == "complete") ) {
               done = true;
               if (callback)
                   callback();

               // Handle memory leak in IE
               script.onload = script.onreadystatechange = null;
            }
        };
    }

    head.appendChild(script);

    // We handle everything using the script element injection
    return undefined;
}



/* getScript("/custom/genepattern/gp.js");
getScript("/custom/genepattern/navigation.js");
getScript("/custom/genepattern/gp-theme.js");
*/

require(["jquery"], function() {
    // Add the loading screen
   

    $([Jupyter.events]).on('kernel_ready.Kernel kernel_created.Session notebook_loaded.Notebook', function() {
        // If no auth widget exists, add it
        setTimeout(function() {
            var authWidgetFound = $(".gp-widget-auth").length >= 1;

            // If jQuery didn't find the widget, does it exist as code?
            if (!authWidgetFound) {
                var cells = Jupyter.notebook.get_cells();
                $.each(cells, function(i, cell) {
                    var code = cell.get_text();
                    if (Jupyter.notebook.get_cells()[0].get_text().indexOf("GPAuthWidget(") > -1) {
                        authWidgetFound = true;
                    }
                });
            }
            // finally see if we already added the first cell with the load
            if (!authWidgetFound) {
                var cells = Jupyter.notebook.get_cells();
                if (cells[0].get_text().indexOf("%reload_ext genepattern") > -1) {
                    authWidgetFound = true;
                    cells[0].execute();
                    console.log('should be executing 2');
                }
            }

            // Add a new auth widget
            if (!authWidgetFound) {
                var cell = Jupyter.notebook.insert_cell_above("code", 0);
                //var code = GenePattern.notebook.init.buildCode("http://genepattern.broadinstitute.org/gp", "", "");
                //cell.code_mirror.setValue(code);
                cell.code_mirror.setValue("%reload_ext genepattern");
                cell.execute();
                console.log('should be executing');
            }
        }, 1);
    });
});

