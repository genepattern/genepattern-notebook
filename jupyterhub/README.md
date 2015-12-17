GenePattern Authenticator
===================

* **Requires Python 3.3+**
* **Requires Jupyterhub**
* **Requires Dockerspawner**

This is a custom Authenticator designed for use with Jupyterhub. This authenticator 
authenticates using GenePattern's OAuth2 endpoints. Also included is an example config 
file for using the authenticator.

## Setting up the authenticator

1. Install JupyterHub
2. Generate JupyterHub config by running
> jupyterhub --generate-config

3. Edit the config to declare GenePatternAuthenticator as the authenticator 
(see example jupyterhib_config.py file)
4. Edit gpauthenticator.py to point to your GenePattern server of choice
> GENEPATTERN_URL = "http://genepattern.broadinstitute.org/gp"
5. Put the gpauthenticator.py file on your Python path
6. Start your JupyterHub server using the config
> sudo nohup jupyterhub --ip=0.0.0.0 --port=8000 --config=/path/to/jupyterhub_config.py &

## Getting nano to work inside Docker
This fixes a weird Docker bug where nano won't work when inside a Docker container. 
This is included here for easy reference.

> export TERM=xterm