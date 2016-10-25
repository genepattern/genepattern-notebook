[![Version](https://img.shields.io/pypi/v/genepattern-notebook.svg)](https://pypi.python.org/pypi/genepattern-notebook)
[![Downloads](https://img.shields.io/pypi/dm/genepattern-notebook.svg)](https://pypi.python.org/pypi/genepattern-notebook)
[![Documentation Status](https://img.shields.io/badge/docs-latest-brightgreen.svg?style=flat)](http://genepattern.org/genepattern-notebooks)
[![Docker Pulls](https://img.shields.io/docker/pulls/genepattern/genepattern-notebook.svg)](https://hub.docker.com/r/genepattern/genepattern-notebook/)
[![Join the chat at https://gitter.im/genepattern](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/genepattern?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[//]: # ( [![Binder](http://mybinder.org/badge.svg)](http://mybinder.org/repo/genepattern/genepattern-notebook) )

GenePattern Notebook
====================

The [GenePattern Notebook](http://www.broadinstitute.org/cancer/software/genepattern/genepattern-notebooks) 
environment gives GenePattern users the ability to interleave text, graphics, and code with 
their GenePattern analyses to create "notebooks" that can be edited, shared, and published. 
GenePattern Notebooks are built on the [Jupyter Notebook](https://jupyter.org/) system 
(formerly called IPython Notebook) and extend it so that users can take advantage of its ease 
of use and ability to encapsulate an entire scientific research narrative, without the need 
to write code.

# Installation

Full installation instructions for casual use are detailed on the 
[GenePattern website](http://www.broadinstitute.org/cancer/software/genepattern/genepattern-notebooks-installation).

## Development Install

The installation instructions below are intended for developers who want to install the 
project from PIP or GitHub for purposes of software development.

### Install Python

In order to get the GenePattern Notebook working you will first need to install a compatible 
version of Python. This means you will need either Python 2.7 or Python 3.4+.

**Note for Mac Users:** Mac comes with Python, but - depending on the version OSX you have - 
you may have to update to a new version. To do this I would recommend using a package manager 
such as Homebrew or MacPorts.

You may wish to install the Anaconda distribution of Python from Continuum Analytics. This is 
a scientific version of Python that ships with many of the most popular Python packages for 
science, math and data analysis (ex: NumPy, SciPy, Pandas, Matplotlib, IPython, etc.).

### Install PIP

Install PIP (Python Package Index) if not already installed (PIP may come with Anaconda 
distribution; see https://pip.pypa.io/en/latest/installing.html). This is Python's preferred 
package management system.

Now you should choose to either install GenePattern Notebook from GitHub or from PIP. If you
don't know which method you would prefer, then we recommend doing the PIP installation. Then 
skip to the appropriate step below.

### Install GenePattern Notebook from GitHub

Copy the contents of genepattern-notebook/extension to your development computer and ensure 
that the resulting directory if on your Python path. To test this, open Python and try to 
*import genepattern*. If this is successful, you have a copy of the extension available.

If you don't already have Jupyter installed, you can install it from PIP by running:

> pip install jupyter

From here go to the "Load the GenePattern extension" step below.

### Install GenePattern Notebook from PIP

The easiest way to install GenePattern Notebook is through PIP. It can be installed by executing
the following command:

> pip install genepattern-notebook

### Load the GenePattern extension

Before you the GenePattern extension for the very first time, you should make sure that it is 
enable in Jupyter. To do this run the following on the command line: 

> jupyter nbextension enable --py widgetsnbextension
>
> jupyter nbextension install --py genepattern
>
> jupyter nbextension enable --py genepattern
>
> jupyter serverextension enable --py genepattern

### Launch Jupyter

Finally, you may launch Jupyter Notebook by issuing the following command at the terminal:

> jupyter notebook

This will start up the notebook kernel and launch your web browser pointing to the Notebook.

### Updating GenePattern Notebook

If you want to update GenePattern Notebook to a more recent version on PIP, run the following 
command:

> pip install -upgrade --no-deps genepattern-notebook

# Known Issues

**The current version of the code only works with GenePattern 3.9.3 and up!**

Users using the GenePattern Notebook with an older version of GenePattern (3.9.3 or 3.9.4) may
need to log into the GenePattern UI before making use of the notebook. The server status 
message and child jobs will also be unavailable. If you are using one of these older versions,
we recommend that you upgrade to the latest version of GenePattern.

# Feature Support

Most common GenePattern features are supported in the GenePattern Notebook environment. A few, 
however, have yet to be implemented. GenePattern features that are not yet supported include:

* Batch job submission
* GenomeSpace integration
* Dynamically updated choice parameters
* Parameter groups
