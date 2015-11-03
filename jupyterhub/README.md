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
> import gpauthenticator
>
> c.JupyterHub.authenticator_class = gpauthenticator.GenePatternAuthenticator
4. Edit gpauthenticator.py to point to your GenePattern server of choice
> url = url_concat("http://127.0.0.1:8080/gp/rest/v1/oauth2/token", params)
5. Put the gpauthenticator.py file on your Python path
6. Start your JupyterHub server using the config
> jupyterhub --config=/path/to/the/config/file

## Getting nano to work inside Docker
This fixes a weird Docker bug where nano won't work when inside a Docker container. 
This is included here for easy reference.

> export TERM=xterm