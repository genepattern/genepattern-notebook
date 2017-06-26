#!/bin/sh

#
# set as an init.d script by placing in /etc/init.d, chown it to root, chmod 755 it, then
# sudo insserv execOnStartup.sh
#


mount -t nfs4 -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2 $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone).fs-ea588aa3.efs.us-east-1.amazonaws.com:/ ~thorin/shared

chmod a+rwx  ~thorin/shared

ln -s ~thorin/shared shared

# run any other startup script we add later, from the EFS dir
if [ -f ~ubuntu/shared/scripts/compute_node_scripts/startup/runOnStartup.sh ]; then
  echo "extra startup file exists"
  ~ubuntu/shared/scripts/compute_node_scripts/startup/runOnStartup.sh
fi


