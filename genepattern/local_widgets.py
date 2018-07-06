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
The CallWidget and functions related to local code execution
"""


def open(path_or_url):
    """
    Wrapper for opening an IO object to a local file or URL
    :param path_or_url:
    :return:
    """
    is_url = re.compile(
        r'^(?:http|ftp)s?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)

    if re.match(is_url, path_or_url):
        return urllib.request.urlopen(path_or_url)
    else:
        return builtins.open(path_or_url)


class build_ui:
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
    name = Unicode('', sync=True)
    description = Unicode('', sync=True)
    output_var = Unicode('', sync=True)
    params = List(sync=True)
    function_import = Unicode('', sync=True)
    register_tool = Bool(True, sync=True)
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

        # Do arguments override the default name, description or output?
        custom_name = kwargs['name'] if 'name' in kwargs else None
        custom_desc = kwargs['description'] if 'description' in kwargs else None
        custom_output = kwargs['output_var'] if 'output_var' in kwargs else None
        custom_import = kwargs['function_import'] if 'function_import' in kwargs else None
        custom_register = kwargs['register_tool'] if 'register_tool' in kwargs else True

        # Apply output_var deprecation warning
        if 'output_var' in kwargs:
            print('Specifying the output variable using the output_var argument is deprecated. Use the parameters argument.')

        # Read parameter metadata
        if 'parameters' in kwargs:
            self._apply_custom_parameter_info(params, kwargs['parameters'])

        # Set the Traitlet values for the call
        self.name = custom_name or function_or_method.__qualname__
        self.description = custom_desc or docstring
        self.output_var = custom_output or ''
        self.params = params
        self.function_import = custom_import or function_import
        self.register_tool = custom_register
        self.function_or_method = function_or_method

    @staticmethod
    def _safe_type(raw_type):
        """Ensure that the provided type is a known type, defaulting to text"""
        if raw_type == 'text' or raw_type == 'number' or raw_type == 'password' or raw_type == 'choice' or raw_type == 'file':
            return raw_type
        else:
            return 'text'

    @staticmethod
    def _apply_custom_parameter_info(params, metadata):
        # If output_var is overridden as a parameter, add to the parameters list as a special case
        if 'output_var' in metadata:
            params.append({
                "name": 'output_var',
                "label": 'output_variable',
                "optional": True,
                "default": '',
                "description": 'The returned value of the function will be assigned to this variable, if provided.',
                "hide": False,
                "type": 'text',
                "kinds": None,
                "choices": []
            })

        # Iterate through each parameters in the function
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
                    param['default'] = GPUIBuilder._safe_default(p_meta['default'])

                # Handle hiding the parameter
                if 'hide' in p_meta:
                    param['hide'] = p_meta['hide']

                # Handle specifying the parameter's type
                if 'type' in p_meta:
                    param['type'] = GPUIBuilder._safe_type(p_meta['type'])

                # Handle specifying the parameter's accepted kinds
                if 'kinds' in p_meta:
                    param['kinds'] = p_meta['kinds']

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
    def _is_primitive(thing):
        """Determine if the value is a primitive"""
        primitive = (int, str, bool, float)
        return isinstance(thing, primitive)

    @staticmethod
    def _safe_default(default):
        """If not safe to serialize in a traitlet, cast to a string"""

        # If the value is not a primitive, cast to string
        if not GPUIBuilder._is_primitive(default):
            default = str(default)
        return default

    @staticmethod
    def _guess_type(val):
        """Guess the input type of the parameter based off the default value, if unknown use text"""
        if isinstance(val, bool):
            return "choice"
        elif isinstance(val, int):
            return "number"
        elif isinstance(val, float):
            return "number"
        elif isinstance(val, str):
            return "text"
        elif hasattr(val, 'read'):
            return "file"
        else:
            return "text"

    @staticmethod
    def _params(sig):
        """Read params, values and annotations from the signature"""
        params = []
        for p in sig.parameters:
            param = sig.parameters[p]
            optional = param.default != inspect.Signature.empty
            default = GPUIBuilder._safe_default(param.default) if param.default != inspect.Signature.empty else ''
            annotation = param.annotation if param.annotation != inspect.Signature.empty else ''
            type = GPUIBuilder._guess_type(default)

            # Create the parameter attribute dict
            p_attr = {
                "name": param.name,
                "label": param.name,
                "optional": optional,
                "default": default,
                "description": annotation,
                "hide": False,
                "type": type,
                "kinds": None,
                "choices": []
            }

            # Special choices handling for boolean parameters
            if isinstance(default, bool):
                p_attr['choices'] = {
                    'True': 'true',
                    'False': 'false'
                }

            # Append it to the list
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


class GPUIOutput(gp.GPResource, widgets.DOMWidget):
    """
    Widget used to render Python output in a UI
    """
    _view_name = Unicode('UIOutputView').tag(sync=True)
    _view_module = Unicode("genepattern/uibuilder").tag(sync=True)

    name = Unicode('', sync=True)
    description = Unicode('', sync=True)
    files = List(sync=True)
    text = Unicode('', sync=True)
    visualization = Unicode('', sync=True)

    def __init__(self, **kwargs):
        super(GPUIOutput, self).__init__('output')
        widgets.DOMWidget.__init__(self, **kwargs)

        # Assign the traitlets, if specified
        self.name = kwargs['name'] if 'name' in kwargs else 'Python Results'
        self.description = kwargs['description'] if 'description' in kwargs else ''
        self.files = kwargs['files'] if 'files' in kwargs else []
        self.text = kwargs['text'] if 'text' in kwargs else ''
        self.visualization = kwargs['visualization'] if 'visualization' in kwargs else ''


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