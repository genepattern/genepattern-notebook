This is a Docker image intended for use with JupyterHub and GenePattern Notebooks. The code here is based 
off of the [jupyter/singleuser](https://github.com/jupyter/dockerspawner/tree/master/singleuser) code.

## Container Use

To make us of this container you will first need to build it from the Dockerfile. You will then need to 
configure JupyterHub to use DockerSpawner and configure DockerSpawner o use this container rather than 
the default jupyter/singleuser container. 

The former can be accomplished by editing jupyterhub_config.py as per the 
[instructions here](https://github.com/jupyter/dockerspawner).

For the latter to be accomplished, one must manually edit dockerspawner.py. Basically just replace 
instances of the string "jupyter/singleuser" with the name of the Docker container you wish to use.

### Notes

Since Docker requires root to run, and since JupyterHub needs permissions to run new Docker containers,
to use JupyterHub with DockerSpawner, you must run JupyterHub using sudo.

Accessing the shell inside a Docker container can be accomplished by running:

> sudo docker exec -it <CONTAINER_ID> bash

