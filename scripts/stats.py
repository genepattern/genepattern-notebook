#!/usr/bin/env python

import commands
import smtplib
import datetime
import sys
import shutil
import base64
import json
from email.MIMEMultipart import MIMEMultipart
from email.MIMEText import MIMEText

if sys.version_info.major > 2:
    import urllib.request as urllib2
else:
    import urllib2

# Environment configuration
x = "???"
home_dir = '/home/user/'
sudo_req = 'sudo '  # Make blank if sudo is not required
test_email = 'user@broadinstitute.org'
admin_login = 'username:password'

# Handle arguments
test_run = True if (len(sys.argv) >= 2 and sys.argv[1] == '--test') else False


def _poll_docker(image):
    """
    Poll DockerHub for stats on the GenePattern images
    :param image:
    :return:
    """
    request = urllib2.Request('https://registry.hub.docker.com/v2/repositories/genepattern/' + image + '/')
    response = urllib2.urlopen(request)
    json_str = response.read().decode('utf-8')
    image_json = json.loads(json_str)
    return {'stars': image_json['star_count'], 'pulls': image_json['pull_count']}


def get_docker():
    """
    Gather all the available Docker stats
    :return:
    """
    docker = {}
    docker['notebook'] = _poll_docker('genepattern-notebook')
    docker['jupyterhub'] = _poll_docker('genepattern-notebook-jupyterhub')
    return docker


def _poll_pypi(package):
    """
    Poll PyPI for stats on the GenePattern packages
    :param package:
    :return:
    """
    request = urllib2.Request('https://pypi.python.org/pypi/' + package + '/json')
    response = urllib2.urlopen(request)
    json_str = response.read().decode('utf-8')
    package_json = json.loads(json_str)

    # Total the downloads
    total = 0
    for release in package_json['releases']:
        total += package_json['releases'][release][0]['downloads']

    return {'weekly': package_json['info']['downloads']['last_week'], 'total': total}


def get_pypi():
    """
    Assemble the available PyPI stats
    :return:
    """
    pypi = {}
    pypi['notebook'] = _poll_pypi('genepattern-notebook')
    pypi['python'] = _poll_pypi('genepattern-python')
    pypi['wysiwyg'] = _poll_pypi('jupyter-wysiwyg')
    return pypi


def _poll_genepattern(gp_url):
    """
    Poll the provided GenePattern server for the number of GenePattern Notebook jobs launched in the last week

    :param gp_url: The URL of the GenePattern server, not including /gp...
    :return: Return the number of GenePattern Notebook jobs launched on this server
    """
    request = urllib2.Request(gp_url + '/gp/rest/v1/jobs/?tag=GenePattern%20Notebook&pageSize=1000&includeChildren=true&includeOutputFiles=false&includePermissions=false')
    base64string = base64.encodestring(bytearray(admin_login, 'utf-8')).decode('utf-8').replace('\n', '')
    request.add_header("Authorization", "Basic %s" % base64string)
    response = urllib2.urlopen(request)
    json_str = response.read().decode('utf-8')
    jobs_json = json.loads(json_str)
    count = 0

    for job in jobs_json['items']:
        timestamp = job['dateSubmitted']
        date = datetime.datetime.strptime(timestamp.split('T')[0], '%Y-%m-%d')
        if date >= datetime.datetime.now() - datetime.timedelta(days=8):
            count += 1
        if 'children' in job:
            child_count = len(job['children']['items'])
            count += child_count

    return count


def get_total_jobs(weekly_jobs):
    # Read the file of total jobs
    jobs_file = file(home_dir + 'jobs.lst', 'r')
    jobs_list = jobs_file.readlines()
    jobs_list = [j.strip() for j in jobs_list]  # Clean new lines

    # Create the total jobs object
    total_jobs = {}
    total_jobs['prod'] = int(jobs_list[0]) + weekly_jobs['prod']
    total_jobs['broad'] = int(jobs_list[1]) + weekly_jobs['broad']
    total_jobs['iu'] = int(jobs_list[2]) + weekly_jobs['iu']

    # Write the new totals back to the file
    if not test_run:
        jobs_file = file(home_dir + 'jobs.lst', 'w')
        jobs_file.write("%s\n" % total_jobs['prod'])
        jobs_file.write("%s\n" % total_jobs['broad'])
        jobs_file.write("%s\n" % total_jobs['iu'])
        jobs_file.close()

    return total_jobs


def get_weekly_jobs():
    """
    Assemble the number of GenePattern Notebook jobs launched on each server
    """
    weekly_jobs = {}
    weekly_jobs['prod'] = _poll_genepattern('https://genepattern.broadinstitute.org')
    weekly_jobs['broad'] = _poll_genepattern('https://gpbroad.broadinstitute.org')
    weekly_jobs['iu'] = _poll_genepattern('http://gp.indiana.edu')
    return weekly_jobs


def get_disk_usage():
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
        cmd_out = commands.getstatusoutput(sudo_req + 'docker exec ' + d + " find . -type f -not -path '*/\.*' -mtime -7 -name *.ipynb | wc -l")[1]
        user_week = int(cmd_out.strip())
        nb_count['week'] += user_week

        cmd_out = commands.getstatusoutput(sudo_req + 'docker exec ' + d + " find . -type f -not -path '*/\.*' -name *.ipynb | wc -l")[1]
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
    user_list = [u.strip() for u in user_list]  # Clean new lines

    # Gather a list of all running containers
    cmd_out = commands.getstatusoutput(sudo_req + 'docker ps -a | grep "jupyter-"')[1]
    cmd_lines = cmd_out.split('\n')
    containers = []
    for line in cmd_lines:
        cmd_parts = line.split()
        last_part = cmd_parts[len(cmd_parts)-1]
        last_halves = last_part.split("-")
        if len(last_halves) < 2:
            continue  # Ignore container names we cannot parse
        containers.append(last_halves[1])

    # Get the sets of users
    users['returning'] = len(set(user_list) & set(containers))
    users['new'] = len(set(containers) - set(user_list))
    users['total'] = len(set(user_list) | set(containers))

    # Update the users file
    if not test_run:
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
    cmd_out = commands.getstatusoutput('cat ' + home_dir + 'nohup.out | grep -c "User logged in"')[1]
    logins['week'] = int(cmd_out.strip())

    # Read the total number of logins
    login_file = file(home_dir + 'logins.log', 'r')
    total_count = login_file.read().strip()
    if len(total_count) == 0:  # Handle an empty file
        total_count = 0
    else:
        total_count = int(total_count)

    # Add logins and update file
    total_count += logins['week']
    logins['total'] = total_count
    if not test_run:
        login_file = file(home_dir + 'logins.log', 'w')
        login_file.write(str(total_count))
        login_file.close()

    # Move the log to backup
    if not test_run:
        shutil.copyfileobj(file(home_dir + 'nohup.out', 'r'), file(home_dir + 'nohup.out.old', 'w'))
        open(home_dir + 'nohup.out', 'w').close()

    return logins


def send_mail(users, logins, disk, nb_count, weekly_jobs, docker, pypi, total_jobs):
    """
    Send the weekly report in an email
    :param disk:
    :return:
    """
    today = str(datetime.date.today())
    fromaddr = "gp-dev@broadinstitute.org" if not test_run else test_email
    toaddr = "gp-dev@broadinstitute.org" if not test_run else test_email
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
                            <h2>Notebook Repository</h2>
                            <h3>Total repository users</h3>
                            <table border="1">
                                <tr>
                                    <th>Users</th>
                                    <th>#</th>
                                </tr>
                                <tr>
                                    <td>Total</td>
                                    <td>%s</td>
                                </tr>
                                <tr>
                                    <td>Returning</td>
                                    <td>%s</td>
                                </tr>
                                <tr>
                                    <td>New</td>
                                    <td>%s</td>
                                </tr>
                            </table>

                            <h3>Repository user logins</h3>
                            <table border="1">
                                <tr>
                                    <th>Logins</th>
                                    <th>#</th>
                                </tr>
                                <tr>
                                    <td>Total</td>
                                    <td>%s</td>
                                </tr>
                                <tr>
                                    <td>This week</td>
                                    <td>%s</td>
                                </tr>
                            </table>

                            <h3>Repository notebook files created</h3>
                            <table border="1">
                                <tr>
                                    <th>Notebooks</th>
                                    <th>#</th>
                                </tr>
                                <tr>
                                    <td>Total</td>
                                    <td>%s</td>
                                </tr>
                                <tr>
                                    <td>Modified</td>
                                    <td>%s</td>
                                </tr>
                            </table>

                            <h3>Repository disk space used</h3>
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
                                </tr>
                                <tr>
                                    <td>Docker Disk</td>
                                    <td>%s</td>
                                    <td>%s</td>
                                    <td>%s</td>
                                </tr>
                            </table>
                        </td>
                        <td width="50%%" valign="top">
                            <h2>Notebook Extension</h2>
                            <h3>Total notebook jobs run</h3>
                            <table border="1">
                                <tr>
                                    <th>Server</th>
                                    <th>#</th>
                                </tr>
                                <tr>
                                    <td>GP Prod</td>
                                    <td>%s</td>
                                </tr>
                                <tr>
                                    <td>GP Broad</td>
                                    <td>%s</td>
                                </tr>
                                <tr>
                                    <td>GP @ IU</td>
                                    <td>%s</td>
                                </tr>
                            </table>

                            <h3>Notebook jobs run this week</h3>
                            <table border="1">
                                <tr>
                                    <th>Server</th>
                                    <th>#</th>
                                </tr>
                                <tr>
                                    <td>GP Prod</td>
                                    <td>%s</td>
                                </tr>
                                <tr>
                                    <td>GP Broad</td>
                                    <td>%s</td>
                                </tr>
                                <tr>
                                    <td>GP @ IU</td>
                                    <td>%s</td>
                                </tr>
                            </table>

                            <h3>DockerHub stats</h3>
                            <table border="1">
                                <tr>
                                    <th>Image</th>
                                    <th>Stars</th>
                                    <th>Pulls</th>
                                </tr>
                                <tr>
                                    <td>gp-notebook</td>
                                    <td>%s</td>
                                    <td>%s</td>
                                </tr>
                                <tr>
                                    <td>gp-jupyterhub</td>
                                    <td>%s</td>
                                    <td>%s</td>
                                </tr>
                            </table>

                            <h3>PyPI downloads</h3>
                            <table border="1">
                                <tr>
                                    <th>Package</th>
                                    <th>Weekly</th>
                                    <th>Total</th>
                                </tr>
                                <tr>
                                    <td>genepattern-notebook</td>
                                    <td>%s</td>
                                    <td>%s</td>
                                </tr>
                                <tr>
                                    <td>genepattern-python</td>
                                    <td>%s</td>
                                    <td>%s</td>
                                </tr>
                                <tr>
                                    <td>jupyter-wysiwyg</td>
                                    <td>%s</td>
                                    <td>%s</td>
                                </tr>
                            </table>
                        </td>
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

        # Notebook files
        nb_count['total'],
        nb_count['week'],

        # Disk Usage
        disk["gen_disk_used"],
        disk["gen_disk_total"],
        disk["gen_disk_percent"],
        disk["docker_disk_used"],
        disk["docker_disk_total"],
        disk["docker_disk_percent"],

        # Total jobs
        total_jobs['prod'], total_jobs['broad'], total_jobs['iu'],

        # Weekly jobs
        weekly_jobs['prod'], weekly_jobs['broad'], weekly_jobs['iu'],

        # Docker stats
        docker['notebook']['stars'], docker['notebook']['pulls'],
        docker['jupyterhub']['stars'], docker['jupyterhub']['pulls'],

        # PyPI stats
        pypi['notebook']['weekly'], pypi['notebook']['total'],
        pypi['python']['weekly'], pypi['python']['total'],
        pypi['wysiwyg']['weekly'], pypi['wysiwyg']['total'])

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
weekly_jobs = get_weekly_jobs()
docker = get_docker()
pypi = get_pypi()
total_jobs = get_total_jobs(weekly_jobs)
send_mail(users, logins, disk, nb_count, weekly_jobs, docker, pypi, total_jobs)
