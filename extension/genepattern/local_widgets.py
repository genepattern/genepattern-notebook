import inspect
import gp
import sys
from ipywidgets import widgets
from traitlets import Unicode, List

"""
The CallWidget and functions related to local code execution
"""


# def call_widget(func):
#     # def widget():
#     #     return GPCallWidget(func)
#     # return widget
#     yield GPCallWidget(func)


class GPCallWidget(gp.GPResource, widgets.DOMWidget):
    _view_name = Unicode('CallWidgetView').tag(sync=True)
    _view_module = Unicode('gp_call').tag(sync=True)

    # Declare the Traitlet values for the widget
    name = Unicode("", sync=True)
    description = Unicode("", sync=True)
    params = List(sync=True)
    function_import = Unicode("", sync=True)
    function_or_method = None

    def __init__(self, function_or_method, **kwargs):
        super(GPCallWidget, self).__init__(function_or_method.__name__)
        widgets.DOMWidget.__init__(self, **kwargs)

        # Read call signature
        sig = inspect.signature(function_or_method)

        # Read params, values and annotations from the signature
        params = self._params(sig)

        # Read docstring
        docstring = self._docstring(function_or_method)

        # Determine how the function is imported in the namespace
        function_import = self._import(function_or_method)

        # Set the Traitlet values for the call
        self.name = function_or_method.__qualname__
        self.description = docstring
        self.params = params
        self.function_import = function_import
        self.function_or_method = function_or_method

    @staticmethod
    def _docstring(function_or_method):
        """Read docstring and protect against None"""
        docstring = inspect.getdoc(function_or_method)
        if docstring is None:
            docstring = ''
        return docstring

    @staticmethod
    def _params(sig):
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

    @staticmethod
    def _import(func):
        """Return the namespace path to the function"""
        func_name = func.__name__

        # from foo.bar import func // func()
        # WARNING: May be broken in IPython, in which case the widget will use a fallback
        if func_name in globals():
            return func_name

        # import foo.bar // foo.bar.func()
        module_name = func.__module__
        submodules = module_name.split('.')

        if submodules[0] in globals():
            return module_name + '.' + func_name

        # from foo import bar // bar.func()
        for i in range(len(submodules)):
            m = submodules[i]
            if m in globals():
                return '.'.join(submodules[i:]) + '.' + func_name

        # import foo.bar as fb // fb.func()
        module_ref = sys.modules[func.__module__]
        all_globals = globals()

        for n in all_globals:
            if all_globals[n] == module_ref:
                return n + '.' + func_name

        # Not Found, return empty string
        return ''
