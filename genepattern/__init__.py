"""
GenePattern Notebook extension for Jupyter

Copyright 2015-2019 Regents of the University of California & Broad Institute
"""

from .remote_widgets import GPAuthWidget, GPTaskWidget, GPJobWidget, session, register_session, get_session, display
from nbtools import UIBuilder as GPUIBuilder, UIOutput as GPUIOutput, build_ui, open
from .local_widgets import GPModuleWidget
from .jupyter_extensions import (GenePatternMagic, load_ipython_extension, load_jupyter_server_extension,
                                 _jupyter_server_extension_paths, _jupyter_nbextension_paths)


# try:  # Import subpackages, if available
#     import genepattern.client
# except Exception:  # Ignore if subpackages are unavailable
#     pass
#
# try:
#     import genepattern.utils
# except Exception:
#     pass

__author__ = 'Thorin Tabor'
__copyright__ = 'Copyright 2014-2019, Regents of the University of California & Broad Institute'
__version__ = '19.07.1'
__status__ = 'Production/Stable'
__license__ = 'BSD-3-Clause'
