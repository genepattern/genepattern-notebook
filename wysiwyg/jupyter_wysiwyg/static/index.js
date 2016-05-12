// Add file path shim for Jupyter 3/4
var WYSIWYG_PATH = location.origin + Jupyter.contents.base_url + "nbextensions/jupyter_wysiwyg/";

define([
    "base/js/namespace",
    "jquery",
    WYSIWYG_PATH + "ckeditor/ckeditor.js",
    WYSIWYG_PATH + "ckeditor/adapters/jquery.js"], function(Jupyter) {

    console.log("INSIDE FIRST: " + WYSIWYG_PATH + "ckeditor/adapters/jquery.js");

    /**
     * Take a Markdown cell and initialize WYSIWYG mode for the cell
     *
     * @param cell - Jupyter cell object for WYSIWYG mode
     */
    function init_wysiwyg_mode(cell) {
        // Check for error states
        if (cell.cell_type !== "markdown") console.log("ERROR: init_wysiwyg_mode() called on non-text cell: " + cell.cell_type);
        if (!cell.rendered) cell.render();

        // Get the DOM elements
        var textbox = cell.element.find(".text_cell_render");
        var content = $(textbox).text().trim();

        // Initialize CKEditor
        var editor = CKEDITOR.replace(textbox[0], {
            height: 250,
            extraPlugins: 'divarea',
            removePlugins: "magicline",
            toolbarGroups: [
                { name: 'styles', groups: [ 'styles' ] },
                { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
                { name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi', 'paragraph' ] },
                { name: 'links', groups: [ 'links' ] },
                { name: 'insert', groups: [ 'insert' ] },
                { name: 'document', groups: [ 'mode' ] }
            ]
        });

        // Editor settings
        editor.on('instanceReady', function( ev ) {
            editor.setReadOnly(false);
            ev.editor.dataProcessor.writer.setRules('p', {
                indent : false,
                breakBeforeOpen : false,
                breakAfterOpen : false,
                breakBeforeClose : false,
                breakAfterClose : false
            });
            ev.editor.dataProcessor.writer.setRules('blockquote', {
                indent : false,
                breakBeforeOpen : false,
                breakAfterOpen : false,
                breakBeforeClose : false,
                breakAfterClose : false
            });
        });

        // Attach editor to cell
        cell.element.data("editor", editor);

        // Editor keyboard events
        editor.on('focus', function( ev ) {
            Jupyter.notebook.keyboard_manager.disable();
            $(".cke_top").show();
        });
        editor.on('blur', function( ev ) {
            Jupyter.notebook.keyboard_manager.enable();
        });

        // Save editor changes to model
        editor.on('change', function( ev ) {
            $(editor.element.$).find(".anchor-link").remove();
            var cellData = editor.getData();
            $(editor.element.$).closest(".cell").data("cell").code_mirror.setValue(cellData);
        });
    }

    /**
     * Gracefully tear down the CKEditor instance used for WYSIWYG mode
     *
     * @param cell
     */
    function disable_wysiwyg_mode(cell) {
        // Get editor instance
        var editor = cell.element.data("editor");
        if (!editor) {
            console.log("ERROR: Could not get editor instance to destroy");
            return;
        }

        // Destroy the editor instance
        editor.destroy();
    }

    /**
     * Attach a WYSIWYG mode button to a cell, if that cell if of the Markdown type and rendered.
     * Gracefully ignore any cells that are not rendered or which are of an incorrect type.
     *
     * @param cell - Jupyter cell object for WYSIWYG button
     */
    function add_wysiwyg_button(cell) {
        if (cell.cell_type === "markdown" && cell.rendered) {
            // TODO: Implement, Remove this debugging line
            console.log("Dummy button added to cell: " + cell);
        }
    }

    /**
     * Attach WYSIWYG mode buttons to all existing cells in the notebook.
     * Used when loading a notebook.
     */
    function attach_buttons() {
        var all_cells = Jupyter.notebook.get_cells();
        $.each(all_cells, function(i, cell) {
            add_wysiwyg_button(cell);
        });
    }

    /**
     * Load the WYSIWYG nbextension
     */
    function load_ipython_extension() {
        // TODO: Remove debugging lines
        window.disable_wysiwyg_mode = disable_wysiwyg_mode;
        window.init_wysiwyg_mode = init_wysiwyg_mode;

        // Attach WYSIWYG buttons to existing cells when a notebook is loaded
        attach_buttons();

        // Attach WYSIWYG button when a new cell is created
        $([Jupyter.events]).on('create.Cell', function(event, target) {
            add_wysiwyg_button(target.cell);
        });
    }

    return {
        load_ipython_extension: load_ipython_extension
    };
});