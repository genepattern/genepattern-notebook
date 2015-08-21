/*
 * Define debuggable method for loading scripts
 */

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

/*
 * Create the GenePattern object to hold GP state
 */

getScript("/static/genepattern/gp.js");

/*
 * Navigation widgets & page initialization
 */

getScript("/static/genepattern/navigation.js");

/*
 * Run the GenePattern Notebook theme's JavaScript
 */

//getScript("/static/genepattern/gp-theme.js");

/**
 * Import the IPython GenePattern Authentication widget
 */

getScript("/static/genepattern/auth-widget.js");

/**
 * Define the IPython GenePattern Job widget
 */
getScript("/static/genepattern/job-widget.js");

/**
 * Define the IPython GenePattern Task widget
 */
getScript("/static/genepattern/task-widget.js");