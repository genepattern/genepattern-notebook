# Dockerfile for running nbtools from a pip install

###################################################################################
##  NOTE                                                                         ##
##  This Dockerfile mimics a pip install. The Dockerfile that mimics a dev       ##
##  install has moved to dev.Dockerfile. This prevents an issue where the dev    ##
##  Dockerfile runs out of memory when transpiling JS dependencies on Binder.    ##
###################################################################################

# Pull the latest known good scipy notebook image from the official Jupyter stacks
# Built 02-06-2021
FROM jupyter/scipy-notebook:2021-08-16

MAINTAINER Thorin Tabor <tmtabor@cloud.ucsd.edu>
EXPOSE 8888

#############################################
##  ROOT                                   ##
##      Install npm                        ##
#############################################

USER root

RUN apt-get update && apt-get install -y npm

#############################################
##  $NB_USER                               ##
##      Install python libraries           ##
#############################################

USER $NB_USER

RUN conda install -c conda-forge jupyterlab=3.1.6 voila beautifulsoup4 blas bokeh cloudpickle dask dill h5py hdf5 \
        jedi jinja2 libblas libcurl matplotlib nodejs numba numexpr numpy pandas patsy pickleshare pillow pycurl \
        requests scikit-image scikit-learn scipy seaborn sqlalchemy sqlite statsmodels sympy traitlets vincent && \
    conda install plotly openpyxl sphinx && \
    pip install plotnine bioblend jupyterlab-git py4cytoscape

#############################################
##  $NB_USER                               ##
##      Build and install nbtools          ##
#############################################

RUN pip install ccalnoir cuzcatlan ndex2 hca qgrid ipycytoscape && \
    pip install --pre nbtools && \
    pip install --pre genepattern-notebook && \
#    jupyter nbextension install --py nbtools && \
    jupyter nbextension enable --py nbtools --sys-prefix


#############################################
##  $NB_USER                               ##
##      Install other labextensions        ##
#############################################

RUN jupyter labextension install plotlywidget --no-build && \
    jupyter labextension install jupyterlab-plotly --no-build && \
#    jupyter labextension install jupyterlab-chart-editor --no-build && \  # JupyterLab 3 not yet supported
    jupyter labextension install @aquirdturtle/collapsible_headings && \
#    jupyter labextension install jupyter-scribe --no-build && \  # JupyterLab 3 not yet supported
#    jupyter labextension install jupyterlab-tabular-data-editor --no-build && \  # JupyterLab 3 not yet supported
    printf '\nc.VoilaConfiguration.enable_nbextensions = True' >> /etc/jupyter/jupyter_notebook_config.py

#############################################
##  $NB_USER                               ##
##      Launch lab by default              ##
#############################################

ENV JUPYTER_ENABLE_LAB="true"
ENV TERM xterm