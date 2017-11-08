"""
GenePattern Notebook extension for Jupyter

Copyright 2015-2017 The Broad Institute

SOFTWARE COPYRIGHT NOTICE
This software and its documentation are the copyright of the Broad Institute, Inc. All rights are reserved.
This software is supplied without any warranty or guaranteed support whatsoever. The Broad Institute is not
responsible for its use, misuse, or functionality.
"""

from .remote_widgets import GPAuthWidget, GPTaskWidget, GPJobWidget, sessions, register_session, get_session, get_session_index
from .local_widgets import GPUIBuilder, GPModuleWidget, build_ui
from.jupyter_extensions import (GenePatternMagic, load_ipython_extension, load_jupyter_server_extension,
                                _jupyter_server_extension_paths, _jupyter_nbextension_paths)

__author__ = 'Thorin Tabor'
__copyright__ = 'Copyright 2015-2017, Broad Institute'
__version__ = '0.6.7'
__status__ = 'Beta'
__license__ = 'BSD'
