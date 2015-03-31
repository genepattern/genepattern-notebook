GenePatternNotebook
===================

Some notes on setup of GenePattern Notebook environment.

# Installation

## Install Python

Apple includes an older version of python with MAC OS X.  You will want to replace
this with the most current version of Python 2.7 or Python 3.x

Updating python would have been straightforward if I had access to the
Admin account on my laptop.  However, even though my user account had
admin privileges, I ran into all sorts of issues when I attempted to
update my python installation using homebrew (the recommended
approach).   In particular, I did not have Homebrew installed on my
system and I did not have the necessary privileges to install
homebrew.  See
http://docs.python-guide.org/en/latest/starting/install/osx/ if you
are interested.  Bottom line was that I could not get Homebrew installed on my 
laptop due to some permissions issue that running sudo did not address.

I ended up installing the Anaconda Distribution of python from continuum analytics
(see http://continuum.io/downloads).  Choose the Python 2.7 graphical
installer for Mac OS X - 64 bit.  That seemed to do the trick.
Another benefit of installing the Anaconda Distribution is that it is
a scientific distribution of python which includes a very large
number of the most popular Python packages for science, math and data
analysis (e.g., NumPy, SciPy, Pandas, Matplotlib, IPython, etc.) 

## Install PIP

Install PIP if not already installed (may come with Anaconda installation); see https://pip.pypa.io/en/latest/installing.html

## Install IPython Notebook
(3) Install IPython Notebook - see http://ipython.org/install.html
> pip install "ipython[notebook]"

(4) Install jsonpickle


## Install JSONPickle (RNA-Seq Notebook Only)
Needed for RNA-Seq notebook document - used to serialization of session state

>pip install -U jsonpickle

## Install GenePattern Notebook

(5) clone onto your local system the broadinstitute/GenePatternNotebook private repository, available on GitHub.

Check to see if git client tools are installed on your system.  If
not, go to Github.com to see instructions for getting started with Git
("Set up Git").

You must be a member of the GenePattern Admin team to have access to
the GenePatternNotebook private repository.   Current members are:
Michael, Helga, Peter, Bobbie, Marc-Danie, Thorin, Chet, Ted.

(6) Copy files to your ~/.ipython folder

From the cloned repository (whose root folder is GenePatternNotebook):

- copy GenePatternNotebook/ipython/extensions/* to
  ~/.ipython/extensions/

- copy GenePatternNotebook/ipython/profile_default/status/custom/* to
  ~/.ipython/profile_default/status/custom/*

Before doing the second copy, you may want to first create backup
copies of the original custom.css and custom.js files, although the
original files are essentially contentless.

## Launch IPython

Launch the IPython notebook kernel by issuing the following command at
the terminal:

> ipython notebook

This will start up the notebook kernel from and launch a web client
connecting to that kernel.  Navigate into your cloned repository to
the document GenePatternNotebook/NotebookDocuments/smoketest.ipynb

Click on this document to bring it up in the Notebook client.  You can
now run each cell individually or run them all sequentially by
selecting Run All in the Cell dropdown menu.

