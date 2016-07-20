# Build as genepattern/genepattern-notebook-jupyterhub
# Run with the DockerSpawner in JupyterHub

FROM jupyter/scipy-notebook

MAINTAINER Thorin Tabor <thorin@broadinstitute.org>

EXPOSE 8888

USER root

# fetch juptyerhub-singleuser entrypoint
RUN wget -q https://raw.githubusercontent.com/genepattern/genepattern-notebook/master/Docker/genepattern-notebook-jupyterhub/singleuser.sh -O /usr/local/bin/singleuser.sh
RUN chmod 755 /usr/local/bin/singleuser.sh

# Install the missing Qt4 API (used by matplotlib)
RUN apt-get update && apt-get install -y python-qt4

# Install GenePattern Notebook
RUN pip install genepattern-notebook jupyter-wysiwyg

# Enable the extension
RUN jupyter nbextension enable --py widgetsnbextension
RUN jupyter nbextension install --py genepattern
RUN jupyter nbextension enable --py genepattern
RUN jupyter serverextension enable --py genepattern
RUN jupyter nbextension install --py jupyter_wysiwyg
RUN jupyter nbextension enable --py jupyter_wysiwyg

USER jovyan

ADD singleuser.sh /srv/singleuser/singleuser.sh
# smoke test that it's importable at least
# RUN sh /srv/singleuser/singleuser.sh -h
CMD ["sh", "/srv/singleuser/singleuser.sh"]