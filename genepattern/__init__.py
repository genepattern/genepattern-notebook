"""
GenePattern Notebook extension for Jupyter

Copyright 2015-2017 Regents of the University of California & Broad Institute
"""

from .remote_widgets import GPAuthWidget, GPTaskWidget, GPJobWidget, sessions, register_session, get_session, get_session_index
from .local_widgets import GPUIBuilder, GPModuleWidget, build_ui
from .jupyter_extensions import (GenePatternMagic, load_ipython_extension, load_jupyter_server_extension,
                                 _jupyter_server_extension_paths, _jupyter_nbextension_paths)

__author__ = 'Thorin Tabor'
__copyright__ = 'Copyright 2014-2017, Regents of the University of California & Broad Institute'
__version__ = '0.7.0'
__status__ = 'Beta'
__license__ = 'BSD'
