define(['base/js/namespace'], function(Jupyter) {
    function load_ipython_extension() {
        console.log("LOADING EVERYTHING!");
        console.log(Jupyter);
    }

    return {
        load_ipython_extension: load_ipython_extension
    };
});