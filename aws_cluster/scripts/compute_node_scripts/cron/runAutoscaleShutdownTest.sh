#!/bin/bash

# crontab lines below
# 55 * * * * /home/ubuntu/scripts/runAS.sh > /home/ubuntu/scripts/log_runAS.txt 2>&1
# 25 * * * * /home/ubuntu/scripts/runAS.sh > /home/ubuntu/scripts/log_runAS.txt 2>&1


. /home/ubuntu/.profile
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games

export INSTANCE_ID="`wget -q -O - http://instance-data/latest/meta-data/instance-id`"
mv /home/ubuntu/shared/scripts/compute_node_scripts/cron/logs/$INSTANCE_ID.runAutoscaleTest.log /home/ubuntu/shared/scripts/compute_node_scripts/cron/logs/$INSTANCE_ID.runAutoscaleTest.log.old

python -u /home/ubuntu/shared/scripts/compute_node_scripts/cron/autoscaleSelfTerminate.py > /home/ubuntu/shared/scripts/compute_node_scripts/cron/logs/$INSTANCE_ID.runAutoscaleTest.log 2>&1
