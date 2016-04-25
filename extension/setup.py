from distutils.core import setup
import subprocess

setup(name='genepattern-notebook',
    py_modules=['genepattern'],
    version='0.5.0',
    description='GenePattern Notebook extension for Jupyter',
    license='BSD',
    author='Thorin Tabor',
    author_email='tabor@broadinstitute.org',
    url='https://github.com/genepattern/genepattern-notebook',
    download_url='https://github.com/genepattern/genepattern-notebook/archive/0.5.0.tar.gz',
    keywords=['genepattern', 'genomics', 'bioinformatics', 'ipython', 'jupyter'],
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Science/Research',
        'Intended Audience :: Developers',
        'Topic :: Scientific/Engineering :: Bio-Informatics',
        'License :: OSI Approved :: BSD License',
        'Programming Language :: Python',
        'Framework :: IPython',
    ],
    categories=[],
    install_requires=[
        'genepattern-python',
        'jupyter',
        'ipywidgets'
    ],
)

# Enable the required nbextension for ipywidgets
subprocess.call(["jupyter", "nbextension", "enable", "--py", "widgetsnbextension"])

# Enable the GenePattern Notebook extension
subprocess.call(["jupyter", "nbextension", "install", "--py", "genepattern"])
subprocess.call(["jupyter", "nbextension", "enable", "--py", "genepattern"])
subprocess.call(["jupyter", "serverextension", "enable", "--py", "genepattern"])
