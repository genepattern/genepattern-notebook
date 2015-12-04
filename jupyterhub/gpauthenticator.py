"""
Custom Authenticator to use GenePattern OAuth2 with JupyterHub
@author Thorin Tabor
Adapted from OAuthenticator code
"""

from tornado import gen, web
from tornado.httputil import url_concat
from tornado.httpclient import HTTPRequest, AsyncHTTPClient, HTTPError
from jupyterhub.auth import Authenticator, LocalAuthenticator


class GenePatternAuthenticator(Authenticator):

    @gen.coroutine
    def authenticate(self, handler, data):
        """Authenticate with GenePattern, and return the username if login is successful.

        Return None otherwise.
        """
        http_client = AsyncHTTPClient()
        username = data['username']
        password = data['password']

        # if not self.check_whitelist(username):
        #     return

        # Set the necessary params
        params = dict(
            grant_type="password",
            username=username,
            password=password,
            client_id="GenePatternNotebook"
        )

        url = url_concat("http://127.0.0.1:8080/gp/rest/v1/oauth2/token", params)

        req = HTTPRequest(url,
                          method="POST",
                          headers={"Accept": "application/json"},
                          body=''  # Body is required for a POST...
                          )

        resp = None
        try:
            resp = yield http_client.fetch(req)
        except HTTPError as e:
            # This is likely a 400 Bad Request error due to an invalid username or password
            return

        if resp is not None and resp.code == 200:
            return username
        else:
            return


class LocalGenePatternAuthenticator(LocalAuthenticator, GenePatternAuthenticator):
    """A version that mixes in local system user creation"""
    pass
