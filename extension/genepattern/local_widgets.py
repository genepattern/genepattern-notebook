import inspect
import functools
import gp
import sys

from IPython.core.display import display
from ipywidgets import widgets
from traitlets import Unicode, List

"""
The CallWidget and functions related to local code execution
"""


class build_ui():
    """
    Decorator used to display the UI Builder upon definition of a function.

    Example:
        @genepattern.build_ui
        def example_function(arg1, arg2):
            return (arg1, arg2)

    Example:
        @genepattern.build_ui(name="custom name", description="custom description")
        def example_function(arg1, arg2):
            return (arg1, arg2)
    """
    func = None
    kwargs = None

    def __init__(self, *args, **kwargs):
        # Display if decorator with no arguments
        if len(args) > 0:
            self.func = args[0]              # Set the function
            display(GPUIBuilder(self.func))  # Display
        else:
            # Save the kwargs for decorators with arguments
            self.kwargs = kwargs

    def __call__(self, *args, **kwargs):
        # Decorators with arguments make this call at define time, while decorators without
        # arguments make this call at runtime. That's the reason for this madness.

        # Figure out what type of call this is, then figure out func and args
        decorator_args = self.func is None
        if decorator_args:
            func = args[0]
            func_args = args[1:]
        else:
            func = self.func
            func_args = args

        # Display if decorator has arguments
        if decorator_args:
            display(GPUIBuilder(func, **self.kwargs))

            # Return wrapped function
            @functools.wraps(func)
            def decorated(*args, **kwargs):
                return func(*args, **kwargs)
            return decorated
        else:
            # Otherwise, just call the function
            return func(*func_args, **kwargs)


class GPUIBuilder(gp.GPResource, widgets.DOMWidget):
    """
    Widget used to render Python functions in as an input form
    """
    _view_name = Unicode('UIBuilderView').tag(sync=True)
    _view_module = Unicode('genepattern/uibuilder').tag(sync=True)

    # Declare the Traitlet values for the widget
    name = Unicode("", sync=True)
    description = Unicode("", sync=True)
    params = List(sync=True)
    function_import = Unicode("", sync=True)
    function_or_method = None

    def __init__(self, function_or_method, **kwargs):
        super(GPUIBuilder, self).__init__(function_or_method.__name__)
        widgets.DOMWidget.__init__(self, **kwargs)

        # Read call signature
        sig = inspect.signature(function_or_method)

        # Read params, values and annotations from the signature
        params = self._params(sig)

        # Read docstring
        docstring = self._docstring(function_or_method)

        # Determine how the function is imported in the namespace
        function_import = self._import(function_or_method)

        # Do arguments override the default name or description?
        custom_name = kwargs['name'] if 'name' in kwargs else None
        custom_desc = kwargs['description'] if 'description' in kwargs else None

        # Read parameter metadata
        if 'parameters' in kwargs:
            self._apply_custom_parameter_info(params, kwargs['parameters'])

        # Set the Traitlet values for the call
        self.name = custom_name or function_or_method.__qualname__
        self.description = custom_desc or docstring
        self.params = params
        self.function_import = function_import
        self.function_or_method = function_or_method

    @staticmethod
    def _apply_custom_parameter_info(params, metadata):
        for param in params:  # Iterate through each parameter
            if param['name'] in metadata:  # If there is something to override
                p_meta = metadata[param['name']]

                # Handle overriding the display name
                if 'name' in p_meta:
                    param['label'] = p_meta['name']

                # Handle overriding the description
                if 'description' in p_meta:
                    param['description'] = p_meta['description']

                # Handle overriding the default value
                if 'default' in p_meta:
                    param['default'] = p_meta['default']

                # Handle hiding the parameter
                if 'hide' in p_meta:
                    param['hide'] = p_meta['hide']

                # Handle giving the parameter a list of choices
                if 'choices' in p_meta:
                    param['choices'] = p_meta['choices']

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
            optional = param.default != inspect.Signature.empty
            default = param.default if param.default != inspect.Signature.empty else ''
            annotation = param.annotation if param.annotation != inspect.Signature.empty else ''
            p_attr = {
                "name": param.name,
                "label": param.name,
                "optional": optional,
                "default": default,
                "description": annotation,
                "hide": False,
                "choices": []
            }
            params.append(p_attr)
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

        # Not Found, return function name
        return func_name


class GPModuleWidget(gp.GPResource, widgets.DOMWidget):
    """
    Widget used to create GenePattern modules from a notebook
    """
    _view_name = Unicode('ModuleWidgetView').tag(sync=True)
    _view_module = Unicode("genepattern/uibuilder").tag(sync=True)
    lsid = Unicode("", sync=True)

    def __init__(self, lsid="", **kwargs):
        super(GPModuleWidget, self).__init__(lsid)
        widgets.DOMWidget.__init__(self, **kwargs)
        self.lsid = lsid