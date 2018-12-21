# How to Deploy to PyPi Test

1. Make sure setup.py and genepattern.__version__ are updated.
2. Navigate to the correct directory:
> cd genepattern-notebook
3. Upload the files by running:
> python setup.py sdist upload -r pypitest
4. If the upload fails go to [https://testpypi.python.org/pypi](https://testpypi.python.org/pypi) and manually upload dist/genepattern-notebook-*.tar.gz.
5. Test the deploy by uninstalling and reinstalling the package: 
> sudo pip uninstall genepattern-notebook;
> sudo pip install --index-url https://test.pypi.org/simple/ genepattern-notebook

# How to Deploy to Production PyPi

1. First deploy to test and ensure everything is working correctly (see above).
2. Navigate to the correct directory:
> cd genepattern-notebook
3. Upload the files by running:
> python setup.py sdist upload
4. If the upload fails go to [https://pypi.python.org/pypi](https://pypi.python.org/pypi) and manually upload dist/genepattern-notebook-*.tar.gz.
5. Test the deploy by uninstalling and reinstalling the package: 
> sudo pip uninstall genepattern-notebook;
> sudo pip install genepattern-notebook

# How to Deploy to Conda

1. Deploy to Production PyPi
2. Navigate to Anaconda directory
> cd anaconda
3. Run the following, removing the existing directory if necessary:
> conda skeleton pypi genepattern-notebook --version XXX
4. Build the package:
> conda build genepattern-notebook
5. Converting this package to builds for other operating systems can be done as shown below. You will need to upload each
built version using a separate upload command.
> conda convert --platform all ./conda-bld/osx-64/genepattern-notebook-XXX-py36_0.tar.bz2 -o conda-bld/
6. Upload the newly built package:
> anaconda upload ./conda-bld/*/genepattern-notebook-XXX-py36_0.tar.bz2 -u genepattern
7. Log into the [Anaconda website](https://anaconda.org/) to make sure everything is good.