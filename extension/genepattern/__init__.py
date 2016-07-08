"""
GenePattern Notebook extension for Jupyter

Copyright 2015-2016 The Broad Institute

SOFTWARE COPYRIGHT NOTICE
This software and its documentation are the copyright of the Broad Institute, Inc. All rights are reserved.
This software is supplied without any warranty or guaranteed support whatsoever. The Broad Institute is not
responsible for its use, misuse, or functionality.
"""

__author__ = 'Thorin Tabor'
__copyright__ = 'Copyright 2015-2016, Broad Institute'
__version__ = '0.5.2'
__status__ = 'Beta'
__license__ = 'BSD-style'

from gp import GPResource
import gp
import sys

import IPython
from IPython.core.magic import Magics, magics_class, line_magic

# Determine IPython version and do version-specific imports
ipy_major_version = IPython.version_info[0]
if ipy_major_version < 4:
    sys.exit("GenePattern Notebook requires Jupyter 4.2 or greater")
elif ipy_major_version >= 4:
    from traitlets import Unicode, Integer
    from ipywidgets import widgets


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


class GPAuthWidget(GPResource, widgets.DOMWidget):
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

    def _handle_custom_msg(self, content):
        if 'event' in content and content['event'] == 'error':
            self.errors()
            self.errors(self)


class GPJobWidget(GPResource, widgets.DOMWidget):
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


class GPTaskWidget(GPResource, widgets.DOMWidget):
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