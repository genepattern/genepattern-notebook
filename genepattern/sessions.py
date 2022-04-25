import gp
import warnings


class SessionList:
    """
    Keeps a list of all currently registered GenePattern server sessions
    """
    sessions = []

    def register(self, server, username, password):
        """
        Register a new GenePattern server session for the provided
        server, username and password. Return the session.
        :param server:
        :param username:
        :param password:
        :return:
        """

        # Create the session
        session = gp.GPServer(server, username, password)

        # Validate username if not empty
        valid_username = username != "" and username is not None

        # Validate that the server is not already registered
        index = self._get_index(server)
        new_server = index == -1

        # Add the new session to the list
        if valid_username and new_server:
            self.sessions.append(session)

        # Replace old session is one exists
        if valid_username and not new_server:
            self.sessions[index] = session

        return session

    def get(self, server):
        """
        Returns a registered GPServer object with a matching GenePattern server url or index
        Returns None if no matching result was found
        :param server:
        :return:
        """

        # Handle indexes
        if isinstance(server, int):
            if server >= len(self.sessions):
                return None
            else:
                return self.sessions[server]

        # Handle server URLs
        index = self._get_index(server)
        if index == -1:
            return None
        else:
            return self.sessions[index]

    def make(self, server):
        """
        Returns the registered session, if one exists.
        Otherwise, returns a placeholder session with the URL but no credentials
        :param server:
        :return:
        """
        session = self.get(server)
        if session: return session
        elif isinstance(server, int): raise RuntimeError('make() does not support session indexes')
        else: return gp.GPServer(server, None, None)

    def clean(self):
        """
        Clear all GenePattern sessions from the sessions list
        :return:
        """
        self.sessions = []

    def _get_index(self, server_url):
        """
        Returns a registered GPServer object with a matching GenePattern server url
        Returns -1 if no matching result was found
        :param server_url:
        :return:
        """
        for i in range(len(self.sessions)):
            session = self.sessions[i]
            if session.url == server_url:
                return i
        return -1


"""
GenePattern Sessions Singleton
"""
session = SessionList()


def get_session(index):
    """Deprecated: genepattern.get_session shim added for the purposes of backward compatibility"""
    warnings.warn("genepattern.get_session() has been deprecated. Please use genepattern.session.get() instead.", UserWarning)
    return session.get(index)


def register_session(server, username, password):
    """Deprecated call for backward compatibility"""
    warnings.warn("register_session will be deprecated, use sessions.register instead", UserWarning)
    return session.register(server, username, password)
