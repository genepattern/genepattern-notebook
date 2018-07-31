import builtins
import inspect
import functools
import re

import gp
import sys
import urllib.request

from IPython.core.display import display
from ipywidgets import widgets
from traitlets import Unicode, List, Bool

"""
Widgets and functions related to local code execution
This has largely been migrated to the nbtools package.
"""


class GPModuleWidget(gp.GPResource, widgets.DOMWidget):
    """
    Widget used to create GenePattern modules from a notebook
    """
    _view_name = Unicode('ModuleWidgetView').tag(sync=True)
    _view_module = Unicode("genepattern/modulebundler").tag(sync=True)
    lsid = Unicode("", sync=True)

    def __init__(self, lsid="", **kwargs):
        super(GPModuleWidget, self).__init__(lsid)
        widgets.DOMWidget.__init__(self, **kwargs)
        self.lsid = lsid