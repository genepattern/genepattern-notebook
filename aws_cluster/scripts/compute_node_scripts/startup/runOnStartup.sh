#!/bin/sh

#export HUB_LOCAL_IP=172.31.59.165
export HUB_LOCAL_IP=172.31.9.58


export NODE_LOCAL_IP=$(ip route get 8.8.8.8 | awk 'NR==1 {print $NF}')
export DOCKER_OPTS="-H tcp://0.0.0.0:2375 -H unix:///var/run/docker.sock"

# Remove all containers
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)

service docker stop
rm /etc/docker/key.json
service docker start


# Start the consul
sudo -u ubuntu docker run --restart=always -d swarm join --advertise=$NODE_LOCAL_IP:2375 consul://$HUB_LOCAL_IP:8500