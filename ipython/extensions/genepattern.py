from IPython.core.magic import Magics, magics_class, line_magic
from client import *



# class GPJob(object):
#     def __init__(self, job_number):
#         self.job_number = job_number
#
#     def _repr_html_(self):
#         to_return = '<script type="text/javascript">gp.setServer("http://127.0.0.1:8080/gp");</script>'
#         to_return = to_return + '<div class="gp-embed" name="' + self.job_number + '"></div>'
#         to_return = to_return + '<script type="text/javascript">var w = $(".gp-embed[name=' + self.job_number + ']");</script>'
#         to_return = to_return + '<script type="text/javascript">gp.tasks({ success: function() { w.jobResults({ jobNumber: ' + self.job_number + ' }); } });</script>'
#
#         return to_return
#
#
# class GPTask(object):
#     def __init__(self, name):
#         self.name = name
#
#     def _repr_html_(self):
#         to_return = '<script type="text/javascript">gp.setServer("http://127.0.0.1:8080/gp");</script>'
#         to_return = to_return + '<div class="gp-embed" name=' + self.name + '></div>'
#         to_return = to_return + '<script type="text/javascript">var w = $(\'.gp-embed[name=' + self.name + ']\');</script>'
#         to_return = to_return + '<script type="text/javascript">gp.tasks({ success: function() { w.runTask({ name: ' + self.name + ' }); } });</script>'
#
#         return to_return


@magics_class
class GenePatternMagic(Magics):
    """
    GenePattern extension demo
    """

    @line_magic
    def get_job(self, line):
        args = line.split(" ")          # Server URL, username, password, job number
        if len(args) != 4:
            return "Incorrect number of args. Need 2."

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