from gp import GPFile
from .sessions import session as sessions
from urllib.request import urlopen
from urllib.parse import urlparse


GENEPATTERN_SERVERS = {
    'GenePattern Cloud': 'https://cloud.genepattern.org/gp',
}


GENEPATTERN_COLORS = [(10, 45, 105, 0.80),
                      (15, 75, 105, 0.80),
                      (115, 25, 10, 0.80),
                      (15, 105, 75, 0.80),]


def server_name(search_url):
    """Search the GENEPATTERN_SERVERS dict for the server with the matching URL"""
    for name, url in GENEPATTERN_SERVERS.items():
        if url == search_url: return name
    return search_url


def color_string(r, g, b, a, secondary_color=False):
    return f'rgba({r}, {g}, {b}, {0.50 if secondary_color else a})'


def session_color(index=0, secondary_color=False):
    if type(index) == int:
        return color_string(*GENEPATTERN_COLORS[index % len(GENEPATTERN_COLORS)], secondary_color)
    else:
        servers = list(GENEPATTERN_SERVERS.values())
        for i in range(len(servers)):
            if index == servers[i]: return color_string(*GENEPATTERN_COLORS[i], secondary_color)
        return color_string(*GENEPATTERN_COLORS[-1], secondary_color)


def filelike(file_url, session_index=None):
    """
    Create a file-like object for the given URL.
    If it is a GenePattern URL, return a GPFile (file-like) object with embedded auth.
    Optionally provide a GenePattern session identifier, otherwise extract it from the URL.
    """
    if session_index is None:  # If no session_index specified, extract it from the URL
        session_index = f'{urlparse(file_url).scheme}://{urlparse(file_url).netloc}/gp'
    session = sessions.get(session_index)  # Get the GenePattern session
    if session is None:                    # If no session, assume this isn't a GenePattern URL
        return urlopen(file_url)           # Return a generic file-like pointing to the response
    return GPFile(session, file_url)       # Otherwise, return a GPFile object
