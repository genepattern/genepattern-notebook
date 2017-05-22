
The scripts directory (parent of this one) is typically mounted on an aws autoscale node at /home/ubuntu/shared and the crontab
is set up like this

1 * * * * /home/ubuntu/shared/scripts/compute_node_scripts/cron/runAutoscaleShutdownTest.sh 
16 * * * * /home/ubuntu/shared/scripts/compute_node_scripts/cron/runAutoscaleShutdownTest.sh
31 * * * * /home/ubuntu/shared/scripts/compute_node_scripts/cron/runAutoscaleShutdownTest.sh
46 * * * * /home/ubuntu/shared/scripts/compute_node_scripts/cron/runAutoscaleShutdownTest.sh

to check whether to shut down a compute node about every 15 minutes.  It keeps the node around if it is running any kernels, if not, and as long as their is at least one compute node present, it shuts itself down and reduces the cluster's desired count by 1.

For this script to work the AMI has to be launched with an AWS IAM role that allows it to make EC2 changes



