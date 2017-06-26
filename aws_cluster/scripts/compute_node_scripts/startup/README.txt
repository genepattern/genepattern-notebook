#
# execOnStartup.sh is  set as an init.d script by placing in /etc/init.d, chown it to root, chmod 755 it, then
# sudo insserv execOnStartup.sh
#
# this is saved into the image used for the autoscale nodes for the jupyterhub. The execOnStartup
# then calls the runOnStartup script from the EFS mount that execOnStartup did.  This allows the startup behavior
# to be changed for the nodes by altering the runOnStartup script that is in the EFS drive, but it is limited to having a
# single version of that script for a single AMI.  If you want to do something similar for a differnt purpose you may want
# to change the execOnStartup to either use a different EFS or to use a different  path to a different script to be called
# at startup.
#
#  For the compute nodes they also have cron setup to self-terminate if they are running no kernels and there are >1
# nodes in the autoscale group they belong to.  This is similarly run from the efs drive to permit it to be changed
# or debugged as necessary

