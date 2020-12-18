import gp
from IPython.display import display
from nbtools import UIBuilder, ToolManager, NBTool, EventManager
from .sessions import session
from .shim import login, system_message
from .taskwidget import TaskTool


GENEPATTERN_SERVERS = {
    'GenePattern Cloud': 'https://cloud.genepattern.org/gp',
    'Indiana University': 'https://gp.indiana.edu/gp',
    'Broad Internal': 'https://gpbroad.broadinstitute.org/gp',
}


REGISTER_EVENT = """
    const target = event.target;
    const widget = target.closest('.nbtools') || target;
    const server_input = widget.querySelector('input[type=text]');
    if (server_input) window.open(server_input.value + '/pages/registerUser.jsf');
    else console.warn('Cannot obtain GenePattern Server URL');"""


class GPAuthWidget(UIBuilder):
    """A widget for authenticating with a GenePattern server"""
    default_color = 'rgba(10, 45, 105, 0.80)'
    login_spec = {  # The display values for building the login UI
        'name': 'Login',
        'collapse': False,
        'display_header': False,
        'color': default_color,
        'run_label': 'Log into GenePattern',
        'buttons': {
            'Register an Account': REGISTER_EVENT
        },
        'parameters': {
            'server': {
                'name': 'GenePattern Server',
                'type': 'choice',
                'combo': True,
                'sendto': False,
                'default': GENEPATTERN_SERVERS['GenePattern Cloud'],
                'choices': GENEPATTERN_SERVERS
            },
            'username': {
                'name': 'Username',
                'sendto': False,
            },
            'password': {
                'name': 'Password',
                'type': 'password',
                'sendto': False,
            }
        }
    }

    def __init__(self, session=None, **kwargs):
        """Initialize the authentication widget"""

        # Assign the session object, lazily creating one if needed
        if session is None: self.session = gp.GPServer('', '', '')
        else: self.session = session

        # Set blank token
        self.token = None

        # Check to see if the provided session has valid credentials
        if self.has_credentials() and self.validate_credentials():
            self.register_session()     # Register the session with the SessionList
            self.register_modules()     # Register the modules with the ToolManager
            self.system_message()       # Display the system message
            self.trigger_login()        # Trigger login callbacks of job and task widgets

            # Display the widget with the system message and no form
            UIBuilder.__init__(self, lambda: None, name=self.session.url, display_header=False, display_footer=False,
                               color=self.default_color, collapsed=True, **kwargs)

        # If not, prompt the user to login
        else:
            # Apply the display spec
            for key, value in self.login_spec.items(): kwargs[key] = value

            # Call the superclass constructor with the spec
            UIBuilder.__init__(self, self.login, **kwargs)

    def login(self, server, username, password):
        """Login to the GenePattern server"""
        # Assign login values to session
        self.session.url = server
        self.session.username = username
        self.session.password = password

        # Validate the provided credentials
        if self.validate_credentials():
            self.replace_widget()

    def has_credentials(self):
        """Test whether the session object is instantiated and whether a username and password have been provided"""
        if type(self.session) is not gp.GPServer: return False  # Test type
        if not self.session.url: return False                   # Test server url
        if not self.session.username: return False              # Test username
        if not self.session.password: return False              # Test password
        return True

    def validate_credentials(self):
        """Call gpserver.login() to validate the provided credentials"""
        try:
            # Check to see if gp library supports login, otherwise call login shim
            if hasattr(self.session, 'login'): self.token = self.session.login()
            else: self.token = login(self.session)
            return True
        except BaseException as e:
            self.error = str(e)
            return False

    def replace_widget(self):
        """Replace the unauthenticated widget with the authenticated widget"""
        self.form.children[2].value = ''        # Blank password so it doesn't get serialized
        display(GPAuthWidget(self.session))     # Display the authenticated widget
        self.close()                            # Close the unauthenticated widget

    def register_session(self):
        """Register the validated credentials with the SessionList"""
        self.session = session.register(self.session.url, self.session.username, self.session.password)

    def register_modules(self):
        """Get the list available modules and register widgets for them with the tool manager"""
        for task in self.session.get_task_list():
            tool = TaskTool(server_name(self.session.url), task)
            ToolManager.instance().register(tool)

    def system_message(self):
        if hasattr(self.session, 'system_message'): message = self.session.system_message()
        else: message = system_message(self.session)
        self.info = message

    def trigger_login(self):
        """Dispatch a login event after authentication"""
        EventManager.instance().dispatch("gp.login", self.session)


def server_name(search_url):
    """Search the GENEPATTERN_SERVERS dict for the server with the matching URL"""
    for name, url in GENEPATTERN_SERVERS.items():
        if url == search_url: return name
    return search_url


class AuthenticationTool(NBTool):
    """Tool wrapper for the authentication widget"""
    origin = '+'
    id = 'authentication'
    name = 'GenePattern Login'
    description = 'Log into a GenePattern server'
    load = lambda x: GPAuthWidget()


# Register the authentication widget
ToolManager.instance().register(AuthenticationTool())

