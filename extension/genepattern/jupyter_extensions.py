import gp
from IPython.core.magic import Magics, magics_class, line_magic

"""
Jupyter-related extensions for GenePattern Notebook
"""

@magics_class
class GenePatternMagic(Magics):
    """
    GenePattern Notebook magic commands
    """

    @line_magic
    def get_job(self, line):
        args = line.split(" ")          # GPServer, job number
        if len(args) != 4:
            return 'Incorrect number of args. Need 4: Server URL, username, password, job number'

        server = gp.GPServer(args[0], args[1], args[2])
        job = gp.GPJob(server, int(args[3]))
        return job

    @line_magic
    def get_task(self, line):
        args = line.split(" ")          # GPServer, task name or lsid
        if len(args) != 4:
            return 'Incorrect number of args. Need 4: Server URL, username, password, task name or LSID'

        server = gp.GPServer(args[0], args[1], args[2])
        task = gp.GPTask(server, args[3])
        return task


def load_ipython_extension(ipython):
    ipython.register_magics(GenePatternMagic)


def _jupyter_server_extension_paths():
    return [{
        "module": "genepattern"
    }]


def _jupyter_nbextension_paths():
    return [dict(
        section="notebook",
        # the path is relative to the `my_fancy_module` directory
        src="static",
        # directory in the `nbextension/` namespace
        dest="genepattern",
        # _also_ in the `nbextension/` namespace
        require="genepattern/index")]


def load_jupyter_server_extension(nbapp):
    nbapp.log.info("GenePattern Notebook enabled!")