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
});