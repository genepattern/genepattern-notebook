#!/usr/bin/env python

import commands


# Environment configuration
container_home = '/home/jovyan/work/'
backup_home = '/home/user/backup/'
sudo_req = 'sudo '  # Make blank if sudo is not required
user = 'user'
group = 'group'


def get_containers():
    """
    Get a list of container IDs and names
    """

    # Gather a list of all running containers
    print('Gathering list of containers...')
    cmd_out = commands.getstatusoutput(sudo_req + 'docker ps')[1]
    cmd_lines = cmd_out.split('\n')
    containers = []
    for line in cmd_lines:
        cmd_parts = line.split()
        id = cmd_parts[0]
        name = cmd_parts[len(cmd_parts)-1]
        containers.append({'id': id, 'name': name})

    # Remove the heading from the list
    containers.pop(0)

    return containers


def backup_container(container):
    """
    Backup the specificed container
    :param container:
    :return:
    """

    print('Backing up ' + container['name'])

    # Copy directory to host
    commands.getstatusoutput(sudo_req + 'docker cp ' + container['id'] + ':' + container_home +
                             ' ' + backup_home + container['name'] + '/')

    # chown, chgrp files
    commands.getstatusoutput(sudo_req + 'chown -R ' + user + ' ' + backup_home + container['name'])
    commands.getstatusoutput(sudo_req + 'chgrp -R ' + group + ' ' + backup_home + container['name'])


def do_backup():
    """
    Perform a full backup
    :return:
    """

    containers = get_containers()

    for c in containers:
        backup_container(c)

    print('Backup complete')


do_backup()