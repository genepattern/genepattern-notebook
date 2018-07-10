import os
from distutils.core import setup


__version__ = '0.7.3'


def get_data_files():
    """
    Get the data files for the package.
    """
    return [
        ('share/jupyter/nbextensions/genepattern', [
            'genepattern/static/index.js',
        ]),
        ('share/jupyter/nbextensions/genepattern/resources',
         ['genepattern/static/resources/' + f for f in os.listdir('genepattern/static/resources')]
         ),
        ('etc/jupyter/nbconfig/notebook.d', ['genepattern.json']),
        # ('share/jupyter/lab/extensions', [
        #     'genepattern/static/index.js',
        #     'genepattern/static/resources',
        # ])
    ]


setup(name='genepattern-notebook',
      packages=['genepattern'],
      version=__version__,
      description='GenePattern Notebook extension for Jupyter',
      license='BSD',
      author='Thorin Tabor',
      author_email='tmtabor@cloud.ucsd.edu',
      url='https://github.com/genepattern/genepattern-notebook',
      download_url='https://github.com/genepattern/genepattern-notebook/archive/' + __version__ + '.tar.gz',
      keywords=['genepattern', 'genomics', 'bioinformatics', 'ipython', 'jupyter'],
      classifiers=[
          'Development Status :: 4 - Beta',
          'Intended Audience :: Science/Research',
          'Intended Audience :: Developers',
          'Topic :: Scientific/Engineering :: Bio-Informatics',
          'License :: OSI Approved :: BSD License',
          'Programming Language :: Python :: 3.5',
          'Programming Language :: Python :: 3.6',
          'Framework :: Jupyter',
      ],
      install_requires=[
          'genepattern-python>=1.4.1',
          'nbtools',
          'jupyter',
          'notebook>=4.2.0',
          'ipywidgets>=7.0.0',
      ],
      package_data={'genepattern': ['static/index.js', 'static/resources/*']},
      data_files=get_data_files(),
      )
