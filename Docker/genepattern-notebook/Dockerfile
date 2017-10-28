# Installs Jupyter Notebook and IPython kernel from the current branch
# Another Docker container should inherit with `FROM jupyter/notebook`
# to run actual services.

FROM jupyter/scipy-notebook

MAINTAINER Thorin Tabor <tmtabor@cloud.ucsd.edu>

EXPOSE 8888

USER root

# Install the missing Qt4 API (used by matplotlib)
RUN apt-get update && apt-get install -y python-qt4

# Install R and RPY2
RUN sudo apt-get update
RUN sudo apt-get install r-base r-base-dev -y
RUN pip install rpy2==2.8.5
RUN jupyter serverextension enable --py rpy2.ipython

# Install the GenePattern Notebook environment
RUN pip install nbtools genepattern-python genepattern-notebook jupyter-wysiwyg

# Enable the extension
RUN jupyter nbextension enable --py widgetsnbextension

RUN jupyter nbextension install --py nbtools
RUN jupyter nbextension enable --py nbtools
RUN jupyter serverextension enable --py nbtools

RUN jupyter nbextension install --py genepattern
RUN jupyter nbextension enable --py genepattern
RUN jupyter serverextension enable --py genepattern

RUN jupyter nbextension install --py jupyter_wysiwyg
RUN jupyter nbextension enable --py jupyter_wysiwyg

USER $NB_USER
