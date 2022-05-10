import inspect
import json
import os
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from gp import GPTask
from IPython.display import display
from ipywidgets import Output
from .jobwidget import GPJobWidget
from nbtools import NBTool, UIBuilder, UIOutput, python_safe, EventManager
from .shim import get_task, get_kinds, get_eula, accept_eula, job_params, param_groups, job_group
from .utils import GENEPATTERN_LOGO, session_color, server_name


class GPTaskWidget(UIBuilder):
    """A widget for representing the status of a GenePattern job"""
    session_color = None
    task = None
    function_wrapper = None
    parameter_spec = None
    upload_callback = None

    def create_function_wrapper(self, task):
        """Create a function that accepts the expected input and submits a GenePattern job"""
        if task is None or task.server_data is None: return lambda: None  # Dummy function for null task
        name_map = {}  # Map of Python-safe parameter names to GP parameter names

        # Function for submitting a new GenePattern job based on the task form
        def submit_job(**kwargs):
            spec = task.make_job_spec()
            for name, value in kwargs.items():
                if value is None: value = ''    # Handle the case of blank optional parameters
                spec.set_parameter(name_map[name], value)
            job = task.server_data.run_job(spec, wait_until_done=False)
            display(GPJobWidget(job, logo='none', color=session_color(self.task.server_data.url, secondary_color=True)))

        # Function for adding a parameter with a safe name
        def add_param(param_list, p):
            safe_name = python_safe(p.name)
            name_map[safe_name] = p.name
            param = inspect.Parameter(safe_name, inspect.Parameter.POSITIONAL_OR_KEYWORD)
            param_list.append(param)

        # Generate function signature programmatically
        submit_job.__qualname__ = task.name
        submit_job.__doc__ = task.description
        params = []
        params_for_job = task.job_params if hasattr(task, 'job_params') else job_params(task)
        for p in task.params + params_for_job: add_param(params, p)  # Loop over all parameters
        submit_job.__signature__ = inspect.Signature(params)

        return submit_job

    def add_type_spec(self, task_param, param_spec):
        if task_param.attributes['type'] == 'java.io.File':
            param_spec['type'] = 'file'
            if task_param.is_choice_param():
                param_spec['choices'] = {c['label']: c['value'] for c in task_param.get_choices()}
            if task_param.allow_multiple(): param_spec['maximum'] = 100
        elif task_param.is_choice_param():
            param_spec['type'] = 'choice'
            param_spec['choices'] = {c['label']: c['value'] for c in task_param.get_choices()}
            if task_param.allow_choice_custom_value(): param_spec['combo'] = True
            if task_param.allow_multiple(): param_spec['multiple'] = True
        elif task_param.attributes['type'] == 'java.lang.Integer': param_spec['type'] = 'number'
        elif task_param.attributes['type'] == 'java.lang.Float': param_spec['type'] = 'number'
        elif task_param.attributes['type'].lower() == 'password': param_spec['type'] = 'password'
        else: param_spec['type'] = 'text'

    def create_param_spec(self, task):
        """Create the display spec for each parameter"""
        if task is None: return {}  # Dummy function for null task
        spec = {}
        params_for_job = task.job_params if hasattr(task, 'job_params') else job_params(task)
        for p in task.params + params_for_job:
            safe_name = python_safe(p.name)
            spec[safe_name] = {}
            spec[safe_name]['default'] = GPTaskWidget.form_value(p.get_default_value())
            spec[safe_name]['description'] = GPTaskWidget.form_value(p.description)
            spec[safe_name]['optional'] = p.is_optional()
            spec[safe_name]['kinds'] = p.get_kinds() if hasattr(p, 'get_kinds') else get_kinds(p)
            self.add_type_spec(p, spec[safe_name])
        return spec

    @staticmethod
    def extract_parameter_groups(task):
        groups = task.param_groups if hasattr(task, 'param_groups') else param_groups(task)     # Get param groups
        job_options_group = task.job_group if hasattr(task, 'job_group') else job_group(task)   # Get job options
        job_options_group['advanced'] = True                                                    # Hide by default
        all_groups = groups + [job_options_group]                                               # Join groups
        for group in all_groups:                                                                # Escape param names
            if 'parameters' in group:
                for i in range(len(group['parameters'])):
                    group['parameters'][i] = python_safe(group['parameters'][i])
        return all_groups

    def generate_upload_callback(self):
        """Create an upload callback to pass to file input widgets"""
        def genepattern_upload_callback(values):
            try:
                for k in values:
                    path = os.path.realpath(k)
                    gpfile = self.task.server_data.upload_file(k, path)
                    os.remove(path)
                    return gpfile.get_url()
            except Exception as e:
                self.error = f"Error encountered uploading file: {e}"
        return genepattern_upload_callback

    def handle_error_task(self, error_message, name='GenePattern Module', **kwargs):
        """Display an error message if the task is None"""
        UIBuilder.__init__(self, lambda: None, color=session_color(), **kwargs)

        self.name = name
        self.display_header = False
        self.display_footer = False
        self.error = error_message

    def __init__(self, task=None, origin='', id='', **kwargs):
        """Initialize the task widget"""
        self.task = task
        if task and origin is None: origin = task.server_data.url
        if task and id is None: id = task.lsid

        if self.task is None or self.task.server_data is None:  # Set the right look and error message if task is None
            self.handle_error_task('No GenePattern module specified.', **kwargs)
        elif self.is_java_visualizer():  # Checks if deprecated visualizer and displays an error message
            self.handle_error_task('Java-based visualizers are deprecated in GenePattern and will not function in Jupyter', name=task.name, **kwargs)
        else:
            if self.task.params is None: self.task.param_load()                 # Load params from GP server
            self.function_wrapper = self.create_function_wrapper(self.task)     # Create run task function
            self.parameter_spec = self.create_param_spec(self.task)
            self.session_color = session_color(self.task.server_data.url)       # Set the session color
            UIBuilder.__init__(self, self.function_wrapper, parameters=self.parameter_spec, color=self.session_color,
                               parameter_groups=GPTaskWidget.extract_parameter_groups(self.task),
                               upload_callback=self.generate_upload_callback(), subtitle=f'Version {task.version}',
                               license=self.add_license(), license_callback=self.generate_license_callback(),
                               origin=origin, _id=id, logo=GENEPATTERN_LOGO, **kwargs)
            self.attach_menu_items()

        # Register the event handler for GP login
        EventManager.instance().register("gp.login", self.login_callback)

    def add_license(self):
        if not self.task or not self.task.json: return {}   # Skip if there is no task json to parse
        eula = self.task.get_eula() if hasattr(self.task, 'get_eula') else get_eula(self.task)
        if len(eula['pendingEulas']) == 0: return {}        # No licenses to add

        return {
            'name': f'You must agree to the following end-user license agreement before you can run {self.task.name}.',
            'text': eula['pendingEulas'][0]['content'],
            'callback': False
        }

    def generate_license_callback(self):
        """Function to call when a license is agreed to"""
        return (lambda: self.task.accept_eula()) if hasattr(self.task, 'accept_eula') else (lambda: accept_eula(self.task))

    def attach_menu_items(self):
        """Attach the menu items needed for GenePattern tasks"""
        self.extra_menu_items = {
            'Documentation': {          # Add the documentation link
                'action': 'javascript',
                'code': f'window.open("{self._generate_doc_link()}")'
            }
        }

    def _generate_doc_link(self):
        """Return the documentation URL if absolute; if relative, attach to server URL"""
        if self.task.documentation and self.task.documentation.startswith('/'):
            return f'{self.task.server_data.url[:-3]}{self.task.documentation}'
        else:
            return {self.task.documentation}

    @staticmethod
    def form_value(raw_value):
        """Give the default parameter value in format the UI Builder expects"""
        if raw_value is not None: return raw_value
        else: return ''

    def is_java_visualizer(self):
        if self.task.params is None: self.task.param_load()  # Load params from GP server
        return 'Visualizer' in self.task.dto['categories']

    def login_callback(self, data):
        """Callback upon authentication for unauthenticated task widgets"""
        if self.task is not None and self.task.server_data is None:
            task = data.get_task(self.task.uri) if hasattr(data, 'get_task') else get_task(data, self.task.uri)
            task.param_load()  # Get the GPTask object and load its data

            # Create a new task widget and close the old unauthenticated one
            with self.output:
                display(GPTaskWidget(task))
                self.close()


class TaskTool(NBTool):
    """Tool wrapper for the authentication widget"""

    def __init__(self, server_name, task):
        NBTool.__init__(self)
        self.origin = server_name
        self.id = task.lsid
        self.name = task.name
        self.description = task.description
        self.load = lambda: GPTaskWidget(task, id=self.id, origin=self.origin)


def reproduce_job(sessions, session_index, job_number):
    session = sessions.make(session_index)
    origin = server_name(session.url)
    needs_rendered = True

    # Create the task widget, either immediately or upon login callback
    def create_task():
        session = sessions.make(session_index)          # Retrieve session again, necessary if run from login callback
        request = Request(session.url + "/rest/v1/jobs/" + str(job_number) + "?includeInputParams=true")
        if session.authorization_header() is not None:  # Make authorized call to GenePattern REST API
            request.add_header('Authorization', session.authorization_header())
        request.add_header('User-Agent', 'GenePatternRest')
        response = urlopen(request)                     # Get the response
        json_str = response.read().decode('utf-8')      # Deal with the JSON payload
        json_dict = json.loads(json_str)
        task = GPTask(session, json_dict['taskLsid'])
        task.param_load()                               # Retrieve task parameters
        params = task.get_parameters()
        for i in range(len(params)):
            task_param = params[i]
            custom_value = json_dict['inputParams'][i]  # Set the values to reproduce the original job
            task_param.attributes['default_value'] = custom_value[list(custom_value)[0]]
        return GPTaskWidget(task)                       # Return widget for display

    # Render the widget upon callback from 'nbtools.register'
    def render_task(data):
        nonlocal needs_rendered
        if needs_rendered and 'origin' in data and data['origin'] == origin:
            task_widget = create_task()             # Create the task widget
            placeholder.close()                     # Remove the placeholder widget
            with output: display(task_widget)       # Display the task widget
            needs_rendered = False                  # Only display once

    if not session.username:                        # If not logged in, display placeholder widget
        output = Output()  # Output widget and placeholder
        placeholder = UIOutput(name='Cannot find module', error=f'Cannot find module: {origin} | {job_number}')
        output.append_display_data(placeholder)
        EventManager.instance().register("nbtools.register", render_task)  # Register the callback with event manager
        return output                               # Return widget for display
    else:
        return create_task()


def load_task(sessions, session_index, name_or_lsid):
    """Return a task widget for the specified module name or lsid,
       regardless of whether it's been registered with the ToolManager or not.
       Useful for loading old versions of modules."""

    session = sessions.make(session_index)          # Get the GenePattern session
    task = GPTask(session, name_or_lsid)            # Initialize a task object

    try: task.param_load()                          # Query the GenePattern server for the module's metadata
    except HTTPError: return None                   # Return None if no module available

    return GPTaskWidget(task)                       # Return the task widget
