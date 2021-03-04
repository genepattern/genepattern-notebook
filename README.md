[![Version](https://img.shields.io/pypi/v/genepattern-notebook.svg)](https://pypi.python.org/pypi/genepattern-notebook)
[![Build](https://travis-ci.org/genepattern/genepattern-notebook.svg?branch=master)](https://travis-ci.org/genepattern/genepattern-notebook)
[![Documentation Status](https://img.shields.io/badge/docs-latest-brightgreen.svg?style=flat)](https://gpnotebook-website-docs.readthedocs.io/en/latest/)
[![Docker Pulls](https://img.shields.io/docker/pulls/genepattern/genepattern-notebook.svg)](https://hub.docker.com/r/genepattern/genepattern-notebook/)
[![Join the chat at https://gitter.im/genepattern](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/genepattern/genepattern-notebook?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

GenePattern Notebook
====================

The [GenePattern Notebook](http://www.genepattern-notebook.org) 
environment gives GenePattern users the ability to interleave text, graphics, and code with 
their GenePattern analyses to create "notebooks" that can be edited, shared, and published. 
GenePattern Notebooks are built on the [Jupyter](https://jupyter.org/) environment 
and extend it so that users can take advantage of its ease of use and ability to encapsulate 
an entire scientific research narrative, without the need to write code.

> ### **Looking for JupyterLab support?**
> **JupyterLab support in is currently in beta. You can find it in its own branch. [Just click here!](https://github.com/genepattern/nbtools/tree/lab)**

# Installation

Full installation instructions for casual use are detailed on the 
[GenePattern Notebook website](https://gpnotebook-website-docs.readthedocs.io/en/latest/local-installation/). Users should 
also consider the [GenePattern Notebook Repository](https://notebook.genepattern.org), which 
provides an install-free cloud deployment of the GenePattern Notebook environment.

## Development Install

The installation instructions below are intended for developers who want to install the 
project from PIP or GitHub for the purposes of software development.

### Install Python

In order to get the GenePattern Notebook working you will first need to install a compatible 
version of Python. This means you will need Python 3.6+. We recommend using the 
[Anaconda](https://www.anaconda.com/download/#macos) Python distribution. This is 
a scientific version of Python that ships with many of the most popular Python packages for 
science, math and data analysis (ex: NumPy, SciPy, Pandas, Matplotlib, IPython, etc.).

**Note for Mac Users:** Mac comes with Python, but you may need to install a newer version, 
as older versions of macOS ship with Python 2.

### Install GenePattern Notebook from GitHub

Copy the contents of genepattern-notebook/extension to your development computer and ensure 
that the resulting directory if on your Python path. To test this, open Python and try to 
*import genepattern*. If this is successful, you have a copy of the extension available.

If you don't already have Jupyter installed, you can install it from PIP by running:

> pip install jupyter

From here go to the "Load the GenePattern extension" step below.

### Install GenePattern Notebook from PIP or Conda

The easiest way to install GenePattern Notebook is through either PIP or conda. It can be installed by 
executing one of the following commands:

> pip install genepattern-notebook

*or*

> conda install -c genepattern genepattern-notebook

### Load the GenePattern extension

In Jupyter 5.2 and earlier, before you can use the GenePattern extension for the very first time, 
you need to enable it by running command lines below. 

In Jupyter 5.3 and later this is automatic and there is no need to run these commands.

> jupyter nbextension enable --py widgetsnbextension
>
> jupyter nbextension install --py nbtools
>
> jupyter nbextension enable --py nbtools
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

> pip install --upgrade --no-deps genepattern-notebook

# Related Repositories

The following GitHub repositories contain code or other data related to the GenePattern 
Notebook environment.

* [genepattern-python](https://github.com/genepattern/genepattern-python): The GenePattern 
    Library allows for programmatic access to GenePattern from Python, and is used by 
    GenePattern Notebook behind the scenes.
* [nbtool-manager](https://github.com/genepattern/nbtool-manager): The Notebook Tool Manager 
    is a tool-agnostic interface and registry for searching, browsing and launching available 
    notebook tools in a Jupyter environment.
* [jupyter-wysiwyg](https://github.com/genepattern/jupyter-wysiwyg): A WYSIWYG editor for 
    markdown cells.
* [example-notebooks](https://github.com/genepattern/): A repository of example notebooks that 
    demonstrate functionality or analysis techniques in the GenePattern Notebook environment. 
* [notebook-docker](https://github.com/genepattern/notebook-docker): A collection of Dockerfiles 
    which are used to build containers encapsulating the GenePattern Notebook environment.
* [notebook-repository](https://github.com/genepattern/notebook-repository): Scripts, services 
    and other infrastructure used in the operation of the GenePattern Notebook Repository.

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

# Code of Conduct

We are dedicated to providing a harassment-free experience for all members of the GenePattern community, regardless of gender, gender identity and expression, sexual orientation, disability, physical appearance, body size, age, race, or religion. We do not tolerate harassment of participants in any form. This code of conduct applies to all GenePattern spaces, including the Google Group, our Git repositories, and our social media accounts, both online and off. Anyone who violates this code of conduct may be sanctioned or expelled from these spaces at the discretion of the GenePattern team.

For more details, see our [Code of Conduct](https://github.com/genepattern/genepattern-notebook/blob/master/Code_of_Conduct.md).

