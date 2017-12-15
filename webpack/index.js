/**
 * @author Thorin Tabor
 *
 * Webpack entry point for bundling client-side resources used in the
 * GenePattern Notebook extension for Jupyter Notebook and JupyterLab
 *
 * Copyright 2015-2017, Regents of the University of California & Broad Institute
 */

// Import GenePattern Notebook Javascript assets
import './gp';
import './navigation';
import './auth-widget';
// import './job-widget';
// import './task-widget';
// import './ui-builder';

// Import GenePattern Notebook CSS assets
import '../css/navigation.css';
import '../css/widget.css';

// Import GenePattern Notebook image assets
import '../img/background.png'
import '../img/gp-icon.png'
import '../img/gp-logo.png'
import '../img/loading.gif'
