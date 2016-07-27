#!/usr/bin/env python

import commands
import smtplib
import datetime
from email.MIMEMultipart import MIMEMultipart
from email.MIMEText import MIMEText

# Environment configuration
x = "???"
home_dir = '/home/user/'
sudo_req = 'sudo ' # Make blank if sudo is not required


def get_disk_usage() :
    """
    Handle determining disk usage on this VM
    """
    disk = {}

    # Get the amount of general disk space used
    cmd_out = commands.getstatusoutput('df -h | grep "/dev/sda1"')[1]
    cmd_parts = cmd_out.split()
    disk["gen_disk_used"] = cmd_parts[2]
    disk["gen_disk_total"] = cmd_parts[3]
    disk["gen_disk_percent"] = cmd_parts[4]

    # Get the amount of Docker disk space used
    cmd_out = commands.getstatusoutput('df -h | grep "/dev/mapper/vg_system-docker"')[1]
    cmd_parts = cmd_out.split()
    disk["docker_disk_used"] = cmd_parts[2]
    disk["docker_disk_total"] = cmd_parts[3]
    disk["docker_disk_percent"] = cmd_parts[4]

    return disk


def get_nb_count():
    """
    Count the number of notebooks on the server
    """

    # Gather a list of all running containers
    cmd_out = commands.getstatusoutput(sudo_req + 'docker ps')[1]
    cmd_lines = cmd_out.split('\n')
    containers = []
    for line in cmd_lines:
        cmd_parts = line.split()
        containers.append(cmd_parts[0])

    # For each container, get the count
    nb_count = {}
    nb_count['week'] = 0
    nb_count['total'] = 0
    for d in containers:
        # Ignore the header
        if d == "CONTAINER":
            continue

        # Weekly query
        cmd_out = commands.getstatusoutput(sudo_req + 'docker exec ' + d + ' find . -type f -not -path \'*\.*\' -mtime -7 -name *.ipynb | wc -l')[1]
        user_week = int(cmd_out.strip())
        nb_count['week'] += user_week

        cmd_out = commands.getstatusoutput(sudo_req + 'docker exec ' + d + ' find . -type f -not -path \'*/\.*\' -name *.ipynb | wc -l')[1]
        user_total = int(cmd_out.strip())
        nb_count['total'] += user_total

    return nb_count


def get_users():
    """
    Counts the number of new and returning users to the GP Notebook Repo
    :return:
    """
    users = {}

    # Read the file of existing users
    user_file = file(home_dir + 'users.lst', 'r')
    user_list = user_file.readlines()
    user_list = [u.strip() for u in user_list] # Clean new lines

    # Gather a list of all running containers
    cmd_out = commands.getstatusoutput(sudo_req + 'docker ps -a | grep "jupyter-"')[1]
    cmd_lines = cmd_out.split('\n')
    containers = []
    for line in cmd_lines:
        cmd_parts = line.split()
        last_part = cmd_parts[len(cmd_parts)-1]
        last_halves = last_part.split("-")
        if len(last_halves) < 2:
            continue # Ignore container names we cannot parse
        containers.append(last_halves[1])

    # Get the sets of users
    users['returning'] = len(set(user_list) & set(containers))
    users['new'] = len(set(containers) - set(user_list))
    users['total'] = len(set(user_list) | set(containers))

    # Update the users file
    user_file = file(home_dir + 'users.lst', 'w')
    for u in (set(user_list) | set(containers)):
        user_file.write("%s\n" % u)
    user_file.close()

    return users


def get_logins():
    """
    Get number of logins this week
    :return:
    """
    logins = {}

    # Count the number of logins in the weekly log
    cmd_out = commands.getstatusoutput('cat ' + home_dir + 'jupyterhub.log | grep -c "User logged in"')[1]
    logins['week'] = int(cmd_out.strip())

    # Read the total number of logins
    login_file = file(home_dir + 'logins.log', 'w+')
    total_count = login_file.read().strip()
    if len(total_count) == 0: # Handle an empty file
        total_count = 0
    else:
        total_count = int(total_count)

    # Add logins and update file
    total_count += logins['week']
    logins['total'] = total_count
    login_file.write(str(total_count))
    login_file.close()

    # Move the log to backup
    commands.getstatusoutput('mv ' + home_dir + 'jupyterhub.log ' + home_dir + 'jupyterhub.log.old')
    commands.getstatusoutput('touch ' + home_dir + 'jupyterhub.log')

    return logins


def send_mail(users, logins, disk, nb_count):
    """
    Send the weekly report in an email
    :param disk:
    :return:
    """
    today = str(datetime.date.today())
    fromaddr = "gp-exec@broadinstitute.org"
    toaddr = "gp-dev@broadinstitute.org"
    msg = MIMEMultipart()
    msg['From'] = fromaddr
    msg['To'] = toaddr
    msg['Subject'] = "GenePattern Notebook Usage Statistics, week ending " + today

    body = """
        <html>
            <body>
                <h1>GenePattern Notebook Report, week ending %s</h1>
                <table width="100%%">
                    <tr>
                        <td width="50%%" valign="top">
                            <h3>Total users</h3>
                            <table border="1">
                                <tr>
                                    <th>Users</th>
                                    <th>#</th>
                                </tr>
                                <tr>
                                    <td>Total</td>
                                    <td>%s</td>
                                <tr>
                                <tr>
                                    <td>Returning</td>
                                    <td>%s</td>
                                <tr>
                                <tr>
                                    <td>New</td>
                                    <td>%s</td>
                                <tr>
                            </table>

                            <h3>User logins</h3>
                            <table border="1">
                                <tr>
                                    <th>Logins</th>
                                    <th>#</th>
                                </tr>
                                <tr>
                                    <td>Total</td>
                                    <td>%s</td>
                                <tr>
                                <tr>
                                    <td>This week</td>
                                    <td>%s</td>
                                <tr>
                            </table>

                            <h3>Disk space used</h3>
                            <table border="1">
                                <tr>
                                    <th>File System</th>
                                    <th>Used</th>
                                    <th>Total</th>
                                    <th>Percent</th>
                                </tr>
                                <tr>
                                    <td>General Disk</td>
                                    <td>%s</td>
                                    <td>%s</td>
                                    <td>%s</td>
                                <tr>
                                <tr>
                                    <td>Docker Disk</td>
                                    <td>%s</td>
                                    <td>%s</td>
                                    <td>%s</td>
                                <tr>
                            </table>
                        </td>
                        <td width="50%%" valign="top">
                            <h3>Total jobs run</h3>
                            <table border="1">
                                <tr>
                                    <th>Server</th>
                                    <th>#</th>
                                </tr>
                                <tr>
                                    <td>GP Prod</td>
                                    <td>%s</td>
                                <tr>
                                <tr>
                                    <td>GP Broad</td>
                                    <td>%s</td>
                                <tr>
                                <tr>
                                    <td>GP @ IU</td>
                                    <td>%s</td>
                                <tr>
                            </table>

                            <h3>Jobs run this week</h3>
                            <table border="1">
                                <tr>
                                    <th>Server</th>
                                    <th>#</th>
                                </tr>
                                <tr>
                                    <td>GP Prod</td>
                                    <td>%s</td>
                                <tr>
                                <tr>
                                    <td>GP Broad</td>
                                    <td>%s</td>
                                <tr>
                                <tr>
                                    <td>GP @ IU</td>
                                    <td>%s</td>
                                <tr>
                            </table>

                            <h3>Notebook files created</h3>
                            <table border="1">
                                <tr>
                                    <th>Notebooks</th>
                                    <th>#</th>
                                </tr>
                                <tr>
                                    <td>Total</td>
                                    <td>%s</td>
                                <tr>
                                <tr>
                                    <td>Modified</td>
                                    <td>%s</td>
                                <tr>
                            </table>
                        <td>
                    </tr>
                </table>
            </body>
        </html>
    """ % (
        # Header
        today,

        # Total users
        users['total'],
        users['returning'],
        users['new'],

        # Weekly logins
        logins['total'],
        logins['week'],

        # Disk Usage
        disk["gen_disk_used"],
        disk["gen_disk_total"],
        disk["gen_disk_percent"],
        disk["docker_disk_used"],
        disk["docker_disk_total"],
        disk["docker_disk_percent"],

        # Total jobs
        x, x, x,

        # Weekly jobs
        x, x, x,

        # Notebook files
        nb_count['total'],
        nb_count['week'])

    msg.attach(MIMEText(body, 'html'))

    server = smtplib.SMTP('localhost', 25)
    text = msg.as_string()
    server.sendmail(fromaddr, toaddr, text)
    server.quit()


# Make necessary calls
disk = get_disk_usage()
nb_count = get_nb_count()
users = get_users()
logins = get_logins()
send_mail(users, logins, disk, nb_count)