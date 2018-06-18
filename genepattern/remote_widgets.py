import warnings

import gp
import IPython.display
from ipywidgets import widgets
from traitlets import Unicode, Integer

"""
Widgets which retrieve results from the GenePattern server

    * GPAuthWidget: GenePattern server authentication
    * GPTaskWidget: Analysis for submission to GenePattern server
    * GPJobWidget: Submitted GenePattern  job
"""


class SessionList:
    """
    Keeps a list of all currently registered GenePattern server sessions
    """
    sessions = []

    def register(self, server, username, password):
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
        index = self._get_index(server)
        new_server = index == -1

        # Add the new session to the list
        if valid_username and new_server:
            self.sessions.append(session)

        # Replace old session is one exists
        if valid_username and not new_server:
            self.sessions[index] = session

        return session

    def get(self, server):
        """
        Returns a registered GPServer object with a matching GenePattern server url or index
        Returns None if no matching result was found
        :param server:
        :return:
        """

        # Handle indexes
        if isinstance(server, int):
            if server >= len(self.sessions):
                return None
            else:
                return self.sessions[server]

        # Handle server URLs
        index = self._get_index(server)
        if index == -1:
            return None
        else:
            return self.sessions[index]

    def clean(self):
        """
        Clear all GenePattern sessions from the sessions list
        :return:
        """
        self.sessions = []

    def _get_index(self, server_url):
        """
        Returns a registered GPServer object with a matching GenePattern server url
        Returns -1 if no matching result was found
        :param server_url:
        :return:
        """
        for i in range(len(self.sessions)):
            session = self.sessions[i]
            if session.url == server_url:
                return i
        return -1


"""
GenePattern Sessions Singleton
"""
session = SessionList()


# Deprecated function calls for backward compatibility
def register_session(server, username, password):
    warnings.warn("register_session will be deprecated in version 1.0, use sessions.register instead", PendingDeprecationWarning)
    return session.register(server, username, password)


def get_session(server):
    warnings.warn("get_session will be deprecated in version 1.0, use sessions.get instead", PendingDeprecationWarning)
    return session.get(server)


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
    A running or completed job on a GenePattern server.

    Contains methods to get the info of the job, and to wait on a running job by
    polling the server until the job is completed.
    """
    _view_name = Unicode('JobWidgetView').tag(sync=True)
    _view_module = Unicode("genepattern/job").tag(sync=True)
    job_number = Integer(-1).tag(sync=True)

    def __init__(self, job=None, **kwargs):
        # Handle None as placeholder job widget
        super(GPJobWidget, self).__init__(job.uri if hasattr(job, 'uri') else None)
        widgets.DOMWidget.__init__(self, **kwargs)
        if job is not None:
            self.job_number = job.job_number


class GPTaskWidget(gp.GPResource, widgets.DOMWidget):
    """
    A running or completed job on a GenePattern server.

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


def display(content):
    """
    Display a widget, text or other media in a notebook without the need to import IPython at the top level.

    Also handles wrapping GenePattern Python Library content in widgets.
    :param content:
    :return:
    """
    if isinstance(content, gp.GPServer):
        IPython.display.display(GPAuthWidget(content))
    elif isinstance(content, gp.GPTask):
        IPython.display.display(GPTaskWidget(content))
    elif isinstance(content, gp.GPJob):
        IPython.display.display(GPJobWidget(content))
    else:
        IPython.display.display(content)