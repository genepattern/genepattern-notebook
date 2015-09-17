GenePattern Notebook
====================

Some notes on setup of GenePattern Notebook environment.

**IMPORTANT: The current version of the code only works with GenePattern 3.9.3 and up! 
We recommend GenePattern 3.9.4 (the latest version), as this version fixes a bug in the 
server than can cause the Notebook to double prompt for authentication.**

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

## Install IPython Notebook
Next install IPython Notebook. This can easily be done from PIP by executing the following 
line of code from the terminal.

> pip install "ipython[all]==3.2"

## Install GenePattern Notebook

For the time being, the best way to install the GenePattern Notebook is by cloning the GitHub 
repository and then copying over some files from the checkout to your IPython profile. The 
GenePattern Notebook repository can be cloned by executing the following command:

> pip install genepattern-notebook

## Launch IPython

Finally, you may launch the IPython notebook by issuing the following command at the terminal:

> ipython notebook

This will start up the notebook kernel from and launch your web browser, pointing to the Notebook.

## Updating GenePattern Notebook

If you want to update GenePattern Notebook to a more recent version on PIP, run the following 
command:

> pip install -U --no-deps genepattern-notebook

## Note for RNA-seq Notebook Users

The RNA-seq Notebook requires an additional Python package known as jsonpickle. This package allows 
the notebook to store results in memory using a JSON data format. This package may be installed by 
executing the following line of code from a terminal.

> pip install -U jsonpickle

# Known Issues

There is a known issue that can cause JavaScript visualizers to not display propertly unless a user 
first logs into the main GenePattern interface from the same browser before using them in the 
GenePattern Notebook. This is due to a security model issue in the GenePattern server. A fix is 
planned for the upcoming GenePattern 3.9.5 release.

# Feature Support

Most common GenePattern features are supported from the GenePattern Notebook. A few, however, have 
yet to be implemented. GenePattern features that are not yet supported are:

* Batch job submission
* GenomeSpace integration
* Pipeline child job output
* Dynamically updated choice parameters
* Parameter groups