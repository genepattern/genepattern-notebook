from distutils.core import setup

setup(name='genepattern-notebook',
    py_modules=['genepattern'],
    version='0.4.7',
    description='GenePattern Notebook extension for Jupyter',
    license='BSD',
    author='Thorin Tabor',
    author_email='tabor@broadinstitute.org',
    url='https://github.com/genepattern/genepattern-notebook',
    download_url='https://github.com/genepattern/genepattern-notebook/archive/0.4.7.tar.gz',
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