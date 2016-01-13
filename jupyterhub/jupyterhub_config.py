# Example jupyterhub_config.py file

c = get_config()

# The ip for the proxy API handlers
c.JupyterHub.proxy_api_ip = '0.0.0.0'

# The ip for this process
c.JupyterHub.hub_ip = '0.0.0.0'

# The IP address (or hostname) the single-user server should listen on
c.Spawner.ip = '0.0.0.0'

# Add gpauthenticator.py to the Python path, if necessary
# import sys
# sys.path.append('/home/genepattern/')

# Set GenePatternAuthenticator as the authenticator
import gpauthenticator
c.JupyterHub.authenticator_class = gpauthenticator.GenePatternAuthenticator

# Set DockerSpawner as the spawner
import dockerspawner
c.JupyterHub.spawner_class = dockerspawner.DockerSpawner

# The docker instances need access to the Hub, so the default loopback port doesn't work:
from IPython.utils.localinterfaces import public_ips
c.JupyterHub.hub_ip = public_ips()[0]