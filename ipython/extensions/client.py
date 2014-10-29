import urllib2
import urllib
import base64
import json
import time
from contextlib import closing
from IPython.html import widgets
from IPython.utils.traitlets import Unicode, List, Integer

# API for GenePattern server

# This API contains:
#
# * Classes that correspond to resources on the server (files and jobs) and
# (for jobs) store locally a copy the state associated with these resources.
#
# * Functions for uploading a file, and running a job, that make calls to the
# server, and return resources.
#
# * A class, JobSpec, that encapsulates the data that specifies a request to
#   run a job on a GenePattern server.


class ServerData(object):
    """
    Wrapper for data needed to make server calls.
    
    Wraps the server url, username and password, and provides helper function
    to construct the authorization header.
    """

    def __init__(self, url, username, password):
        self.url = url
        self.username = username
        self.password = password
        auth_string = base64.encodestring('%s:%s' % (self.username, self.password))[:-1]
        self.auth_header = "Basic %s" % auth_string

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
            server_data: ServerData object used to make the server call.

        Returns:
            A GPFile object that wraps the URI of the uploaded file, or None if the
            upload fails.
        """

        request = urllib2.Request(self.url + 'rest/v1/data/upload/job_input?name=' + file_name)
        request.add_header('Authorization', self.authorization_header())
        request.add_header('User-Agent', 'GenePatternRest')
        data = open(file_path, 'rb').read()

        try:
            response = urllib2.urlopen(request, data)
        except IOError:
            print "authentication failed"
            return None

        if response.getcode() != 201:
            print "file upload failed, status code = %i" % response.getcode()
            return None

        return GPFile(response.info().getheader('Location'))

    def run_job(self, jobspec, wait_until_done=True):
        """
        Runs a job defined by jobspec, optionally non-blocking.

        Takes a JobSpec object that defines a request to run a job, and makes the
        request to the server.  By default blocks until the job is finished by
        polling the server, but can also run asynchronously.

        Args:
            jobspec: A JobSpec object that contains the data defining the job to be
                run.
            server_data: ServerData object used to make the server call.
            waitUntilDone: Whether to wait until the job is finished before
                returning.

        Returns:
            a GPJob object that refers to the running job on the server.  If called
            synchronously, this object will contain the info associated with the
            completed job.  Otherwise, it will just wrap the URI of the running job.
        """

        # names should be a list of names,
        # values should be a list of **lists** of values
        json_string = json.dumps({'lsid': jobspec.lsid, 'params': jobspec.params})
        request = urllib2.Request(self.url + 'rest/v1/jobs')
        request.add_header('Authorization', self.authorization_header())
        request.add_header('Content-Type', 'application/json')
        request.add_header('User-Agent', 'GenePatternRest')
        response = urllib2.urlopen(request, json_string)
        if response.getcode() != 201:
            print " job POST failed, status code = %i" % response.getcode()
            return None
        job = GPJob(response.info().getheader('Location'))
        if wait_until_done:
            job.wait_until_done(self)
        return job

    def get_task_list(self):
        request = urllib2.Request(self.url + 'rest/v1/tasks/all.json')
        request.add_header('Authorization', self.authorization_header())
        request.add_header('User-Agent', 'GenePatternRest')
        response = urllib2.urlopen(request)
        category_and_tasks = json.loads(response.read())
        return category_and_tasks['all_modules']

    def poll_multiple_jobs(self, job_list):
        complete = [False] * len(job_list)
        wait = 1
        while not all(complete):
            time.sleep(wait)
            for i, job in enumerate(job_list):
                if not complete[i]:
                    complete[i] = job.is_finished(self)
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

    def __init__(self, uri):
        self.uri = uri


class GPFile(GPResource):
    """
    A file on a Gene Pattern server.
    
    Wraps the URI of the file, and contains methods to download the file.
    """

    def open(self, server_data):
        request = urllib2.Request(self.uri)
        request.add_header('Authorization', server_data.authorization_header())
        request.add_header('User-Agent', 'GenePatternRest')
        return urllib2.urlopen(request)

    def read(self, server_data):
        with closing(self.open(server_data)) as f:
            data = f.read()
        return data or None


class GPJob(GPResource, widgets.DOMWidget):
    """
    A running or completed job on a Gene Pattern server.
    
    Contains methods to get the info of the job, and to wait on a running job by
    polling the server until the job is completed.
    """
    _view_name = Unicode('JobWidgetView', sync=True)  # Define the widget's view
    json = Unicode(sync=True)  # Define the backing JSON string
    task_name = Unicode(sync=True)
    task_lsid = Unicode(sync=True)
    user_id = Unicode(sync=True)
    job_number = Integer(sync=True)
    status = Unicode(sync=True)
    date_submitted = Unicode(sync=True)
    log_files = List(sync=True)
    output_files = List(sync=True)
    num_output_files = Integer(sync=True)

    def __init__(self, uri, **kwargs):
        super(GPJob, self).__init__(uri)
        widgets.DOMWidget.__init__(self, **kwargs)
        self.info = None

        self.errors = widgets.CallbackDispatcher(accepted_nargs=[0, 1])
        self.on_msg(self._handle_custom_msg)

    def _handle_custom_msg(self, content):
        """
        Handle a msg from the front-end.

        Parameters
        ----------
        content: dict
        Content of the msg.
        """
        if 'event' in content and content['event'] == 'error':
            self.errors()
            self.errors(self)

    def get_info(self, server_data):
        request = urllib2.Request(self.uri)
        request.add_header('Authorization', server_data.authorization_header())
        request.add_header('User-Agent', 'GenePatternRest')
        response = urllib2.urlopen(request)

        self.json = response.read()
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

    def is_finished(self, server_data):

        self.get_info(server_data)

        if not 'status' in self.info:
            return False
        if not 'isFinished' in self.info['status']:
            return False

        return self.info['status']['isFinished']

    def get_status_message(self):
        return self.info['status']['statusMessage']

    def get_output_files(self):
        return [GPFile(f['link']['href']) for f in self.info['outputFiles']]

    def wait_until_done(self, server_data):
        wait = 1
        while True:
            time.sleep(wait)
            self.get_info(server_data)
            if self.info['status']['isFinished']:
                break
            # implements a crude exponential backoff
            wait = min(wait * 2, 60)

    def get_job_status_url(self, server_data):
        return server_data.url + "pages/index.jsf?jobid=" + self.uri.split("/")[-1]


class JobSpec(object):
    """
    Data needed to make a request to perform a job on a Gene Pattern server
    
    Encapsulates the data needed to make a server call to run a job.  This
    includes the LSID of the job, and the parameters.  Helper methods set
    the LSID and parameters.
    """

    def __init__(self):
        self.params = []
        self.lsid = None

    def set_lsid(self, lsid):
        self.lsid = lsid

    def set_parameter(self, name, values):
        if not isinstance(values, list):
            values = [values]
        self.params.append({'name': name, 'values': values})


class GPCategory(object):
    """Encapsulates element of task category list.

    """

    def __init__(self, dto):
        self.dto = dto

    def get_dto(self):
        return self.dto

    def get_name(self):
        return self.dto['name']

    def get_description(self):
        return self.dto['description']

    def get_tags(self):
        return self.dto['tags']


class GPTaskListElement(object):
    """Encapsulates element of task list.
    
    Note that only the Lsid is guaranteed to be unique
    across all elements of the task list.
    
    """

    def __init__(self, dto):
        self.dto = dto

    def get_dto(self):
        return self.dto

    def get_name(self):
        return self.dto['name']

    def get_lsid(self):
        return self.dto['lsid']

    def get_description(self):
        """ Returns task description.

        If task has no description, throws GenePatternException.
        """

        if not 'description' in self.dto:
            raise GenePatternException('no task description')
        return self.dto['description']

    def get_tags(self):
        return self.dto['tags']

    def get_documentation(self):
        """ Returns path to task documentation on GPServer.

        In order to retrieve, will need to construct full URL and use GPFile class.
        Throws GenePatternException if no document.
        """

        if not 'documentation' in self.dto:
            raise GenePatternException('no task documentation')
        return self.dto['documentation']

    def get_version(self):
        """
        Returns string representation of module version.
        """
        return self.dto['version']

    def get_categories(self):
        return self.dto['categories']

    def get_suites(self):
        return self.dto['suites']


class GPTask(GPResource, widgets.DOMWidget):
    """Describes a GenePattern task (module or pipeline).

    The constructor retrieves data transfer object (DTO) describing task from GenePattern server.
    The DTO contains general task information (LSID, Category, Description, Version comment),
    a parameter list and a list of initial values.  Class includes getters for each of these
    components.

    """
    _view_name = Unicode('TaskWidgetView', sync=True)   # Define the widget's view
    json = Unicode(sync=True)                           # Define the backing JSON string
    description = Unicode(sync=True)
    name = Unicode(sync=True)
    documentation = Unicode(sync=True)
    lsid = Unicode(sync=True)
    version = Unicode(sync=True)
    params = List(sync=True)

    def __init__(self, name_or_lsid, server_data, **kwargs):
        GPResource.__init__(self, name_or_lsid)
        widgets.DOMWidget.__init__(self, **kwargs)

        request = urllib2.Request(server_data.url + '/rest/v1/tasks/' + urllib.quote(name_or_lsid))
        request.add_header('Authorization', server_data.authorization_header())
        request.add_header('User-Agent', 'GenePatternRest')
        response = urllib2.urlopen(request)
        self.json = response.read()
        self.dto = json.loads(self.json)

        self.description = self.dto['description']
        self.name = self.dto['name']
        self.documentation = self.dto['documentation']
        self.lsid = self.dto['lsid']
        self.version = self.dto['version']
        self.params = self.dto['params']

        self.errors = widgets.CallbackDispatcher(accepted_nargs=[0, 1])
        self.on_msg(self._handle_custom_msg)

    def _handle_custom_msg(self, content):
        """
        Handle a msg from the front-end.

        Parameters
        ----------
        content: dict
        Content of the msg.
        """
        if 'event' in content and content['event'] == 'error':
            self.errors()
            self.errors(self)

    def get_dto(self):
        return self.dto

    def get_lsid(self):
        return self.dto['lsid']

    def get_name(self):
        return self.dto['name']

    def get_description(self):
        """ Returns task description.

        If task has no description, throws GenePatternException.
        """
        return "DESCRIPTION NOT YET SUPPORTED"

    def get_version_comment(self):
        return "VERSION NOT YET SUPPORTED"

    def get_parameters(self):
        return self.dto['params']


class GPTaskParameter(object):
    """Encapsulates single parameter information.

    The constructor's input parameter is the data transfer object
    associated with a single task parameter (i.e., element from list
    returned by GPTask.getParameters)
    """

    def __init__(self, dto):
        self.dto = dto

    def get_dto(self):
        return self.dto

    def get_name(self):
        return self.dto['name']

    def is_optional(self):
        if ((self.dto.has_key('optional') and bool(self.dto['optional'].strip())) and
                (self.dto.has_key('minValue') and self.dto['minValue'] == 0)):
            return True
        else:
            return False

    def get_description(self):
        return self.dto['description']

    def get_type(self):
        """
        Returns either 'File' or 'String'.

        The type attribute (e.g., java.io.File, java.lang.Integer, java.lang.Float),
        which might give a hint as to what string should represent,
        is not enforced and not employed consistently across all tasks, so we ignore.

        """

        if self.dto.has_key('TYPE') and self.dto.has_key('MODE'):
            dto_type = self.dto['TYPE']
            dto_mode = self.dto['MODE']
            if dto_type == 'FILE' and dto_mode == 'IN':
                return 'File'
        return 'String'

    def is_password(self):
        """
        Indicates whether password flag associated with string parameter.

        If string parameter flagged as password, UI should not display
        parameter value on input field (e.g., mask out with asterisks).

        """

        if self.dto.has_key('type') and self.dto['type'] == 'PASSWORD':
            return True
        else:
            return False

    def allow_multiple(self):
        # note that maxValue means "max number of values", and is an integer, not a string
        if ((not self.dto.has_key('maxValue')) or
                (self.dto['maxValue'] > 1)):
            return True
        else:
            return False

    def get_default_value(self):
        if (self.dto.has_key('default_value') and
                bool(self.dto['default_value'].strip())):
            return self.dto['default_value']
        else:
            return None

    # returns boolean
    def is_choice_param(self):
        return self.dto.has_key('choiceInfo')

    # returns a message field, which indicates whether choices statically
    # or dynamically defined, and flag indicating whether a dynamic file
    # selection loading error occurred.
    def get_choice_status(self):
        if not self.dto.has_key('choiceInfo'):
            raise GenePatternException('not a choice parameter')

        status = self.dto['choiceInfo']['status']
        return status['message'], status['flag']

    def get_choice_href(self):
        if not self.dto.has_key('choiceInfo'):
            raise GenePatternException('not a choice parameter')

        return self.dto['choiceInfo']['href']

    # the default selection from a choice menu
    def get_choice_selected_value(self):
        if not self.dto.has_key('choiceInfo'):
            raise GenePatternException('not a choice parameter')
        choice_info_dto = self.dto['choiceInfo']
        if choice_info_dto.has_key('selectedValue'):
            return self.dto['choiceInfo']['selectedValue']
        else:
            return None

    def allow_choice_custom_vakue(self):
        """
        Returns boolean indicating whether choice parameter supports custom value.

        If choice parameter supports custom value, user can provide parameter value
        other than those provided in choice list.
        """
        if not self.dto.has_key('choiceInfo'):
            raise GenePatternException('not a choice parameter')
        return bool(BooleanString(self.dto['choiceInfo']['choiceAllowCustom']))

    # this needs additional work - some kind of limited polling to give server time to assemble list
    def get_choices(self, server_data):
        """
        Returns a list of dictionary objects, one dictionary object per choice.

        Each object has two keys defined: 'value', 'label'.
        The 'label' entry is what should be displayed on the UI, the 'value' entry
        is what is written into JobSpec.

        """

        if not self.dto.has_key('choiceInfo'):
            raise GenePatternException('not a choice parameter')
        if self.get_choice_status()[1] == "NOT_INITIALIZED":
            print self.get_choice_status()
            print "choice status not initialized"

            request = urllib2.Request(self.get_choice_href())
            request.add_header('Authorization', server_data.authorization_header())
            request.add_header('User-Agent', 'GenePatternRest')
            response = urllib2.urlopen(request)
            self.dto['choiceInfo'] = json.loads(response.read())
        return self.dto['choiceInfo']['choices']

    # only pipeline prompt-when-run parameters
    # can have alternate names and alternate descriptions
    def get_alt_name(self):
        if (self.dto.has_key('altName') and
                bool(self.dto['altName'].strip())):
            return self.dto['altName']
        else:
            return None

    def get_alt_description(self):
        if (self.dto.has_key('altDescription') and
                bool(self.dto['altDescription'].strip())):
            return self.dto['altDescription']
        else:
            return None


class GenePatternException(Exception):
    def __init__(self, value):
        self.value = value

    def __str__(self):
        return repr(self.value)


class BooleanString(str):
    def __nonzero__(self):
        return self.lower() in ('on', 'yes', 'true')
