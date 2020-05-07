/**
 * @author Thorin Tabor
 *
 * Library for interfacing with GenePattern REST API from JavaScript.
 *
 * Copyright 2015-2020 Regents of the University of California & The Broad Institute
 */

define("genepattern", ["jquery", "jqueryui"], function ($) {

    /**
     * Declaration of top gp library namespace
     *
     * @required - jQuery 1.5+ library
     */
    // const GenePattern = GenePattern || {};
    const GenePattern = function() {
        const gp = this;

        gp._server = null;
        gp._tasks = [];
        gp._jobs = [];
        gp._kinds = [];
        gp.authenticated = false;
        gp.initialized = false;
        gp.password = null;
        gp.username = null;
        gp.token = null;

        /**
         * Easily determine if the URL to the GenePattern server has been set or not.
         *
         * @returns {boolean} - true if the server has been set, else false
         */
        gp.isServerSet = () => !!gp._server;


        /**
         * Sets or returns the server at which this library is pointed
         * Example: https://cloud.genepattern.org/gp
         *
         * @returns {string|null}
         */
        gp.server = function (serverUrl) {
            if (serverUrl === undefined) {
                return gp._server;
            }
            else {
                gp._server = serverUrl;
            }
        };


        /**
         * Gets or sets the map of kind to task
         *
         * @param kindMap
         * @returns {Array|*}
         */
        gp.kinds = function (kindMap) {
            if (kindMap === undefined) {
                return gp._kinds;
            }
            else {
                gp._kinds = kindMap;
            }
        };


        /**
         * Given a map of kinds to task LSIDs (as returned by the REST API), returns a map of kinds to the
         * linked Task() objects. Prints and error if the Task() object cannot be found.
         *
         * @param kindMap
         * @returns {Array|*}
         */
        gp.linkKinds = function (kindMap) {
            const returnMap = {};

            $.each(kindMap, function (key, taskArray) {
                const returnArray = [];

                for (let i = 0; i < taskArray.length; i++) {
                    const lsid = taskArray[i];
                    const task = gp.task(lsid);
                    if (task === null) {
                        console.log("Error finding Task() for LSID: " + lsid + " skipping...")
                    }
                    else {
                        // Add Task() to array
                        returnArray.push(task);
                    }
                }

                // Add array of Task()s to map
                returnMap[key] = returnArray;
            });

            return returnMap;
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
        gp.tasks = function (pObj) {
            const forceRefresh = pObj && ((typeof pObj.force === 'boolean' && pObj.force) ||
                (typeof pObj.force === 'string' && pObj.force.toLowerCase() === 'true'));
            const useCache = gp._tasks && !forceRefresh;

            if (useCache) {
                return new $.Deferred()
                    .done(function () {
                        if (pObj && pObj.success) {
                            pObj.success("cached", gp._tasks);
                        }
                    })
                    .resolve();
            }
            else {
                const REST_ENDPOINT = "/rest/v1/tasks/all.json";
                const includeHidden = pObj && pObj.hidden && pObj.hidden.toLowerCase() === 'true' ? '?includeHidden=true' : '';

                return $.ajax({
                    url: gp.server() + REST_ENDPOINT + includeHidden,
                    type: 'GET',
                    dataType: 'json',
                    headers: {"Authorization": "Bearer " + gp.token},
                    xhrFields: {
                        withCredentials: true
                    }
                })
                    .done(function (response) {
                        // Create the new _tasks list and iterate over returned JSON list, creating Task objects
                        gp._tasks = [];
                        const modules = response['all_modules'];
                        if (modules) {
                            for (let i = 0; i < modules.length; i++) {
                                const json = modules[i];
                                gp._tasks.push(new gp.Task(json));
                            }
                        }

                        if (pObj && pObj.success) {
                            pObj.success(response, gp._tasks);
                        }
                    })
                    .fail(function (exception) {
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
         * @returns {gp.Task|null} - The Task object from the cache
         */
        gp.task = function (pObj) {
            // Ensure either lsid or name is defined
            if (!pObj) throw "GenePattern.task() parameter either null or undefined";
            if (typeof pObj === 'object' && !pObj.lsid && !pObj.name) throw "GenePattern.task() parameter does not contain lsid or name";
            if (typeof pObj !== 'string' && typeof pObj !== 'object') throw "GenePattern.task() parameter must be either object or string";
            if (gp._tasks === null) throw "gp task list has not been initialized";

            const identifier = typeof pObj === 'string' ? pObj : null;
            const isLsid = identifier.indexOf(':') > -1;
            const isBaseLsid = (identifier.split(":").length - 1) === 4;

            for (let i = 0; i < gp._tasks.length; i++) {
                const task = gp._tasks[i];
                if (isLsid && (task.lsid() === pObj.lsid || task.lsid() === identifier)) return task;
                if (isBaseLsid && (task.baseLsid() === pObj.lsid || task.baseLsid() === identifier)) return task;
                if (!isBaseLsid && (task.name() === pObj.name || task.name() === identifier)) return task;
            }

            return null;
        };

        /**
         * Queries the server for a task object and its parameters. Useful for obtaining
         * alternate versions of modules, as well as hidden modules or modules otherwise
         * not in the cache.
         *
         * @param pObj - An object specifying the following properties:
         *                  lsid: the LSID of the task to load from the server
         *                  name: the name of the task to load from the server
         *                          If neither LSID nor name is defined, an error will
         *                          be thrown.
         *                  success: callback to call upon successful load, passes in
         *                          the new Task() object as a parameter
         *                  error: callback for when something went wrong creating the
         *                          task object, passes in the exception as a parameter
         *
         * @returns {jQuery.Deferred} - Returns a jQuery Deferred object for event chaining.
         *      See http://api.jquery.com/jquery.deferred/ for details.
         */
        gp.taskQuery = function (pObj) {
            // Ensure either lsid or name is defined
            if (!pObj) throw "GenePattern.taskQuery() parameter either null or undefined";
            if (typeof pObj === 'object' && !pObj.lsid && !pObj.name) throw "GenePattern.taskQuery() parameter does not contain lsid or name";
            if (typeof pObj !== 'object') throw "GenePattern.taskQuery() parameter must be object";

            const identifier = pObj.lsid ? pObj.lsid : pObj.name;
            const REST_ENDPOINT = "/rest/v1/tasks/";

            return $.ajax({
                url: gp.server() + REST_ENDPOINT + encodeURIComponent(identifier),
                type: 'GET',
                dataType: 'json',
                headers: {"Authorization": "Bearer " + gp.token},
                xhrFields: {
                    withCredentials: true
                },
                success: function (response) {
                    // Create the Task object
                    const task = new gp.Task(response);

                    // Add params to Task object
                    const params = response['params'];
                    if (params) {
                        task._params = [];
                        for (let i = 0; i < params.length; i++) {
                            const param = params[i];
                            task._params.push(new gp.Param(param));
                        }
                    }

                    // Add updated EULA info to Task Object
                    task._eula = response['eulaInfo'];

                    if (pObj && pObj.success) {
                        pObj.success(task);
                    }
                },
                error: function (exception) {
                    if (pObj && pObj.error) {
                        pObj.error(exception);
                    }
                }
            });
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
        gp.jobs = function (pObj) {
            const forceRefresh = pObj && pObj.force && pObj.force.toLowerCase() === 'true';
            const useCache = gp._jobs && !forceRefresh;

            if (useCache) {
                return new $.Deferred()
                    .done(function () {
                        if (pObj && pObj.success) {
                            pObj.success("cached", gp._jobs);
                        }
                    })
                    .resolve();
            }
            else {
                let REST_ENDPOINT = "/rest/v1/jobs/?";

                const userId = pObj && pObj['userId'] ? pObj['userId'] : null;
                const groupId = pObj && pObj['groupId'] ? pObj['groupId'] : null;
                const batchId = pObj && pObj['batchId'] ? pObj['batchId'] : null;
                const pageSize = pObj && pObj['pageSize'] ? pObj['pageSize'] : null;
                const page = pObj && pObj['page'] ? pObj['page'] : null;
                const includeChildren = pObj && pObj['includeChildren'] ? pObj['includeChildren'] : null;
                const includeOutputFiles = pObj && pObj['includeOutputFiles'] ? pObj['includeOutputFiles'] : null;
                const includePermissions = pObj && pObj['includePermissions'] ? pObj['includePermissions'] : null;

                if (userId) REST_ENDPOINT += "&userId=" + encodeURIComponent(userId);
                if (groupId) REST_ENDPOINT += "&groupId=" + encodeURIComponent(groupId);
                if (batchId) REST_ENDPOINT += "&batchId=" + encodeURIComponent(batchId);
                if (pageSize) REST_ENDPOINT += "&pageSize=" + encodeURIComponent(pageSize);
                if (page) REST_ENDPOINT += "&page=" + encodeURIComponent(page);
                if (includeChildren) REST_ENDPOINT += "&includeChildren=" + encodeURIComponent(includeChildren);
                if (includeOutputFiles) REST_ENDPOINT += "&includeOutputFiles=" + encodeURIComponent(includeOutputFiles);
                if (includePermissions) REST_ENDPOINT += "&includePermissions=" + encodeURIComponent(includePermissions);

                return $.ajax({
                    url: gp.server() + REST_ENDPOINT,
                    type: 'GET',
                    dataType: 'json',
                    headers: {"Authorization": "Bearer " + gp.token},
                    xhrFields: {
                        withCredentials: true
                    }
                })
                    .done(function (response) {
                        // Create the new _jobs list and iterate over returned JSON list, creating Job objects
                        gp._jobs = [];
                        const jobs = response['items'];
                        if (jobs) {
                            for (let i = 0; i < jobs.length; i++) {
                                const json = jobs[i];
                                gp._jobs.push(new gp.Job(json));
                            }
                        }

                        if (pObj && pObj.success) {
                            pObj.success(response, gp._tasks);
                        }
                    })
                    .fail(function (exception) {
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
        gp.job = function (pObj) {
            const forceRefresh = pObj && ((typeof pObj.force === 'boolean' && pObj.force) ||
                (typeof pObj.force === 'string' && pObj.force.toLowerCase() === 'true'));
            const getPermissions = pObj && ((typeof pObj.permissions === 'boolean' && pObj.permissions) ||
                (typeof pObj.permissions === 'string' && pObj.permissions.toLowerCase() === 'true'));
            const jobNumber = pObj.jobNumber;

            // Try to find the job in the cache
            if (!forceRefresh && gp._jobs) {
                for (let i = 0; i < gp._jobs.length; i++) {
                    const job = gp._jobs[i];
                    if (job.jobNumber() === jobNumber) {
                        return new $.Deferred()
                            .done(function () {
                                if (pObj && pObj.success) {
                                    pObj.success("Job cached", job);
                                }
                            })
                            .resolve();
                    }
                }
            }

            // Otherwise, if not cached or refreshed forced
            const permissionsParam = getPermissions ? "?includePermissions=true" : "";
            const REST_ENDPOINT = "/rest/v1/jobs/";

            return $.ajax({
                url: gp.server() + REST_ENDPOINT + jobNumber + permissionsParam,
                type: 'GET',
                dataType: 'json',
                headers: {"Authorization": "Bearer " + gp.token},
                xhrFields: {
                    withCredentials: true
                }
            })
                .done(function (response) {
                    // Create the new _jobs list and iterate over returned JSON list, creating Job objects
                    const loadedJob = new gp.Job(response);

                    if (pObj && pObj.success) {
                        pObj.success(response, loadedJob);
                    }
                })
                .fail(function (exception) {
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
        gp.upload = function (pObj) {
            // Ensure the file is specified
            if (!pObj) throw "GenePattern.upload() parameter either null or undefined";
            if (typeof pObj === 'object' && typeof pObj.file !== 'object') throw "GenePattern.upload() parameter does not contain a File object";

            const REST_ENDPOINT = "/rest/v1/data/upload/job_input";
            const nameParam = "?name=" + pObj.file.name;

            return $.ajax({
                url: gp.server() + REST_ENDPOINT + nameParam,
                type: 'POST',
                dataType: "text",
                processData: false,
                data: pObj.file,
                xhrFields: {
                    withCredentials: true
                },
                headers: {
                    "Authorization": "Bearer " + gp.token,
                    "Content-Length": pObj.file.size
                },
                success: function (data, textStatus) {
                    if (pObj && pObj.success) {
                        pObj.success(textStatus, data);
                    }
                }
            })
                .fail(function (exception) {
                    if (pObj && pObj.error) {
                        pObj.error(exception);
                    }
                });
        };


        /**
         * Declaration of Task class
         * @constructor
         */
        gp.Task = function (taskJson) {
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
            this._param_groups = null;
            this._eula = null;

            /**
             * Constructor-like initialization for the Task class
             *
             * @private
             */
            this._init_ = function () {
                if (taskJson) {
                    this._tags = taskJson.tags;
                    this._description = taskJson.description;
                    this._name = taskJson.name;
                    this._documentation = taskJson.documentation;
                    this._categories = taskJson.categories;
                    this._suites = taskJson.suites;
                    this._version = taskJson.version;
                    this._lsid = taskJson.lsid;
                    this._eula = taskJson.eulaInfo;
                }
            };
            this._init_();

            /**
             * Returns a JobInput object for submitting a job for this task
             * @returns {GenePattern.JobInput}
             */
            this.jobInput = function () {
                return new gp.JobInput(this);
            };

            /**
             * Loads a specific Param object, loading parameters via REST, if necessary
             *
             * @param pObj - The following parameters may be set
             *                  name: the name of the parameter
             *                  success: callback function for a done() event,
             *                          expects response and a Param object
             *                  error: callback function for an fail() event, expects exception as argument
             *
             * @returns {jQuery.Deferred} - Returns a jQuery Deferred object for event chaining.
             *      See http://api.jquery.com/jquery.deferred/ for details.
             */
            this.param = function(pObj) {
                this.params({
                    "success": function(response, params) {
                        let found = false;
                        params.forEach(function(i) {
                            if (pObj.name === i.name()) {
                                pObj.success(response, i);
                                found = true;
                                return false;
                            }
                        });

                        // Return an error if no matching param found
                        if (!found) {
                            pObj.error("No parameter matching found matching: " + pObj.name);
                        }
                    },
                    "error": pObj.error
                });
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
            this.params = function (pObj) {
                const task = this;
                const forceRefresh = pObj && ((typeof pObj.force === 'boolean' && pObj.force) ||
                    (typeof pObj.force === 'string' && pObj.force.toLowerCase() === 'true'));
                const inCache = forceRefresh ? false : task._params !== null;

                if (inCache) {
                    return new $.Deferred()
                        .done(function () {
                            if (pObj && pObj.success) {
                                pObj.success("cached", task._params);
                            }
                        })
                        .resolve();
                }
                else {
                    const REST_ENDPOINT = "/rest/v1/tasks/";

                    return $.ajax({
                        url: gp.server() + REST_ENDPOINT + encodeURIComponent(task.lsid()),
                        type: 'GET',
                        dataType: 'json',
                        headers: {"Authorization": "Bearer " + gp.token},
                        xhrFields: {
                            withCredentials: true
                        }
                    })
                        .done(function (response) {
                            // Add params to Task object
                            const params = response['params'];
                            if (params) {
                                task._params = [];
                                for (let i = 0; i < params.length; i++) {
                                    const param = params[i];
                                    task._params.push(new gp.Param(param));
                                }
                            }

                            // Add param groups, if supported
                            if (response['paramGroups']) {
                                task._param_groups = response['paramGroups'];
                            }

                            // Add job option params, if supported
                            if (!!response['config']) {
                                // Add the job options param group to the list
                                if(!!response['config']['job.inputParamGroup']) task._param_groups.push(response['config']['job.inputParamGroup']);

                                // Add the job options params to the list
                                if(!!response['config']['job.inputParams']) {
                                    for (let i = 0; i < response['config']['job.inputParams'].length; i++) {
                                        const param = response['config']['job.inputParams'][i];
                                        task._params.push(new gp.Param(param));
                                    }
                                }
                            }

                            // Add updated EULA info to Task Object
                            task._eula = response['eulaInfo'];

                            if (pObj && pObj.success) {
                                pObj.success(response, task._params);
                            }
                        })
                        .fail(function (exception) {
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
            this.tags = function () {
                return this._tags;
            };

            /**
             * Getter for Task description
             *
             * @returns {null|string}
             */
            this.description = function () {
                return this._description;
            };

            /**
             * Getter for Task name
             *
             * @returns {null|string}
             */
            this.name = function () {
                return this._name;
            };

            /**
             * Getter for URL to Task documentation
             *
             * @returns {null|string}
             */
            this.documentation = function () {
                return this._documentation;
            };

            /**
             * Getter for list of Task categories
             *
             * @returns {null|Array}
             */
            this.categories = function () {
                return this._categories;
            };

            /**
             * Getter for list of Task suites
             *
             * @returns {null|Array}
             */
            this.suites = function () {
                return this._suites;
            };

            /**
             * Getter for Task version
             *
             * @returns {null|number}
             */
            this.version = function () {
                return this._version;
            };

            /**
             * Getter for Task LSID
             *
             * @returns {null|string}
             */
            this.lsid = function () {
                return this._lsid;
            };

            /**
             * Get the base of the LSID
             *
             * @returns {null}
             */
            this.baseLsid = function () {
                const parts = this._lsid.split(':');
                if (parts.length === 6) {
                    parts.pop();
                    return parts.join(':');
                }
                else {
                    return this._lsid;
                }
            };

            /**
             * Getter for parameter group info
             *
             * @returns {null|string}
             */
            this.paramGroups = function () {
                return this._param_groups;
            };

            /**
             * Getter for EULA info
             *
             * @returns {null|string}
             */
            this.eula = function () {
                return this._eula;
            };

            /**
             * Accepts any pending EULAs for this task
             *
             * Executes the error function if there are no pending EULAs
             * or no EULA info attached to the Task object.
             *
             * @param success - function to execute upon success
             * @param error - function to execute upon error
             */
            this.acceptEula = function (success, error) {
                const eula = this.eula();

                // Execute error if no eula object
                if (eula === undefined || eula === null) {
                    error(null, "no EULA object defined");
                }

                // Execute error if no pending EULAs to accept
                if (eula['pendingEulas'] === undefined || eula['pendingEulas'] === null || eula['pendingEulas'].length < 1) {
                    error(null, "no pending EULAs to accept");
                }

                // Call the accept endpoint
                const lsid = eula.acceptData.lsid;
                const url = eula.acceptUrl;
                const method = eula.acceptType;

                $.ajax({
                    url: url + "?lsid=" + encodeURIComponent(lsid),
                    type: method,
                    xhrFields: {
                        withCredentials: true
                    },
                    headers: {"Authorization": "Bearer " + gp.token},
                    success: success,
                    error: error
                });
            };

            return this;
        };


        /**
         * Declaration of Job class
         * @constructor
         */
        gp.Job = function (jobJson) {
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
            this._launchUrl = null;
            this._children = null;

            /**
             * Constructor-like initialization for the Job class
             *
             * @private
             */
            this._init_ = function () {
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
                    this._task = gp.task(this._taskLsid);
                    this._launchUrl = jobJson.launchUrl;
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
            this.update = function (pObj) {
                const REST_ENDPOINT = "/rest/v1/jobs/" + this.jobNumber() + "/status.json";
                const job = this;

                return $.ajax({
                    url: gp.server() + REST_ENDPOINT,
                    type: 'GET',
                    dataType: 'json',
                    headers: {"Authorization": "Bearer " + gp.token},
                    xhrFields: {
                        withCredentials: true
                    }
                })
                    .done(function (response) {
                        // Add params to Job object
                        const status = response;
                        if (status) {
                            job._status = status;
                        }

                        if (pObj && pObj.success) {
                            pObj.success(response, status);
                        }
                    })
                    .fail(function (exception) {
                        if (pObj && pObj.error) {
                            pObj.error(exception);
                        }
                    });
            };

            /**
             * Returns code snippets for getting the job information in a using GenePattern library
             *
             * @param pObj - The following parameters may be set
             *                  language: the language the return code should be in
             *                      Accepted: Python, R, Java and MATLAB
             *
             * @returns {jQuery.Deferred} - Returns a jQuery Deferred object for event chaining.
             *      See http://api.jquery.com/jquery.deferred/ for details.
             */
            this.code = function (pObj) {
                // Validate language
                let language = null;

                if (typeof pObj === "string") {
                    language = pObj;
                }
                else {
                    language = pObj.language;
                }

                if (language !== "Python" && language !== "R" && language !== "Java" && language !== "MATLAB") {
                    console.log("Unknown language, defaulting to Python: " + language);
                }

                const REST_ENDPOINT = "/rest/v1/jobs/" + this.jobNumber() + "/code?language=" + language;

                return $.ajax({
                    url: gp.server() + REST_ENDPOINT,
                    type: 'GET',
                    dataType: 'text',
                    headers: {"Authorization": "Bearer " + gp.token},
                    xhrFields: {
                        withCredentials: true
                    }
                })
                    .fail(function (exception) {
                        if (pObj && pObj.error) {
                            pObj.error(exception);
                        }
                    });
            };

            /**
             * Returns the Task object associated with the job
             *
             * @returns {null|gp.Task}
             */
            this.task = function () {
                return this._task;
            };

            /**
             * Returns the name of the job's associated task
             * @returns {string | null}
             */
            this.taskName = function () {
                return this._taskName;
            };

            /**
             * Returns the LSID of the job's associated task
             *
             * @returns {string | null}
             */
            this.taskLsid = function () {
                return this._taskLsid;
            };

            /**
             * Returns the user ID of the job's owner
             *
             * @returns {string | null}
             */
            this.userId = function () {
                return this._userId;
            };

            /**
             * Returns the launch URL of a JavaScript Visualizer
             *
             * @returns {string|null}
             */
            this.launchUrl = function () {
                return this._launchUrl;
            };

            /**
             * Returns an array of child Job() objects associated with this parent job.
             * Lazily initialized Job._children in the process.
             *
             * @returns {Array}
             */
            this.children = function () {
                // Lazily initialize Job._children
                if (this._children === null) {
                    const childList = [];

                    // If the job has children
                    if (jobJson['children'] !== undefined) {
                        const rawChildren = jobJson['children']['items'];
                        rawChildren.forEach(function (child) {
                            const childJob = new gp.Job(child);
                            childList.push(childJob);
                        });
                    }

                    this._children = childList;
                }

                // Return the array of child jobs
                return this._children;
            };

            /**
             * Returns the permissions object for the job
             *
             * @returns {string|null}
             */
            this.permissions = function () {
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
            this.savePermissions = function (pObj) {
                const REST_ENDPOINT = "/rest/v1/jobs/" + this.jobNumber() + "/permissions";

                return $.ajax({
                    url: gp.server() + REST_ENDPOINT,
                    type: 'PUT',
                    data: JSON.stringify(pObj['bundle']),
                    dataType: 'json',
                    contentType: "application/json",
                    headers: {"Authorization": "Bearer " + gp.token},
                    xhrFields: {
                        withCredentials: true
                    }
                })
                    .done(function (response) {
                        // Create Job object from JSON response
                        const jobNumber = response['jobId'];

                        if (pObj && pObj.success) {
                            pObj.success(response, jobNumber);
                        }
                    })
                    .fail(function (exception) {
                        if (pObj && pObj.error) {
                            pObj.error(exception);
                        }
                    });
            };

            /**
             * Returns the job number
             *
             * @returns {number|null}
             */
            this.jobNumber = () => this._jobNumber;

            /**
             * Returns a job permissions object
             *
             * @returns {null|object}
             */
            this.permissions = () => this._permissions;

            /**
             * Returns a job status object
             *
             * @returns {null|object}
             */
            this.status = () => this._status;

            /**
             * Returns the date the job was submitted
             *
             * @returns {null|string|Date}
             */
            this.dateSubmitted = () => this._dateSubmitted;

            /**
             * Returns an array of log files associated with the job
             *
             * @returns {Array}
             */
            this.logFiles = () => this._logFiles;

            /**
             * Returns an array of the output files possessed by the job
             *
             * @returns {Array}
             */
            this.outputFiles = () => this._outputFiles;

            /**
             * Returns the number of output files the job has currently output
             *
             * @returns {null|number}
             */
            this.numOutputFiles = () => this._numOutputFiles;
        };


        /**
         * Declaration of Job Input class
         *
         * @constructor
         */
        gp.JobInput = function (task) {
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
            this._init_ = function () {
                if (task) {
                    this._lsid = task.lsid();
                    this._params = [];
                    for (let i = 0; i < task._params.length; i++) {
                        const param = task._params[i];
                        this._params.push(param.clone());
                    }
                }
            };
            this._init_();

            /**
             * Getter for Task LSID
             *
             * @returns {string|null}
             */
            this.lsid = () => this._lsid;

            /**
             * Getter for the params list
             *
             * @returns {Array}
             */
            this.params = () => this._params;

            /**
             * Returns a Parameter after looking it up by name
             *      Returns null if the param was not found.
             *
             * @param name - The name of the parameter
             * @returns {gp.Param|null} - The matching Param object
             */
            this.param = function (name) {
                for (let i = 0; i < this._params.length; i++) {
                    const param = this._params[i];
                    if (param.name() === name) return param;
                }
                return null;
            };

            /**
             * Returns a JSON structure for this Job Input designed to be consumed by a submit() call
             * @returns {object}
             *
             * @private
             */
            this._submitJson_ = function () {
                const lsid = this.lsid();
                const params = [];
                for (let i = 0; i < this.params().length; i++) {
                    const param = this.params()[i];
                    params.push({
                        name: param.name(),
                        values: param.values() === null ? (param.defaultValue() ? [param.defaultValue()] : []) : param.values(),
                        batchParam: param.batchParam() === null ? false : param.batchParam(),
                        groupId: param.groupId() === null ? "" : param.groupId()
                    });
                }
                return {
                    lsid: lsid,
                    params: params,
                    tags: ["GenePattern Notebook"]
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
            this.submit = function (pObj) {
                const REST_ENDPOINT = "/rest/v1/jobs/";

                return $.ajax({
                    url: gp.server() + REST_ENDPOINT,
                    type: 'POST',
                    data: JSON.stringify(this._submitJson_()),
                    dataType: 'json',
                    contentType: "application/json",
                    headers: {"Authorization": "Bearer " + gp.token},
                    xhrFields: {
                        withCredentials: true
                    }
                })
                    .done(function (response) {
                        // Create Job object from JSON response
                        const jobNumber = response['jobId'];

                        if (pObj && pObj.success) {
                            pObj.success(response, jobNumber);
                        }
                    })
                    .fail(function (exception) {
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
        gp.Param = function (paramJson) {
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
            this._numValues = null;
            this._kinds = null;

            /**
             * Constructor-like initialization for the Param class
             *
             * @private
             */
            this._init_ = function () {
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
                        this._numValues = paramJson[this._name]['attributes']['numValues'];
                        this._kinds = paramJson[this._name]['attributes']['fileFormat'] ? this._parseKinds(paramJson[this._name]['attributes']['fileFormat']) : null;
                    }
                }
            };

            /**
             * Parses the string of accepted kinds and returns a list
             *
             * @param kindString
             * @returns {Array}
             * @private
             */
            this._parseKinds = function (kindString) {
                return kindString.split(";");
            };

            /**
             * Parses the choice info JSON returned by the server into the expected format
             *
             * @param choiceInfo - The choice info JSON
             * @returns {*}
             * @private
             */
            this._parseChoices = function (choiceInfo) {
                if (choiceInfo['choices']) {
                    const choices = {};
                    for (let i = 0; i < choiceInfo['choices'].length; i++) {
                        const choice = choiceInfo['choices'][i];
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
            this.clone = function () {
                const param = new gp.Param();
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
            this.values = function (value) {
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
            this.batchParam = function (batchParam) {
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
            this.groupId = function (groupId) {
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
             * @returns {string|null}
             */
            this.name = function (name) {
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
             * @returns {string|null}
             */
            this.description = function (description) {
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
             * @returns {string|null}
             */
            this.choices = function (choices) {
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
             * @returns {string|null}
             */
            this.defaultValue = function (defaultValue) {
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
             * @returns {boolean|null}
             */
            this.optional = function (optional) {
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
             * @returns {string|null}
             */
            this.prefixWhenSpecified = function (prefixWhenSpecified) {
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
             * @returns {string|null}
             */
            this.type = function (type) {
                if (type !== undefined) {
                    this._type = type;
                }
                else {
                    return this._type;
                }
            };

            /**
             * Gets or sets the list of accepted file kinds
             *
             * @param kinds
             * @returns {Array|null}
             */
            this.kinds = function (kinds) {
                if (kinds !== undefined) {
                    this._kinds = kinds;
                }
                else {
                    return this._kinds;
                }
            };

            /**
             * Returns or sets the number of values the parameter expects
             *
             * @param [numVal=optional] - A string describing the number of expected values
             *                              1 - a single required value
             *                              0..1 - A single optional value
             *                              1..n - A required list of 1 to n files
             *                              0..n - An optional list of 1 to n files
             *                              n..m - A list of n to m files
             *                              1+ - Required value, unlimited files
             *                              0+ - Optional value, unlimited files
             * @returns {string|null}
             */
            this.numValues = function (numVal) {
                if (numVal !== undefined) {
                    this._numValues = numVal;
                }
                else {
                    return this._numValues;
                }
            };

            /**
             * Returns the max number of values this parameter will accept.
             * If numValues is not defined, it will assume 1 max.
             * If there is no max it will return -1.
             *
             * @returns {number}
             */
            this.maxValues = function () {
                let numVal = this.numValues();

                // If not defined, assume 1
                if (numVal === undefined || numVal === null) return 1;

                // If numValues is unlimited
                const unlimited = numVal.indexOf("+") > 0;
                if (unlimited) return -1;

                // If numValues is a range
                const range = numVal.indexOf("..") > 0;
                if (range) {
                    const parts = numVal.split("..");
                    if (parts.length > 1) numVal = parts[1];
                }

                // If numValues is a single number
                try {
                    const actualNum = parseInt(numVal);
                    if (isNaN(actualNum)) throw "numValues is not a number: " + numVal;
                    else return actualNum;
                }
                catch (err) {
                    // Log error, assume 1
                    console.log(err);
                    return 1;
                }
            };

            // Init the object
            this._init_();
        };
    };

    return {
        GenePattern: GenePattern
    }
});