"""
GenePattern Notebook extension for Jupyter

Copyright 2015-2018 Regents of the University of California & Broad Institute
"""

from .remote_widgets import GPAuthWidget, GPTaskWidget, GPJobWidget, session, register_session, get_session, display
from .local_widgets import GPUIBuilder, GPUIOutput, GPModuleWidget, build_ui, open
from .jupyter_extensions import (GenePatternMagic, load_ipython_extension, load_jupyter_server_extension,
                                 _jupyter_server_extension_paths, _jupyter_nbextension_paths)

__author__ = 'Thorin Tabor'
__copyright__ = 'Copyright 2014-2018, Regents of the University of California & Broad Institute'
__version__ = '0.7.2'
__status__ = 'Beta'
__license__ = 'BSD-3-Clause'
