import gp
from ipywidgets import widgets
from traitlets import Unicode, Integer

"""
Widgets which retrieve results from the GenePattern server

    * GPAuthWidget: GenePattern server authentication
    * GPTaskWidget: Analysis for submission to GenePattern server
    * GPJobWidget: Submitted GenePattern  job
"""


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


class GPAuthWidget(gp.GPResource, widgets.DOMWidget):
    """
    A running or completed job on a GenePattern server.

    Contains methods to get the info of the job, and to wait on a running job by
    polling the server until the job is completed.
    """
    _view_name = Unicode('AuthWidgetView').tag(sync=True)
    _view_module = Unicode('genepattern/authentication').tag(sync=True)

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
    _view_module = Unicode("genepattern/job").tag(sync=True)
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
    _view_module = Unicode("genepattern/task").tag(sync=True)
    lsid = Unicode("", sync=True)
    name = Unicode("", sync=True)

    def __init__(self, task, **kwargs):
        super(GPTaskWidget, self).__init__(task.uri)
        widgets.DOMWidget.__init__(self, **kwargs)

        if self.is_uri_lsid(task.uri):
            self.lsid = task.uri
        else:
            self.name = task.uri

    @staticmethod
    def is_uri_lsid(uri):
        if uri.startswith("urn"):
            return True
        else:
            return False
