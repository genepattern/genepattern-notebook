/**
 * @author Thorin Tabor
 *
 * Webpack entry point for bundling client-side resources used in the
 * GenePattern Notebook extension for Jupyter Notebook and JupyterLab
 *
 * Copyright 2015-2017, Regents of the University of California & Broad Institute
 */

// Import GenePattern Notebook Javascript assets
import './genepattern';
import './genepattern.navigation';
import './genepattern.authentication';
import './genepattern.job';
import './genepattern.task';
import './genepattern.uibuilder';

// Import GenePattern Notebook CSS assets
import '../css/genepattern.css';

// Import GenePattern Notebook image assets
import '../img/background.png'
import '../img/gp-icon.png'
import '../img/gp-logo.png'
import '../img/loading.gif'
