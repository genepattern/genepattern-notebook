// Add file path shim for Jupyter 3/4
var WYSIWYG_PATH = location.origin + Jupyter.contents.base_url + "nbextensions/jupyter_wysiwyg/";

define([
    "base/js/namespace",
    "jquery",
    WYSIWYG_PATH + "ckeditor/ckeditor.js",
    WYSIWYG_PATH + "ckeditor/adapters/jquery.js"], function(Jupyter) {

    console.log("INSIDE FIRST: " + WYSIWYG_PATH + "ckeditor/adapters/jquery.js");

    function load_ipython_extension() {
        //define([WYSIWYG_PATH + "ckeditor/adapters/jquery.js"], function() {
        //    // Initiate the jupyter_wysiwyg extension
        //    // If reloading a notebook, display with the full event model
        //    // $([Jupyter.events]).on('kernel_ready.Kernel kernel_created.Session notebook_loaded.Notebook', GenePattern.notebook.init.notebook_init_wrapper);
        //
        //    // Otherwise, if not initialized after two seconds, manually init
        //    //setTimeout(function() {
        //    //    //if (!GenePattern.notebook.init.done_init  && Jupyter.notebook.kernel) {
        //    //    //    GenePattern.notebook.init.notebook_init_wrapper();
        //    //    //}
        //    //}, 2000);
        //
            console.log("ALL IS WELL!");
        //
        //    return {
        //        load_jquery_adapter: function() {}
        //    };
        //});
    }

    return {
        load_ipython_extension: load_ipython_extension
    };
});