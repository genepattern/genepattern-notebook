# Deploying JupyterHub

1. Start an Ubuntu instance
2. apt-get install docker, nodejs, pip, npm
3. pip install jupyterhub
4. npm install configurable-http-proxy
5. Make sure node points to nodejs, link to nodejs if it does not
6. Copy dockerspawner.py, gpauthenticator.py, jupyterhub_config.py
7. Edit jupyterhub_config.py to make sure it has the correct directory paths
8. If using AWS, make sure to enable traffic on the right ports in the security group
9. Pull the docker container that will be used for each user. For example: jupyter/singleuser
10. Start jupyterhub: sudo jupyterhub --port=80


### Who's using port 8000?
> sudo netstat -tulpn | grep :8000