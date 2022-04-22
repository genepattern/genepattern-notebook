from gp import GPFile
from .sessions import session as sessions
import base64
from urllib.request import urlopen
from urllib.parse import urlparse


GENEPATTERN_SERVERS = {
    'GenePattern Cloud': 'https://cloud.genepattern.org/gp',
}


GENEPATTERN_COLORS = [(10, 45, 105, 0.80),
                      (15, 75, 105, 0.80),
                      (115, 25, 10, 0.80),
                      (15, 105, 75, 0.80),]


GENEPATTERN_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA4IAAABLCAMAAAAS2MmyAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAMBQTFRF////9Yx80tDnkYvCurfbhoG01NTX+vr6+Pj47Ozs9aeW/Pz89PT07u7u9vb28PDw8vLy6err9Htr/v7+8mpcU0+Y+fr67RwkxsTeLjGS6+zt6uvs7e3t7+/v4uPkp6XF5ePw8PD28fHx9/j44+HtnprH5+fo8V1RtLDVWFSgdG6r98Cv8/Pz+/v7+dvR/f7+9fX1+/z88fLy3N3e9fb2+fn59/f37O3t29jq+uvm/f39wsLT/v//rarNs7HP////uxeysgAAAEB0Uk5T////////////////////////////////////////////////////////////////////////////////////AMJ7sUQAABKgSURBVHja7J19Y5w2EsZx2wsksOw69Hw5J5u262uaNnBeOwHn6Avf/1ud7PXCSPOMkFjsrBtN8octjUajQT+EXsBRNJ90QYIE8ZUoIBgkSEAwSJCAYEAwSJAvhuBv/+TyKope/MLlpVL/F5CAYJAgj4LgSUAwSJCAYJAgXweC33//i/n/pAgIBgkyJ4KFEohg8YdCkMmJUkcI3ppxBD6s4AQJ4oRgMS+CT2kdNaz5BvnbjYJPazcj7L4EOYpR8MNsCD61LcWwBRrkGBCs5kLw6W3rh3MIQY5kFHzJ5OQPbwSf4NGacBjIHpIxjSPx84hCZlNrlUAE2/rDy5ffG/9enih1hOCtmUMIPK4eHQ7kjYQkIPgoCLZ4FPRE8EkeMX0Ej63Fj5Dv8abPEZjDbfytEIw/vAQIeo6CT/OY90N7bC19nEPs3YxlEKBhz3WTw20QP6PjCZkdwTRNIYJpChG8TFOEoLKSHkjg14Kg29PckSMYBQQfAcEKIfgi9UHQ2muPmMEHvGvYCh/zRNNAsAgIfqlR8EXigeBYl/36ELQWjp4SglFAcC4E06qqIIIVnAu+UOoIQZVcjfZkf4VjQNDK5leDYNEaYtOYo5bDLXxxBAdXimkI3j6Inpj/XyTuCEZeq2hPAsEuICj2qoDg7AjGHxiAfqOgS299agh2AUGphwcEJyJYxXH8269cXsXqQfTk5KX2T42CdRwjBJWVeMoI9+QQ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';


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
