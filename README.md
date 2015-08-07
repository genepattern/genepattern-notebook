GenePattern Notebook
====================

Some notes on setup of GenePattern Notebook environment.

**IMPORTANT: The current version of the code here only works with GenePattern 3.9.3 and up! 
We recommend GenePattern 3.9.4 (the latest version), as this version fixs  bug in the 
server than can cause the Notebook to double prompt for authentication.  This is because a 
number of changes have been made to the GenePattern REST API to support GenePattern 
Notebook. Use of modules requiring a EULA or file lists requires GenePattern 3.9.4 (also 
due to REST API changes).**

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

> pip install "ipython[notebook]"

## Install GenePattern Python Library
The GenePattern Notebook uses the GenePattern Python Library for many of its calls. This 
library can be installed from PIP by running the following command:

> pip install genepattern-python

## Install GenePattern Notebook

For the time being, the best way to install the GenePattern Notebook is by cloning the GitHub 
repository and then copying over some files from the checkout to your IPython profile. The 
GenePattern Notebook repository can be cloned by executing the following command:

> git clone https://github.com/broadinstitute/GenePatternNotebook.git

**As the GenePattern Notebook is not yet public, at this time you must be a member of the 
GenePattern team to access the repository.**

Next, you must copy over the GenePattern Notebook extension to your IPython profile. Your 
profile is by default found at ~/.ipython - a hidden directory under your user directory.
You will need to copy the client-side files needed to display the GenePattern widgets. 
From the cloned repository (whose root folder is GenePatternNotebook):

> cp GenePatternNotebook/profile/profile_default/static/custom/* ~/.ipython/profile_default/static/custom/

## Launch IPython

Finally, you may launch the IPython notebook by issuing the following command at the terminal:

> ipython notebook

This will start up the notebook kernel from and launch your web browser, pointing to the Notebook.

## Note for RNA-seq Notebook Users

The RNA-seq Notebook requires an additional Python package known as jsonpickle. This package allows 
the notebook to store results in memory using a JSON data format. This package may be installed by 
executing the following line of code from a terminal.

> pip install -U jsonpickle
