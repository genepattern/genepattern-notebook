from threading import Timer
from urllib.error import HTTPError

from ipywidgets import Dropdown, Button, VBox, HBox

from genepattern.shim import get_permissions, set_permissions, get_token
from nbtools import UIOutput, EventManager, ToolManager


class GPJobWidget(UIOutput):
    """A widget for representing the status of a GenePattern job"""
    default_color = 'rgba(10, 45, 105, 0.80)'
    sharing_displayed = False
    job = None

    def __init__(self, job=None, **kwargs):
        """Initialize the job widget"""
        UIOutput.__init__(self, color=self.default_color, **kwargs)
        self.job = job
        self.poll()  # Query the GP server and begin polling, if needed
        self.attach_detach()
        self.attach_sharing()

        # Register the event handler for GP login
        EventManager.instance().register("gp.login", self.login_callback)

    def poll(self):
        """Poll the GenePattern server for the job info and display it in the widget"""
        if self.job is not None and self.job.server_data is not None:
            try:  # Attempt to load the job info from the GP server
                self.job.get_info()
            except HTTPError:  # Handle HTTP errors contacting the server
                self.name = 'Error Loading Job'
                self.error = f'Error loading job #{self.job.job_number}'
                return

            # Add the job information to the widget
            self.name = f'{self.job.job_number}'
            self.status = self.status_text()
            self.description = self.submitted_text()
            self.files = self.files_list()
            self.visualization = self.visualizer()

            # Send notification if completed
            self.handle_notification()

            self.extra_file_menu_items = {
                'Send to Code': {
                    'action': 'cell',
                    'code': f'import genepattern\n\nfile_{self.job.job_number} = genepattern.session.get("{self.job.server_data.url}").get_job({self.job.job_number}).get_file("{{{{file_name}}}}")\nfile_{self.job.job_number}'
                },
                'Send to Dataframe': {
                    'action': 'cell',
                    'kinds': ['gct', 'odf'],
                    'code': f'import genepattern\nfrom gp.data import GCT as gct, ODF as odf\n\nfile_{self.job.job_number} = {{{{type}}}}(genepattern.session.get("{self.job.server_data.url}").get_job({self.job.job_number}).get_file("{{{{file_name}}}}"))\nfile_{self.job.job_number}'
                }
            }

            # Handle child jobs
            if len(self.appendix.children) == 0:
                self.appendix.children = [GPJobWidget(child) for child in self.job.get_child_jobs()]

            # Begin polling if pending or running
            self.poll_if_needed()
        else:
            # Display error message if no initialized GPJob object is provided
            self.name = 'Not Authenticated'
            self.error = 'You must be authenticated before the job can be displayed. After you authenticate it may take a few seconds for the information to appear.'

    def visualizer(self):
        if self.job is None: return  # Ensure the job has been set

        # Get the token, using the shim if necessary
        if hasattr(self.job.server_data, 'get_token'): token = self.job.server_data.get_token()
        else: token = get_token(self.job.server_data)

        # Handle server-relative URLs
        if 'launchUrl' in self.job.info:
            launch_url = self.job.info["launchUrl"]
            if launch_url[0] == '/': launch_url = launch_url[3:]
            return f'{self.job.server_data.url}{launch_url}#{token}'

        # Handle index.html or single HTML returns
        single_html = None
        for f in self.files:
            if f.endswith('/index.html'):
                return f
            elif f.endswith('.html') and single_html is None:
                single_html = f
            elif f.endswith('.html') and single_html is not None:
                single_html = False
        if single_html: return f'{single_html}#{token}'

        # Otherwise there is no visualizer
        return ''

    def poll_if_needed(self):
        """Begin a polling interval if the job is pending or running"""
        if self.status == 'Pending' or self.status == 'Running':
            timer = Timer(15.0, lambda: self.poll())
            timer.start()

    def submitted_text(self):
        """Return pretty job submission text"""
        if self.job is None: return  # Ensure the job has been set
        return f'Submitted by {self.job.info["userId"]} on {self.job.date_submitted}'

    def files_list(self):
        """Return the list of output and log files in the format the widget can handle"""
        if self.job is None: return  # Ensure the job has been set
        return [f['link']['href'] for f in (self.job.output_files + self.job.log_files)]

    def handle_notification(self):
        if self.status == 'Error':
            ToolManager.instance().send('notification', {'message': f'Job #{self.name} has an error!', 'sender': 'GenePattern Notebook'})
        elif self.status == 'Completed':
            ToolManager.instance().send('notification', {'message': f'Job #{self.name} is complete!', 'sender': 'GenePattern Notebook'})

    def status_text(self):
        """Return concise status text"""
        if self.job is None: return ''  # Ensure the job has been set
        if 'hasError' in self.job.info['status'] and self.job.info['status']['hasError']:
            return 'Error'
        elif 'completedInGp' in self.job.info['status'] and self.job.info['status']['completedInGp']:
            return 'Completed'
        elif 'isPending' in self.job.info['status'] and self.job.info['status']['isPending']:
            return 'Pending'
        else:
            return 'Running'

    def attach_detach(self):
        """Attach the menu option to detach the job widget from the analysis cell"""
        self.extra_menu_items = {**self.extra_menu_items, **{'Detach Job': {
                'action': 'cell',
                'code': f'import gp\n\ngenepattern.display(gp.GPJob(genepattern.session.get(0), {self.job.job_number}))'  # FIXME: support non-default sessions
            }}}

    def attach_sharing(self):
        if self.sharing_displayed: self.toggle_job_sharing()  # Display sharing if toggled on
        self.extra_menu_items = {**self.extra_menu_items, **{'Share Job': {
                'action': 'method',
                'code': 'toggle_job_sharing'
            }}}

    def build_sharing_controls(self):
        """Create and return a VBox with the job sharing controls"""
        # Query job permissions, using the shim if necessary
        if hasattr(self.job, 'get_permissions'):
            perms = self.job.get_permissions()
        else:
            perms = get_permissions(self.job)
        group_widgets = []

        # Build the job sharing form by iterating over groups
        for g in perms['groups']:
            d = Dropdown(description=g['id'], options=['Private', 'Read', 'Read & Write'])
            if g['read'] and g['write']:
                d.value = 'Read & Write'
            elif g['read']:
                d.value = 'Read'
            group_widgets.append(d)

        # Cancel / Close the sharing form functionality
        cancel_button = Button(description='Cancel')
        cancel_button.on_click(lambda b: self.toggle_job_sharing())

        # Save sharing permissions functionality
        def save_permissions(button):
            save_perms = []
            for g in group_widgets:
                if g.value == 'Read & Write':
                    save_perms.append({'id': g.description, 'read': True, 'write': True})
                elif g.value == 'Read':
                    save_perms.append({'id': g.description, 'read': True, 'write': False})
                else:
                    save_perms.append({'id': g.description, 'read': False, 'write': False})
            # Save the permissions, using the shim if necessary
            if hasattr(self.job, 'set_permissions'):
                self.job.set_permissions(save_perms)
            else:
                set_permissions(self.job, save_perms)
            self.toggle_job_sharing()

        save_button = Button(description='Save', button_style='info')
        save_button.on_click(save_permissions)

        # Create the button HBox
        button_box = HBox(children=[cancel_button, save_button])

        # Create the job sharing box and attach to the job widget
        return VBox(children=group_widgets + [button_box])

    def toggle_job_sharing(self):
        """Toggle displaying the job sharing controls off and on"""
        # Handle None's
        if self.job is None or self.job.server_data is None:
            return  # Ignore this call if the job has not been properly initialized

        if self.sharing_displayed:
            # Add the old appendix children back to the widget if any exist, else simply remove the sharing box
            self.appendix.children = self.sharing_displayed if self.sharing_displayed is not True else []
            self.sharing_displayed = False
        else:
            # Create the job sharing box
            permissions_box = self.build_sharing_controls()
            # Save any child widgets in the appendix so that they're available when toggled back on
            self.sharing_displayed = self.appendix.children if self.appendix.children else True
            # Attach to the job widget
            self.appendix.children = [permissions_box]

    def login_callback(self, data):
        """Callback for after a user authenticates"""
        if self.job is not None and self.job.server_data is None:
            self.job.server_data = data
            self.error = ''
            self.poll()