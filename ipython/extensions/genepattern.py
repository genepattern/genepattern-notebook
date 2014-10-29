from IPython.core.magic import Magics, magics_class, line_magic
from client import *


@magics_class
class GenePatternMagic(Magics):
    """
    GenePattern extension demo
    """

    @line_magic
    def get_job(self, line):
        args = line.split(" ")          # Server URL, username, password, job number
        if len(args) != 4:
            return "Incorrect number of args. Need 4."

        server = ServerData(args[0], args[1], args[2])
        job = GPJob(args[0] + "/rest/v1/jobs/" + args[3])
        job.get_info(server)
        return job

    # @line_magic
    # def get_task(self, line):
    #     task = GPTask(line)
    #     return task


def load_ipython_extension(ipython):
    # The `ipython` argument is the currently active `InteractiveShell`
    # instance, which can be used in any way. This allows you to register
    # new magics or aliases, for example.
    print "GenePattern IPython Module Loaded!"
    ipython.register_magics(GenePatternMagic)


def unload_ipython_extension(ipython):
    # If you want your extension to be unloadable, put that logic here.
    return True