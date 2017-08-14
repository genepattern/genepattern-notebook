import inspect
import gp
from ipywidgets import widgets
from traitlets import Unicode, List

"""
The CallWidget and functions related to local code execution
"""


class GPCallWidget(gp.GPResource, widgets.DOMWidget):
    _view_name = Unicode('CallWidgetView').tag(sync=True)
    _view_module = Unicode('gp_call').tag(sync=True)

    # Declare the Traitlet values for the widget
    name = Unicode("", sync=True)
    description = Unicode("", sync=True)
    params = List(sync=True)
    function_or_method = None

    def _docstring(self, function_or_method):
        """Read docstring and protect against None"""
        docstring = inspect.getdoc(function_or_method)
        if docstring is None:
            docstring = ""
        return docstring

    def _params(self, sig):
        """Read params, values and annotations from the signature"""
        params = []
        for p in sig.parameters:
            param = sig.parameters[p]
            required = param.default != inspect.Signature.empty
            default = param.default if param.default != inspect.Signature.empty else ""
            annotation = param.annotation if param.annotation != inspect.Signature.empty else ""
            p_list = [param.name, required, default, annotation]
            params.append(p_list)
        return params

    def __init__(self, function_or_method, **kwargs):
        super(GPCallWidget, self).__init__(function_or_method.__name__)
        widgets.DOMWidget.__init__(self, **kwargs)

        # Read call signature
        sig = inspect.signature(function_or_method)

        # Read params, values and annotations from the signature
        params = self._params(sig)

        # Read docstring
        docstring = self._docstring(function_or_method)

        # Set the Traitlet values for the call
        self.name = function_or_method.__qualname__
        self.description = docstring
        self.params = params
        self.function_or_method = function_or_method