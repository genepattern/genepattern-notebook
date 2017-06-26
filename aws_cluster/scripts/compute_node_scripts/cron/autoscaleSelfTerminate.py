import os
import json
from random import randint
from time import sleep

# look at docker and see how many containers are running now
dockerPsCount = int(os.popen("sudo docker ps | grep \"jupyterhub/singleuser\" | wc -l").read())

# find my own EC2 instance ID
myId = os.popen("wget -q -O - http://instance-data/latest/meta-data/instance-id").read()

print("My AWS instance id is " + myId)

# sleep for a random amount of time so that all the instances don't do this check at the same moment
# this is in seconds so sleep for between 0s and 15 min since we call this every 30 min
sleep_period = randint(0,600)
print("Sleeping for " + str(sleep_period) + " seconds to prevent test at same time by all compute nodes")
sleep(sleep_period)


# look for what autoscale group I am in
# and see how many instances it has running in it
os.system("aws autoscaling describe-auto-scaling-groups > /home/ubuntu/temp/autoscalegroups.json ")
x = open('/home/ubuntu/temp/autoscalegroups.json')
d = json.load(x)



# even if 'all' compute nodes decide to shut down, this will only happen if none of them have any kernels
# running and then the autoscale will start a new one immediately and it will see itself as alone in the 
# group and thus stay up

groupInstanceCount = 0;
groupName = ""
desiredCount=1
for group in d['AutoScalingGroups']:
     for instance in group['Instances']:
             if (myId == instance['InstanceId']):
		groupName = group['AutoScalingGroupName']
		desiredCount=group['DesiredCapacity']
                groupInstanceCount = len(group['Instances'])
                print("Found group : " + group['AutoScalingGroupName'] + " with instance count " + str(groupInstanceCount))

# bail out if desired is < than instanceCount.  Probably due to another compute
# being in the process of shutting down node but can't figue out how to tell
# if the group is in cooldown mode
if (desiredCount < groupInstanceCount):
	print("Group has desired " + str(desiredCount) + " but it has " + str(groupInstanceCount) + " instances so we'll quit and check again later in case something else is already shutting down." );
	exit()

# reduce the desired count by 1 but not below 1
desiredCount = max(1, desiredCount -1)

print("My # of kernel  instances: " + str(dockerPsCount))

# if we find 0 kernels locally and we're not the only one in 
# the autoscale group we belong to, shut down the ec2 instance we ar running on
if ((groupInstanceCount > 1) & (dockerPsCount == 0)):
	#asChange = os.popen("aws autoscaling detach-instances --instance-ids "+ myId+" --auto-scaling-group-name " + groupName +  " --should-decrement-desired-capacity ").read()
        #asChange = os.popen("aws autoscaling set-desired-capacity --auto-scaling-group-name " + groupName + " --desired-capacity " + str(desiredCount) + " --honor-cooldown").read()
	#print(asChange)
	asChange = os.popen("aws autoscaling terminate-instance-in-auto-scaling-group --instance-id "+myId+" --should-decrement-desired-capacity").read()	
	print("Deregister returned " + asChange)
	print("Shutting down NOW! -- no jupyter kernels running")
        os.system("sudo shutdown -h now")

else:
        print("leaving this instance running.  Autoscale group instance count = " + str(groupInstanceCount) + " (must be >1 for shutdown) and my kernels = " + str(dockerPsCount) + " (must be 0 for shutdown)")

