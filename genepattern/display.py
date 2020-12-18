import gp
import IPython

from .jobwidget import GPJobWidget
from .authwidget import GPAuthWidget
from .taskwidget import GPTaskWidget


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