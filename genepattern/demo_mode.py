from IPython.display import display, Javascript
from json import dumps

demo_jobs = []


"""
    BELOW IS AN EXAMPLE OF HOW TO USE DEMO MODE. SUGGESTED USE: WRAP BEHIND UI BUILDER
    
    import genepattern
    
    genepattern.set_demo_jobs([
        {
            'name': 'Conos.Preprocess',
            'job': 389201,  # Make sure to set the permissions of any demo job to 'public'
            'params': {
                'knn': '40',  # Demo mode should be able to match between int and string, but when in doubt use string
                'perplexity': 50
            }
        }, 
        {
            'name': 'Conos.Cluster',
            'job': 82094,
            'params': {
                'conos_object': 'conos_preprocess_output.rds',  # For file parameters, just list the file name, not URL
                'runleiden': 'True',
                'leiden_resolution': '1.0',
                'runwalktrap': 'True',
                'walktrap_steps': '10',
                'umap_distance': '0.05',
                'umap_spread': '5'
            }
        }
    ])
    
    genepattern.activate_demo_mode()
    display(HTML('<div class="alert alert-success">Demo mode activated</div>'))
"""


def set_demo_jobs(jobs):
    global demo_jobs
    demo_jobs = jobs


def demo_jobs_string():
    global demo_jobs
    return dumps(demo_jobs)


def activate_demo_mode():
    display(Javascript("""
        const demo_jobs = """ + demo_jobs_string() + """;

        const file_special_handling = (uiInput, uiValue) => {
            const is_file_param = $(uiInput).hasClass("nbtools-file");
            if (is_file_param) {
                if (uiValue.constructor === Array) {
                    return uiValue.map(val => {
                        if (val.constructor === File) return val.name;
                        else return val.substring(val.lastIndexOf('/')+1)
                    });
                }
                else {
                    return uiValue.substring(uiValue.lastIndexOf('/')+1);
                }
            }
            else {
                return uiValue;
            }
        }

        const get_actual_values = widget => {
            const values = {};
            const uiParams = widget.element.find(".gp-widget-task-param");
            for (let i = 0; i < uiParams.length; i++) {
                const uiParam = $(uiParams[i]);
                const uiInput = uiParam.find(".gp-widget-task-param-input");
                let uiValue = widget._getInputValue(uiInput);
                uiValue = file_special_handling(uiInput, uiValue);
                const uiName = widget._getParamName(uiParam);
                if (uiValue !== null) {
                    // Wrap value in list if not already wrapped
                    if (uiValue.constructor !== Array) {
                        uiValue = [uiValue];
                    }
                    values[uiName] = uiValue;
                }
            }
            return values;
        }

        const params_match = (job, params) => {
            let matched = true;
            Object.keys(job.params).forEach(key => {
                let value = job.params[key];
                if (value.constructor !== Array) {
                    value = [value];
                }
                if (value.toString() !== params[key].toString()) matched = false;
            });
            return matched;
        }

        const check_for_matches = widget => {
            const name = widget.options.task.name();
            const params = get_actual_values(widget);

            let matched = null;
            demo_jobs.forEach(job => {
                if (job.name === name && params_match(job, params)) 
                    matched = job.job
            });

            return matched;
        }

        const intercept_run_button = widget => {
            if (widget.orig_submit) return;                         // Skip if already intercepted
            widget.orig_submit = widget.submit;                     // Store the original submit method
            widget.submit = () => {                                 // Replace with this method
                let matched_job_number = check_for_matches(widget); // Does a mock exist for this job?
                if (matched_job_number) {                           // If there's a match, show the job!
                    widget.expandCollapse(false);                   // And collapse the task widget
                    widget.add_job_widget(widget.options.cell, widget.options.session_index, matched_job_number);
                    let job_widget = widget.options.cell.element.find(".gp-widget-job").data("widget");
                    job_widget.infoMessage("This job contains pre-computed results used to demo GenePattern functionality.");
                    Jupyter.notebook.kernel.execute(`job${matched_job_number} = gp.GPJob(genepattern.session.get(0), ${matched_job_number})`, {}, {});
                }
                else {                                              // If not, ask the user
                    if (confirm('You are running in demo mode and no demo job can be found which ' + 
                                'match your inputs.\\n\\nWould you like to submit the job anyway?')) {
                        widget.orig_submit();                       // Submit the job the normal way
                    }
                }
            }
        }

        const demo_mode_on = () => {
            $(".gp-widget-task").each((i, task_node) => {
                const widget = $(task_node).data("widget");
                intercept_run_button(widget);
            });
        }

        setInterval(demo_mode_on, 1000);
    """))
