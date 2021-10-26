from io import StringIO
from html.parser import HTMLParser
from gp import GPTask, GPTaskParam
import json
import requests
import urllib.parse
import urllib.request


def get_token(session):
    if not hasattr(session, 'token') or not session.token:
        session.token = session.login()
    return session.token


def get_kinds(param):
    if 'fileFormat' not in param.attributes:
        return []  # Default to an empty list

    # Get the list from the attributes
    kinds_string = param.attributes['fileFormat']

    if kinds_string == '' or kinds_string == '*':
        return []  # Accepts all known kinds

    return kinds_string.split(';')


def get_permissions(job):
    url = f'{job.server_data.url}/rest/v1/jobs/{job.job_number}/permissions'
    request = urllib.request.Request(url)
    if job.server_data.authorization_header() is not None:
        request.add_header('Authorization', job.server_data.authorization_header())
    request.add_header('User-Agent', 'GenePatternRest')

    response = urllib.request.urlopen(request)
    return json.loads(response.read())


def set_permissions(job, permissions):
    url = f'{job.server_data.url}/rest/v1/jobs/{job.job_number}/permissions'
    data = json.dumps(permissions).encode('utf8')
    request = urllib.request.Request(url, data=data, method='PUT')
    if job.server_data.authorization_header() is not None:
        request.add_header('Authorization', job.server_data.authorization_header())
    request.add_header('User-Agent', 'GenePatternRest')
    urllib.request.urlopen(request)


def login(session):
    safe_url = ensure_safe_url(session.url)
    safe_username = urllib.parse.quote(session.username)
    safe_password = urllib.parse.quote(session.password)

    url = f"{safe_url}/rest/v1/oauth2/token?grant_type=password&username={safe_username}&password={safe_password}&client_id=GenePatternNotebook-{safe_username}"
    response = requests.post(url)

    try:
        response.raise_for_status()
        return response.json()['access_token']
    except requests.exceptions.Timeout:
        raise TimeoutError('Connection timed out attempting to contact GenePattern server')
    except requests.exceptions.TooManyRedirects:
        raise TimeoutError('Bad GenePattern server URL')
    except requests.exceptions.RequestException as e:
        raise TimeoutError('Invalid username or password')


def system_message(session):
    safe_url = ensure_safe_url(session.url)
    url = f"{safe_url}/rest/v1/config/system-message"
    response = requests.get(url)
    return strip_html(response.text)


def get_task(session, lsid_or_name):
    url = f'{session.url}/rest/v1/tasks/{lsid_or_name}/'
    request = urllib.request.Request(url)
    if session.authorization_header() is not None:
        request.add_header('Authorization', session.authorization_header())
    request.add_header('User-Agent', 'GenePatternRest')

    response = urllib.request.urlopen(request)
    task_dict = json.loads(response.read())
    return GPTask(session, task_dict['lsid'], task_dict)


class HTMLStripper(HTMLParser):
    """Parse HTML blob and strip out all tags"""
    def __init__(self):
        super().__init__()
        self.reset()
        self.strict = False
        self.convert_charrefs = True
        self.text = StringIO()

    def error(self, message):
        pass

    def handle_data(self, d):
        self.text.write(d)

    def get_data(self):
        return self.text.getvalue()


def strip_html(html):
    """Strip potentially unsafe HTML from the system message string"""
    s = HTMLStripper()
    s.feed(html)
    return s.get_data()


def ensure_safe_url(url):
    """Ensure the GenePattern URL ends with /gp"""
    if url.endswith('/'):
        url = url[:-1]
    if not url.endswith('/gp'):
        url += '/gp'
    return url


def get_eula(task):
    """Return a dict containing the module's EULA information"""
    return task.dto['eulaInfo']


def accept_eula(task):
    """Call the EULA accept endpoint"""
    eula = get_eula(task)
    requests.put(eula['acceptUrl'], data=eula['acceptData'],
                 auth=(task.server_data.username, task.server_data.password))
    task.param_load()


def job_params(task):
    if 'config' in task.dto and 'job.inputParams' in task.dto['config']:
        return [GPTaskParam(task, p) for p in task.dto['config']['job.inputParams']]
    else:
        return []


def param_groups(task):
    if 'paramGroups' in task.dto: return task.dto['paramGroups']
    else: return []


def job_group(task):
    if 'config' in task.dto and 'job.inputParamGroup' in task.dto['config']:
        return task.dto['config']['job.inputParamGroup']
    else:
        return {}


def terminate_job(job):
    url = f'{job.server_data.url}/rest/v1/jobs/{job.job_number}/terminate'
    request = urllib.request.Request(url, method='DELETE')
    if job.server_data.authorization_header() is not None:
        request.add_header('Authorization', job.server_data.authorization_header())
    request.add_header('User-Agent', 'GenePatternRest')
    return urllib.request.urlopen(request).code == 200
