# How to Deploy to PyPi Test

1. Make sure setup.py and gp.py/__version__ are updated
2. cd to *genepattern-notebook/profile/extensions* directory
3. Run *python setup.py register -r pypitest* to register
4. Upload via *python setup.py sdist upload -r pypitest*
5. If the upload fails go to https://testpypi.python.org/pypi and manually upload dist/genepattern-notebook-*.tar.gz
6. Test the deploy by uninstalling and reinstalling the package: *sudo pip uninstall genepattern-notebook* and *sudo pip install -i https://testpypi.python.org/pypi genepattern-notebook* .

# How to Deploy to Production PyPi

1. First deploy to test and ensure everything is working correctly (see above).
2. cd to *genepattern-notebook/profile/extensions* directory
3. Run *python setup.py register* to register
4. Upload via *python setup.py sdist upload*
5. If the upload fails go to https://pypi.python.org/pypi and manually upload dist/genepattern-notebook-*.tar.gz
6. Test the deploy by uninstalling and reinstalling the package: *sudo pip uninstall genepattern-notebook* and *sudo pip install genepattern-notebook* .