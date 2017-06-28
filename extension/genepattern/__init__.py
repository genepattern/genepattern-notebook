"""
GenePattern Notebook extension for Jupyter

Copyright 2015-2016 The Broad Institute

SOFTWARE COPYRIGHT NOTICE
This software and its documentation are the copyright of the Broad Institute, Inc. All rights are reserved.
This software is supplied without any warranty or guaranteed support whatsoever. The Broad Institute is not
responsible for its use, misuse, or functionality.
"""

__author__ = 'Thorin Tabor'
__copyright__ = 'Copyright 2015-2017, Broad Institute'
__version__ = '0.6.3'
__status__ = 'Beta'
__license__ = 'BSD-style'

import gp
import inspect
from IPython.core.magic import Magics, magics_class, line_magic
from traitlets import Unicode, Integer, List
from ipywidgets import widgets


"""
Keep a dictionary of all currently registered GenePattern server sessions
Keys are the relevant server URLs
"""
sessions = []


def register_session(server, username, password):
    """
    Register a new GenePattern server session for the provided
    server, username and password. Return the session.
    :param server:
    :param username:
    :param password:
    :return:
    """

    # Create the session
    session = gp.GPServer(server, username, password)

    # Validate username if not empty
    valid_username = username != "" and username is not None

    # Validate that the server is not already registered
    index = get_session_index(server)
    new_server = index == -1

    # Add the new session to the list
    if valid_username and new_server:
        sessions.append(session)

    # Replace old session is one exists
    if valid_username and not new_server:
        sessions[index] = session

    return session


def get_session(server):
    """
    Returns a registered GPServer object with a matching GenePattern server url or index
    Returns None if no matching result was found
    :param server:
    :return:
    """

    # Handle indexes
    if isinstance(server, int):
        if server >= len(sessions):
            return None
        else:
            return sessions[server]

    # Handle server URLs
    index = get_session_index(server)
    if index == -1:
        return None
    else:
        return sessions[index]


def get_session_index(server_url):
    """
    Returns a registered GPServer object with a matching GenePattern server url
    Returns -1 if no matching result was found
    :param server_url:
    :return:
    """
    for i in range(len(sessions)):
        session = sessions[i]
        if session.url == server_url:
            return i
    return -1


@magics_class
class GenePatternMagic(Magics):
    """
    GenePattern Notebook magic commands
    """

    @line_magic
    def get_job(self, line):
        args = line.split(" ")          # GPServer, job number
        if len(args) != 4:
            return 'Incorrect number of args. Need 4: Server URL, username, password, job number'

        server = gp.GPServer(args[0], args[1], args[2])
        job = gp.GPJob(server, int(args[3]))
        return job

    @line_magic
    def get_task(self, line):
        args = line.split(" ")          # GPServer, task name or lsid
        if len(args) != 4:
            return 'Incorrect number of args. Need 4: Server URL, username, password, task name or LSID'

        server = gp.GPServer(args[0], args[1], args[2])
        task = gp.GPTask(server, args[3])
        return task


class GPAuthWidget(gp.GPResource, widgets.DOMWidget):
    """
    A running or completed job on a GenePattern server.

    Contains methods to get the info of the job, and to wait on a running job by
    polling the server until the job is completed.
    """
    _view_name = Unicode('AuthWidgetView').tag(sync=True)
    _view_module = Unicode('gp_auth').tag(sync=True)

    def __init__(self, uri, **kwargs):
        super(GPAuthWidget, self).__init__(uri)
        widgets.DOMWidget.__init__(self, **kwargs)
        self.info = None

        self.errors = widgets.CallbackDispatcher(accepted_nargs=[0, 1])
        self.on_msg(self._handle_custom_msg)

    def _handle_custom_msg(self, content, **kwargs):
        if 'event' in content and content['event'] == 'error':
            self.errors()
            self.errors(self)


class GPJobWidget(gp.GPResource, widgets.DOMWidget):
    """
    A running or completed job on a Gene Pattern server.

    Contains methods to get the info of the job, and to wait on a running job by
    polling the server until the job is completed.
    """
    _view_name = Unicode('JobWidgetView').tag(sync=True)
    _view_module = Unicode('gp_job').tag(sync=True)
    job_number = Integer(0).tag(sync=True)

    def __init__(self, job, **kwargs):
        super(GPJobWidget, self).__init__(job.uri)
        widgets.DOMWidget.__init__(self, **kwargs)
        self.job_number = job.job_number


class GPTaskWidget(gp.GPResource, widgets.DOMWidget):
    """
    A running or completed job on a Gene Pattern server.

    Contains methods to get the info of the job, and to wait on a running job by
    polling the server until the job is completed.
    """
    _view_name = Unicode('TaskWidgetView').tag(sync=True)
    _view_module = Unicode('gp_task').tag(sync=True)
    lsid = Unicode("", sync=True)
    name = Unicode("", sync=True)

    def __init__(self, task, **kwargs):
        super(GPTaskWidget, self).__init__(task.uri)
        widgets.DOMWidget.__init__(self, **kwargs)

        if self.is_uri_lsid(task.uri):
            self.lsid = task.uri
        else:
            self.name = task.uri

    def is_uri_lsid(self, uri):
        if uri.startswith("urn"):
            return True
        else:
            return False


class GPCallWidget(gp.GPResource, widgets.DOMWidget):
    _view_name = Unicode('CallWidgetView').tag(sync=True)
    _view_module = Unicode('gp_call').tag(sync=True)

    # Declare the Traitlet values for the widget
    name = Unicode("", sync=True)
    description = Unicode("", sync=True)
    params = List(sync=True)
    function_or_method = None

    def __init__(self, function_or_method, **kwargs):
        super(GPCallWidget, self).__init__(function_or_method.__name__)
        widgets.DOMWidget.__init__(self, **kwargs)

        # Read call signature
        sig = inspect.signature(function_or_method)

        # Read params, values and annotations from the signature
        params = []
        for p in sig.parameters:
            param = sig.parameters[p]
            required = param.default != inspect.Signature.empty
            default = param.default if param.default != inspect.Signature.empty else ""
            annotation = param.annotation if param.annotation != inspect.Signature.empty else ""
            p_list = [param.name, required, default, annotation]
            params.append(p_list)

        # Read docstring and protect against None
        docstring = inspect.getdoc(function_or_method)
        if docstring is None:
            docstring = ""

        # Set the Traitlet values for the call
        self.name = function_or_method.__qualname__
        self.description = docstring
        self.params = params
        self.function_or_method = function_or_method


def load_ipython_extension(ipython):
    ipython.register_magics(GenePatternMagic)


def _jupyter_server_extension_paths():
    return [{
        "module": "genepattern"
    }]


def _jupyter_nbextension_paths():
    return [dict(
        section="notebook",
        # the path is relative to the `my_fancy_module` directory
        src="static",
        # directory in the `nbextension/` namespace
        dest="genepattern",
        # _also_ in the `nbextension/` namespace
        require="genepattern/index")]


def load_jupyter_server_extension(nbapp):
    nbapp.log.info("GenePattern Notebook enabled!")