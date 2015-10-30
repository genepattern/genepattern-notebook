GenePattern Notebook
====================

Some notes on setup of GenePattern Notebook environment.

**IMPORTANT: The current version of the code only works with GenePattern 3.9.3 and up! 
Some features are only supported in GenePattern 3.9.5 and up.**

# Installation

## Install Python

In order to get the GenePattern Notebook working you will first need to install a compatible 
version of Python. This means you will need either Python 2.7 or Python 3.4+.

**Note for Mac Users:** Mac comes with Python, but - depending on the version OSX you have - 
you may have to update to a new version. To do this I would recommend using a package manager 
such as Homebrew or MacPorts.

You may wish to install the Anaconda distribution of Python from Continuum Analytics. This is 
a scientific version of Python that ships with many of the most popular Python packages for 
science, math and data analysis (ex: NumPy, SciPy, Pandas, Matplotlib, IPython, etc.).

## Install PIP

Install PIP (Python Package Index) if not already installed (PIP may come with Anaconda 
distribution; see https://pip.pypa.io/en/latest/installing.html). This is Python's preferred 
package management system.

## Install GenePattern Notebook

The best way to install GenePattern Notebook is through PIP. It can be installed by executing
the following command:

> pip install genepattern-notebook

## Launch Jupyter

Finally, you may launch Jupyter Notebook by issuing the following command at the terminal:

> jupyter notebook

This will start up the notebook kernel and launch your web browser pointing to the Notebook.

## Updating GenePattern Notebook

If you want to update GenePattern Notebook to a more recent version on PIP, run the following 
command:

> pip install -U --no-deps genepattern-notebook

# Known Issues

Users using the GenePattern Notebook with an older version of GenePattern (3.9.3 or 3.9.4) may
need to log into the GenePattern UI before making use of the notebook. The server status 
message and child jobs will also be unavailable.

# Feature Support

Most common GenePattern features are supported in the GenePattern Notebook. A few, however, have 
yet to be implemented. GenePattern features that are not yet supported are:

* Batch job submission
* GenomeSpace integration
* Dynamically updated choice parameters
* Parameter groups