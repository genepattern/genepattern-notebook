from gp import GPFile
from .sessions import session as sessions
from urllib.request import urlopen
from urllib.parse import urlparse


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
