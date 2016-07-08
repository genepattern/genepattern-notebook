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
> GENEPATTERN_URL = "https://genepattern.broadinstitute.org/gp"
5. Put the gpauthenticator.py file on your Python path
6. Start your JupyterHub server using the config
> sudo nohup jupyterhub --ip=0.0.0.0 --port=8000 --config=/path/to/jupyterhub_config.py &

## Setting up the spawner

1. Make sure that you have Docker installed on your system
2. Download the genepattern/genepattern-notebook-jupyterhub image
> docker pull genepattern/genepattern-notebook-jupyterhub

3. Install DockerSpawner on your Python path
4. Edit dockerspawner.py line 74 to point to genepattern/genepattern-notebook-jupyterhub
5. Edit the generated config to set DockerSpawner as the spawner
(see the example config file)
6. Depending on your setup, you may need to edit singleuser.sh inside the base container 
to point to ip=0.0.0.0 

### Getting nano to work inside Docker

This fixes a weird Docker bug where nano won't work when inside a Docker container. 
This is included here for easy reference.

> export TERM=xterm

## Writing to a log file

By default JupyterHub doesn't write its log to a file. I log file can be set by editing 
the config to have the following lines:

> c.JupyterHub.extra_log_file = '/path/to/log/jupyterhub.log'

## Port forwarding

By default JupyterHub runs on port 8000. You can forward port 80 to 8000 by executing the 
following on the command line:

> sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 8000

## Location of JupyterHub install

JupyterHub code typically installed at:

> /usr/lib/python3.4/site-packages/jupyterhub

JupyterHub templates installed at:

> /usr/share/jupyter/hub

## Editing JupyterHub templates

JupyterHub uses jinja template engine. Stores templates at their own path.

The location of these templates can be set in the JupyterHub config file:

> c.JupyterHub.data_files_path = '/path/to/directory'
> c.JupyterHub.template_paths = ['/list/of/paths']