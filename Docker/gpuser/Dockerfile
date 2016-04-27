# Build as genepattern/gpuser
# Run with the DockerSpawner in JupyterHub

FROM jupyter/scipy-notebook

MAINTAINER Thorin Tabor <thorin@broadinstitute.org>

# fetch juptyerhub-singleuser entrypoint
ADD https://raw.githubusercontent.com/genepattern/genepattern-notebook/develop/Docker/gpuser/singleuser.sh /usr/local/bin/jupyterhub-singleuser
RUN chmod 755 /usr/local/bin/jupyterhub-singleuser

# Install GenePattern Notebook
RUN pip install genepattern-notebook

# Enable the extension
RUN jupyter nbextension enable --py widgetsnbextension
RUN jupyter nbextension install --py genepattern
RUN jupyter nbextension enable --py genepattern
RUN jupyter serverextension enable --py genepattern

ADD singleuser.sh /srv/singleuser/singleuser.sh
CMD ["sh", "/srv/singleuser/singleuser.sh"]