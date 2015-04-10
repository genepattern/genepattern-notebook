__author__ = 'tabor'

from IPython.html import widgets
from IPython.utils.traitlets import Unicode, List, Integer
from gp import GPResource


class GPAuthWidget(GPResource, widgets.DOMWidget):
    """
    A running or completed job on a Gene Pattern server.

    Contains methods to get the info of the job, and to wait on a running job by
    polling the server until the job is completed.
    """
    _view_name = Unicode('AuthWidgetView', sync=True)  # Define the widget's view

    def __init__(self, uri, **kwargs):
        super(GPAuthWidget, self).__init__(uri)
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


class GPJobWidget(GPResource, widgets.DOMWidget):
    """
    A running or completed job on a Gene Pattern server.

    Contains methods to get the info of the job, and to wait on a running job by
    polling the server until the job is completed.
    """
    _view_name = Unicode('JobWidgetView', sync=True)  # Define the widget's view
    job_number = Integer(0, sync=True)

    def __init__(self, job, **kwargs):
        super(GPJobWidget, self).__init__(job.uri)
        widgets.DOMWidget.__init__(self, **kwargs)
        self.job_number = job.job_number

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


class GPTaskWidget(GPResource, widgets.DOMWidget):
    """
    A running or completed job on a Gene Pattern server.

    Contains methods to get the info of the job, and to wait on a running job by
    polling the server until the job is completed.
    """
    _view_name = Unicode('TaskWidgetView', sync=True)  # Define the widget's view
    lsid = Unicode("", sync=True)
    name = Unicode("", sync=True)

    def __init__(self, task, **kwargs):
        super(GPTaskWidget, self).__init__(task.uri)
        widgets.DOMWidget.__init__(self, **kwargs)

        if self.is_uri_lsid(task.uri):
            self.lsid = task.uri
        else:
            self.name = task.uri

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

    def is_uri_lsid(self, uri):
        if uri.startswith("urn"):
            return True
        else:
            return False