/*
 * Create the GenePattern object to hold GP state
 */

/**
 * @author Thorin Tabor
 *
 * Library for interfacing with GenePattern REST API from JavaScript.
 */

/**
 * Declaration of top gp library namespace
 *
 * @required - jQuery 1.5+ library
 */
var GenePattern = GenePattern || {};
GenePattern._server = null;
GenePattern._tasks = [];
GenePattern._jobs = [];
GenePattern.authenticated = false;
GenePattern.initialized = false;
GenePattern.password = null;
GenePattern.username = null;

require(["jquery"], function() {
    /**
     * Sets the URL to the GP server
     * Example: http://genepattern.broadinstitute.org/gp
     *
     * @param url - URL to server including the /gp (or similar)
     */
    GenePattern.setServer = function(url) {
        GenePattern._server = url;
    };


    /**
     * Easily determine if the URL to the GenePattern server has been set or not.
     *
     * @returns {boolean} - true if the server has been set, else false
     */
    GenePattern.isServerSet = function() {
        return GenePattern._server ? true : false;
    };


    /**
     * Returns the server at which this library is pointed
     * @returns {string|null}
     */
    GenePattern.server = function() {
        return GenePattern._server;
    };


    /**
     * Queries for a list of all tasks available to the user. If this data is not yet cached, it will
     * make an AJAX request to get the info, and make a callback once available. If this data is already
     * cached, it will immediately make the callback with the cached data.
     *
     * This does not retrieve or cache parameter information. For that use Task.load()
     *
     * @param pObj - An object that can set the following options:
     *                  force: force an AJAX call, regardless of whether data is cached
     *                  hidden: include hidden modules? default: false
     *                  success: callback function for a done() event,
     *                          expects response and list of Task objects as arguments
     *                  error: callback function for an fail() event, expects exception as argument
     *
     * @returns {jQuery.Deferred} - Returns a jQuery Deferred object for event chaining.
     *      See http://api.jquery.com/jquery.deferred/ for details.
     */
    GenePattern.tasks = function(pObj) {
        var forceRefresh = pObj && pObj.force && pObj.force.toLowerCase() === 'true';
        var useCache = GenePattern._tasks && !forceRefresh;

        if (useCache) {
            return new $.Deferred()
                .done(function() {
                    if (pObj && pObj.success) {
                        pObj.success("cached", GenePattern._tasks);
                    }
                })
                .resolve();
        }
        else {
            var REST_ENDPOINT = "/rest/v1/tasks/all.json";
            var includeHidden = pObj && pObj.hidden && pObj.hidden.toLowerCase() === 'true' ? '?includeHidden=true' : '';

            return $.ajax({
                    url: GenePattern.server() + REST_ENDPOINT + includeHidden,
                    type: 'GET',
                    dataType: 'json',
                    xhrFields: {
                        withCredentials: true
                    }
                })
                .done(function(response) {
                    // Create the new _tasks list and iterate over returned JSON list, creating Task objects
                    GenePattern._tasks = [];
                    var modules = response['all_modules'];
                    if (modules) {
                        for (var i = 0; i < modules.length; i++) {
                            var json = modules[i];
                            GenePattern._tasks.push(new GenePattern.Task(json));
                        }
                    }

                    if (pObj && pObj.success) {
                        pObj.success(response, GenePattern._tasks);
                    }
                })
                .fail(function(exception) {
                    if (pObj && pObj.error) {
                        pObj.error(exception);
                    }
                });
        }
    };


    /**
     * Returns a cached Task() object matching the provided LSID or module name
     *
     * @param pObj - An object specifying of one these two properties:
     *                  lsid: the LSID of the task to load from the server
     *                  name: the name of the task to load from the server
     *                      Alternately a string can be passed in containing LSID or name
     *                      If nothing is defined, an error will be thrown.
     *
     * @returns {GenePattern.Task|null} - The Task object from the cache
     */
    GenePattern.task = function(pObj) {
        // Ensure either lsid or name is defined
        if (!pObj) throw "GenePattern.task() parameter either null or undefined";
        if (typeof pObj === 'object' && !pObj.lsid && !pObj.name) throw "GenePattern.task() parameter does not contain lsid or name";
        if (typeof pObj !== 'string' && typeof pObj !== 'object') throw "GenePattern.task() parameter must be either object or string";
        if (GenePattern._tasks === null) throw "gp task list has not been initialized";

        var identifier = typeof pObj === 'string'? pObj : null;

        for (var i = 0; i < GenePattern._tasks.length; i++) {
            var task = GenePattern._tasks[i];
            if (task.lsid() === pObj.lsid || task.lsid() === identifier) return task;
            if (task.name() === pObj.name || task.name() === identifier) return task;
        }

        return null;
    };


    /**
     * Returns a list of jobs on the server and caches those jobs.
     * To begin a new search include the force parameter
     *
     * @param pObj - An object specifying which jobs to select:
     *                  force: do not use cache, force a new search
     *                  success: callback function for a done() event,
     *                          expects response and list of Job objects as arguments
     *                  error: callback function for an fail() event, expects exception as argument
     *                  userId: select by user (default is all users)
     *                  groupId: the ID of the group to select for
     *                  batchId: the ID of the batch
     *                  pageSize: the maximum number of jobs to select (default is 10)
     *                  page: page of jobs to select (default is 1)
     *                  includeChildren: include child jobs? (default is true)
     *                  includeOutputFiles: include the output files? (default is true)
     *                  includePermissions: include job permissions? (default is true)
     *
     * @returns {jQuery.Deferred} - Returns a jQuery Deferred object for event chaining.
     *      See http://api.jquery.com/jquery.deferred/ for details.
     */
    GenePattern.jobs = function(pObj) {
        var forceRefresh = pObj && pObj.force && pObj.force.toLowerCase() === 'true';
        var useCache = GenePattern._jobs && !forceRefresh;

        if (useCache) {
            return new $.Deferred()
                .done(function() {
                    if (pObj && pObj.success) {
                        pObj.success("cached", GenePattern._jobs);
                    }
                })
                .resolve();
        }
        else {
            var REST_ENDPOINT = "/rest/v1/jobs/?";

            var userId = pObj && pObj['userId'] ? pObj['userId'] : null;
            var groupId = pObj && pObj['groupId'] ? pObj['groupId'] : null;
            var batchId = pObj && pObj['batchId'] ? pObj['batchId'] : null;
            var pageSize = pObj && pObj['pageSize'] ? pObj['pageSize'] : null;
            var page = pObj && pObj['page'] ? pObj['page'] : null;
            var includeChildren = pObj && pObj['includeChildren'] ? pObj['includeChildren'] : null;
            var includeOutputFiles = pObj && pObj['includeOutputFiles'] ? pObj['includeOutputFiles'] : null;
            var includePermissions = pObj && pObj['includePermissions'] ? pObj['includePermissions'] : null;

            if (userId) REST_ENDPOINT += "&userId=" + encodeURIComponent(userId);
            if (groupId) REST_ENDPOINT += "&groupId=" + encodeURIComponent(groupId);
            if (batchId) REST_ENDPOINT += "&batchId=" + encodeURIComponent(batchId);
            if (pageSize) REST_ENDPOINT += "&pageSize=" + encodeURIComponent(pageSize);
            if (page) REST_ENDPOINT += "&page=" + encodeURIComponent(page);
            if (includeChildren) REST_ENDPOINT += "&includeChildren=" + encodeURIComponent(includeChildren);
            if (includeOutputFiles) REST_ENDPOINT += "&includeOutputFiles=" + encodeURIComponent(includeOutputFiles);
            if (includePermissions) REST_ENDPOINT += "&includePermissions=" + encodeURIComponent(includePermissions);

            return $.ajax({
                    url: GenePattern.server() + REST_ENDPOINT,
                    type: 'GET',
                    dataType: 'json',
                    xhrFields: {
                        withCredentials: true
                    }
                })
                .done(function(response) {
                    // Create the new _jobs list and iterate over returned JSON list, creating Job objects
                    GenePattern._jobs = [];
                    var jobs = response['items'];
                    if (jobs) {
                        for (var i = 0; i < jobs.length; i++) {
                            var json = jobs[i];
                            GenePattern._jobs.push(new GenePattern.Job(json));
                        }
                    }

                    if (pObj && pObj.success) {
                        pObj.success(response, GenePattern._tasks);
                    }
                })
                .fail(function(exception) {
                    if (pObj && pObj.error) {
                        pObj.error(exception);
                    }
                });
        }
    };


    /**
     * Returns a Job object either from the cache or from a server query
     *
     * @param pObj - An object specifying this property:
     *                  jobNumber: the job number of the job
     *                  force: do not use cache, force a new query
     *                  success: callback function for a done() event,
     *                          expects response and a Job object as arguments
     *                  error: callback function for an fail() event, expects exception as argument
     *
     * @returns {jQuery.Deferred} - Returns a jQuery Deferred object for event chaining.
     *      See http://api.jquery.com/jquery.deferred/ for details.
     */
    GenePattern.job = function(pObj) {
        var forceRefresh = pObj && pObj.force && pObj.force.toLowerCase() === 'true';
        var jobNumber = pObj.jobNumber;

        // Try to find the job in the cache
        if (!forceRefresh && GenePattern._jobs) {
            for (var i = 0; i < GenePattern._jobs.length; i++) {
                var job = GenePattern._jobs[i];
                if (job.jobNumber() === jobNumber) {
                    return new $.Deferred()
                        .done(function() {
                            if (pObj && pObj.success) {
                                pObj.success("Job cached", job);
                            }
                        })
                        .resolve();
                }
            }
        }

        // Otherwise, if not cached or refreshed forced
        var REST_ENDPOINT = "/rest/v1/jobs/";
        return $.ajax({
                url: GenePattern.server() + REST_ENDPOINT + jobNumber,
                type: 'GET',
                dataType: 'json',
                xhrFields: {
                    withCredentials: true
                }
            })
            .done(function(response) {
                // Create the new _jobs list and iterate over returned JSON list, creating Job objects
                var loadedJob = new GenePattern.Job(response);

                if (pObj && pObj.success) {
                    pObj.success(response, loadedJob);
                }
            })
            .fail(function(exception) {
                if (pObj && pObj.error) {
                    pObj.error(exception);
                }
            });
    };


    /**
     * Uploads a file for running a job
     *
     * @param pObj - An object specifying this property:
     *                  file: This is a File object for the file to upload
     *                          (See the HTML5 File API)
     *                  success: This a callback for after the upload.
     *                          Expects a response and URL to the file resource
     *                  error: Callback for an error. Expects an exception
     */
    GenePattern.upload = function(pObj) {
        // Ensure the file is specified
        if (!pObj) throw "GenePattern.upload() parameter either null or undefined";
        if (typeof pObj === 'object' && typeof pObj.file !== 'object') throw "GenePattern.upload() parameter does not contain a File object";

        var REST_ENDPOINT = "/rest/v1/data/upload/job_input";
        var nameParam = "?name=" + pObj.file.name;

        return $.ajax({
                url: GenePattern.server() + REST_ENDPOINT + nameParam,
                type: 'POST',
                dataType: "text",
                processData: false,
                data: pObj.file,
                xhrFields: {
                    withCredentials: true
                },
                headers: {
                    "Content-Length": pObj.file.size
                },
                success: function(data, textStatus, request){
                    var location = request.getResponseHeader('Location');
                    if (pObj && pObj.success) {
                        pObj.success(textStatus, location);
                    }
                }
            })
            .fail(function(exception) {
                if (pObj && pObj.error) {
                    pObj.error(exception);
                }
            });
    };


    /**
     * Declaration of Task class
     * @constructor
     */
    GenePattern.Task = function(taskJson) {
        // Define class members
        this._tags = null;
        this._description = null;
        this._name = null;
        this._documentation = null;
        this._categories = null;
        this._suites = null;
        this._version = null;
        this._lsid = null;
        this._params = null;

        /**
         * Constructor-like initialization for the Task class
         *
         * @private
         */
        this._init_ = function() {
            if (taskJson) {
                this._tags = taskJson.tags;
                this._description = taskJson.description;
                this._name = taskJson.name;
                this._documentation = taskJson.documentation;
                this._categories = taskJson.categories;
                this._suites = taskJson.suites;
                this._version = taskJson.version;
                this._lsid = taskJson.lsid;
            }
        };
        this._init_();

        /**
         * Returns a JobInput object for submitting a job for this task
         * @returns {GenePattern.JobInput}
         */
        this.jobInput = function() {
            return new GenePattern.JobInput(this);
        };

        /**
         * Loads a Task's parameters from REST call, or retrieves them from the cache
         *
         * @param pObj - The following parameters may be set
         *                  force: Do not use cache, if available. Always make AJAX call.
         *                  success: callback function for a done() event,
         *                          expects response and a list of Param objects as arguments
         *                  error: callback function for an fail() event, expects exception as argument
         *
         * @returns {jQuery.Deferred} - Returns a jQuery Deferred object for event chaining.
         *      See http://api.jquery.com/jquery.deferred/ for details.
         */
        this.params = function(pObj) {
            var task = this;
            var forceRefresh = (pObj && pObj.force && pObj.force.toLowerCase() === 'true') ? true : false;
            var inCache = forceRefresh ? false : task._params !== null;

            if (inCache) {
                return new $.Deferred()
                    .done(function() {
                        if (pObj && pObj.success) {
                            pObj.success("cached", task._params);
                        }
                    })
                    .resolve();
            }
            else {
                var REST_ENDPOINT = "/rest/v1/tasks/";

                return $.ajax({
                        url: GenePattern.server() + REST_ENDPOINT + encodeURIComponent(task.lsid()),
                        type: 'GET',
                        dataType: 'json',
                        xhrFields: {
                            withCredentials: true
                        }
                    })
                    .done(function(response) {
                        // Add params to Task object
                        var params = response['params'];
                        if (params) {
                            task._params = [];
                            for (var i = 0; i < params.length; i++) {
                                var param = params[i];
                                task._params.push(new GenePattern.Param(param));
                            }
                        }

                        if (pObj && pObj.success) {
                            pObj.success(response, task._params);
                        }
                    })
                    .fail(function(exception) {
                        if (pObj && pObj.error) {
                            pObj.error(exception);
                        }
                    });
            }
        };

        /**
         * Getter for Task tags
         *
         * @returns {null|Array}
         */
        this.tags = function() {
            return this._tags;
        };

        /**
         * Getter for Task description
         *
         * @returns {null|string}
         */
        this.description = function() {
            return this._description;
        };

        /**
         * Getter for Task name
         *
         * @returns {null|string}
         */
        this.name = function() {
            return this._name;
        };

        /**
         * Getter for URL to Task documentation
         *
         * @returns {null|string}
         */
        this.documentation = function() {
            return this._documentation;
        };

        /**
         * Getter for list of Task categories
         *
         * @returns {null|Array}
         */
        this.categories = function() {
            return this._categories;
        };

        /**
         * Getter for list of Task suites
         *
         * @returns {null|Array}
         */
        this.suites = function() {
            return this._suites;
        };

        /**
         * Getter for Task version
         *
         * @returns {null|number}
         */
        this.version = function() {
            return this._version;
        };

        /**
         * Getter for Task LSID
         *
         * @returns {null|string}
         */
        this.lsid = function() {
            return this._lsid;
        };
    };


    /**
     * Declaration of Job class
     * @constructor
     */
    GenePattern.Job = function(jobJson) {
        this._task = null;
        this._taskName = null;
        this._taskLsid = null;
        this._userId = null;
        this._permissions = null;
        this._jobNumber = null;
        this._status = null;
        this._dateSubmitted = null;
        this._logFiles = null;
        this._outputFiles = null;
        this._numOutputFiles = null;

        /**
         * Constructor-like initialization for the Job class
         *
         * @private
         */
        this._init_ = function() {
            if (jobJson) {
                this._taskName = jobJson.taskName;
                this._taskLsid = jobJson.taskLsid;
                this._userId = jobJson.userId;
                this._permissions = jobJson.permissions;
                this._jobNumber = typeof jobJson['jobId'] === 'string' ? parseInt(jobJson['jobId']) : jobJson['jobId'];
                this._status = jobJson.status;
                this._dateSubmitted = jobJson.dateSubmitted;
                this._logFiles = jobJson.logFiles;
                this._outputFiles = jobJson.outputFiles;
                this._numOutputFiles = typeof jobJson.numOutputFiles === 'string' ? parseInt(jobJson.numOutputFiles) : jobJson.numOutputFiles;
                this._task = GenePattern.task(this._taskLsid);
            }
        };
        this._init_();

        /**
         * Queries the server for the job's status, updates the Job object and returns
         *
         * @param pObj - The following parameters may be set
         *                  success: callback function for a done() event,
         *                          expects response and a status object as arguments
         *                  error: callback function for an fail() event, expects exception as argument
         *
         * @returns {jQuery.Deferred} - Returns a jQuery Deferred object for event chaining.
         *      See http://api.jquery.com/jquery.deferred/ for details.
         */
        this.update = function(pObj) {
            var REST_ENDPOINT = "/rest/v1/jobs/" + this.jobNumber() + "/status.json";
            var job = this;

            return $.ajax({
                    url: GenePattern.server() + REST_ENDPOINT,
                    type: 'GET',
                    dataType: 'json',
                    xhrFields: {
                        withCredentials: true
                    }
                })
                .done(function(response) {
                    // Add params to Job object
                    var status = response;
                    if (status) {
                        job._status = status;
                    }

                    if (pObj && pObj.success) {
                        pObj.success(response, status);
                    }
                })
                .fail(function(exception) {
                    if (pObj && pObj.error) {
                        pObj.error(exception);
                    }
                });
        };

        /**
         * Returns the Task object associated with the job
         *
         * @returns {null|GenePattern.Task}
         */
        this.task = function() {
            return this._task;
        };

        /**
         * Returns the name of the job's associated task
         * @returns {string}
         */
        this.taskName = function() {
            return this._taskName;
        };

        /**
         * Returns the LSID of the job's associated task
         *
         * @returns {string}
         */
        this.taskLsid = function() {
            return this._taskLsid;
        };

        /**
         * Returns the user ID of the job's owner
         *
         * @returns {string}
         */
        this.userId = function() {
            return this._userId;
        };

        this.permissions = function() {
            return this._permissions;
        };

        /**
         * Returns the job number
         *
         * @returns {number}
         */
        this.jobNumber = function() {
            return this._jobNumber;
        };

        /**
         * Returns a job permissions object
         *
         * @returns {null|object}
         */
        this.permissions = function() {
            return this._permissions;
        };

        /**
         * Returns a job status object
         *
         * @returns {null|object}
         */
        this.status = function() {
            return this._status;
        };

        /**
         * Returns the date the job was submitted
         * @returns {null|string|Date}
         */
        this.dateSubmitted = function() {
            return this._dateSubmitted;
        };

        /**
         * Returns an array of log files associated with the job
         * @returns {Array}
         */
        this.logFiles = function() {
            return this._logFiles;
        };

        /**
         * Returns an array of the output files possessed by the job
         *
         * @returns {Array}
         */
        this.outputFiles = function() {
            return this._outputFiles;
        };

        /**
         * Returns the number of output files the job has currently output
         *
         * @returns {null|number}
         */
        this.numOutputFiles = function() {
            return this._numOutputFiles;
        };
    };


    /**
     * Declaration of Job Input class
     * @constructor
     */
    GenePattern.JobInput = function(task) {
        // Define class members
        this._lsid = null;
        this._params = null;

        // Ensure that Task object has its params initialized
        if (task._params === null) throw "Cannot create JonInput from Task with null params. First call Task.params()";

        /**
         * Constructor-like initialization for the JobInput class
         *
         * @private
         */
        this._init_ = function() {
            if (task) {
                this._lsid = task.lsid();
                this._params = [];
                for (var i = 0; i < task._params.length; i++) {
                    var param = task._params[i];
                    this._params.push(param.clone());
                }
            }
        };
        this._init_();

        /**
         * Getter for Task LSID
         *
         * @returns {string}
         */
        this.lsid = function() {
            return this._lsid;
        };

        /**
         * Getter for the params list
         *
         * @returns {Array}
         */
        this.params = function() {
            return this._params;
        };

        /**
         * Returns a Parameter after looking it up by name
         *      Returns null if the param was not found.
         *
         * @param name - The name of the parameter
         * @returns {GenePattern.Param|null} - The matching Param object
         */
        this.param = function(name) {
            for (var i = 0; i < this._params.length; i++) {
                var param = this._params[i];
                if (param.name() == name) return param;
            }
            return null;
        };

        /**
         * Returns a JSON structure for this Job Input designed to be consumed by a submit() call
         * @returns {object}
         *
         * @private
         */
        this._submitJson_ = function() {
            var lsid = this.lsid();
            var params = [];
            for (var i = 0; i < this.params().length; i++) {
                var param = this.params()[i];
                params.push({
                    name: param.name(),
                    values: param.values() === null ? (param.defaultValue() ? [param.defaultValue()] : []) : param.values(),
                    batchParam: param.batchParam() === null ? false : param.batchParam(),
                    groupId: param.groupId() === null ? "" : param.groupId()
                });
            }
            return {
                lsid: lsid,
                params: params
            };
        };

        /**
         * Submits the task and parameter values to the server as a Job
         *
         * @param pObj - The following parameters may be set
         *                  success: callback function for a done() event,
         *                          expects response and a Job Number as arguments
         *                  error: callback function for an fail() event, expects exception as argument
         *
         * @returns {jQuery.Deferred} - Returns a jQuery Deferred object for event chaining.
         *      See http://api.jquery.com/jquery.deferred/ for details.
         */
        this.submit = function(pObj) {
            var REST_ENDPOINT = "/rest/v1/jobs/";

            return $.ajax({
                    url: GenePattern.server() + REST_ENDPOINT,
                    type: 'POST',
                    data: JSON.stringify(this._submitJson_()),
                    dataType: 'json',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    xhrFields: {
                        withCredentials: true
                    }
                })
                .done(function(response) {
                    // Create Job object from JSON response
                    var jobNumber = response['jobId'];

                    if (pObj && pObj.success) {
                        pObj.success(response, jobNumber);
                    }
                })
                .fail(function(exception) {
                    if (pObj && pObj.error) {
                        pObj.error(exception);
                    }
                });
        };
    };

    /**
     * Declaration of Param class
     * @constructor
     */
    GenePattern.Param = function(paramJson) {
        // Define class members
        this._name = null;
        this._description = null;
        this._choices = null;
        this._values = null;
        this._batchParam = null;
        this._groupId = null;
        this._defaultValue = null;
        this._optional = null;
        this._prefixWhenSpecified = null;
        this._type = null;

        /**
         * Constructor-like initialization for the Param class
         *
         * @private
         */
        this._init_ = function() {
            if (paramJson) {
                if (paramJson) {
                    this._name = Object.keys(paramJson)[0];
                    this._description = paramJson[this._name]['description'];
                    this._choices = paramJson[this._name]['choiceInfo'] ? this._parseChoices(paramJson[this._name]['choiceInfo']) : null;
                    this._values = null;
                    this._batchParam = false;
                    this._groupId = null;
                    this._defaultValue = paramJson[this._name]['attributes']['default_value'];
                    this._optional = paramJson[this._name]['attributes']['optional'] === 'on';
                    this._prefixWhenSpecified = paramJson[this._name]['attributes']['prefix_when_specified'];
                    this._type = paramJson[this._name]['attributes']['type'];
                }
            }
        };

        /**
         * Parses the choice info JSON returned by the server into the expected format
         *
         * @param choiceInfo - The choice info JSON
         * @returns {*}
         * @private
         */
        this._parseChoices = function(choiceInfo) {
            if (choiceInfo['choices']) {
                var choices = {};
                for (var i = 0; i < choiceInfo['choices'].length; i++) {
                    var choice = choiceInfo['choices'][i];
                    choices[choice['label']] = choice['value'];
                }
                return choices;
            }
            else {
                console.log("No choices in choice info. Dynamic choices not yet supported.");
                return null;
            }
        };

        /**
         * Return a clone of this param
         *
         * @returns {GenePattern.Param}
         */
        this.clone = function() {
            var param = new GenePattern.Param();
            param.name(this.name());
            param.values(this.values());
            param.defaultValue(this.defaultValue());
            param.optional(this.optional());
            param.prefixWhenSpecified(this.prefixWhenSpecified());
            param.type(this.type());

            return param;
        };

        /**
         * Returns or sets the value of the parameter
         *
         * @param [value=optional] - The set value of the parameter
         * @returns {null|Array}
         */
        this.values = function(value) {
            if (value !== undefined) {
                this._values = value;
            }
            else {
                return this._values;
            }
        };

        /**
         * Returns or sets whether this parameter is a batch (default is false)
         *
         * @param [batchParam=optional] - Is this parameter a batch?
         * @returns {null|boolean}
         */
        this.batchParam = function(batchParam) {
            if (batchParam !== undefined) {
                this._batchParam = batchParam;
            }
            else {
                return this._batchParam;
            }
        };

        /**
         * Returns or sets the group ID
         *
         * @param [groupId=optional] - the group ID of the parameter
         * @returns {null|string}
         */
        this.groupId = function(groupId) {
            if (groupId !== undefined) {
                this._groupId = groupId;
            }
            else {
                return this._groupId;
            }
        };

        /**
         * Returns or sets the name of the parameter
         *
         * @param [name=optional] - The name of the parameter
         * @returns {string}
         */
        this.name = function(name) {
            if (name !== undefined) {
                this._name = name;
            }
            else {
                return this._name;
            }
        };

        /**
         * Returns or sets the description of the parameter
         *
         * @param [description=optional] - The description of the parameter
         * @returns {string}
         */
        this.description = function(description) {
            if (description !== undefined) {
                this._description = description;
            }
            else {
                return this._description;
            }
        };

        /**
         * Returns or sets the choices for the parameter
         *
         * @param [choices=optional] - The choices for the parameter.
         *              Assumes a object of key : value pairings.
         * @returns {string}
         */
        this.choices = function(choices) {
            if (choices !== undefined) {
                this._choices = choices;
            }
            else {
                return this._choices;
            }
        };

        /**
         * Returns or sets the default value of the parameter
         *
         * @param [defaultValue=optional] - The default value for the parameter
         * @returns {string}
         */
        this.defaultValue = function(defaultValue) {
            if (defaultValue !== undefined) {
                this._defaultValue = defaultValue;
            }
            else {
                return this._defaultValue;
            }
        };

        /**
         * Returns or sets whether the parameter is optional or not
         *
         * @param [optional=optional] - Is this parameter optional?
         * @returns {boolean}
         */
        this.optional = function(optional) {
            if (optional !== undefined) {
                this._optional = optional;
            }
            else {
                return this._optional;
            }
        };

        /**
         * Returns or sets the prefix when specified value
         *
         * @param [prefixWhenSpecified=optional] - What is the prefix?
         * @returns {string}
         */
        this.prefixWhenSpecified = function(prefixWhenSpecified) {
            if (prefixWhenSpecified !== undefined) {
                this._prefixWhenSpecified = prefixWhenSpecified;
            }
            else {
                return this._prefixWhenSpecified;
            }
        };

        /**
         * Returns or sets the type of the parameter
         *
         * @param [type=optional] - The type of this parameter
         * @returns {string}
         */
        this.type = function(type) {
            if (type !== undefined) {
                this._type = type;
            }
            else {
                return this._type;
            }
        };

        // Init the object
        this._init_();
    };
});

/*
 * Navigation widgets
 */

GenePattern.notebook = GenePattern.notebook || {};

/**
 * Attaches the loading screen
 *
 * @returns {*|jQuery}
 */
GenePattern.notebook.loadingScreen = function() {
    return $("<div></div>")
        .addClass("loading-screen")
        .append(
            $("<img/>")
                .attr("src", "/static/custom/GP_logo_on_black.png")
        );
};

/**
 * Attach the bottom "Add Cell" buttons
 * @returns {*|jQuery}
 */
GenePattern.notebook.bottomButton = function() {
    var auth_view = GenePattern.authenticated ? "visible" : "hidden";
    return $("<div></div>")
            .addClass("container add-cell-container")
            .append(
                $("<span></span>")
                    .addClass("fa fa-paragraph add-cell-button")
                    .attr("title", "Add Markdown Cell")
                    .attr("data-toggle", "tooltip")
                    .attr("data-placement", "top")
                    .click(function() {
                        var index = IPython.notebook.get_cells().length;
                        IPython.notebook.insert_cell_below('markdown', index);
                        IPython.notebook.select_next();
                    })
            )
            .append(
                $("<span></span>")
                    .addClass("fa fa-terminal add-cell-button")
                    .attr("title", "Add Code Cell")
                    .attr("data-toggle", "tooltip")
                    .attr("data-placement", "top")
                    .click(function() {
                        var index = IPython.notebook.get_cells().length;
                        IPython.notebook.insert_cell_below('code', index);
                        IPython.notebook.select_next();
                    })
            )
            .append(
                $("<span></span>")
                    .addClass("glyphicon glyphicon-th add-cell-button gp-cell-button")
                    .attr("title", "Add GenePattern Cell")
                    .css("padding-left", "3px")
                    .css("visibility", auth_view)
                    .attr("data-toggle", "tooltip")
                    .attr("data-placement", "top")
                    .click(function() {
                        $(".sidebar-button-main").trigger("click");
                    })
            );
};

/**
 * Attach the left-hand slider tab
 *
 * @returns {*|jQuery}
 */
GenePattern.notebook.sliderTab = function() {
    var auth_view = GenePattern.authenticated ? "inline-block" : "none";
    return $("<span></span>")
            .addClass("glyphicon glyphicon-ok sidebar-button sidebar-button-main")
            .attr("title", "GenePattern Options")
            .attr("data-toggle", "tooltip")
            .attr("data-placement", "right")
            .css("display", auth_view)
            .click(function() {
                $("#slider").show("slide");
            });
};

/**
 * Create a slider option object
 *
 * @param id - ID of the object (usually LSID)
 * @param name - Name of the object (module name)
 * @param anno - Annotation (version number)
 * @param desc - Description
 * @param tags - List of tags
 * @returns {*|jQuery}
 */
GenePattern.notebook.sliderOption = function(id, name, anno, desc, tags) {
    var tagString = tags.join(", ");
    return $("<div></div>")
        .addClass("well well-sm slider-option")
        .attr("name", id)
        .append(
            $("<h4></h4>")
                .addClass("slider-option-name")
                .append(name)
        )
        .append(
            $("<h5></h5>")
                .addClass("slider-option-anno")
                .append(anno)
        )
        .append(
            $("<span></span>")
                .addClass("slider-option-desc")
                .append(desc)
        )
        .append(
            $("<span></span>")
                .addClass("slider-option-tags")
                .append(tagString)
        );
};

/**
 * Attach the GenePattern left-hand slider
 *
 * @returns {*|jQuery}
 */
GenePattern.notebook.slider = function() {
    return $("<div></div>")
        .attr("id", "slider")

        // Append the navigation tab
        .append(
            $("<span></span>")
                .addClass("glyphicon glyphicon-ok sidebar-button sidebar-button-slider")
                .attr("title", "GenePattern Options")
                .attr("data-toggle", "tooltip")
                .attr("data-placement", "right")
                .click(function() {
                    $("#slider").hide("slide");
                })
        )

        // Append the filter box
        .append(
            $("<div></div>")
                .attr("id", "slider-filter-box")
                .append(
                    $("<input/>")
                        .attr("id", "slider-filter")
                        .attr("type", "search")
                        .attr("placeholder", "Type to Filter")
                        .keydown(function(event) {
                            event.stopPropagation();
                        })
                        .keyup(function(event) {
                            var search = $("#slider-filter").val().toLowerCase();
                            $.each($("#slider-tabs").find(".slider-option"), function(index, element) {
                                var raw = $(element).text().toLowerCase();
                                if (raw.indexOf(search) === -1) {
                                    $(element).hide();
                                }
                                else {
                                    $(element).show();
                                }
                            })
                        })
                )
        )

        // Append the internal tabs
        .append(
            $("<div></div>")
                .attr("id", "slider-tabs")
                .addClass("tabbable")
                .append(
                    $("<ul></ul>")
                        .addClass("nav nav-tabs")
                        .append(
                            $("<li></li>")
                                .addClass("active")
                                .append(
                                    $("<a></a>")
                                        .attr("data-toggle", "tab")
                                        .attr("href", "#slider-modules")
                                        .text("Modules")
                                )
                        )
                        .append(
                            $("<li></li>")
                                .append(
                                    $("<a></a>")
                                        .attr("data-toggle", "tab")
                                        .attr("href", "#slider-data")
                                        .text("Data")
                                )
                        )
                        .append(
                            $("<li></li>")
                                .append(
                                    $("<a></a>")
                                        .attr("data-toggle", "tab")
                                        .attr("href", "#slider-jobs")
                                        .text("Jobs")
                                )
                        )
                )
                .append(
                    $("<div></div>")
                        .addClass("tab-content")
                        .append(
                            $("<div></div>")
                                .attr("id", "slider-modules")
                                .addClass("tab-pane active")
                        )
                        .append(
                            $("<div></div>")
                                .attr("id", "slider-data")
                                .addClass("tab-pane")
                        )
                        .append(
                            $("<div></div>")
                                .attr("id", "slider-jobs")
                                .addClass("tab-pane")
                        )
                )
        );
};

/**
 * Authenticate the notebook & change nav accordingly
 *
 * @param data
 */
GenePattern.notebook.authenticate = function(data) {
    // Show the GenePattern cell button
    $(".gp-cell-button").css("visibility", "visible");

    // Show the slider tab
    $(".sidebar-button-main").show("slide", {"direction": "left"});

    // Clear and add the modules to the slider
    $("#slider-modules").empty();
    if (data['all_modules']) {
        $.each(data['all_modules'], function(index, module) {
            var tags = module['categories'];
            $.each(module['tags'], function(i, e) {
                tags.push(e['tag'])
            });
            tags.sort();
            $("#slider-modules").append(GenePattern.notebook.sliderOption(module['lsid'], module['name'], "v" + module['version'], module['description'], tags));
        });
        $("#slider-modules").append($("<p>&nbsp;</p>"))
    }

    console.log(data);
};

/**
 * Convert a status object from a Job object to a display string
 *
 * @param statusObj
 * @returns {string}
 */
GenePattern.notebook.statusIndicator = function(statusObj) {
    if (statusObj["hasError"]) {                // Error
        return "Error";
    }
    else if (statusObj["completedInGp"]) {      // Complete
        return "Completed"
    }
    else if (statusObj["isPending"]) {          // Pending
        return "Pending";
    }
    else {                                      // Running
        return "Running";
    }
};

/**
 * Remove a slider option representing a job from the slider
 *
 * @param jobNumber
 */
GenePattern.notebook.removeSliderJob = function(jobNumber) {
    // Remove from jobs list
    for (var i = 0; i < GenePattern._jobs.length; i++) {
        var job = GenePattern._jobs[i];
        if (job.jobNumber() === jobNumber) {
            GenePattern._jobs.splice(i, 1);
        }
    }

    // Update the UI
    $("#slider-jobs").find(".slider-option[name='" + jobNumber + "']").remove();
};

/**
 * Update a slider option representing a job on the slider
 *
 * @param job
 */
GenePattern.notebook.updateSliderJob = function(job) {
    // If the job does not yet exist in the list, add it
    var jobsSlider = $("#slider-jobs");
    var existingOption = jobsSlider.find(".slider-option[name='" + job.jobNumber() + "']");
    if (existingOption.length < 1) {
        // Add to jobs list
        GenePattern._jobs.push(job);

        // Update the UI
        var option = GenePattern.notebook.sliderOption(job.jobNumber(), job.jobNumber() + ". " + job.taskName(),
            GenePattern.notebook.statusIndicator(job.status()), "Submitted: " + job.dateSubmitted(), []);
        option.click(function() {
            $('#site').animate({
                scrollTop: $(".gp-widget-job[name='" + job.jobNumber() + "']").offset().top
            }, 500);
        });
        jobsSlider.append(option);
    }
    // Otherwise update the view
    else {
        // Update in jobs list
        for (var i = 0; i < GenePattern._jobs.length; i++) {
            var jobInList = GenePattern._jobs[i];
            if (jobInList.jobNumber() === job.jobNumber()) {
                GenePattern._jobs.splice(i, 1, job);
            }
        }

        // Update the UI
        existingOption.find(".slider-option-anno").text(GenePattern.notebook.statusIndicator(job.status()));
    }
};

/*
 * Initialization functions
 */

GenePattern.notebook.init = GenePattern.notebook.init || {};

/**
 * Initialize GenePattern Notebook from the main notebook listing page
 *
 * @param evt
 */
GenePattern.notebook.init.main_init_wrapper = function(evt) {
    GenePattern.notebook.init.launch_init(evt);

    // Mark init as done
    GenePattern.notebook.init.launch_init.done_init = true;
};

/**
 * Initialize GenePattern Notebook from the notebook page
 *
 * @param evt
 */
GenePattern.notebook.init.notebook_init_wrapper = function (evt) {
    if (!GenePattern.notebook.init.launch_init.done_init  && IPython.notebook.kernel) {
        // Call the core init function
        GenePattern.notebook.init.launch_init();

        // If no auth widget exists, add it
        setTimeout(function() {
            if ($(".gp-widget-auth").length < 1) {
                var cell = IPython.notebook.insert_cell_above("code", 0);
                var code = GenePattern.notebook.init.buildCode("http://genepattern.broadinstitute.org/gp", "", "");
                cell.code_mirror.setValue(code);
                cell.execute();
            }
        }, 1000);

        // Mark init as done
        GenePattern.notebook.init.launch_init.done_init = true;
    }
};

/**
 * Build the Python code used to authenticate GenePattern
 *
 * @param server
 * @param username
 * @param password
 */
GenePattern.notebook.init.buildCode = function(server, username, password) {
    return '# !AUTOEXEC\n\
\n\
import gp\n\
from gp_widgets import GPAuthWidget, GPJobWidget\n\
\n\
# The gpserver object holds your authentication credentials and is used to\n\
# make calls to the GenePattern server through the GenePattern Python library.\n\
# Your actual username and password have been removed from the code shown\n\
# below for security reasons.\n\
gpserver = gp.GPServer("' + server + '", "' + username + '", "' + password + '")\n\
\n\
# Return the authentication widget to view it\n\
GPAuthWidget(gpserver)';
};

/**
 * Initialize GenePattern Notebook core functionality
 */
GenePattern.notebook.init.launch_init = function() {
    // Change the logo
    $("#ipython_notebook").find("img").attr("src", "/static/custom/GP_logo_on_black.png");

    // Add the bottom buttons
    $("#notebook-container").append(GenePattern.notebook.bottomButton());

    // Add the sidebar
    var body = $("body");
    body.append(GenePattern.notebook.sliderTab());
    body.append(GenePattern.notebook.slider());

    // Initialize tooltips
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    });

    // Auto-run widgets
    $(function () {
        $.each($(".cell"), function(index, val) {
            if ($(val).html().indexOf("# !AUTOEXEC") > -1) {
                IPython.notebook.get_cell(index).execute();
            }
        });
    });

    // Hide the loading screen
    setTimeout(function () {
        $(".loading-screen").toggle("fade");
    }, 100);
};

/*
 * Initialize the page
 */

require(["jquery"], function() {
    // Add the loading screen
    $("body").append(GenePattern.notebook.loadingScreen());

    // If in a notebook, display with the full event model
    $([IPython.events]).on('kernel_ready.Kernel kernel_created.Session notebook_loaded.Notebook', GenePattern.notebook.init.notebook_init_wrapper);

    // If the notebook listing page, display with alternate event model
    if ($(document).find("#notebooks").length > 0) {
        setTimeout(GenePattern.notebook.init.main_init_wrapper, 1000);
    }
});

/**
 * Define the IPython GenePattern Authentication widget
 */
require(["widgets/js/widget"], function (WidgetManager) {

    var AuthWidgetView = IPython.WidgetView.extend({
        render: function () {
            var widget = this;
            // Render the view.
            this.setElement(
                $("<div></div>")
                    .addClass("panel panel-primary gp-widget gp-widget-auth")
                    .append(
                        $("<div></div>")
                            .addClass("panel-heading")
                            .append(
                                $("<div></div>")
                                    .addClass("widget-float-right")
                                    .append(
                                        $("<span></span>")
                                            .addClass("widget-server-label")
                                            .append(widget.getServerLabel(""))
                                    )
                                    .append(
                                        $("<button></button>")
                                            .addClass("btn btn-default btn-sm widget-slide-indicator")
                                            .css("padding", "2px 7px")
                                            .attr("title", "Expand or Collapse")
                                            .attr("data-toggle", "tooltip")
                                            .attr("data-placement", "bottom")
                                            .append(
                                                $("<span></span>")
                                                    .addClass("fa fa-arrow-up")
                                            )
                                            .tooltip()
                                            .click(function() {
                                                widget.expandCollapse();
                                            })
                                    )
                                    .append(" ")
                                    .append(
                                        $("<button></button>")
                                            .addClass("btn btn-default btn-sm")
                                            .css("padding", "2px 7px")
                                            .attr("title", "Toggle Code View")
                                            .attr("data-toggle", "tooltip")
                                            .attr("data-placement", "bottom")
                                            .append(
                                                $("<span></span>")
                                                    .addClass("fa fa-terminal")
                                            )
                                            .tooltip()
                                            .click(function() {
                                                widget.toggleCode();
                                            })
                                    )
                            )
                            .append(
                                $("<h3></h3>")
                                    .addClass("panel-title")
                                    .append(
                                        $("<span></span>")
                                            .addClass("glyphicon glyphicon-th")
                                    )
                                    .append(" GenePattern: ")
                                    .append(
                                        $("<span></span>")
                                            .addClass("widget-username-label")
                                            .append(widget.getUserLabel("Login"))
                                    )
                            )
                        )
                    .append(
                        $("<div></div>")
                            .addClass("panel-body widget-code")
                            .css("display", "none")
                    )
                    .append(
                        $("<div></div>")
                            .addClass("panel-body widget-view")
                            .append(
                                $("<div></div>")
                                    .addClass("form-group")
                                    .append(
                                        $("<label></label>")
                                            .attr("for", "server")
                                            .text("GenePattern Server")
                                    )
                                    .append(
                                        $("<select></select>")
                                            .addClass("form-control")
                                            .attr("name", "server")
                                            .attr("type", "text")
                                            .css("margin-left", "0")
                                            .append(
                                                $("<option></option>")
                                                    .attr("value", "http://genepattern.broadinstitute.org/gp")
                                                    .text("GenePattern @ Broad Institute")
                                            )
                                            .append(
                                                $("<option></option>")
                                                    .attr("value", "http://127.0.0.1:8080/gp")
                                                    .text("GenePattern @ localhost")
                                            )
                                            .val(widget.getServerLabel("http://genepattern.broadinstitute.org/gp"))
                                    )
                            )
                            .append(
                                $("<div></div>")
                                    .addClass("form-group")
                                    .append(
                                        $("<label></label>")
                                            .attr("for", "username")
                                            .text("GenePattern Username")
                                    )
                                    .append(
                                        $("<input/>")
                                            .addClass("form-control")
                                            .attr("name", "username")
                                            .attr("type", "text")
                                            .attr("placeholder", "Username")
                                            .attr("required", "required")
                                            .val(widget.getUserLabel(""))
                                    )
                            )
                            .append(
                                $("<div></div>")
                                    .addClass("form-group")
                                    .append(
                                        $("<label></label>")
                                            .attr("for", "password")
                                            .text("GenePattern Password")
                                    )
                                    .append(
                                        $("<input/>")
                                            .addClass("form-control")
                                            .attr("name", "password")
                                            .attr("type", "password")
                                            .attr("placeholder", "Password")
                                            .val(widget.getPasswordLabel(""))
                                    )
                            )
                            .append(
                                $("<button></button>")
                                    .addClass("btn btn-primary gp-auth-button")
                                    .text("Login to GenePattern")
                                    .click(function() {
                                        var server = widget.$el.find("[name=server]").val();
                                        var username = widget.$el.find("[name=username]").val();
                                        var password = widget.$el.find("[name=password]").val();

                                        widget.buildCode(server, username, password);
                                        widget.authenticate(server, username, password, function() {
                                            widget.executeCell();
                                            widget.buildCode(server, "", "")
                                        });
                                    })
                            )
                    )
            );

            // Hide the code by default
            var element = this.$el;
            setTimeout(function() {
                element.closest(".cell").find(".input")
                    .css("height", "0")
                    .css("overflow", "hidden");
            }, 1);

            // Hide the login form if already authenticated
            if (GenePattern.authenticated) {
                setTimeout(function() {
                    element.find(".panel-body").hide();
                    var indicator = element.find(".widget-slide-indicator").find("span");
                    indicator.removeClass("fa-arrow-up");
                    indicator.addClass("fa-arrow-down");
                }, 1);
            }
        },

        expandCollapse: function() {
            var toSlide = this.$el.find(".panel-body.widget-view");
            var indicator = this.$el.find(".widget-slide-indicator").find("span");
            if (toSlide.is(":hidden")) {
                toSlide.slideDown();
                indicator.removeClass("fa-arrow-down");
                indicator.addClass("fa-arrow-up");
                this.$el.find(".widget-code").slideUp();
            }
            else {
                toSlide.slideUp();
                indicator.removeClass("fa-arrow-up");
                indicator.addClass("fa-arrow-down");
            }
        },

        toggleCode: function() {
            var code = this.$el.find(".widget-code");
            var view = this.$el.find(".widget-view");

            if (code.is(":hidden")) {
                this.options.cell.code_mirror.refresh();
                var raw = this.$el.closest(".cell").find(".input").html();
                code.html(raw);

                // Fix the issue where the code couldn't be selected
                code.find(".CodeMirror-scroll").attr("draggable", "false");

                view.slideUp();
                code.slideDown();
            }
            else {
                view.slideDown();
                code.slideUp();
            }
        },

        buildCode: function(server, username, password) {
            var code = GenePattern.notebook.init.buildCode(server, username, password);
            this.options.cell.code_mirror.setValue(code);
        },

        executeCell: function() {
            this.options.cell.execute();
        },

        authenticate: function(server, username, password, done) {
            var widget = this;
            $.ajax({
                type: "GET",
                url: server + "/rest/v1/tasks/all.json",
                dataType: 'json',
                cache: false,
                xhrFields: {
                    withCredentials: true
                },
                //beforeSend: function (xhr) {
                //    xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
                //},
                success: function(data, status, xhr) {
                    // Set the authentication info on GenePattern object
                    GenePattern.authenticated = true;
                    GenePattern.setServer(server);
                    GenePattern.username = username;
                    GenePattern.password = password;

                    // Make authenticated UI changes to auth widget
                    widget.$el.find(".widget-username-label").text(username);
                    widget.$el.find(".widget-server-label").text(server);

                    // Enable authenticated nav elsewhere in notebook
                    GenePattern.notebook.authenticate(data);

                    // Populate the GenePattern._tasks list
                    if (data['all_modules']) {
                        $.each(data['all_modules'], function(index, module) {
                            GenePattern._tasks.push(new GenePattern.Task(module));
                        });
                    }

                    // If a function to execute when done has been passed in, execute it
                    if (done) { done(); }
                },
                error: function(xhr, status, e) {
                    console.log("Error authenticating");
                }
            });
        },

        getUserLabel: function(alt) {
            if (GenePattern.authenticated && GenePattern.username) {
                return GenePattern.username;
            }
            else {
                return alt
            }
        },

        getPasswordLabel: function(alt) {
            if (GenePattern.authenticated && GenePattern.password) {
                return GenePattern.password;
            }
            else {
                return alt
            }
        },

        getServerLabel: function(alt) {
            if (GenePattern.authenticated && GenePattern._server) {
                return GenePattern._server;
            }
            else {
                return alt
            }
        }
    });

    // Register the JobWidgetView with the widget manager.
    IPython.WidgetManager.register_widget_view('AuthWidgetView', AuthWidgetView);
});

/**
 * Define the IPython GenePattern Job widget
 */
require(["widgets/js/widget", "jqueryui"], function (WidgetManager) {
    /**
     * Widget for viewing the job results of a launched job.
     *
     * Supported Features:
     *      Job Status
     *      Access to Job Results
     *      Access to Logs
     *
     * Non-Supported Features:
     *      Job Sharing & Permissions
     *      Access to Job Inputs
     *      Visibility into Child Jobs
     *      Batch Jobs
     */
    $.widget("gp.jobResults", {
        options: {
            jobNumber: null,    // The job number
            poll: true,         // Poll to refresh running jobs
            job: null           // Job object this represents
        },

        /**
         * Constructor
         *
         * @private
         */
        _create: function() {
            var widget = this;

            // Ensure the job number is defined
            if (typeof this.options.jobNumber !== 'number' && !this.options.json) {
                throw "The job number is not correctly defined, cannot create job results widget";
            }

            // Add class and child elements
            this.element.addClass("panel panel-default gp-widget gp-widget-job");
            this.element.append(
                $("<div></div>")
                    .addClass("panel-heading gp-widget-job-header")
                    .append(
                        $("<div></div>")
                            .addClass("widget-float-right")
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-job-status")
                            )
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-job-buttons")
                                    .append(
                                        $("<button></button>")
                                            .addClass("btn btn-default btn-sm")
                                            .css("padding", "2px 7px")
                                            .attr("title", "Reload Task Form")
                                            .attr("data-toggle", "tooltip")
                                            .attr("data-placement", "bottom")
                                            .append(
                                                $("<span></span>")
                                                    .addClass("fa fa-refresh")
                                            )
                                            .tooltip()
                                            .click(function() {
                                                // TODO: Implement
                                                // widget.expandCollapse();
                                            })
                                    )
                                    .append(" ")
                                    .append(
                                        $("<button></button>")
                                            .addClass("btn btn-default btn-sm")
                                            .css("padding", "2px 7px")
                                            .attr("title", "Toggle Code View")
                                            .attr("data-toggle", "tooltip")
                                            .attr("data-placement", "bottom")
                                            .append(
                                                $("<span></span>")
                                                    .addClass("fa fa-terminal")
                                            )
                                            .tooltip()
                                            .click(function() {
                                                widget.toggleCode();
                                            })
                                    )
                            )
                    )
                    .append(
                        $("<h3></h3>")
                            .addClass("panel-title")
                            .append(
                                $("<span></span>")
                                    .addClass("glyphicon glyphicon-th")
                            )
                            .append(
                                $("<span></span>")
                                    .addClass("gp-widget-job-task")
                            )
                    )
                    .append(
                        $("<div></div>")
                            .addClass("gp-widget-job-submitted")
                    )
            );
            this.element.append(
                $("<div></div>")
                    .addClass("panel-body")
                    .append(
                        $("<div></div>")
                            .addClass("widget-code gp-widget-job-code")
                            .css("display", "none")
                    )
                    .append(
                        $("<div></div>")
                            .addClass("gp-widget-job-outputs")
                    )
            );

            // Check to see if the user is authenticated yet
            if (GenePattern.authenticated) {
                // If authenticated, load job status
                this._loadJobStatus();
            }
            else {
                // If not authenticated, display message
                this._showAuthenticationMessage();
                this._pollForAuth();
            }
        },

        /**
         * Destructor
         *
         * @private
         */
        _destroy: function() {
            this._updateSlider("destroy");
            this.element.removeClass("gp-widget-job-widget");
            this.element.empty();
        },

        /**
         * Update all options
         *
         * @param options - Object contain options to update
         * @private
         */
        _setOptions: function(options) {
            this._superApply(arguments);
            this._loadJobStatus();
        },

        /**
         * Update for single options
         *
         * @param key - The name of the option
         * @param value - The new value of the option
         * @private
         */
        _setOption: function(key, value) {
            this._super(key, value);
        },

        /**
         * Toggle the code view on or off
         */
        toggleCode: function() {
            var code = this.element.find(".gp-widget-job-code");
            var view = this.element.find(".gp-widget-job-outputs");

            if (code.is(":hidden")) {
                this.element.closest(".cell").data("cell").code_mirror.refresh();
                var raw = this.element.closest(".cell").find(".input").html();
                code.html(raw);

                // Fix the issue where the code couldn't be selected
                code.find(".CodeMirror-scroll").attr("draggable", "false");

                view.slideUp();
                code.slideDown();
            }
            else {
                view.slideDown();
                code.slideUp();
            }
        },

        /**
         * Initialize polling as appropriate for options and status
         *
         * @param statusObj
         * @private
         */
        _initPoll: function(statusObj) {
            var running = !statusObj["hasError"] && !statusObj["completedInGp"];
            var widget = this;

            // If polling is turned on, attach the event
            if (this.options.poll && running) {
                setTimeout(function() {
                    widget._loadJobStatus();
                }, 10000);
            }
        },

        /**
         * Polls every few seconds to see if the notebook is authenticated, and gets job info once authenticated
         *
         * @private
         */
        _pollForAuth: function() {
            var widget = this;
            setTimeout(function() {
                // Check to see if the user is authenticated yet
                if (GenePattern.authenticated) {
                    // If authenticated, load job status
                    widget._loadJobStatus();
                }
                else {
                    // If not authenticated, poll again
                    widget._pollForAuth();
                }
            }, 1000);
        },

        /**
         * Update the left-hand slider with job information
         *
         * @private
         */
        _updateSlider: function(method) {
            if (method.toLowerCase() == "destroy") {
                GenePattern.notebook.removeSliderJob(this.options.jobNumber);
            }
            // Else assume "update"
            else {
                GenePattern.notebook.updateSliderJob(this.options.job);
            }
        },

        /**
         * Show the message about authentication
         *
         * @private
         */
        _showAuthenticationMessage: function() {
            this.element.find(".gp-widget-job-task").text(" GenePattern Job: Not Authenticated");
            this.element.find(".gp-widget-job-outputs").text("You must be authenticated before the job information can be displayed. After you authenticate it may take a few seconds for the job information to appear.");
        },

        /**
         * Make a quest to the server to update the job status, and then update the UI
         *
         * @private
         */
        _loadJobStatus: function() {
            // If JSON already loaded
            if (this.options.json) {
                var jsonObj = JSON.parse(this.options.json);
                var job = new GenePattern.Job(jsonObj);
                this._displayJob(job);
            }
            // If we need to load the JSON from the server
            else {
                var widget = this;

                GenePattern.job({
                    jobNumber: this.options.jobNumber,
                    forceRefresh: true,
                    success: function(response, job) {
                        // Set the job object
                        widget.options.job = job;

                        // Update the widget
                        widget._displayJob(job);

                        // Update the slider
                        widget._updateSlider("update");
                    },
                    error: function() {
                        // Clean the old data
                        widget._clean();

                        // Display the error
                        widget.element.find(".gp-widget-job-task").text(" GenePattern Job: Error");
                        widget.element.find(".gp-widget-job-outputs").text("Error loading job: " + widget.options.jobNumber);

                        // Update the slider
                        widget._updateSlider("update");
                    }
                });
            }
        },

        /**
         * Display the widget from the job object
         *
         * @param job
         * @private
         */
        _displayJob: function(job) {
            // Clean the old data
            this._clean();

            // Set the job number
            this.element.attr("name", job.jobNumber());

            // Display the job number and task name
            var taskText = " " + job.jobNumber() + ". " + job.taskName();
            this.element.find(".gp-widget-job-task").text(taskText);

            // Display the user and date submitted
            var submittedText = "Submitted by " + job.userId() + " on " + job.dateSubmitted();
            this.element.find(".gp-widget-job-submitted").text(submittedText);

            // Display the status
            var statusText = this._statusText(job.status());
            this.element.find(".gp-widget-job-status").text(statusText);

            // Display the job results
            var outputsList = this._outputsList(job.outputFiles());
            this.element.find(".gp-widget-job-outputs").append(outputsList);

            // Display the log files
            var logList = this._outputsList(job.logFiles());
            this.element.find(".gp-widget-job-outputs").append(logList);

            // Initialize status polling
            this._initPoll(job.status());
        },

        /**
         * Return the display of the job's status
         *
         * @param statusObj - The status object returned by the server
         * @returns {string} - Display text of the status
         * @private
         */
        _statusText: function(statusObj) {
            if (statusObj["hasError"]) {                // Error
                return "Error";
            }
            else if (statusObj["completedInGp"]) {      // Complete
                return "Completed"
            }
            else if (statusObj["isPending"]) {          // Pending
                return "Pending";
            }
            else {                                      // Running
                return "Running";
            }
        },

        /**
         * Return a div containing the file outputs formatted for display
         *
         * @param outputs
         * @returns {*|jQuery|HTMLElement}
         * @private
         */
        _outputsList: function(outputs) {
            var outputsList = $("<div></div>")
                .addClass("gp-widget-job-outputs-list");

            if (outputs) {
                for (var i = 0; i < outputs.length; i++) {
                    var output = outputs[i];
                    $("<a></a>")
                        .text(output["link"]["name"])
                        .attr("href", output["link"]["href"])
                        .attr("target", "_blank")
                        .appendTo(outputsList);
                }
            }
            else {
                outputsList.text("No output files.");
            }

            return outputsList;
        },

        /**
         * Remove the display data from the widget
         *
         * @private
         */
        _clean: function() {
            this.element.find(".gp-widget-job-task").empty();
            this.element.find(".gp-widget-job-submitted").empty();
            this.element.find(".gp-widget-job-status").empty();
            this.element.find(".gp-widget-job-outputs").empty();
        },

        /**
         * Getter for the associated job number
         *
         * @returns {null|number}
         */
        jobNumber: function() {
            return this.options.jobNumber;
        }
    });

    var JobWidgetView = IPython.WidgetView.extend({
        render: function () {
            // Double check to make sure that this is the correct cell
            if ($(this.options.cell.element).hasClass("running")) {
                // Render the view.
                this.setElement($('<div/></div>'));
                var jobNumber = this.model.get('job_number');
                this.$el.jobResults({
                    jobNumber: jobNumber
                });

                // Hide the code by default
                var element = this.$el;
                setTimeout(function() {
                    element.closest(".cell").find(".input")
                        .css("height", "0")
                        .css("overflow", "hidden");
                }, 1);
            }
        }
    });

    // Register the JobWidgetView with the widget manager.
    IPython.WidgetManager.register_widget_view('JobWidgetView', JobWidgetView);
});