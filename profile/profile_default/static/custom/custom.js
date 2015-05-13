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
        var forceRefresh = pObj && ((typeof pObj.force === 'boolean' && pObj.force) ||
                (typeof pObj.force === 'string' && pObj.force.toLowerCase() === 'true'));
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
     *                  permissions: whether to include permissions info (default: false)
     *                  success: callback function for a done() event,
     *                          expects response and a Job object as arguments
     *                  error: callback function for an fail() event, expects exception as argument
     *
     * @returns {jQuery.Deferred} - Returns a jQuery Deferred object for event chaining.
     *      See http://api.jquery.com/jquery.deferred/ for details.
     */
    GenePattern.job = function(pObj) {
        var forceRefresh = pObj && ((typeof pObj.force === 'boolean' && pObj.force) ||
                (typeof pObj.force === 'string' && pObj.force.toLowerCase() === 'true'));
        var getPermissions = pObj && ((typeof pObj.permissions === 'boolean' && pObj.permissions) ||
                (typeof pObj.permissions === 'string' && pObj.permissions.toLowerCase() === 'true'));
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
        var permissionsParam = getPermissions ? "?includePermissions=true" : "";
        var REST_ENDPOINT = "/rest/v1/jobs/";

        return $.ajax({
                url: GenePattern.server() + REST_ENDPOINT + jobNumber + permissionsParam,
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
                    if (pObj && pObj.success) {
                        pObj.success(textStatus, data);
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
            var forceRefresh = pObj && ((typeof pObj.force === 'boolean' && pObj.force) ||
                (typeof pObj.force === 'string' && pObj.force.toLowerCase() === 'true'));
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

        this.code = function(pObj) {
            // Validate language
            var language = null;

            if (typeof pObj === "string") { language = pObj; }
            else { language = pObj.language; }

            if (language !== "Python" && language !== "R" && language !== "Java" && language !== "MATLAB") {
                console.log("Unknown language, defaulting to Python: " + language);
            }

            var REST_ENDPOINT = "/rest/v1/jobs/" + this.jobNumber() + "/code?language=" + language;
            var job = this;

            return $.ajax({
                    url: GenePattern.server() + REST_ENDPOINT,
                    type: 'GET',
                    dataType: 'text',
                    xhrFields: {
                        withCredentials: true
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
         * Save the job's permissions to the server
         *
         * @param pObj - The following parameters may be set
         *                  bundle: This is a JSON object of permissions
         *                  success: callback function for a done() event,
         *                          expects response and a Job Number as arguments
         *                  error: callback function for an fail() event, expects exception as argument
         *
         * @returns {*}
         */
        this.savePermissions = function(pObj) {
            var REST_ENDPOINT = "/rest/v1/jobs/" + this.jobNumber() + "/permissions";

            return $.ajax({
                    url: GenePattern.server() + REST_ENDPOINT,
                    type: 'PUT',
                    data: JSON.stringify(pObj['bundle']),
                    dataType: 'json',
                    contentType: "application/json",
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
                    contentType: "application/json",
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
                        var index = IPython.notebook.get_selected_index();
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
                        var index = IPython.notebook.get_selected_index();
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
                        $("#slider-tabs").find("[href='#slider-modules']").trigger("click");
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
            .addClass("glyphicon glyphicon-th sidebar-button sidebar-button-main")
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
                .addClass("glyphicon glyphicon-th sidebar-button sidebar-button-slider")
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
    var sliderModules = $("#slider-modules");
    sliderModules.empty();
    if (data['all_modules']) {
        $.each(data['all_modules'], function(index, module) {
            var tags = module['categories'];
            $.each(module['tags'], function(i, e) {
                tags.push(e['tag'])
            });
            tags.sort();
            var option = GenePattern.notebook.sliderOption(module['lsid'], module['name'], "v" + module['version'], module['description'], tags);
            option.click(function() {
                var index = IPython.notebook.get_selected_index();
                IPython.notebook.insert_cell_below('code', index);
                IPython.notebook.select_next();
                var cell = IPython.notebook.get_selected_cell();
                var code = GenePattern.notebook.buildModuleCode(module);
                cell.set_text(code);
                setTimeout(function() {
                    cell.execute();
                }, 10);

                // Close the slider
                $(".sidebar-button-slider").trigger("click");

                // Scroll to the new cell
                $('#site').animate({
                    scrollTop: $(IPython.notebook.get_selected_cell().element).position().top
                }, 500);
            });
            sliderModules.append(option);
        });
        sliderModules.append($("<p>&nbsp;</p>"))
    }
};

/**
 * Build the basic code for displaying a module widget
 *
 * @param module
 */
GenePattern.notebook.buildModuleCode = function(module) {
    return "# !AUTOEXEC\n\n" +
            "task = gp.GPTask(gpserver, '" + module["lsid"] + "')\n" +
            "GPTaskWidget(task)";
};

/**
 * Build the basic code for displaying a job widget
 *
 * @param jobNumber
 * @returns {string}
 */
GenePattern.notebook.buildJobCode = function(jobNumber) {
    return "# !AUTOEXEC\n\n" +
            "job" + jobNumber + " = gp.GPJob(gpserver, " + jobNumber + ")\n" +
            "GPJobWidget(job" + jobNumber + ")";
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
 * Return whether the file URL is external, internal, upload
 *
 * @param value
 * @returns {string}
 */
GenePattern.notebook.fileLocationType = function(value) {
    if (typeof value === 'object') {
        return "Upload";
    }
    else if (value.indexOf(GenePattern.server()) !== -1 || value.indexOf("<GenePatternURL>") !== -1) {
        return "Internal"
    }
    else {
        return "External";
    }
};

/**
 * Return the name of a file from its url
 *
 * @param url
 * @returns {string}
 */
GenePattern.notebook.nameFromUrl = function(url) {
    var parts = url.split("/");
    return decodeURIComponent(parts[parts.length - 1]);
};

/**
 * Encode text for HTML display
 *
 * @param text
 * @returns {string}
 */
GenePattern.notebook.htmlEncode = function(text) {
    return text.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
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
                scrollTop: $(".gp-widget-job[name='" + job.jobNumber() + "']").position().top
            }, 500);

            // Close the slider
            $(".sidebar-button-slider").trigger("click");
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

/**
 * Remove a slider option representing data from the slider
 *
 * @param name
 */
GenePattern.notebook.removeSliderData = function(name) {
    // Update the UI
    $("#slider-data").find(".slider-option[name='" + name + "']").remove();
};

/**
 * Update a slider option representing data on the slider
 *
 * @param url
 * @param value
 */
GenePattern.notebook.updateSliderData = function(url, value) {
    // If the data does not yet exist in the list, add it
    var dataSlider = $("#slider-data");
    var existingOption = dataSlider.find(".slider-option[name='" + url + "']");
    if (existingOption.length < 1) {
        // Update the UI
        var type = GenePattern.notebook.fileLocationType(value);
        var name = GenePattern.notebook.nameFromUrl(url);
        var urlWithPrefix = type === "Upload" ? "Ready to Upload: " + GenePattern.notebook.htmlEncode(url) : GenePattern.notebook.htmlEncode(url);
        var option = GenePattern.notebook.sliderOption(url, name, type, urlWithPrefix, []);
        option.click(function() {
            // Close the slider
            $(".sidebar-button-slider").trigger("click");

            var fileOffset = $(".file-widget-value-text:contains('" + url + "')").offset().top;
            var notebookOffset = $("#notebook").offset().top;

            $('#site').animate({
                scrollTop: fileOffset - notebookOffset - 50
            }, 500);
        });
        dataSlider.append(option);
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
# Don\'t have the GenePattern library? It can be downloaded from: \n\
# http://genepattern.broadinstitute.org/gp/downloads/gp-python.zip \n\
import gp\n\
\n\
# The following widgets are components of the GenePattern Notebook extension.\n\
try:\n\
    from gp_widgets import GPAuthWidget, GPJobWidget, GPTaskWidget\n\
except:\n\
    def GPAuthWidget(input):\n\
        print "GP Widget Library not installed. Please visit http://genepattern.org"\n\
    def GPJobWidget(input):\n\
        print "GP Widget Library not installed. Please visit http://genepattern.org"\n\
    def GPTaskWidget(input):\n\
        print "GP Widget Library not installed. Please visit http://genepattern.org"\n\
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

    // Add GenePattern "cell type"
    $("#cell_type")
        .append($("<option value='code'>GenePattern</option>"));
    $("#change_cell_type").find("ul.dropdown-menu")
        .append($("<li id='to_genepattern' title='Insert a GenePattern widget cell'><a href='#'>GenePattern</a></option>"));

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
require(["widgets/js/widget", "jqueryui"], function (WidgetManager) {
    $.widget("gp.auth", {
        options: {
            servers: [                                              // Expects a list of lists with [name, url] pairs
                ['GenePattern @ localhost', 'http://127.0.0.1:8080/gp'],
                ['GenePattern @ Broad Institute', 'http://genepattern.broadinstitute.org/gp'],
                ['GenePattern @ gpbeta', 'http://genepatternbeta.broadinstitute.org/gp']
            ],
            cell: null                                              // Reference to the IPython cell
        },

        /**
         * Constructor
         *
         * @private
         */
        _create: function() {
            var widget = this;

            // Add data pointer
            this.element.data("widget", this);

            // Render the view.
            this.element
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
                                .addClass("gp-widget-loading")
                                .append("<img src='/static/custom/loader.gif' />")
                                .hide()
                        )
                        .append(
                            $("<div></div>")
                                .addClass("gp-widget-logged-in")
                                .append(
                                    $("<div></div>")
                                        .text("You are already logged in.")
                                        .append($("<br/>"))
                                        .append(
                                            $("<button></button>")
                                                .text("Login Again")
                                                .addClass("btn btn-warning btn-lg")
                                                .click(function() {
                                                    widget.element.find(".gp-widget-logged-in").hide();
                                                })
                                        )
                                )
                                .hide()
                        )
                        .append(
                            $("<div></div>")
                                .addClass("alert alert-danger gp-widget-error")
                                .hide()
                        )
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
                                        .keyup(function (e) {
                                            if (e.keyCode == 13) {
                                                widget._enterPressed();
                                            }
                                        })
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
                                        .keyup(function (e) {
                                            if (e.keyCode == 13) {
                                                widget._enterPressed();
                                            }
                                        })
                                )
                        )
                        .append(
                            $("<button></button>")
                                .addClass("btn btn-primary gp-auth-button")
                                .text("Login to GenePattern")
                                .click(function() {
                                    var server = widget.element.find("[name=server]").val();
                                    var username = widget.element.find("[name=username]").val();
                                    var password = widget.element.find("[name=password]").val();

                                    // Display the loading animation
                                    widget._displayLoading();

                                    widget.buildCode(server, username, password);
                                    widget.authenticate(server, username, password, function() {
                                        widget.executeCell();
                                        widget.buildCode(server, "", "");

                                        // Done loading
                                        widget._displayLoggedIn();
                                    });
                                })
                        )
            );

            // Add servers to select
            var serverSelect = this.element.find("[name=server]");
            $.each(this.options.servers, function(i, e) {
                serverSelect.append(
                    $("<option></option>")
                        .attr("value", e[1])
                        .text(e[0])
                );
            });

            // Hide the code by default
            var element = this.element;
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

                    // Display the logged in message
                    widget._displayLoggedIn();
                }, 1);
            }
        },

        /**
         * Destructor
         *
         * @private
         */
        _destroy: function() {
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
         * Display the loading animation
         *
         * @private
         */
        _displayLoading: function() {
            this.hideError();
            this.element.find(".gp-widget-loading").show();
        },

        _displayLoggedIn: function() {
            this.element.find(".gp-widget-loading").hide();
            this.element.find(".gp-widget-logged-in").show();
        },

        /**
         * Hide the error message
         *
         * @param message
         */
        hideError: function(message) {
            this.element.find(".gp-widget-error").hide();
        },

        /**
         * Show an error message
         *
         * @param message
         */
        errorMessage: function(message) {
            // Get into the correct view
            var code = this.element.find(".widget-code");
            var view = this.element.find(".widget-view");
            view.slideDown();
            code.slideUp();

            // Hide the loading message & logged in
            this.element.find(".gp-widget-loading").hide();
            this.element.find(".gp-widget-logged-in").hide();

            // Display the error
            var messageBox = this.element.find(".gp-widget-error");
            messageBox.removeClass("alert-success");
            messageBox.addClass("alert-danger");
            messageBox.text(message);
            messageBox.show("shake", {}, 500);
        },

        /**
         * Click the login button if the enter key is pressed
         *
         * @private
         */
        _enterPressed: function() {
            this.element.find(".gp-auth-button").trigger("click");
        },

        expandCollapse: function() {
            var toSlide = this.element.find(".panel-body.widget-view");
            var indicator = this.element.find(".widget-slide-indicator").find("span");
            if (toSlide.is(":hidden")) {
                toSlide.slideDown();
                indicator.removeClass("fa-arrow-down");
                indicator.addClass("fa-arrow-up");
                this.element.find(".widget-code").slideUp();
            }
            else {
                toSlide.slideUp();
                indicator.removeClass("fa-arrow-up");
                indicator.addClass("fa-arrow-down");
            }
        },

        toggleCode: function() {
            var code = this.element.find(".widget-code");
            var view = this.element.find(".widget-view");

            if (code.is(":hidden")) {
                this.options.cell.code_mirror.refresh();
                var raw = this.element.closest(".cell").find(".input").html();
                code.html(raw);

                // Fix the issue where the code couldn't be selected
                code.find(".CodeMirror-scroll").attr("draggable", "false");

                view.slideUp();
                code.slideDown();
            }
            else {
                // If normally collapsed
                var collapsed = $(".widget-slide-indicator").find(".fa-arrow-down").length > 0;
                if (collapsed) {
                    code.slideUp();
                }
                // If otherwise expanded
                else {
                    view.slideDown();
                    code.slideUp();
                }
            }
        },

        buildCode: function(server, username, password) {
            var code = GenePattern.notebook.init.buildCode(server, username, password);
            this.options.cell.code_mirror.setValue(code);
        },

        executeCell: function() {
            this.options.cell.execute();
        },

        /**
         * Call the authentication endpoint, then call afterAuthenticate();
         *
         * @param server
         * @param username
         * @param password
         * @param done
         */
        authenticate: function(server, username, password, done) {
            var widget = this;
            $.ajax({
                type: "POST",
                url: server + "/rest/v1/oauth2/token?grant_type=password&username=" + username + "&password=" + password + "&client_id=GenePatternNotebook",
                cache: false,
                xhrFields: {
                    withCredentials: true
                },
                success: function(data, status, xhr) {
                    console.log(data['access_token']);

                    var token = data['access_token'];

                    $.ajaxSetup({
                        headers: {"Authorization": "Bearer " + token}
                    });

                    widget.afterAuthenticate(server, username, password, done);
                },
                error: function(xhr, status, e) {
                    widget.errorMessage("Error authenticating");
                }
            });
        },

        /**
         * Assumes the authenticate endpoint has already been called,
         * then does all the other stuff needed for authentication
         *
         * @param done
         */
        afterAuthenticate: function(server, username, password, done) {
            var widget = this;
            $.ajax({
                type: "GET",
                url: server + "/rest/v1/tasks/all.json",
                dataType: 'json',
                cache: false,
                xhrFields: {
                    withCredentials: true
                },
                success: function(data, status, xhr) {
                    // Set the authentication info on GenePattern object
                    GenePattern.authenticated = true;
                    GenePattern.setServer(server);
                    GenePattern.username = username;
                    GenePattern.password = password;

                    // Make authenticated UI changes to auth widget
                    widget.element.find(".widget-username-label").text(username);
                    widget.element.find(".widget-server-label").text(server);

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
                    widget.errorMessage("Error loading server info");
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


    var AuthWidgetView = IPython.WidgetView.extend({
        render: function () {
            // Double check to make sure that this is the correct cell
            if ($(this.options.cell.element).hasClass("running")) {
                // Render the view.
                this.setElement($('<div></div>'));
                //var jobNumber = this.model.get('job_number');
                this.$el.auth({
                    cell: this.options.cell
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

            // Add data pointer
            this.element.data("widget", this);

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
                                    .addClass("gp-widget-job-buttons")
                                    .append(
                                        $("<button></button>")
                                            .addClass("btn btn-default btn-sm gp-widget-job-share")
                                            .css("padding", "2px 7px")
                                            .attr("title", "Share Job")
                                            .attr("data-toggle", "tooltip")
                                            .attr("data-placement", "bottom")
                                            .attr("disabled", "disabled")
                                            .append(
                                                $("<span></span>")
                                                    .addClass("fa fa-share")
                                            )
                                            .tooltip()
                                            .click(function() {
                                                widget.toggleShareJob();
                                            })
                                    )
                                    .append(" ")
                                    .append(
                                        $("<button></button>")
                                            .addClass("btn btn-default btn-sm gp-widget-job-reload")
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
                                                widget.reloadJob();
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
            );
            this.element.append(
                $("<div></div>")
                    .addClass("panel-body")
                    .append(
                        $("<div></div>")
                            .addClass("gp-widget-job-body-wrapper")
                            .append(
                                $("<div></div>")
                                    .addClass("widget-float-right gp-widget-job-status")
                            )
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-job-share-options")
                                    .css("display", "none")
                            )
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-job-submitted")
                            )
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-job-outputs")
                            )
                    )
                    .append(
                        $("<div></div>")
                            .addClass("widget-code gp-widget-job-code")
                            .css("display", "none")
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
         * Construct the sharing panel from the job permissions
         *
         * @param job
         */
        buildSharingPanel: function(job) {
            var widget = this;
            var optionsPane = this.element.find(".gp-widget-job-share-options");
            var permissions = job.permissions();

            // Make sure that the permissions exist, if not return an error
            if (permissions === undefined || permissions === null) {
                optionsPane
                    .addClass("alert alert-danger")
                    .text("Job Permissions Not Found");
                return;
            }

            // Build alert box
            optionsPane.append(
                $("<div></div>").addClass("gp-widget-job-share-alert")
            );

            // Build the header
            optionsPane.append(
                $("<h4></h4>").text("Job Sharing")
            );

            // Build the permissions table
            var table = $("<table></table>")
                .addClass("gp-widget-job-share-table");
            table.append(
                $("<tr></tr>")
                    .append(
                        $("<th></th>")
                            .text("Group")
                    )
                    .append(
                        $("<th></th>")
                            .text("Permissions")
                    )
            );

            var groups = permissions['groups'];
            $.each(groups, function(i, e) {
                var groupDisplayName = e['id'];
                if (groupDisplayName === "*") {
                    groupDisplayName = "Public";
                }
                var row = $("<tr></tr>")
                    .attr('name', e['id']);
                row.append(
                    $("<td></td>")
                        .text(groupDisplayName)
                );
                row.append(
                    $("<td></td>")
                        .append(
                            $("<input/>")
                                .attr("type", "radio")
                                .attr("name", e['id'])
                                .attr("id", "radio-" + job.jobNumber() + "-" + i + "-None")
                                .val("None")
                        )
                        .append(
                            $("<label></label>")
                                .attr("for", "radio-" + job.jobNumber() + "-" + i + "-None")
                                .text("None")
                        )
                        .append(
                            $("<input/>")
                                .attr("type", "radio")
                                .attr("name", e['id'])
                                .attr("id", "radio-" + job.jobNumber() + "-" + i + "-Read")
                                .val("Read")
                        )
                        .append(
                            $("<label></label>")
                                .attr("for", "radio-" + job.jobNumber() + "-" + i + "-Read")
                                .text("Read")
                        )
                        .append(
                            $("<input/>")
                                .attr("type", "radio")
                                .attr("name", e['id'])
                                .attr("id", "radio-" + job.jobNumber() + "-" + i + "-Write")
                                .val("Write")
                        )
                        .append(
                            $("<label></label>")
                                .attr("for", "radio-" + job.jobNumber() + "-" + i + "-Write")
                                .text("Read & Write")
                        )
                );
                table.append(row);

                // Select the right radio buttons
                if (!e["read"]) {
                    row.find("#radio-" + job.jobNumber() + "-" + i + "-None")
                        .attr("checked", "checked")
                }
                else if (e["read"] && !e["write"]) {
                    row.find("#radio-" + job.jobNumber() + "-" + i + "-Read")
                        .attr("checked", "checked")
                }
                else if (e["write"]) {
                    row.find("#radio-" + job.jobNumber() + "-" + i + "-Write")
                        .attr("checked", "checked")
                }
            });
            optionsPane.append(table);

            // Attach button group
            optionsPane
                .append(
                    $("<button></button>")
                        .addClass("btn btn-success")
                        .text("Save")
                        .click(function() {
                            // Bundle up permissions to save
                            var bundle = widget._bundlePermissions();

                            // Call to save permissions
                            widget._savePermissions(bundle,
                                // On success
                                function() {
                                    // Success message
                                    widget.element.find(".gp-widget-job-share-alert")
                                        .removeClass("alert-danger")
                                        .addClass("alert alert-success")
                                        .text("Permissions saved!");
                                    widget.toggleShareJob();
                                },
                                // On fail
                                function() {
                                    // Error message
                                    widget.element.find(".gp-widget-job-share-alert")
                                        .removeClass("alert-success")
                                        .addClass("alert alert-danger")
                                        .text("Error saving permissions.")
                                        .show("shake", {}, 500);
                                });
                        })
                )
                .append(" ")
                .append(
                    $("<button></button>")
                        .addClass("btn btn-default")
                        .text("Cancel")
                        .click(function() {
                            // Hide sharing panel
                            widget.element.find(".gp-widget-job-share-options").slideUp();

                            // Display other parts of the panel
                            widget.element.find(".gp-widget-job-submitted").slideDown();
                            widget.element.find(".gp-widget-job-outputs-list").slideDown();
                        })
                )
        },

        /**
         * Save the permissions bundle back to the GenePattern server
         *
         * @private
         */
        _savePermissions: function(bundle, success, fail) {
            this.options.job.savePermissions({
                bundle: bundle,
                success: success,
                error: fail
            });
        },

        /**
         * Bundle the sharing permissions into a JSON object
         *
         * @private
         */
        _bundlePermissions: function() {
            var rawGroups = this.element.find(".gp-widget-job-share-table").find("tr");
            var toReturn = [];
            $.each(rawGroups, function(i, e) {
                var name = $(e).attr("name");
                // Skip the header row
                if (name === undefined || name === null || name === "") {
                    return;
                }
                // Get the radio value
                var group = {"id": name};
                var value = $(e).find("input:radio:checked").val();
                if (value === "Read") {
                    group["read"] = true;
                    group["write"] = false;
                    toReturn.push(group);
                }
                else if (value === "Write") {
                    group["read"] = true;
                    group["write"] = true;
                    toReturn.push(group);
                }
            });

            return toReturn;
        },

        /**
         * Prompt for sharing the job
         */
        toggleShareJob: function() {
            var sharePanel = this.element.find(".gp-widget-job-share-options");

            if (sharePanel.is(":visible")) {
                // Hide sharing panel
                sharePanel.slideUp();

                // Display other parts of the panel
                this.element.find(".gp-widget-job-submitted").slideDown();
                this.element.find(".gp-widget-job-outputs-list").slideDown();
            }
            else {
                // Display sharing panel
                sharePanel.slideDown();

                // Hide other parts of the panel
                this.element.find(".gp-widget-job-submitted").slideUp();
                this.element.find(".gp-widget-job-outputs-list").slideUp();
            }
        },

        /**
         * Remove unwanted code from reload, such as import statements and run_job
         *
         * @param code
         * @private
         */
        _stripUnwantedCode: function(code) {
            var lines = code.split("\n");
            var newCode = "# !AUTOEXEC\n\n";
            var taskVar = null;

            // Iterate over each line
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                var skip = false;

                // Determine if this is a skipped line
                if (line.trim().indexOf("import gp") === 0) { skip = true; }
                if (line.trim().indexOf("gpserver = ") === 0) { skip = true; }
                if (line.trim().indexOf("# Load the parameters") === 0) { skip = true; }
                if (line.trim().indexOf("gpserver.run_job") !== -1) { skip = true; }
                if (line.trim().indexOf(".param_load()") !== -1) { skip = true; }
                if (line.trim().length === 0) { skip = true; }

                // Identify taskVar if necessary
                if (taskVar === null && line.trim().indexOf("gp.GPTask") !== -1) {
                    taskVar = line.split(" ")[0];
                }

                // Append the code if it's not a skipped line
                if (!skip) {
                    newCode += line.trim() + "\n"
                }
            }

            // Append the widget view
            newCode += "\nGPTaskWidget(" + taskVar + ")";

            return newCode;
        },

        /**
         * Reloads the job in a Task widget
         */
        reloadJob: function() {
            var dialog = require('base/js/dialog');
            var job = this.options.job;
            var widget = this;
            var cell = this.element.closest(".cell").data("cell");

            dialog.modal({
                notebook: IPython.notebook,
                keyboard_manager: this.keyboard_manager,
                title : "Reload Job?",
                body : "Are you sure you want to reload the job? This will detach the notebook" +
                       "from the current job and replace it with the run task form.",
                buttons : {
                    "Cancel" : {},
                    Reload : {
                        "class" : "btn-danger",
                        "click" : function() {
                            job.code("Python").done(function(code) {
                                code = widget._stripUnwantedCode(code);

                                // Put the code in the cell
                                cell.code_mirror.setValue(code);

                                // Execute the cell
                                cell.execute();
                            });
                        }
                    }
                }
            });
        },

        /**
         * Toggle the code view on or off
         */
        toggleCode: function() {
            var code = this.element.find(".gp-widget-job-code");
            var view = this.element.find(".gp-widget-job-body-wrapper");

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
                    // If authenticated, execute cell again
                    widget.element.closest(".cell").data("cell").execute();
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
                // Remove only if this is the last instance of the job in the notebook
                var JobInstanceNum = $(".gp-widget-job[name='" + this.options.jobNumber + "']").length;
                if (JobInstanceNum === 1) {
                    GenePattern.notebook.removeSliderJob(this.options.jobNumber);
                }
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
            this.element.find(".gp-widget-job-outputs")
                .addClass("alert alert-danger")
                .text("You must be authenticated before the job information can be displayed. After you authenticate it may take a few seconds for the job information to appear.");

            // Update the reload button
            this.element.find(".gp-widget-job-reload").attr("disabled", "disabled");
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
                    force: true,
                    permissions: true,
                    success: function(response, job) {
                        // Set the job object
                        widget.options.job = job;

                        // Update the widget
                        widget._displayJob(job);

                        // Update the slider
                        widget._updateSlider("update");

                        // Enable the code button
                        widget.element.find(".gp-widget-job-reload").removeAttr("disabled");
                    },
                    error: function() {
                        // Clean the old data
                        widget._clean();

                        // Display the error
                        widget.element.find(".gp-widget-job-task").text(" GenePattern Job: Error");
                        widget.element.find(".gp-widget-job-outputs").text("Error loading job: " + widget.options.jobNumber);

                        // Update the code button
                        widget.element.find(".gp-widget-job-reload").attr("disabled", "disabled");
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

            // Enable sharing button, if necessary
            var permissions = job.permissions();
            if (permissions !== undefined && permissions !== null && permissions['canSetPermissions']) {
                this.element.find(".gp-widget-job-share").removeAttr("disabled");
            }

            // Build the sharing pane
            this.buildSharingPanel(job);

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
                this.setElement($('<div></div>'));
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

/**
 * Define the IPython GenePattern Task widget
 */
require(["widgets/js/widget", "jqueryui"], function (WidgetManager) {

    /**
     * Widget for file input into a GenePattern Notebook.
     * Used for file inputs by the runTask widget.
     *
     * Supported Features:
     *      External URLs
     *      Uploading New Files
     *      Pasted Internal File Paths
     *      Pasted Job Result URLs
     *
     * Non-Supported Features:
     *      GenomeSpace Files
     *      GenePattern Uploaded Files
     */
    $.widget("gp.fileInput", {
        options: {
            allowFilePaths: true,
            allowExternalUrls: true,
            allowJobUploads: true,

            // Pointers to associated runTask widget
            runTask: null,
            param: null
        },

        /**
         * Constructor
         *
         * @private
         */
        _create: function() {
            // Save pointers to associated Run Task widget or parameter
            this._setPointers();

            // Set variables
            var widget = this;
            this._value = null;
            this._display = null;

            // Add data pointer
            this.element.data("widget", this);

            // Add classes and child elements
            this.element.addClass("file-widget");
            this.element.append(
                $("<div></div>")
                    .addClass("file-widget-upload")
                    .append(
                        $("<button></button>")
                            .addClass("btn btn-default file-widget-upload-file")
                            .text("Upload File...")
                            .click(function () {
                                $(this).parents(".file-widget").find(".file-widget-input-file").click();
                            })
                    )
                    .append(
                        $("<input />")
                            .addClass("file-widget-input-file")
                            .attr("type", "file")
                            .change(function () {
                                var newValue = widget.element.find(".file-widget-input-file")[0].files[0];
                                widget.value(newValue);
                            })
                    )
                    .append(
                        $("<button></button>")
                            .addClass("file-widget-url")
                            .addClass("btn btn-default file-widget-button")
                            .text("Add Path or URL...")
                            .click(function() {
                                widget._pathBox(true);
                                widget.element.find(".file-widget-path-input").focus();
                            })
                    )
                    .append(
                        $("<span></span>")
                            .addClass("file-widget-drop")
                            .text("Drag Files Here")
                    )
                    .append(
                        $("<div></div>")
                            .addClass("file-widget-size")
                            .text(" 2GB file upload limit using the Upload File... button.")
                    )
            );
            this.element.append(
                $("<div></div>")
                    .addClass("file-widget-listing")
                    .css("display", "none")
                    .append(
                        $("<div></div>")
                            .addClass("file-widget-value")
                            .append(
                                $("<div></div>")
                                    .addClass("btn btn-default btn-sm file-widget-value-erase")
                                    .append(
                                        $("<span></span>")
                                            .addClass("fa fa-times")

                                    )
                                    .click(function() {
                                        widget._updateSlider("destroy");
                                        widget.clear();
                                    })
                            )
                            .append(
                                $("<span></span>")
                                    .addClass("file-widget-value-text")
                            )
                    )
            );
            this.element.append(
                $("<div></div>")
                    .addClass("form-group file-widget-path")
                    .css("display", "none")
                    .append(
                        $("<div></div>")
                            .addClass("control-label file-widget-path-label")
                            .text("Enter Path or URL")
                    )
                    .append(
                        $("<input />")
                            .addClass("form-control file-widget-path-input")
                            .attr("type", "text")
                    )
                    .append(
                        $("<div></div>")
                            .addClass("file-widget-path-buttons")
                            .append(
                                $("<button></button>")
                                    .addClass("btn btn-default file-widget-button")
                                    .text("Select")
                                    .click(function() {
                                        var boxValue = widget.element.find(".file-widget-path-input").val();
                                        widget.element.find(".file-widget-path-input").val("");
                                        widget._pathBox(false);
                                        widget.value(boxValue);
                                    })
                            )
                            .append(" ")
                            .append(
                                $("<button></button>")
                                    .addClass("btn btn-default file-widget-button")
                                    .text("Cancel")
                                    .click(function() {
                                        widget._pathBox(false);
                                        widget.element.find(".file-widget-path-input").val("");
                                    })
                            )
                    )
            );

            // Initialize the drag & drop functionality
            if (this.options.allowJobUploads) {
                this._initDragDrop();
            }

            // Hide elements if not in use by options
            this._setDisplayOptions();
        },

        /**
         * Destructor
         *
         * @private
         */
        _destroy: function() {
            this._updateSlider("destroy");
            this.element.removeClass("file-widget");
            this.element.empty();
        },

        /**
         * Update the left-hand slider with data information
         *
         * @private
         */
        _updateSlider: function(method) {
            if (method.toLowerCase() == "destroy") {
                GenePattern.notebook.removeSliderData(this._display);
            }
            // Else assume "update"
            else {
                GenePattern.notebook.updateSliderData(this._display, this._value);
            }
        },

        /**
         * Initializes the drag & drop functionality in the widget
         *
         * @private
         */
        _initDragDrop: function() {
            var widget = this;
            var dropTarget = this.element[0];

            dropTarget.addEventListener("dragenter", function(event) {
                widget.element.css("background-color", "#dfeffc");
                event.stopPropagation();
                event.preventDefault();
            }, false);
            dropTarget.addEventListener("dragexit", function(event) {
                widget.element.css("background-color", "");
                event.stopPropagation();
                event.preventDefault();
            }, false);
            dropTarget.addEventListener("dragover", function(event) {
                event.stopPropagation();
                event.preventDefault();
            }, false);
            dropTarget.addEventListener("drop", function(event) {
                // If there is are files assume this is a file drop
                if (event['dataTransfer'].files.length > 0) {
                    var files = event['dataTransfer'].files;
                    widget.value(files[0]);
                }
                // If not, assume this is a text drop
                else {
                    var html = event['dataTransfer'].getData('text/html');
                    var htmlList = $(html);

                    // Path for Firefox
                    if (htmlList.length === 1) {
                        var tag = $(htmlList).prop("tagName");
                        if (tag.toLowerCase() !== "a") {
                            htmlList = $(htmlList).find("a");
                        }
                        var text = $(htmlList).attr("href");
                        if (text !== undefined && text !== null) {
                            widget.value(text);
                        }
                    }

                    // Path for Chrome
                    else if (htmlList.length > 1) {
                        $.each(htmlList, function(i, e) {
                            var text = $(e).attr("href");
                            if (text !== undefined && text !== null) {
                                widget.value(text);
                            }
                        });
                    }
                }

                widget.element.css("background-color", "");

                event.stopPropagation();
                event.preventDefault();
            }, false);
        },

        /**
         * Shows or hides the box of selected files
         *
         * @param file - A string if to show, undefined or null if to hide
         * @private
         */
        _fileBox: function(file) {
            if (file) {
                this.element.find(".file-widget-value-text").text(file);
                this.element.find(".file-widget-listing").show();
                this.element.find(".file-widget-upload").hide();
            }
            else {
                this.element.find(".file-widget-upload").show();
                this.element.find(".file-widget-listing").hide();
            }
        },

        /**
         * Takes a value and returns the display string for the value
         *
         * @param value - the value, either a string or File object
         * @returns {string} - the display value
         * @private
         */
        _valueToDisplay: function(value) {
            if (typeof value === 'string') {
                return value;
            }
            else {
                return value.name;
            }
        },

        /**
         * Displays the select path or URL box
         *
         * @param showPathBox - Whether to display or hide the path box
         * @private
         */
        _pathBox: function(showPathBox) {
            if (showPathBox) {
                this.element.find(".file-widget-path").show();
                this.element.find(".file-widget-upload").hide();
            }
            else {
                this.element.find(".file-widget-path").hide();
                this.element.find(".file-widget-upload").show();
            }
        },

        /**
         * Update the pointers to the Run Task widget and parameter
         *
         * @private
         */
        _setPointers: function() {
            if (this.options.runTask) { this._runTask = this.options.runTask; }
            if (this.options.param) { this._param = this.options.param; }
        },

        /**
         * Update the display of the UI to match current options
         *
         * @private
         */
        _setDisplayOptions: function() {
            if (!this.options.allowJobUploads) {
                this.element.find(".file-widget-upload-file").hide();
                this.element.find(".file-widget-drop").hide();
                this.element.find(".file-widget-size").hide();
            }
            else {
                this.element.find(".file-widget-upload-file").show();
                this.element.find(".file-widget-drop").show();
                this.element.find(".file-widget-size").show();
            }
            if (!this.options.allowExternalUrls && !this.options.allowFilePaths) {
                this.element.find(".file-widget-url").hide();
            }
            else if (!this.options.allowExternalUrls && this.options.allowFilePaths) {
                this.element.find(".file-widget-url").show();
                this.element.find(".file-widget-url").text("Add Path...");
                this.element.find(".file-widget-path-label").text("Enter Path");
            }
            else if (this.options.allowExternalUrls && !this.options.allowFilePaths) {
                this.element.find(".file-widget-url").show();
                this.element.find(".file-widget-url").text("Add URL...");
                this.element.find(".file-widget-path-label").text("Enter URL");
            }
            else if (this.options.allowExternalUrls && this.options.allowFilePaths) {
                this.element.find(".file-widget-url").show();
                this.element.find(".file-widget-url").text("Add Path or URL...");
                this.element.find(".file-widget-path-label").text("Enter Path or URL");
            }
        },

        /**
         * Update all options
         *
         * @param options - Object contain options to update
         * @private
         */
        _setOptions: function(options) {
            this._superApply(arguments);
            this._setPointers();
            this._setDisplayOptions();
        },

        /**
         * Update individual option
         *
         * @param key - The name of the option
         * @param value - The new value of the option
         * @private
         */
        _setOption: function(key, value) {
            this._super(key, value);
            this._setPointers();
            this._setDisplayOptions();
        },

        /**
         * Upload the selected file to the server
         *
         * @param pObj - Object containing the following params:
         *                  success: Callback for success, expects url to file
         *                  error: Callback on error, expects exception
         * @returns {boolean} - Whether an upload was just initiated or not
         */
        upload: function(pObj) {
            var currentlyUploading = null;
            var widget = this;

            // Value is a File object
            if (typeof this.value() === 'object' && this.value()) {
                GenePattern.upload({
                    file: this.value(),
                    success: function(response, url) {
                        widget._value = url;
                        if (pObj.success) {
                            pObj.success(response, url);
                        }
                    },
                    error: function(exception) {
                        console.log("Error uploading file from file input widget: " + exception.statusText);
                        if (pObj.error) {
                            pObj.error(exception);
                        }
                    }
                });
                currentlyUploading = true;
            }
            // If the value is not set, give an error
            else if (!this.value()) {
                console.log("Cannot upload from file input: value is null.");
                currentlyUploading = false;
                if (pObj.error) {
                    pObj.error({statusText: "Cannot upload from file input: value is null."});
                }
            }
            // If the value is a string, do nothing
            else {
                // Else assume we have a non-upload value selected
                currentlyUploading = false;
            }
            return currentlyUploading;
        },

        /**
         * Getter for associated RunTask object
         *
         * @returns {object|null}
         */
        runTask: function() {
            return this._runTask;
        },

        /**
         * Getter for associated parameter
         * @returns {string|null|object}
         */
        param: function() {
            return this._param;
        },

        /**
         * Gets or sets the value of this widget
         *
         * @param [val=optional] - String value for file (undefined is getter)
         * @returns {object|string|null} - The value of this widget
         */
        value: function(val) {
            // Do setter
            if (val) {
                this._value = val;
                this._display = this._valueToDisplay(val);
                this._fileBox(this._display);
                this._updateSlider("update");
            }
            // Do getter
            else {
                return this._value;
            }
        },

        /**
         * Clears the current value of the widget and hides file box
         * @private
         */
        clear: function() {
            this._value = null;
            this._fileBox(null);
        }
    });


    /**
     * Widget for text input into a GenePattern Notebook.
     * Used for text, number and password inputs by the runTask widget.
     *
     * Supported Features:
     *      Text input
     *      Password input
     *      Number input
     *
     * Non-Supported Features:
     *      Directory input
     */
    $.widget("gp.textInput", {
        options: {
            type: "text", // Accepts: text, number, password
            default: "",

            // Pointers to associated runTask widget
            runTask: null,
            param: null
        },

        /**
         * Constructor
         *
         * @private
         */
        _create: function() {
            // Save pointers to associated Run Task widget or parameter
            this._setPointers();

            // Set variables
            var widget = this;
            //noinspection JSValidateTypes
            this._value = this.options.default;

            // Clean the type option
            this._cleanType();

            // Add data pointer
            this.element.data("widget", this);

            // Add classes and child elements
            this.element.addClass("text-widget");
            this.element.append(
                $("<input />")
                    .addClass("form-control text-widget-input")
                    .attr("type", this.options.type)
                    .val(this._value)
                    .change(function() {
                        widget._value = $(this).val();
                    })
            );

            // Hide elements if not in use by options
            this._setDisplayOptions();
        },

        /**
         * Destructor
         *
         * @private
         */
        _destroy: function() {
            this.element.removeClass("text-widget");
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
            this._setPointers();
            this._setDisplayOptions();
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
            this._setPointers();
            this._setDisplayOptions();
        },

        /**
         * Update the pointers to the Run Task widget and parameter
         *
         * @private
         */
        _setPointers: function() {
            if (this.options.runTask) { this._runTask = this.options.runTask; }
            if (this.options.param) { this._param = this.options.param; }
        },

        /**
         * Update the display of the UI to match current options
         *
         * @private
         */
        _setDisplayOptions: function() {
            this._cleanType();
            this.element.find(".text-widget-input").prop("type", this.options.type);
        },

        /**
         * Removes bad type listings, defaulting to text
         *
         * @private
         */
        _cleanType: function() {
            if (typeof this.options.type !== 'string') {
                console.log("Type option for text input is not a string, defaulting to text");
                this.options.type = "text";
            }
            if (this.options.type.toLowerCase() !== "text" &&
                this.options.type.toLowerCase() !== "password" &&
                this.options.type.toLowerCase() !== "number") {
                console.log("Type option for text input is not 'text', 'password' or 'number', defaulting to text");
                this.options.type = "text";
            }
        },

        /**
         * Gets or sets the value of the input
         *
         * @param val - the value for the setter
         * @returns {_value|string}
         */
        value: function(val) {
            // Do setter
            if (val) {
                this._value = val;
                this.element.find(".text-widget-input").val(val);
            }
            // Do getter
            else {
                return this._value;
            }
        }
    });


    /**
     * Widget for choice input into a GenePattern Notebook.
     * Used for choice inputs by the runTask widget.
     *
     * Supported Features:
     *      Simple Choice Input
     *
     * Non-Supported Features:
     *      File choice input
     *      Dynamic choice parameters
     */
    $.widget("gp.choiceInput", {
        options: {
            choices: [], // Assumes an object of key, value pairs
            default: null,

            // Pointers to associated runTask widget
            runTask: null,
            param: null
        },

        /**
         * Constructor
         *
         * @private
         */
        _create: function() {
            // Save pointers to associated Run Task widget or parameter
            this._setPointers();

            // Set variables
            var widget = this;

            // Add data pointer
            this.element.data("widget", this);

            // Add classes and child elements
            this.element.addClass("choice-widget");
            this.element.append(
                $("<select></select>")
                    .addClass("form-control choice-widget-select")
                    .change(function() {
                        widget._value = $(this).val();
                    })
            );

            // Hide elements if not in use by options
            this._setDisplayOptions();
        },

        /**
         * Destructor
         *
         * @private
         */
        _destroy: function() {
            this.element.removeClass("choice-widget");
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
            this._setPointers();
            this._setDisplayOptions();
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
            this._setPointers();
            this._setDisplayOptions();
        },

        /**
         * Update the pointers to the Run Task widget and parameter
         *
         * @private
         */
        _setPointers: function() {
            if (this.options.runTask) { this._runTask = this.options.runTask; }
            if (this.options.param) { this._param = this.options.param; }
        },

        /**
         * Update the display of the UI to match current options
         *
         * @private
         */
        _setDisplayOptions: function() {
            this._applyChoices();
            this._applyDefault();
        },

        /**
         * Applies the choices options, setting them to the provided values
         *
         * @private
         */
        _applyChoices: function() {
            if (typeof this.options.choices !== 'object') {
                console.log("Error reading choices in Choice Input, aborting");
                return;
            }

            var select = this.element.find(".choice-widget-select");
            select.empty();

            for (var key in this.options.choices) {
                if (this.options.choices.hasOwnProperty(key)) {
                    var value = this.options.choices[key];

                    select.append(
                        $("<option></option>")
                            .text(key)
                            .val(value)
                    );
                }
            }
        },

        /**
         * Applies the option for default, resetting the selected option
         *
         * @private
         */
        _applyDefault: function() {
            this.element.find(".choice-widget-select").val(this.options.default);
            this._value = this.element.find(".choice-widget-select").val();
        },

        /**
         * Gets or sets the value of the input
         *
         * @param val - the value for the setter
         * @returns {_value|string}
         */
        value: function(val) {
            // Do setter
            if (val) {
                this._value = val;
                this.element.find(".choice-widget-select").val(val);
            }
            // Do getter
            else {
                return this._value;
            }
        }
    });


    /**
     * Widget for entering parameters and launching a job from a task.
     *
     * Supported Features:
     *      File Inputs
     *      Text Inputs
     *      Choice Inputs
     *
     * Non-Supported Features:
     *      Batch Parameters
     *      EULA support
     *      Dynamic Dropdowns
     *      Reloaded Jobs
     *      File Lists
     *      Task Source
     */
    $.widget("gp.runTask", {
        options: {
            lsid: null,
            name: null
        },

        /**
         * Constructor
         *
         * @private
         */
        _create: function() {
            // Set variables
            var widget = this;
            var identifier = this._getIdentifier();

            // Add data pointer
            this.element.data("widget", this);

            // Add classes and scaffolding
            this.element.addClass("panel panel-default gp-widget gp-widget-task");
            this.element.append( // Attach header
                $("<div></div>")
                    .addClass("panel-heading gp-widget-task-header")
                    .append(
                        $("<div></div>")
                            .addClass("widget-float-right")
                            .append(
                                $("<span></span>")
                                    .addClass("gp-widget-task-version")
                            )
                            .append(
                                $("<button></button>")
                                    .addClass("btn btn-default btn-sm gp-widget-task-doc")
                                    .css("padding", "2px 7px")
                                    .attr("title", "View Documentation")
                                    .attr("data-toggle", "tooltip")
                                    .attr("data-placement", "bottom")
                                    .append(
                                        $("<span></span>")
                                            .addClass("fa fa-question")
                                    )
                                    .tooltip()
                                    .click(function(event) {
                                        var url = $(event.target).attr("data-href");
                                        window.open(url,'_blank');
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
                            .append(
                                $("<span></span>")
                                    .addClass("gp-widget-task-name")
                            )
                    )
            );
            this.element.append( // Attach header
                $("<div></div>")
                    .addClass("panel-body")
                    .append(
                        $("<div></div>")
                            .addClass("widget-code gp-widget-task-code")
                            .css("display", "none")
                    )
                    .append( // Attach message box
                        $("<div></div>")
                            .addClass("alert gp-widget-task-message")
                            .css("display", "none")
                    )
                    .append( // Attach subheader
                        $("<div></div>")
                            .addClass("gp-widget-task-subheader")
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-task-desc")
                            )
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-task-run")
                                    .append(
                                        $("<button></button>")
                                            .addClass("btn btn-primary gp-widget-task-run-button")
                                            .text("Run")
                                            .click(function() {
                                                if (widget.validate()) {
                                                    widget.submit();
                                                }
                                            })
                                    )
                                    .append("* Required Field")
                            )
                    )
                    .append(
                        $("<div></div>") // Attach form placeholder
                            .addClass("form-horizontal gp-widget-task-form")
                    )
                    .append( // Attach footer
                        $("<div></div>")
                            .addClass("gp-widget-task-footer")
                            .append(
                                $("<div></div>")
                                    .addClass("gp-widget-task-run")
                                    .append(
                                        $("<button></button>")
                                            .addClass("btn btn-primary gp-widget-task-run-button")
                                            .text("Run")
                                            .click(function() {
                                                if (widget.validate()) {
                                                    widget.submit();
                                                }
                                            })
                                    )
                                    .append("* Required Field")
                            )
                    )
            );

            // Check to see if the user is authenticated yet
            if (GenePattern.authenticated) {
                // Make call to build the header & form
                this._task = this._loadTask(identifier);

                setTimeout(function() {
                    if (widget._task !== null) {
                        widget._buildHeader();
                        widget._buildForm();
                    }
                    else {
                        widget._showUninstalledMessage();
                    }
                }, 1);
            }
            else {
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
            this.element.removeClass("gp-widget-task");
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
            var identifier = this._getIdentifier();
            this._task = this._loadTask(identifier);
            if (this._task !== null) {
                this._buildHeader();
                this._buildForm();
            }
            else {
                this._showUninstalledMessage();
            }
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
         * Returns an identifier for attaining the Task object from the server
         *
         * @returns {string|null}
         * @private
         */
        _getIdentifier: function() {
            if (this.options.lsid) { return this.options.lsid; }
            else if (this.options.name) { return this.options.name }
            else {
                throw "Error creating Run Task widget! No LSID or name!";
            }
        },

        /**
         * Returns the Task object based on the identifier
         *
         * @param identifier - String containing name or LSID
         * @returns {GenePattern.Task|null}
         * @private
         */
        _loadTask: function(identifier) {
            return GenePattern.task(identifier);
        },

        /**
         * Display module not installed message
         *
         * @private
         */
        _showUninstalledMessage: function() {
            this.element.find(".gp-widget-task-name").empty().text(" GenePattern Task: Module Not Installed");
            this.element.find(".gp-widget-task-form").empty().text("The module used by this widget is not installed on this GenePattern server.");
            this.element.find(".gp-widget-task-subheader").hide();
            this.element.find(".gp-widget-task-footer").hide();
        },

        /**
         * Display the not authenticated message
         *
         * @private
         */
        _showAuthenticationMessage: function() {
            this.element.find(".gp-widget-task-name").empty().text(" GenePattern Task: Not Authenticated");
            this.element.find(".gp-widget-task-form").empty()
                .addClass("alert alert-danger")
                .text("You must be authenticated before the task information can be displayed. After you authenticate it may take a few seconds for the task information to appear.");
            this.element.find(".gp-widget-task-subheader").hide();
            this.element.find(".gp-widget-task-footer").hide();

            // Update the doc button
            this.element.find(".gp-widget-task-doc").attr("disabled", "disabled");
        },

        /**
         * Polls every few seconds to see if the notebook is authenticated, and gets task info once authenticated
         *
         * @private
         */
        _pollForAuth: function() {
            var widget = this;
            setTimeout(function() {
                // Check to see if the user is authenticated yet
                if (GenePattern.authenticated) {
                    // If authenticated, execute cell again
                    widget.element.closest(".cell").data("cell").execute();
                }
                else {
                    // If not authenticated, poll again
                    widget._pollForAuth();
                }
            }, 1000);
        },

        /**
         * Build the header and return the Task object
         *
         * @private
         */
        _buildHeader: function() {
            this.element.find(".gp-widget-task-subheader").show();
            this.element.find(".gp-widget-task-footer").show();

            this.element.find(".gp-widget-task-name").empty().text(" " + this._task.name());
            this.element.find(".gp-widget-task-version").empty().text("Version " + this._task.version());
            this.element.find(".gp-widget-task-doc").attr("data-href", GenePattern.server() + this._task.documentation().substring(3));
            this.element.find(".gp-widget-task-desc").empty().text(this._task.description());
        },

        /**
         * Parse the code for the job spec and return the values of the inputs in a dictionary
         *
         * @private
         */
        _parseJobSpec: function() {
            var dict = {};
            var code = this.element.closest(".cell").data("cell").code_mirror.getValue();
            var lines = code.split("\n");

            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];

                // Here is a line to parse
                if (line.indexOf("_job_spec.set_parameter") !== -1) {
                    var parts = line.split(",");
                    var first = parts[0].split("\"");
                    var second = parts[1].split("\"");
                    var key = first[1];
                    dict[key] = second[1];
                }
            }

            return dict;
        },

        /**
         * Make the call to the server to get the params and build the form
         *
         * @private
         */
        _buildForm: function() {
            var widget = this;
            this.element.find(".gp-widget-task-form").empty();

            this._task.params({
                success: function(response, params) {
                    var reloadVals = widget._parseJobSpec();

                    for (var i = 0; i < params.length; i++) {
                        try {
                            var param = params[i];
                            var pDiv = widget._addParam(param);

                            if (reloadVals[param.name()] !== undefined) {
                                var pWidget = pDiv.data("widget");
                                pWidget.value(reloadVals[param.name()]);
                            }
                        }
                        catch(exception) {
                            alert(exception);
                            console.log(exception);
                        }
                    }
                },
                error: function(exception) {
                    widget.errorMessage("Could not load task: " + exception.statusText);
                }
            });
        },

        /**
         * Toggle the code view on or off
         */
        toggleCode: function() {
            var code = this.element.find(".gp-widget-task-code");
            var form = this.element.find(".gp-widget-task-form");
            var headers = this.element.find(".gp-widget-task-subheader, .gp-widget-task-footer");

            if (code.is(":hidden")) {
                this.element.closest(".cell").data("cell").code_mirror.refresh();
                var raw = this.element.closest(".cell").find(".input").html();
                code.html(raw);

                // Fix the issue where the code couldn't be selected
                code.find(".CodeMirror-scroll").attr("draggable", "false");

                form.slideUp();
                headers.slideUp();
                code.slideDown();
            }
            else {
                form.slideDown();

                // Only show these bits if authenticated
                if (GenePattern.authenticated) {
                    headers.slideDown();
                }

                code.slideUp();
            }
        },

        /**
         * Add the parameter to the form and return the widget
         *
         * @param param {GenePattern.Param}
         * @private
         */
        _addParam: function(param) {
            var form = this.element.find(".gp-widget-task-form");
            var required = param.optional() ? "" : "*";

            var paramBox = $("<div></div>")
                .addClass(" form-group gp-widget-task-param")
                .attr("name", param.name())
                .append(
                    $("<label></label>")
                        .addClass("col-sm-3 control-label gp-widget-task-param-name")
                        .text(param.name() + required)
                )
                .append(
                    $("<div></div>")
                        .addClass("col-sm-9 gp-widget-task-param-wrapper")
                        .append(
                            $("<div></div>")
                                .addClass("gp-widget-task-param-input")
                        )
                        .append(
                            $("<div></div>")
                                .addClass("gp-widget-task-param-desc")
                                .text(param.description())
                        )
                );
            if (required) paramBox.addClass("gp-widget-task-required");

            // Add the correct input widget
            if (param.type() === "java.io.File") {
                paramBox.find(".gp-widget-task-param-input").fileInput({
                    runTask: this,
                    param: param
                });
            }
            else if (param.choices()) {
                paramBox.find(".gp-widget-task-param-input").choiceInput({
                    runTask: this,
                    param: param,
                    choices: param.choices(),
                    default: param.defaultValue()
                });
            }
            else if (param.type() === "java.lang.String") {
                paramBox.find(".gp-widget-task-param-input").textInput({
                    runTask: this,
                    param: param,
                    default: param.defaultValue()
                });
            }
            else if (param.type() === "java.lang.Integer") {
                paramBox.find(".gp-widget-task-param-input").textInput({
                    runTask: this,
                    param: param,
                    default: param.defaultValue(),
                    type: "number"
                });
            }
            else {
                console.log("Unknown input type for Run Task widget");
            }

            form.append(paramBox);
            return paramBox.find(".gp-widget-task-param-input");
        },

        /**
         * From the input widget's element get the input widget's value
         *
         * @param inputDiv - The element that has been made into the widget
         * @returns {*}
         * @private
         */
        _getInputValue: function(inputDiv) {
            if ($(inputDiv).hasClass("file-widget")) {
                return $(inputDiv).fileInput("value");
            }
            else if ($(inputDiv).hasClass("text-widget")) {
                return $(inputDiv).textInput("value");
            }
            else if ($(inputDiv).hasClass("choice-widget")) {
                return $(inputDiv).choiceInput("value");
            }
            else {
                console.log("Unknown input widget type.");
                return null;
            }
        },

        /**
         * Show a success message to the user
         *
         * @param message - String containing the message to show
         */
        successMessage: function(message) {
            var messageBox = this.element.find(".gp-widget-task-message");
            messageBox.removeClass("alert-danger");
            messageBox.addClass("alert-success");
            messageBox.text(message);
            messageBox.show("shake", {}, 500);
        },

        /**
         * Show an error message to the user
         *
         * @param message - String containing the message to show
         */
        errorMessage: function(message) {
            var messageBox = this.element.find(".gp-widget-task-message");
            messageBox.removeClass("alert-success");
            messageBox.addClass("alert-danger");
            messageBox.text(message);
            messageBox.show("shake", {}, 500);
        },

        /**
         * Validate the current Run Task form
         */
        validate: function() {
            var validated = true;
            var missing = [];
            var params = this.element.find(".gp-widget-task-param");

            // Validate each required parameter
            for (var i = 0; i < params.length; i++) {
                var param = $(params[i]);
                var required = param.hasClass("gp-widget-task-required");
                if (required) {
                    var input = param.find(".gp-widget-task-param-input");
                    var value = this._getInputValue(input);
                    if (value === null || value === "") {
                        param.addClass("gp-widget-task-param-missing");
                        missing.push(param.attr("name"));
                        validated = false;
                    }
                    else {
                        param.removeClass("gp-widget-task-param-missing");
                    }
                }
            }

            // Display message to user
            if (validated) {
                //this.successMessage("All required parameters present.");
            }
            else {
                this.errorMessage("Missing required parameters: " + missing.join(", "));
            }

            return validated;
        },

        /**
         * Submit the Run Task form to the server
         */
        submit: function() {
            // Create the job input
            var jobInput = this._task.jobInput();
            var widget = this;

            this.uploadAll({
                success: function() {
                    // Assign values from the inputs to the job input
                    var uiParams = widget.element.find(".gp-widget-task-param");
                    for (var i = 0; i < uiParams.length; i++) {
                        var uiParam = $(uiParams[i]);
                        var uiInput = uiParam.find(".gp-widget-task-param-input");
                        var uiValue = widget._getInputValue(uiInput);

                        if (uiValue !== null) {
                            var objParam = jobInput.params()[i];
                            objParam.values([uiValue]);
                        }
                    }

                    // Submit the job input
                    jobInput.submit({
                        success: function(response, jobNumber) {
                            //widget.successMessage("Job successfully submitted! Job ID: " + jobNumber);

                            // Set the code for the job widget
                            var cell = widget.element.closest(".cell").data("cell");
                            var code = GenePattern.notebook.buildJobCode(jobNumber);
                            cell.code_mirror.setValue(code);

                            // Execute cell.
                            cell.execute();
                        },
                        error: function(exception) {
                            widget.errorMessage("Error submitting job: " + exception.statusText);
                        }
                    });
                },
                error: function(exception) {
                    widget.errorMessage("Error uploading in preparation of job submission: " + exception.statusText);
                }
            });
        },

        /**
         * Upload all the file inputs that still need uploading
         *
         * @param pObj - Object containing the following params:
         *                  success: Callback for success, expects no arguments
         *                  error: Callback on error, expects exception
         * @returns {boolean} - Whether an upload was just initiated or not
         */
        uploadAll: function(pObj) {
            var files = this.element.find(".file-widget");
            var widget = this;

            // Cycle through all files
            for (var i = 0; i < files.length; i++) {
                var fileWidget = $(files[i]);
                var value = fileWidget.fileInput("value");

                // If one needs to be uploaded, upload, recheck
                if (typeof value === 'object' && value !== null) {
                    widget.successMessage("Uploading file: " + value.name);
                    fileWidget.fileInput("upload", {
                        success: function() {
                            widget.uploadAll(pObj);
                        },
                        error: pObj.error
                    });
                    return true
                }
            }

            // If none need to be uploaded, call success function
            pObj.success();
            return false;
        }
    });

    var TaskWidgetView = IPython.WidgetView.extend({
        render: function () {
            // Double check to make sure that this is the correct cell
            if ($(this.options.cell.element).hasClass("running")) {
                // Render the view.
                this.setElement($('<div></div>'));
                var lsid = this.model.get('lsid');
                var name = this.model.get('name');

                // Determine which identifier is used
                if (lsid) {
                    this.$el.runTask({
                        lsid: lsid
                    });
                }
                else {
                    this.$el.runTask({
                        name: name
                    });
                }

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

    // Register the TaskWidgetView with the widget manager.
    IPython.WidgetManager.register_widget_view('TaskWidgetView', TaskWidgetView);
});