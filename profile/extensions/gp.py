__authors__ = ['Thorin Tabor', 'Chet Birger']
__copyright__ = 'Copyright 2015, Broad Institute'
__version__ = '1.0.3'
__status__ = 'Production'

""" GenePattern Python Client

    Compatible with Python 2.7 and Python 3.4
"""


import sys
import urllib
import base64
import json
import time
from contextlib import closing

# Imports requiring compatibility between Python 2 and Python 3
if sys.version_info.major == 2:
    import urllib2
elif sys.version_info.major == 3:
    from urllib import request as urllib2


class GPServer(object):
    """
    Wrapper for data needed to make server calls.

    Wraps the server url, username and password, and provides helper function
    to construct the authorization header.
    """

    def __init__(self, url, username, password):
        self.url = url
        self.username = username
        self.password = password
        self.auth_header = None

        # Handle Basic Auth differences in Python 2 vs. Python 3
        if sys.version_info.major == 2:
            auth_string = base64.encodestring('%s:%s' % (self.username, self.password))[:-1]
            self.auth_header = "Basic %s" % auth_string
        elif sys.version_info.major == 3:
            password_mgr = urllib2.HTTPPasswordMgrWithDefaultRealm()
            password_mgr.add_password(None, url, username, password)
            handler = urllib2.HTTPBasicAuthHandler(password_mgr)
            opener = urllib2.build_opener(handler)
            urllib2.install_opener(opener)

            # auth_string = '%s:%s' % (self.username, self.password)
            # if sys.version_info.major == 3:  # Required for Python 3
            #     auth_string = bytes(auth_string, 'ascii')
            # auth_string = base64.encodestring(auth_string)[:-1]
            # self.auth_header = "Basic %s" % auth_string
        else:
            raise GPException('Version of Python not supported')

    def __str__(self):
        return self.url + ' ' + self.username + ' ' + self.password

    def authorization_header(self):
        return self.auth_header

    def upload_file(self, file_name, file_path):
        """
        Upload a file to a server

        Attempts to upload a local file with path filepath, to the server, where it
        will be named filename.

        Args:
            filename: The name that the uploaded file will be called on the server.
            filepath: The path of the local file to upload.
            server_data: GPServer object used to make the server call.

        Returns:
            A GPFile object that wraps the URI of the uploaded file, or None if the
            upload fails.
        """

        request = urllib2.Request(self.url + '/rest/v1/data/upload/job_input?name=' + file_name)
        if self.authorization_header() is not None:
            request.add_header('Authorization', self.authorization_header())
        request.add_header('User-Agent', 'GenePatternRest')
        data = open(file_path, 'rb').read()

        try:
            response = urllib2.urlopen(request, data)
        except IOError:
            print("authentication failed")
            return None

        if response.getcode() != 201:
            print("file upload failed, status code = %i" % response.getcode())
            return None

        return GPFile(self, response.info().get('Location'))

    def run_job(self, job_spec, wait_until_done=True):
        """
        Runs a job defined by jobspec, optionally non-blocking.

        Takes a GPJobSpec object that defines a request to run a job, and makes the
        request to the server.  By default blocks until the job is finished by
        polling the server, but can also run asynchronously.

        Args:
            jobspec: A GPJobSpec object that contains the data defining the job to be
                run.
            server_data: GPServer object used to make the server call.
            waitUntilDone: Whether to wait until the job is finished before
                returning.

        Returns:
            a GPJob object that refers to the running job on the server.  If called
            synchronously, this object will contain the info associated with the
            completed job.  Otherwise, it will just wrap the URI of the running job.
        """

        # names should be a list of names,
        # values should be a list of **lists** of values
        json_string = json.dumps({'lsid': job_spec.lsid, 'params': job_spec.params})
        if sys.version_info.major == 3:  # Handle conversion to bytes for Python 3
            json_string = bytes(json_string, 'utf-8')
        request = urllib2.Request(self.url + '/rest/v1/jobs')
        if self.authorization_header() is not None:
            request.add_header('Authorization', self.authorization_header())
        request.add_header('Content-Type', 'application/json')
        request.add_header('User-Agent', 'GenePatternRest')
        response = urllib2.urlopen(request, json_string)
        if response.getcode() != 201:
            print(" job POST failed, status code = %i" % response.getcode())
            return None
        data = json.loads(response.read().decode('utf-8'))
        job = GPJob(self, data['jobId'])
        job.get_info()
        if wait_until_done:
            job.wait_until_done()
        return job

    def get_task_list(self):
        request = urllib2.Request(self.url + '/rest/v1/tasks/all.json')
        if self.authorization_header() is not None:
            request.add_header('Authorization', self.authorization_header())
        request.add_header('User-Agent', 'GenePatternRest')
        response = urllib2.urlopen(request)
        response_string = response.read().decode('utf-8')
        category_and_tasks = json.loads(response_string)
        raw_list = category_and_tasks['all_modules']
        task_list = []
        for task_dict in raw_list:
            task = GPTask(self, task_dict['lsid'], task_dict)
            task_list.append(task)
        return task_list

    def wait_until_complete(self, job_list):
        complete = [False] * len(job_list)
        wait = 1
        while not all(complete):
            time.sleep(wait)
            for i, job in enumerate(job_list):
                if not complete[i]:
                    complete[i] = job.is_finished()
                    if not complete[i]:
                        break
            wait = min(wait * 2, 10)


class GPResource(object):
    """
    Base class for resources on a Gene Pattern server.

    Wraps references to resources on a Gene Pattern server, which are all
    defined by a URI.  Subclasses can implement custom logic appropriate for
    that resources such as downloading a file or info for a running or completed
    job.
    """
    uri = None

    def __init__(self, uri):
        self.uri = uri


class GPFile(GPResource):
    """
    A file on a Gene Pattern server.

    Wraps the URI of the file, and contains methods to download the file.
    """
    server_data = None

    def __init__(self, server_data, uri):
        GPResource.__init__(self, uri)
        self.server_data = server_data

    def open(self):
        request = urllib2.Request(self.uri)
        if self.server_data.authorization_header() is not None:
            request.add_header('Authorization', self.server_data.authorization_header())
        request.add_header('User-Agent', 'GenePatternRest')
        return urllib2.urlopen(request)

    def read(self):
        with closing(self.open()) as f:
            data = f.read()
        return data or None

    def get_url(self):
        return self.uri


class GPJob(GPResource):
    """
    A running or completed job on a Gene Pattern server.

    Contains methods to get the info of the job, and to wait on a running job by
    polling the server until the job is completed.
    """
    json = None  # Define the backing JSON string
    info = None
    server_data = None
    task_name = None
    task_lsid = None
    user_id = None
    job_number = None
    status = None
    date_submitted = None
    log_files = None
    output_files = None
    num_output_files = None

    def __init__(self, server_data, uri):
        super(GPJob, self).__init__(server_data.url + "/rest/v1/jobs/" + str(uri))
        self.info = None
        self.server_data = server_data
        self.job_number = uri

    def get_info(self):
        request = urllib2.Request(self.uri)
        if self.server_data.authorization_header() is not None:
            request.add_header('Authorization', self.server_data.authorization_header())
        request.add_header('User-Agent', 'GenePatternRest')
        response = urllib2.urlopen(request)

        self.json = response.read().decode('utf-8')
        self.info = json.loads(self.json)

        self.task_name = self.info['taskName']
        self.task_lsid = self.info['taskLsid']
        self.user_id = self.info['userId']
        self.job_number = int(self.info['jobId'])
        self.status = self.get_status_message()
        self.date_submitted = self.info['dateSubmitted']
        self.log_files = self.info['logFiles']
        self.output_files = self.info['outputFiles']
        self.num_output_files = self.info['numOutputFiles']

        self.status = self.get_status_message()

    def is_finished(self):
        self.get_info()

        if 'status' not in self.info:
            return False
        if 'isFinished' not in self.info['status']:
            return False

        return self.info['status']['isFinished']

    def get_status_message(self):
        # Lazily load info
        if self.info is None:
            self.get_info()

        return self.info['status']['statusMessage']

    def get_output_files(self):
        # Lazily load info
        if self.info is None:
            self.get_info()

        if 'outputFiles' in self.info:
            return [GPFile(self.server_data, f['link']['href']) for f in self.info['outputFiles']]
        else:
            return []

    def wait_until_done(self):
        wait = 1
        while True:
            time.sleep(wait)
            self.get_info()
            if self.info['status']['isFinished']:
                break
            # implements a crude exponential back off
            wait = min(wait * 2, 60)

    def get_job_status_url(self):
        return self.server_data.url + "/pages/index.jsf?jobid=" + self.uri.split("/")[-1]


class GPJobSpec(object):
    """
    Data needed to make a request to perform a job on a Gene Pattern server

    Encapsulates the data needed to make a server call to run a job.  This
    includes the LSID of the job, and the parameters.  Helper methods set
    the LSID and parameters.
    """

    def __init__(self, server_data, lsid):
        self.params = []
        self.lsid = lsid
        self.server_data = server_data

    def set_parameter(self, name, values, group_id=None):
        if not isinstance(values, list):
            values = [values]
        if group_id is None:
            self.params.append({'name': name, 'values': values})
        else:
            self.params.append({'name': name, 'groupId': group_id, 'values': values})


class GPTask(GPResource):
    """Describes a GenePattern task (module or pipeline).

    The constructor retrieves data transfer object (DTO) describing task from GenePattern server.
    The DTO contains general task information (LSID, Category, Description, Version comment),
    a parameter list and a list of initial values.  Class includes getters for each of these
    components.

    """
    json = None  # Define the backing JSON string
    server_data = None
    description = None
    name = None
    documentation = None
    lsid = None
    version = None
    params = None
    dto = None

    submit_json = None
    job_spec = None
    job = None
    job_number = None

    def __init__(self, server_data, name_or_lsid, task_dict=None):
        GPResource.__init__(self, name_or_lsid)
        self.server_data = server_data

        # Initialize descriptive attributes if available
        if task_dict is not None:
            if 'name' in task_dict:
                self.name = task_dict['name']
            if 'lsid' in task_dict:
                self.lsid = task_dict['lsid']
            if 'description' in task_dict:
                self.description = task_dict['description']
            if 'documentation' in task_dict:
                self.documentation = task_dict['documentation']
            if 'version' in task_dict:
                self.version = task_dict['version']

    def param_load(self):
        # Differences between Python 2 and Python 3
        escaped_uri = self.uri
        if sys.version_info.major == 2:
            escaped_uri = urllib.quote(self.uri)
        elif sys.version_info.major == 3:
            escaped_uri = urllib.parse.quote(self.uri)

        request = urllib2.Request(self.server_data.url + '/rest/v1/tasks/' + escaped_uri)
        if self.server_data.authorization_header() is not None:
            request.add_header('Authorization', self.server_data.authorization_header())
        request.add_header('User-Agent', 'GenePatternRest')
        response = urllib2.urlopen(request)
        self.json = response.read().decode('utf-8')
        self.dto = json.loads(self.json)

        self.description = self.dto['description'] if 'description' in self.dto else ""
        self.name = self.dto['name']
        self.documentation = self.dto['documentation'] if 'documentation' in self.dto else ""
        self.lsid = self.dto['lsid']
        self.version = self.dto['version'] if 'version' in self.dto else ""
        self.params = []
        for param in self.dto['params']:
            self.params.append(GPTaskParam(self, param))

    def get_lsid(self):
        return self.lsid

    def get_name(self):
        return self.name

    def get_description(self):
        """ Returns task description.
        """
        return self.description

    def get_version(self):
        return self.version

    def get_parameters(self):
        return self.params

    def make_job_spec(self):
        return GPJobSpec(self.server_data, self.lsid)


class GPTaskParam(object):
    """Encapsulates single parameter information.

    The constructor's input parameter is the data transfer object
    associated with a single task parameter (i.e., element from list
    returned by GPTask.getParameters)
    """
    task = None
    dto = None
    name = None
    description = None
    attributes = None

    def __init__(self, task, dto):
        self.task = task
        self.dto = dto
        self.name = list(dto)[0]
        if 'description' in dto[self.name]:
            self.description = dto[self.name]['description']
        else:
            self.description = ''
        self.attributes = dto[self.name]['attributes']

    def get_dto(self):
        return self.dto

    def get_name(self):
        return self.name

    def is_optional(self):
        if (('optional' in self.attributes and bool(self.attributes['optional'].strip())) and
                ('minValue' in self.attributes and self.attributes['minValue'] == 0)):
            return True
        else:
            return False

    def get_description(self):
        return self.description

    def get_type(self):
        """
        Returns either 'File' or 'String'.

        The type attribute (e.g., java.io.File, java.lang.Integer, java.lang.Float),
        which might give a hint as to what string should represent,
        is not enforced and not employed consistently across all tasks, so we ignore.

        """

        if 'TYPE' in self.attributes and 'MODE' in self.attributes:
            dto_type = self.attributes['TYPE']
            dto_mode = self.attributes['MODE']
            if dto_type == 'FILE' and dto_mode == 'IN':
                return 'File'
        return 'String'

    def is_password(self):
        """
        Indicates whether password flag associated with string parameter.

        If string parameter flagged as password, UI should not display
        parameter value on input field (e.g., mask out with asterisks).

        """

        if 'type' in self.attributes and self.attributes['type'] == 'PASSWORD':
            return True
        else:
            return False

    def allow_multiple(self):
        # note that maxValue means "max number of values", and is an integer, not a string
        if (('maxValue' in self.attributes) and
                (self.attributes['maxValue'] > 1)):
            return True
        else:
            return False

    def get_default_value(self):
        if ('default_value' in self.attributes and
                bool(self.attributes['default_value'].strip())):
            return self.attributes['default_value']
        else:
            return None

    def is_choice_param(self):
        return 'choiceInfo' in self.dto[self.name]

    # returns a message field, which indicates whether choices statically
    # or dynamically defined, and flag indicating whether a dynamic file
    # selection loading error occurred.
    def get_choice_status(self):
        if 'choiceInfo' not in self.dto[self.name]:
            raise GPException('not a choice parameter')

        status = self.dto[self.name]['choiceInfo']['status']
        return status['message'], status['flag']

    def get_choice_href(self):
        if 'choiceInfo' not in self.dto[self.name]:
            raise GPException('not a choice parameter')

        return self.dto[self.name]['choiceInfo']['href']

    # the default selection from a choice menu
    def get_choice_selected_value(self):
        if 'choiceInfo' not in self.dto[self.name]:
            raise GPException('not a choice parameter')
        choice_info_dto = self.dto[self.name]['choiceInfo']
        if 'selectedValue' in choice_info_dto:
            return self.dto[self.name]['choiceInfo']['selectedValue']
        else:
            return None

    def allow_choice_custom_value(self):
        """
        Returns boolean indicating whether choice parameter supports custom value.

        If choice parameter supports custom value, user can provide parameter value
        other than those provided in choice list.
        """
        if 'choiceInfo' not in self.dto[self.name]:
            raise GPException('not a choice parameter')
        return self._is_string_true(self.dto[self.name]['choiceInfo']['choiceAllowCustom'])

    # this needs additional work - some kind of limited polling to give server time to assemble list
    def get_choices(self):
        """
        Returns a list of dictionary objects, one dictionary object per choice.

        Each object has two keys defined: 'value', 'label'.
        The 'label' entry is what should be displayed on the UI, the 'value' entry
        is what is written into GPJobSpec.

        """

        if 'choiceInfo' not in self.dto[self.name]:
            raise GPException('not a choice parameter')
        if self.get_choice_status()[1] == "NOT_INITIALIZED":
            print(self.get_choice_status())
            print("choice status not initialized")

            request = urllib2.Request(self.get_choice_href())
            if self.task.server_data.authorization_header() is not None:
                request.add_header('Authorization', self.task.server_data.authorization_header())
            request.add_header('User-Agent', 'GenePatternRest')
            response = urllib2.urlopen(request)
            self.dto[self.name]['choiceInfo'] = json.loads(response.read().decode('utf-8'))
        return self.dto[self.name]['choiceInfo']['choices']

    # only pipeline prompt-when-run parameters
    # can have alternate names and alternate descriptions
    def get_alt_name(self):
        if ('altName' in self.attributes and
                bool(self.attributes['altName'].strip())):
            return self.attributes['altName']
        else:
            return None

    def get_alt_description(self):
        if 'altDescription' in self.attributes and bool(self.attributes['altDescription'].strip()):
            return self.attributes['altDescription']
        else:
            return None

    def _is_string_true(self, test):
        if type(test) is bool:
            return test
        return test.lower() in ('on', 'yes', 'true')


class GPException(Exception):
    def __init__(self, value):
        self.value = value

    def __str__(self):
        return repr(self.value)