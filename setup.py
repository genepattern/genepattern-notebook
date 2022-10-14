from setuptools import setup


__version__ = '22.10.0b1'


with open('README.md') as f:
    long_description = f.read()


setup(name='genepattern-notebook',
      packages=['genepattern'],
      version=__version__,
      description='GenePattern Notebook extension for JupyterLab',
      long_description=long_description,
      long_description_content_type="text/markdown",
      license='BSD',
      author='Thorin Tabor',
      author_email='tmtabor@cloud.ucsd.edu',
      url='https://github.com/genepattern/genepattern-notebook',
      download_url='https://github.com/genepattern/genepattern-notebook/archive/' + __version__ + '.tar.gz',
      keywords=['genepattern', 'genomics', 'bioinformatics', 'ipython', 'jupyter'],
      classifiers=[
          'Development Status :: 5 - Production/Stable',
          'Intended Audience :: Science/Research',
          'Intended Audience :: Developers',
          'Topic :: Scientific/Engineering :: Bio-Informatics',
          'License :: OSI Approved :: BSD License',
          'Programming Language :: Python :: 3.6',
          'Programming Language :: Python :: 3.7',
          'Programming Language :: Python :: 3.8',
          'Programming Language :: Python :: 3.9',
          'Framework :: Jupyter',
      ],
      install_requires=[
          'genepattern-python>=1.4.2',
          'nbtools>=20',
          'notebook>=5.0.0',
          'ipywidgets>=7.0.0',
          'pandas',
      ],
      data_files=[("share/jupyter/nbtools", ["nbtools/genepattern.json"])],
      normalize_version=False,
      )
