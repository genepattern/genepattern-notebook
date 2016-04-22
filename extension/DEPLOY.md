# How to Deploy to PyPi Test

1. Make sure setup.py and genepattern.__version__ are updated.
2. Navigate to the correct directory:
> cd genepattern-notebook/extension
3. Run the following to register the deploy with the test PyPi:
> python setup.py register -r pypitest
4. Upload the files by running:
> python setup.py sdist upload -r pypitest
5. If the upload fails go to [https://testpypi.python.org/pypi](https://testpypi.python.org/pypi) and manually upload dist/genepattern-notebook-*.tar.gz.
6. Test the deploy by uninstalling and reinstalling the package: 
> sudo pip uninstall genepattern-notebook;
> sudo pip install -i https://testpypi.python.org/pypi genepattern-notebook

# How to Deploy to Production PyPi

1. First deploy to test and ensure everything is working correctly (see above).
2. Navigate to the correct directory:
> cd genepattern-notebook/extension
3. Run the following to register the deploy with PyPi:
> python setup.py register
4. Upload the files by running:
> python setup.py sdist upload
5. If the upload fails go to [https://pypi.python.org/pypi](https://pypi.python.org/pypi) and manually upload dist/genepattern-notebook-*.tar.gz.
6. Test the deploy by uninstalling and reinstalling the package: 
> sudo pip uninstall genepattern-notebook;
> sudo pip install genepattern-notebook