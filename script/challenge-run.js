$(function() {

	var CMD_START = 1,
		CMD_STOP = 2,
		CMD_APPLY = 3,
		CMD_DESTROY = 4,
		CMD_SET_CAP = 5,

		STATE_STOPPED = 0,
		STATE_RUNNING = 1,
		STATE_PENDING = 2,

		FLAG_NOT_READY = 0,
		FLAG_READY = 1,
		FLAG_READY_NOT_ACTIVE = 2,
		FLAG_PENDING = 3,
		FLAG_ERROR = 4;

	/**
	 * Add comma thousand separator
	 */
	function numberWithCommas(x) {
	    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	/**
	 */
	var SystemMessages = function() {
		//////////////////////////////

		/**
		 * SystemMessages are dynamic user interface 
		 */
		var SystemMessages = function( baseDir ) {

			// Initialize variables
			this.index = {};
			this.visited = {};
			this.baseDir = baseDir;

			// Fetch the message index
			$.ajax({
				'url': baseDir + '/index.json',
				'dataType': 'json',
				'success': (function(data,status,xhr) {
					this.index = data;
				}).bind(this),
				'error': (function(data,status,xhr) {
				}).bind(this)
			});

		};

		/**
		 * Fetch a message for the given context key and render
		 * it to the hostElm container.
		 */
		SystemMessages.prototype.fetchAndRender = function( key, hostElm ) {
			var indexInfo = this.index[key];
			if (!indexInfo) return;

			// Check for visit information
			var visit_index = 0, visit_doc = false;
			if (this.visited[key] != undefined)
				visit_index=this.visited[key]+1;

			// Check if we have sequence
			if (indexInfo['sequence'] != undefined) {
				if (visit_index < indexInfo['sequence'].length)
					visit_doc = indexInfo['sequence'][visit_index];
			}

			// Check if we have randomized chunks
			if (!visit_doc && (indexInfo['random'] != null)) {
				var i = Math.floor( Math.random() * indexInfo['random'].length );
				visit_doc = indexInfo['random'][i];
			}

			// Keep the visit index
			this.visited[key] = visit_index;

			// Load that document
			$(hostElm).load( this.baseDir + "/" + visit_doc );

		};



		//////////////////////////////
		return SystemMessages;
	}();

	/**
	 * Log-in interface
	 */
	var LoginInterface = function() {

		/**
		This should be placed on the log-in page:
	
		window.opener.location = "http://test4theory.cern.ch/vlhc/#user="+btoa('!{JSON.stringify(user)}');
		window.close();

		**/

		/**
		 * The user log-in interface
		 */
		var LoginInterface = function(baseURL) {
			this.loginURL = baseURL + "/vlhc_login";
			this.creditsURL = baseURL + "/vlhc_credits";
			this._loginListeners = [];
			this._logoutListeners = [];

			// Bind hash change listener
			$(window).on('hashchange',(function() {
				var hash = String(window.location.hash);
				this._handleHashChange(hash);
			}).bind(this));

			// Fetch original user information from localStorage
			this.userInfo = null;

			// Fetch/generate a unique anonymous ID when logged off
			this.anonymousID = localStorage.getItem("vas-anonymous-id");
			if (!this.anonymousID) {
				var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-0123456789";
				this.anonymousID = "r-";
				for (var i=0; i<32; i++)
					this.anonymousID += charset[Math.floor(Math.random() * charset.length)];
				localStorage.setItem("vas-anonymous-id", this.anonymousID);
			}

			// Initial trigger with anonymous ID
			$(window).trigger("analytics.userid", [this.anonymousID] );

		};

		/**
		 * Thaw data previously created with freeze()
		 */
		LoginInterface.prototype.thaw = function( storeData ) {
			if (!storeData) return;

			// Keep a reference of the previous user
			var prevUser = this.userInfo;

			// Update all fields
			var data = JSON.parse( atob(storeData) );
			this.anonymousID = data['a'];
			this.userInfo = data['u'];

			// Update new version fields
			if (this.userInfo) {
				if (!this.userInfo['boinc_username']) this.userInfo['boinc_username']='';
				if (!this.userInfo['boinc_authenticator']) this.userInfo['boinc_authenticator']='';
				if (!this.userInfo['boinc_userid']) this.userInfo['boinc_userid']='';
			}

			// Check for user login state switched
			if ((prevUser == null) && (this.userInfo != null)) {
				// Call login listeners
				for (var i=0; i<this._loginListeners.length; i++)
					this._loginListeners[i](this.userInfo);
				// Analytics trigger with the real uuid
				$(window).trigger("analytics.userid", [this.userInfo['uuid']] );
			} else if ((prevUser != null) && (this.userInfo == null)) {
				// Call logout listeners
				for (var i=0; i<this._logoutListeners.length; i++)
					this._logoutListeners[i](prevUser);
				$(window).trigger("analytics.userid", [this.anonymousID] );
			}

		}

		/**
		 * Return the VMID
		 */
		LoginInterface.prototype.vmid = function() {
			if (this.userInfo != null) {
				return this.userInfo['uuid'];
			} else {
				return this.anonymousID;
			}
		}

		/**
		 * Return the username
		 */
		LoginInterface.prototype.username = function() {
			if (this.userInfo != null) {
				return this.userInfo['displayName'];
			} else {
				return "anonymous";
			}
		}

		/**
		 * Freeze data adn return the payload to store
		 */
		LoginInterface.prototype.freeze = function() {
			return btoa( JSON.stringify({
				'u': this.userInfo,
				'a': this.anonymousID
			}));
		}

		/**
		 * Abstract the various user information to unified IDs
		 */
		LoginInterface.prototype._normalizeAccountInfo = function(data) {
			if (data['provider'] == "facebook") {
				return {
					'provider'		: 'facebook',
					'displayName'	: data['displayName'],
					'profileUrl'	: data['profileUrl'],
					'picture'		: '//graph.facebook.com/'+data['id']+'/picture',
					'uuid'			: "f-"+data['id']
				};
			} else if (data['provider'] == "google") {
				return {
					'provider'		: 'google',
					'displayName'	: data['displayName'],
					'profileUrl'	: data['_json']['link'],
					'picture'		: data['_json']['picture'],
					'uuid'			: "g-"+data['id']
				};
			} else if (data['provider'] == "twitter") {
				return {
					'provider'		: 'twitter',
					'displayName'	: data['displayName'],
					'profileUrl'	: data['_json']['url'],
					'picture'		: data['photos'][0]['value'],
					'uuid'			: "t-"+data['id']
				};
			} else if (data['provider'] == "boinc") {
				return {
					'provider'		: 'boinc',
					'displayName'	: data['displayName'],
					'profileUrl'	: 'http://mcplots-dev.cern.ch/production.php?view=user&userid='+data['id'],
					'picture'		: 'http://lhcathome2.cern.ch/vLHCathome/user_profile/images/'+data['id']+'.jpg',
					'boinc'			: {
						'userid'		: data['id'],
						'name'			: data['name'],
						'authenticator'	: data['authenticator']
					},
					'uuid'			: "b-"+data['id']
				};
			}
		};


		/**
		 * Handle hash change
		 */
		LoginInterface.prototype._handleHashChange = function(hash) {
			if (hash[0] == "#") hash=hash.substr(1);
			if (hash.substr(0,5) == "user=") {
				var userStr = hash.substr(5);
				if (userStr == "none") {
					// Fire logout function
					this.logout();
				} else {

					// Parse user info from the hash
					var info = this._normalizeAccountInfo(JSON.parse(atob(userStr)));

					// Fire callbacks (with current log-in info)
					if (this.userInfo == null) {
						// Update user info
						this.userInfo = info;
						// Call login listeners
						for (var i=0; i<this._loginListeners.length; i++)
							this._loginListeners[i](info);
						// Change the analytics userid
						$(window).trigger("analytics.userid", [this.userInfo['uuid']] );
					}

				}

				// Clear hash
				window.location.hash = "";

			}
		}

		/**
		 * Log-out
		 */
		LoginInterface.prototype.logout = function() {
			// Fire callbacks (with previous log-in info)
			if (this.userInfo != null) {
				// Update user info
				this.userInfo = null;
				// Call logout listeners
				for (var i=0; i<this._logoutListeners.length; i++)
					this._logoutListeners[i](this.userInfo);
				// Change the analytics userid
				$(window).trigger("analytics.userid", [this.anonymousID] );
			}
		}

		/**
		 * Log-in user
		 */
		LoginInterface.prototype.showAccountWindow = function(vmid, user) {
			var w = 750, h = 450,
				l = (screen.width - w) / 2,
				t = (screen.height - h)/ 2;

			// If we are logged-in show credits
			if (vmid) {
				window.open(
					this.creditsURL + "?vmid=" + escape(vmid) + "&user=" + escape(user),
					"login-window",
					"width="+w+",height="+h+",left="+l+",top="+t+",location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,toolbar=no"
				).focus();
			} else {
				window.open(
					this.loginURL,
					"login-window",
					"width="+w+",height="+h+",left="+l+",top="+t+",location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,toolbar=no"
				).focus();
			}

		};

		/**
		 * Register a listener when the user logs-in.
		 */
		LoginInterface.prototype.onUserLogin = function(callback) {
			this._loginListeners.push(callback);
		}

		/**
		 * Register a listener when the user logs-out.
		 */
		LoginInterface.prototype.onUserLogout = function(callback) {
			this._logoutListeners.push(callback);
		}

		return LoginInterface;

	}();

	/**
	 * Development wrapper to isolate the autonomous VM code
	 */
	var AutonomousVM = function() {
		//////////////////////////////

		/**
		 * Function to convert month/day/hour:minute:second into an integer
		 */
		var timestampOf = function(m,d,h) {
			var timeParts = h.toString().split(":"),
				monthLookup = [ "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec" ];

			var monthIndex = monthLookup.indexOf(m.toString().toLowerCase());
			if (monthIndex < 0) monthIndex = 0;

			// Convert to seconds (assuming month = 31 days)
			return monthIndex * 2678400 +
				   parseInt(d) * 86400 +
				   parseInt(timeParts[0]) * 3600 +
				   parseInt(timeParts[1]) * 60 +
				   parseInt(timeParts[2]);
		}

		/**
		 * Autonomous VM is a class which takes care of all the user-triggered operations
		 * of setting-up, modifying and controling the VM.
		 *
		 * Every action happens asynchronously in a 'best-effort' basis.
		 */
		var AutonomousVM = function(vmcp) {

			// Setup config parameters
			this.config = {
				'memory': 128,
				'cpus'  : 1,
				'cap'   : 80,
				'vmid'  : 'anonymous',
				// For concurrency with BOINC
				'boinc_username' : '',
				'boinc_authenticator': '',
				'boinc_userid': ''
			};

			// Setup state parameters
			this.state = 0;
			this.pendingCommand = 0;
			this.wa_plugin = null;
			this.wa_session = null;
			this.lastErrorMessage = "";

			// Setup private parameters
			this.__statusProbeTimer = null;
			this.__firstStateEvent = false;
			this.__vmStarted = false;
			this.apiAvailable = false;

			// For event rate calculation
			this.__lastEvents = 0;
			this.__lastEventTimestamp = 0;
			this.__eventsRing = [];
			this.eventRate = 0;

			// Pending functions to be called
			// when we have a session
			this.__sessionReadyFn = [];

			// Cache invalidation counter
			this.__nid = 0;

			// For job description information
			this.__lastJobKey = "";
			this.__jobConfig = {};

			// Status flags
			this.statusFlags = {
				'webapi'		: FLAG_PENDING,
				'webapi_session': FLAG_NOT_READY,
				'vm'			: FLAG_NOT_READY,
				'api'			: FLAG_NOT_READY,
				'agent'			: FLAG_NOT_READY,
				'job'			: FLAG_NOT_READY
			};

			// Single-instance listeners
			this.listeners = { };

			// Multi-instance listeners
			this.multiListeners = { };

			// Call-on-register functions for every listener. 
			// In principle this is used to forward past events to later-registered listeners.
			this.listenerInitializers = {};

			// Fire-up initial callbacks
			this.__fireListener('flagChanged', this.statusFlags);
			this.__fireListener('progressActive', false);
			this.__fireListener('progress', "Starting WebAPI", 0.0);

			// Initialize WebAPI
			this.vmcp = vmcp;
			this.webapiInitialized = false;
			this.webapiSessionInitialized = false;
			this.__initWebAPI();

		};

		/**
		 * Initialize WebAPI connection
		 */
		AutonomousVM.prototype.__initWebAPI = function() {

			// We will (soon) be initialized
			this.webapiInitialized = true;

			// Contact CernVM WebAPI to prepare a VM for us
			CVM.startCVMWebAPI(
				(function(plugin) {

					// Something went wrong
					if (!plugin) {
						this.statusFlags.webapi = FLAG_ERROR;
						this.__notifyFlagChange();
						// Forward analytics event
						$(window).trigger("analytics.webapi.error", ["Cannot start WebAPI"] );
						return;
					}

					// Forward analytics event
					setTimeout(function() { // Delay it a bit
						$(window).trigger("analytics.webapi.available");
					}, 100);

					// Store webapi instance
					this.wa_plugin = plugin;

					// Bind progress messages
					plugin.addEventListener('started', this.__notifyProgressStart.bind(this));
					plugin.addEventListener('completed', this.__notifyProgressComplete.bind(this));
					plugin.addEventListener('progress', this.__notifyProgress.bind(this));
					plugin.addEventListener('failed', this.__notifyError.bind(this));
					plugin.addEventListener('disconnected', this.__notifyDisconnected.bind(this));

					// Update status flags
					this.statusFlags.webapi = FLAG_READY;
					this.statusFlags.webapi_session = FLAG_PENDING;
					this.__notifyFlagChange();

					// Capture the first state event to identify the VM
					// status at creation time.
					this.__firstStateEvent = true;

					// Try to satisfy the current command
					this.satisfyCommand();

				}).bind(this)
			);
		}

		/**
		 * Reset monitor. configurations
		 */
		AutonomousVM.prototype.__resetMonitors = function() {

			// For event rate calculation
			this.__lastEvents = 0;
			this.__lastEventTimestamp = 0;
			this.__eventsRing = [];
			this.eventRate = 0;

			// For job description information
			this.__lastJobKey = "";
			this.__jobConfig = {};

			// Fire reseted monitor events
			this.__fireListener("monitor.cpuLoad", 0,0,0);
			this.__fireListener("monitor.eventRate", 0);
			this.__fireListener("monitor.progress", 0.0);
			this.__fireListener("monitor.jobInfo", null);

		}

		/**
		 * Initialize WebAPI session
		 */
		AutonomousVM.prototype.__initWebAPISession = function() {

			// We will be (soon) initialized
			this.webapiSessionInitialized = true;

			// Request session
			this.wa_plugin.requestSession(this.vmcp, (function(session) {

				// Something went wrong
				if (!session) {
					this.webapi_session.webapi = FLAG_ERROR;
					this.__notifyFlagChange();

					// Forward analytics event
					$(window).trigger("analytics.webapi.error", ["Cannot request session"] );

					return;
				}

				// Forward analytics event
				$(window).trigger("analytics.webapi.started");

				// Store session instance
				window.s = session;
				this.wa_session = session;
				this.wa_last_state = -1;

				// Fetch original session config
				this.config.memory = session.memory;
				this.config.cpus = session.cpus;
				this.config.cap = session.executionCap;

				// Bind to progress messages
				session.addEventListener('started', this.__notifyProgressStart.bind(this));
				session.addEventListener('completed', this.__notifyProgressComplete.bind(this));
				session.addEventListener('progress', this.__notifyProgress.bind(this));
				session.addEventListener('failed', this.__notifyError.bind(this));

				// Handle VM state changes
				session.addEventListener('stateChanged', this.__handleStateChange.bind(this));
				session.addEventListener('apiStateChanged', this.__handleApiStateChange.bind(this));

				// Fire all the session ready functions
				for (var i=0; i<this.__sessionReadyFn.length; i++)
					this.__sessionReadyFn[i]( session );

				// Let listeners know that we have a CernVM WebAPI
				this.__fireListener('webapiStateChanged', true);

				// Update status flags
				this.statusFlags.webapi_session = FLAG_READY;
				this.__notifyFlagChange();
				
				// Satisfy any pending command
				this.satisfyCommand();


			}).bind(this));

		}


		/**
		 * Fire the listener registered for the given event name
		 */
		AutonomousVM.prototype.__fireListener = function() {
			var fnArgs = Array.prototype.slice.call(arguments),
				cbName = fnArgs.shift();

			// Register event initializer
			this.listenerInitializers[cbName] = (function(args) {
				return (function(cb) { cb.apply(this, args); }).bind(this);
			}).bind(this)(fnArgs);

			// Fire listener
			if (this.listeners[cbName]) 
				this.listeners[cbName].apply(this, fnArgs);

			// Fire multi-listeners
			if (this.multiListeners[cbName]) {
				for (var i=0; i<this.multiListeners[cbName].length; i++) {
					this.multiListeners[cbName][i].apply(this, fnArgs);
				}
			}

		}

		/**
		 * Forward to the status flag listener that a flag is changed
		 */
		AutonomousVM.prototype.__notifyFlagChange = function() {
			// Fire listener
			this.__fireListener('flagChanged', this.statusFlags);
		}

		/**
		 * Forward to the status flag listener that the plugin has disconnected
		 */
		AutonomousVM.prototype.__notifyDisconnected = function() {
			// Reset flags
			this.statusFlags.webapi = FLAG_NOT_READY;
			this.statusFlags.webapi_session = FLAG_NOT_READY;
			this.statusFlags.vm = FLAG_NOT_READY;
			this.statusFlags.api = FLAG_NOT_READY;
			this.statusFlags.agent = FLAG_NOT_READY;
			this.statusFlags.job = FLAG_NOT_READY;

			// Fire listener
			this.__fireListener('progressActive', false);
			this.__fireListener('progress', "Disconnected from WebAPI", 0.0);
			this.__fireListener('error', "The connection with the CernVM WebAPI plugin was interrupted!");

			// De-initialize webapi
			this.webapiInitialized = false;
			this.webapi = null;
			this.webapiSessionInitialized = false;
			this.webapi_session = null;

			// Let everybody know that API has gone away
			this.__fireListener('webapiStateChanged', false);

			// Very last event -> Notify flag change
			this.__notifyFlagChange();

		}

		/**
		 * Forward to the progress start listener that a progress event stared
		 */
		AutonomousVM.prototype.__notifyProgressStart = function(message) {
			// Fire listeners
			this.__fireListener('progressActive', true);
			this.__fireListener('progress', message, 0.0);
		}

		/**
		 * Forward to the progress start listener that a progress event has completed
		 */
		AutonomousVM.prototype.__notifyProgressComplete = function(message) {
			// Fire listeners
			this.__fireListener('progress', message, 1.0);
			this.__fireListener('progressActive', false);
		}

		/**
		 * Forward to the progress start listener that a progress event has failed
		 */
		AutonomousVM.prototype.__notifyError = function(message) {

			// Keep last error
			this.lastErrorMessage = message;

			// Check what to fail from the flags
			if (this.statusFlags.webapi == FLAG_PENDING) {
				this.statusFlags.webapi = FLAG_ERROR;
			} else if (this.statusFlags.webapi_session == FLAG_PENDING) {
				this.statusFlags.webapi_session = FLAG_ERROR;
			} else {
				this.statusFlags.vm = FLAG_ERROR;
				this.statusFlags.api = FLAG_NOT_READY;
				this.statusFlags.agent = FLAG_NOT_READY;
				this.statusFlags.job = FLAG_NOT_READY;
			}

			// Fire listeners
			this.__fireListener('progress', message, 1.0);
			this.__fireListener('progressActive', false);
			this.__fireListener('error', message);
			this.__notifyFlagChange();

			// Forward analytics event
			$(window).trigger("analytics.webapi.error", [message]);

		}

		/**
		 * Forward to the progress start listener that a progress event is updated
		 */
		AutonomousVM.prototype.__notifyProgress = function(message, value) {
			// Fire listeners
			this.__fireListener('progress', message, value);
		}

		/**
		 * Handle VM state change
		 */
		AutonomousVM.prototype.__handleStateChange = function(state) {

			// Only process real state changes
			if (this.wa_last_state == state) return;
			this.wa_last_state = state;

			// Handle first stateChange event (which lets us know if the VM is running)
			if (this.__firstStateEvent) {
				this.__vmStarted = (state == 5);
				this.__firstStateEvent = false;
			}

			// Handle flags
			if (state != 5 /*SS_RUNNING*/) {

				// VM exited running state, reset all other variables
				this.statusFlags.vm = FLAG_NOT_READY;
				this.statusFlags.api = FLAG_NOT_READY;
				this.statusFlags.agent = FLAG_NOT_READY;
				this.statusFlags.job = FLAG_NOT_READY;
				// Reset monitors
				this.__resetMonitors();
				// Notify changes
				this.__fireListener('genericStateChanged', STATE_STOPPED);
				this.__notifyFlagChange();

			} else {
				this.statusFlags.vm = FLAG_READY;
				this.__fireListener('genericStateChanged', STATE_RUNNING);
				this.__notifyFlagChange();
			}

			// Handle states for analytics
			if (state == 0) { /* SS_MISSING */
				// Forward event to the window
				$(window).trigger("analytics.vm.missing")
			} else if (state == 1) { /* SS_AVAILBLE */
				// Forward event to the window
				$(window).trigger("analytics.vm.available")
			} else if (state == 2) { /* SS_POWEROFF */
				// Forward event to the window
				$(window).trigger("analytics.vm.poweroff")
			} else if (state == 3) { /* SS_SAVED */
				// Forward event to the window
				$(window).trigger("analytics.vm.saved")
			} else if (state == 4) { /* SS_PAUSED */
				// Forward event to the window
				$(window).trigger("analytics.vm.paused")
			} else if (state == 5) { /* SS_RUNNING */
				// Forward event to the window
				$(window).trigger("analytics.vm.running")
			}

			// Try to satisfy a pending command
			this.satisfyCommand();
		}

		AutonomousVM.prototype.__handleApiStateChange = function(state, apiURL) {

			// Forward api state change
			this.__fireListener('apiStateChanged', !!state, apiURL );

			// Update flags accordingly
			if (!state) {
				this.apiAvailable = false;
				this.statusFlags.api = FLAG_NOT_READY;
				this.statusFlags.agent = FLAG_NOT_READY;
				this.statusFlags.job = FLAG_NOT_READY;
				// Reset monitors
				this.__resetMonitors();
				// Notify changes
				this.__notifyFlagChange();
				this.__stopStatusProbe();
			} else {
				this.apiAvailable = true;
				this.statusFlags.api = FLAG_READY;
				this.__notifyFlagChange();
				this.__startStatusProbe(apiURL);
			}

			// Try to satisfy a pending command
			this.satisfyCommand();
			
		}

		/**
		 * Start a probe which is going to contact the VM endpoint and check
		 * periodically for the status of the software INSIDE the VM
		 */
		AutonomousVM.prototype.__startStatusProbe = function(refApiURL) {
			if (this.__statusProbeTimer) clearInterval(this.__statusProbeTimer);
			var apiURL = refApiURL;
			var nid = ++this.__nid;

			this.__messages = null;
			this.__bootTime = null;
			this.__jobConfig = {};
			this.__statusProbeTimer = setInterval((function() {

				// Allow only one probe to run
				if (this.__probeBusy) return;
				this.__probeBusy = true;

				// Get messages
				if (!this.__messages) {

					// Try to get copilot-agent.log
					$.ajax({
						'url': apiURL+'/logs/messages?i='+nid,
						'success': (function(data,status,xhr) {

							// Process log lines and find the last one
							var lines = data.split("\n");
							this.__messages = lines;

							// Find boot time, from the last entry in the logfile
							for (var i=0; i<lines.length; i++) {
								if ((lines[i].indexOf("syslogd")>0) && (lines[i].indexOf("restart")>0)) {
									var date = lines[0].split(/[ \t]+/);
									this.__bootTime = timestampOf(date[0], date[1], date[2]);
									// Keep iterating until we found the last entry
								}
							}

						}).bind(this),
						'error': (function(data,status,xhr) {
							// Could not get messages. Do nothing
						}).bind(this)
					});

				}

				// Try to get copilot-agent.log
				$.ajax({
					'url': apiURL+'/logs/copilot-agent.log?i='+nid,
					'success': (function(data,status,xhr) {

						// Process log lines and find the last one
						var lines = data.split("\n"),
							parts = lines[lines.length-1].split("] ["),
							logDate = new Date(parts[0].substr(1)),
							nowDate = new Date();

						// Check for recent log
						if (nowDate - logDate > 60000) {
							this.statusFlags.agent = FLAG_READY_NOT_ACTIVE;
						} else {
							this.statusFlags.agent = FLAG_READY;
						}
						this.__notifyFlagChange();

					}).bind(this),
					'error': (function(data,status,xhr) {
						this.statusFlags.agent = FLAG_NOT_READY;
						this.__notifyFlagChange();
					}).bind(this)
				});

				// Try to get job.err
				$.ajax({
					'url': apiURL+'/logs/job.err?i='+nid,
					'success': (function(data,status,xhr) {

						// If it's empty, that's good news
						data = data.toLowerCase();
						if ((data.indexOf("error") >= 0) || (data.indexOf("critical") >= 0) || (data.indexOf("fail") >= 0)) {
							this.statusFlags.job = FLAG_ERROR;
						} else {
							this.statusFlags.job = FLAG_READY;
						}
						this.__notifyFlagChange();

					}).bind(this),
					'error': (function(data,status,xhr) {
						this.statusFlags.job = FLAG_NOT_READY;
						this.__notifyFlagChange();
					}).bind(this)
				});

				// If we are ready, include additional information
				if ((this.statusFlags.job == FLAG_READY) && (this.__messages)) {  

					// Process job output
					$.ajax({
						'url': apiURL+'/logs/job.out?i='+nid,
						'success': (function(data,status,xhr) {
							var currEvents = 0,
								lines = data.split("\n"),
								is_valid = false;

							// Find the runRunvet header in the first few lines
							for (var i=0; i<10; i++) {
								if (lines[i].substr(0,15) == "===> [runRivet]") {
									// Get the time started
									var parts = lines[i].split(/[ \t]+/),
										date = timestampOf(parts[3], parts[4], parts[5]);
									// Check if that date is newer than the boot time
									is_valid = (date > this.__bootTime);
									break;
								}
							}

							// Get the last line that matches 'Events processed'
							for (var i=lines.length-1; i>=0; i--) {
								if ((lines[i].indexOf("Events processed") >= 0) && is_valid) {
									var currTimestamp = Date.now();
									currEvents = parseInt(lines[i].split(/[ \t]+/)[0]);
									
									// Skip idle states
									if ((this.__lastEvents == currEvents) && (currTimestamp - this.__lastEventTimestamp < 10000))
										break;

									// Calculate event rate
									if (currEvents < this.__lastEvents) {
										this.statusFlags.job = FLAG_PENDING;
										this.__fireListener("monitor.eventRate", 0);
										this.__notifyFlagChange();

									} else {
										var rate = (currEvents - this.__lastEvents) / (currTimestamp - this.__lastEventTimestamp) * 60000;

										// Average using ring buffer
										this.__eventsRing.push(rate);
										if (this.__eventsRing.length > 5)
											this.__eventsRing.shift();
										this.eventRate = 0;
										for (var i=0; i<this.__eventsRing.length; i++) {
											this.eventRate += this.__eventsRing[i];
										}
										this.eventRate /= this.__eventsRing.length;

										// Fire dial update
										this.__fireListener("monitor.eventRate", this.eventRate);
									}

									// Update last fields
									this.__lastEvents = currEvents;
									this.__lastEventTimestamp = currTimestamp;
									break;
								}
							}

							// Quit if we didn't have a valid record
							if (!is_valid) return;

							// Find the first line which contains the configuration info
							var jobKey = "", jobCfg = {};
							for (var i=0; i<lines.length; i++) {

								// Look for input parameters
								if (lines[i].trim() == "Input parameters:") {
									for (i++; lines[i].trim() != ""; i++) {
										var kv = lines[i].split("=");
										jobCfg[kv[0]] = kv[1];
										jobKey += lines[i]+";";
									}
								} 

								// Look for analysis name
								else if (lines[i].substr(0,14) == "analysesNames=") {
									jobCfg['analysesNames'] = lines[i].substr(14);
									jobKey += lines[i]+";";
									break; // And we are done
								}
							}

							// Check if that's a new job
							if (jobKey != this.__lastJobKey) {
								this.__fireListener('monitor.jobInfo', jobCfg);
								this.__lastJobKey = jobKey;
								this.__jobConfig = jobCfg;
							}

							// Update progress if we have a job
							if (this.__jobConfig) {
								var progress = currEvents / parseInt(this.__jobConfig['nevts']);
								this.__fireListener("monitor.progress", progress);
							}

						}).bind(this),
						'error': (function(data,status,xhr) {
							this.__fireListener('monitor.jobInfo', null);
							this.__fireListener("monitor.eventRate", 0);
							this.__fireListener("monitor.progress", 0);
							if (this.statusFlags.job != FLAG_PENDING) {
								this.statusFlags.job = FLAG_PENDING;
								this.__notifyFlagChange();
							}
						}).bind(this)
					});

					// Process top command
					$.ajax({
						'url': apiURL+'/logs/top?i='+nid,
						'success': (function(data,status,xhr) {

							// If it's empty, that's good news
							var lines = data.split("\n"),
								loadParts = lines[0].split("load average: ")[1].split(/[ \t]+/);

							// Get machine load
							this.__fireListener("monitor.cpuLoad", parseFloat(loadParts[0]), parseFloat(loadParts[1]), parseFloat(loadParts[2]));


						}).bind(this),
						'error': (function(data,status,xhr) {

						}).bind(this)
					});

				}


				// Release 'busy' flag
				this.__probeBusy = false;

			}).bind(this), 5000);
		}

		/**
		 * Stop a VM probe previously started with __startStatusProbe
		 */
		AutonomousVM.prototype.__stopStatusProbe = function() {
			clearInterval(this.__statusProbeTimer);
		}

		/**
		 * Get a property from the VM (asynchronously)
		 */
		AutonomousVM.prototype.getProperty = function(name, callback) {

			// Function to get property
			var fn = function(session) {
				// Fire callback with the value
				callback(session.getProperty(name));
			};

			// If we don't have a session, schedule, otherwise run it right away
			if (this.wa_session == null) {
				this.__sessionReadyFn.push(fn);
			} else {
				fn(this.wa_session);
			}
		}

		/**
		 * Set a property from the VM (asynchronously)
		 */
		AutonomousVM.prototype.setProperty = function(name, value, callback) {

			// Function to get property
			var fn = function(session) {
				// Set property
				session.setProperty(name, value);
				// Fire callback
				if (callback) callback();
			};

			// If we don't have a session, schedule, otherwise run it right away
			if (this.wa_session == null) {
				this.__sessionReadyFn.push(fn);
			} else {
				fn(this.wa_session);
			}
		}

		/**
		 * Register an event listeners
		 */
		AutonomousVM.prototype.setListener = function(name, func) {
			this.listeners[name] = func;
			if (this.listenerInitializers[name] !== undefined)
				this.listenerInitializers[name](func);
		}

		/** 
		 * Register multiple event listeners
		 */
		AutonomousVM.prototype.addListener = function(name, func) {
			if (!this.multiListeners[name]) this.multiListeners[name]=[];
			this.multiListeners[name].push(func);
		}

		/**
		 * Remove listener initializer on the particular event (acknowlege the event)
		 */
		AutonomousVM.prototype.acknowlege = function(name) {
			if (this.listenerInitializers[name] != undefined)
				delete this.listenerInitializers[name];
		}


		/**
		 * Try to satisfy the pending command
		 */
		AutonomousVM.prototype.satisfyCommand = function() {

			// Start webAPI if not initialized
			if (!this.webapiInitialized) {
				this.__initWebAPI();
				return;
			}

			// Open (new) session if required
			if (!this.webapiSessionInitialized) {
				this.__initWebAPISession();
				return;
			}

			// Check if we can satisfy the pending command
			if (this.pendingCommand == 0) return;
			if (this.wa_session == null) return;

			// Try to handle the pending command
			if ((this.pendingCommand == CMD_START) && (this.wa_session.state != 5 /*SS_RUNNING*/)) {
				
				// Start the VM
				this.wa_session.executionCap = this.config.cap;
				this.wa_session.start(this.config);
				this.__fireListener('genericStateChanged', STATE_PENDING);

				// Update flags accordingly
				this.statusFlags.vm = FLAG_PENDING;
				this.statusFlags.api = FLAG_NOT_READY;
				this.statusFlags.agent = FLAG_NOT_READY;
				this.statusFlags.job = FLAG_NOT_READY;
				this.__notifyFlagChange();

			} else if ((this.pendingCommand == CMD_STOP) && (this.wa_session.state == 5 /*SS_RUNNING*/)) {

				// Save VM on the disk
				this.wa_session.hibernate();

				// Update flags accordingly
				this.statusFlags.vm = FLAG_NOT_READY;
				this.statusFlags.api = FLAG_NOT_READY;
				this.statusFlags.agent = FLAG_NOT_READY;
				this.statusFlags.job = FLAG_NOT_READY;
				this.__notifyFlagChange();

			} else if (this.pendingCommand == CMD_SET_CAP) {

				// Modify execution cap
				this.wa_session.executionCap = this.config.cap;

			} else if (this.pendingCommand == CMD_APPLY) {

				// Check what's the state of the VM and act accordingly
				if (this.wa_session.state >= 3 /* SS_SAVED,SS_PAUSED,SS_RUNNING */) {

					// Power off the VM
					this.wa_session.stop();
					this.__fireListener('genericStateChanged', STATE_PENDING);

					// Update flags accordingly
					this.statusFlags.vm = FLAG_PENDING;
					this.statusFlags.api = FLAG_NOT_READY;
					this.statusFlags.agent = FLAG_NOT_READY;
					this.statusFlags.job = FLAG_NOT_READY;
					this.__notifyFlagChange();

					// Schedule a start command if VM was running
					if (this.__vmStarted) {
						this.pendingCommand = CMD_START;
						return;
					}

				} else {

					// We are on SS_MISSING,SS_AVAILABLE or SS_POWEROFF,
					// which means that we don't have VM in locked state.

					// Start right away if the VM was started
					if (this.__vmStarted) {
						this.wa_session.executionCap = this.config.cap;
						this.wa_session.start(this.config);
						this.__fireListener('genericStateChanged', STATE_PENDING);
					}

					// Update flags accordingly
					this.statusFlags.vm = FLAG_PENDING;
					this.statusFlags.api = FLAG_NOT_READY;
					this.statusFlags.agent = FLAG_NOT_READY;
					this.statusFlags.job = FLAG_NOT_READY;
					this.__notifyFlagChange();

				}

			}

			// Reset pending command
			this.pendingCommand = 0;

		}

		AutonomousVM.prototype.start = function() {
			this.pendingCommand = CMD_START;
			this.__vmStarted = true;
			this.__fireListener('genericStateChanged', STATE_PENDING);
			this.satisfyCommand();
		}

		AutonomousVM.prototype.stop = function() {
			this.pendingCommand = CMD_STOP;
			this.__vmStarted = false;
			this.__fireListener('genericStateChanged', STATE_PENDING);
			this.satisfyCommand();
		}

		AutonomousVM.prototype.applyAll = function(c) {
			this.pendingCommand = CMD_APPLY;
			this.satisfyCommand();
		}

		AutonomousVM.prototype.applyCap = function(cap) {
			this.pendingCommand = CMD_SET_CAP;
			this.satisfyCommand();
		}

		AutonomousVM.prototype.destroy = function() {
			if (this.wa_session) {
				this.wa_session.close();
				this.wa_session = null;
				this.webapiSessionInitialized = false;
			}
		}

		//////////////////////////////
		return AutonomousVM;
	}();

	/**
	 * Development wrapper to isolate the Challenge Interface code
	 */
	var ChallengeInterface = function() {
		//////////////////////////////

		/**
		 * Helper class that organizes all the UI operations in the challenge
		 * dashboard interface.
		 */
		var ChallengeInterface = function( systemMessages, loginInterface ) {

			// Keep references of subsystems
			this.systemMessages = systemMessages;
			this.loginInterface = loginInterface;

			// Gauge frame & subparts
			this.gaugeFrame = $("#gauge-frame");
			this.gagueFrameTitle = $("#gauge-frame-title");
			this.gaugeFrameAlertOverlay = $("#gauge-frame .panel-alert");
			this.gaugeFrameWarnOverlay = $("#gauge-frame .panel-warn");
			this.gaugeFrameProgressOverlay = $("#gauge-frame .back-progress");

			// The gauges in the interface
			this.gaugeFrameGauges = {
				cpuLoad 	: $("#inp-cpuload"),
				eventRate 	: $("#inp-eventrate"),
				progress 	: $("#inp-progress"),
				ranking 	: $("#inp-ranking"),
			};

			// Initialize gauge frame
			this.gaugeFrameInit();

			// Description frame & subparts
			this.descriptionFrames = [
				$("#description-frame .desc-install"),	// FRAME_INSTALL
				$("#description-frame .desc-intro"),	// FRAME_INTRO
				$("#description-frame .desc-starting"),	// FRAME_STARTING
				$("#description-frame .desc-recovery"),	// FRAME_RECOVERY
				$("#description-frame .desc-idle"),		// FRAME_IDLE
				$("#description-frame .desc-live"),		// FRAME_LIVE
				$("#description-frame .desc-waitjob"),	// FRAME_WAITJOB
			];

			// Initialize description frames
			this.descFrameInit();

			// accounting frame
			this.accBtnLogin = $("#btn-login");
			this.accBtnLogout = $("#btn-logout");
			this.accBtnCredits = $("#btn-credits");
			this.accCreditsModal = $("#modal-credits");
			this.accInfoPicture = $("#acc-picture");
			this.accInfoName = $("#acc-name");

			// Initialize accounting frame
			this.accFrameInit();

			// Footer buttons
			this.footerBtnPower = $("#btn-power");
			this.footerBtnGear = $("#btn-status");

			// Start frame shuffler
			setInterval(this.descFrameSetShuffle.bind(this), 30000);

			// Initialize footer 
			this.footerInit();

		}

		///////////////////////////////////////////////
		//             * GAUGE FRAME *               //
		///////////////////////////////////////////////

		/**
		 * Initialize gauge frame components
		 */
		ChallengeInterface.prototype.gaugeFrameInit = function() {

			// Create the four gauges
			this.gaugeFrameGauges.cpuLoad.rundial({
				min: 0, max: 400, step: 10,
				format: function(x) { return x + " %"; }
			});
			this.gaugeFrameGauges.eventRate.rundial({
				min: 0, max: 1000000, step: 500,
				format: function(x) { return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
			});
			this.gaugeFrameGauges.progress.rundial({
				min: 0, max: 100, step: 1,
				format: function(x) { return parseInt(x).toString() + " %"; }
			});
			this.gaugeFrameGauges.ranking.rundial({
				min: 0, max: 100000, step: 10,
				format: function(x) { return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
			});

		}

		/**
		 * Show/Hide the big gauge error frame
		 */
		ChallengeInterface.prototype.gaugeFrameAlert = function(header,body) {
			if (!header) {
				this.gaugeFrame.removeClass("progress-error");
			} else {
				this.gaugeFrame.addClass("progress-error");
				this.gaugeFrameAlertOverlay.find("h1").text(header);
				this.gaugeFrameAlertOverlay.find("p").text(body);
			}
		}

		/**
		 * Show/Hide the big gauge error frame
		 */
		ChallengeInterface.prototype.gaugeFrameWarn = function(header,body) {
			if (!header) {
				this.gaugeFrame.removeClass("progress-warn");
			} else {
				this.gaugeFrame.addClass("progress-warn");
				this.gaugeFrameWarnOverlay.find("h1").text(header);
				this.gaugeFrameWarnOverlay.find("p").text(body);
			}
		}

		/**
		 * Update gauge frame progress
		 */
		ChallengeInterface.prototype.gaugeFrameProgress = function(v, text) {
			this.gagueFrameTitle.text( text );
			if (!v) {
				this.gaugeFrame.removeClass("progress-active");
			} else {
				this.gaugeFrame.addClass("progress-active");
				this.gaugeFrameProgressOverlay.css({
					'width': v*100+'%'
				});
			}
		}

		/**
		 * Update gauge frame status label
		 */
		ChallengeInterface.prototype.gaugeFrameStatus = function(text) {
			this.gagueFrameTitle.text( text );
		}

		/**
		 * Reset gauges
		 */
		ChallengeInterface.prototype.gaugeFrameResetGauges = function() {
			this.gaugeFrameGauges.eventRate.rundial("value", 0);
			this.gaugeFrameGauges.cpuLoad.rundial("value", 0);
			this.gaugeFrameGauges.progress.rundial("value", 0);
		}

		///////////////////////////////////////////////
		//           * DESCRIPTION FRAME *           //
		///////////////////////////////////////////////

		/**
		 * Initialize description frame
		 */
		ChallengeInterface.prototype.descFrameInit = function() {

			// Frame constants
			this.FRAME_INSTALL = 0;
			this.FRAME_INTRO = 1;
			this.FRAME_STARTING = 2;
			this.FRAME_RECOVERY = 3;
			this.FRAME_IDLE = 4;
			this.FRAME_LIVE = 5;
			this.FRAME_WAITJOB = 6;

			// Hide everything besides welcome
			for (var i=1; i<this.descriptionFrames.length; i++)
				this.descriptionFrames[i].hide();

			// Set the active frame
			this.descriptionActiveFrame = 0;

			// Prohibition flag from switching to 'starting'
			// after we issued a shutdown command
			this.shutdownCommandActive = false;

			// Prohibition flag for showing the intro screen
			this.dontShowIdle = true;

		}

		/**
		 * Initialize description frame
		 */
		ChallengeInterface.prototype.descFrameSetActive = function( index ) {

			// Don't do any transition on the same frame
			if (this.descriptionActiveFrame == index) return;

			// Fadeout previous frame
			this.descriptionFrames[ this.descriptionActiveFrame ].fadeOut();
			this.descriptionFrames[ index ].fadeIn();

			// Update active frame id
			this.descriptionActiveFrame = index;

			// Try to load text according to the frame type
			var dynamicDocElm = this.descriptionDynamicDocElm = this.descriptionFrames[ index ].find(".dynamic-content");
			if (index == this.FRAME_STARTING) {
				this.systemMessages.fetchAndRender( "starting", dynamicDocElm );
			} else if (index == this.FRAME_INTRO) {
				this.systemMessages.fetchAndRender( "intro", dynamicDocElm );
			} else if (index == this.FRAME_LIVE) {
				this.systemMessages.fetchAndRender( "live", dynamicDocElm );
			} else if (index == this.FRAME_IDLE) {
				this.systemMessages.fetchAndRender( "idle", dynamicDocElm );
			}

		}

		/**
		 * Automatic shuffling of the description frame system messages
		 */
		ChallengeInterface.prototype.descFrameSetShuffle = function( index ) {
			if (this.descriptionActiveFrame == this.FRAME_LIVE) {
				this.systemMessages.fetchAndRender( "live", this.descriptionDynamicDocElm );
			}
		}

		/**
		 * Update live frame
		 */
		ChallengeInterface.prototype.descFrameSetLiveConfig = function( cfg ) {
			this.gaugeFrameStatus("Starting virtual event generator");
			//$("#live-debug").text(JSON.stringify(cfg));
			if (cfg) {

				// Apply energy units
				var energy = parseInt(cfg['energy']);
				if (energy >= 1000) {
					energy = Number(energy/1000).toFixed(2) + " GeV";
				} else {
					energy = energy.toString() + " MeV";
				}

				// Populate analyses
				$("#live-analyses").empty();
				var analyses = cfg['analysesNames'].split(" ");
				for (var i=0; i<analyses.length; i++) {
					var e = $('<a target="_blank" href="https://rivet.hepforge.org/analyses#'+analyses[i]+'" class="list-group-item">'+analyses[i]+'</a>');
					e.appendTo($("#live-analyses"));
				}

				// Apply generator
				var gen_url = {
					'herwig++': 'https://herwig.hepforge.org/',
					'pythia6': 'https://pythia6.hepforge.org/',
					'pythia8': 'http://home.thep.lu.se/~torbjorn/Pythia.html',
					'sherpa': 'https://sherpa.hepforge.org/trac/wiki',
					'vincia': 'http://vincia.hepforge.org/',
					'alpgenpythia6': 'http://mlm.web.cern.ch/mlm/alpgen/',
					'alpgenherwigjimmy': 'http://mlm.web.cern.ch/mlm/alpgen/',
					'epos': 'http://arxiv.org/abs/1006.2967',
					'phojet': '#',
				};
				$("#live-generator-link").text(cfg['generator']);
				$("#live-generator-link").removeClass("disabled");
				$("#live-generator-link").attr("href", "#");
				$("#live-generator-link").attr("target", "");
				if (gen_url[cfg['generator']] !== undefined) {
					$("#live-generator-link").attr("href", gen_url[cfg['generator']]);
					$("#live-generator-link").attr("target", "_blank");
				}

				// Apply configuration
				$("#live-beam").text(cfg['beam'])
				$("#live-process").text(cfg['process'])
				$("#live-energy").text(energy)
				$("#live-generator").text(cfg['generator'])
				$("#live-nevts").text(numberWithCommas(parseInt(cfg['nevts'])));

			} else {

				// Reset analyses
				$("#live-analyses").empty();
				$('<a href="#" class="list-group-item disabled">(No analyses)</a>').appendTo($("#live-analyses"));

				$("#live-beam").text("---");
				$("#live-process").text("---");
				$("#live-energy").text("---");
				$("#live-generator").text("---");
				$("#live-nevts").text("---");

				$("#live-generator-link").text("(No generator)");
				$("#live-generator-link").addClass("disabled");
				$("#live-generator-link").attr("href", "#");
				$("#live-generator-link").attr("target", "");

			}
		}

		///////////////////////////////////////////////
		//             * FOOTER BUTTONS *            //
		///////////////////////////////////////////////

		/**
		 * Initialize footer buttons
		 */
		ChallengeInterface.prototype.footerInit = function() {

			// Disable power button by default
			this.footerBtnPower.addClass('disabled');

			// By default clicking the power button will start the VM
			this.footerBtnStart = true;

			// Display a popover when we click on the gear
			this.footerBtnGear.popover({
				'title': 'Virtual Machine Configuration',
				'html': true,
				'placement': 'top',
				'container': 'body',
				'content': (function() {
					setTimeout((function() { 
						this.footerCreateAVMControls($("#challenge-popup-status"));
					}).bind(this), 10);
					return '<div id="challenge-popup-status"></div>';
				}).bind(this),
			});

			// Setup power button click
			this.footerBtnPower.click((function() {
				if (this.footerBtnStart) {
					// Start VM
					this.avm.start();
					// After we clicked 'start' we can show
					// the idle screen.
					this.dontShowIdle = false;

					// Forward analytics event
					$(window).trigger("analytics.actions.start");

				} else {
					// Stop VM
					this.avm.stop();
					this.shutdownCommandActive = true;
					this.gaugeFrameResetGauges();
					this.descFrameSetActive( this.FRAME_IDLE );

					// Forward analytics event
					$(window).trigger("analytics.actions.stop");
				}
			}).bind(this));

		}

		/**
		 * Set power button disabled/enabled
		 */
		ChallengeInterface.prototype.footerPowerBtnDisabled = function( isDisabled ) {
			if (isDisabled) {
				this.footerBtnPower.addClass("disabled");
			} else {
				this.footerBtnPower.removeClass("disabled");
			}
		}

		/**
		 * Set power button mode
		 */
		ChallengeInterface.prototype.footerPowerBtnMode = function( inProgress, startMode ) {
			if (inProgress)	{
				this.footerBtnPower.addClass("disabled");
				this.footerBtnPower.text("In progress...");
			} else {
				this.footerBtnPower.removeClass("disabled");

				// Handle cases where second parameter is missing
				if (startMode == undefined) startMode=this.footerBtnStart;
				if (startMode) {
					this.footerBtnPower.removeClass("btn-default");
					this.footerBtnPower.addClass("btn-primary");
					this.footerBtnPower.text("Start");
				} else {
					this.footerBtnPower.addClass("btn-default");
					this.footerBtnPower.removeClass("btn-primary");
					this.footerBtnPower.text("Stop");					
				}
				this.footerBtnStart = startMode;
			}
		}

		/**
		 * Create AVM controls on the given host element
		 */
		ChallengeInterface.prototype.footerCreateAVMControls = function( hostElm ) {

			var avmInstance = this.avm;

			var row = $('<div class="row"></div>').appendTo(hostElm),
				colLeft = $('<div class="col-xs-6"></div>').appendTo(row),
				colRight = $('<div class="col-xs-6 col-border-left"></div>').appendTo(row);

			// Check for missing AVM instance
			if (!avmInstance) {

				// We don't have an AVM to control yet
				var popoverError = $('<div class="popover-failure text-center alert alert-danger" role="alert"></div>').appendTo(row),
					h1 = $('<h4>Misconfigured Challenge</h4>').appendTo(popoverError),
					povError = $('<div>There was a misconfiguration on the challenge interface code! Let the developer know...</div>').appendTo(popoverError);

				return;
			}

			var blockRAM = $('<div></div>').appendTo(colLeft),
				l1 = $('<label for="slider-ram">Allocated RAM (Mb):</label>').appendTo(blockRAM),
				r2 = $('<div class="slider-host"></div>').appendTo(blockRAM),
				//inputRAM = $('<input type="range" min="128" max="2048" step="64" id="slider-ram" />').appendTo(r2),
				inputRAM = $('<div class="slider" />').appendTo(r2),
				labelRAM = $('<div class="text">10</div>').appendTo(r2),

				blockCPU = $('<div></div>').appendTo(colLeft),
				l1 = $('<label for="slider-cpu">Number of CPUs:</label>').appendTo(blockCPU),
				r2 = $('<div class="slider-host"></div>').appendTo(blockCPU),
				//inputCPU = $('<input type="range" min="1" max="8" step="1" id="slider-cpu" />').appendTo(r2),
				inputCPU = $('<div class="slider" />').appendTo(r2),
				labelCPU = $('<div class="text">1</div>').appendTo(r2),

				blockCAP = $('<div></div>').appendTo(colLeft),
				l1 = $('<label for="slider-cap">Allocated CPU power:</label>').appendTo(blockCAP),
				r2 = $('<div class="slider-host"></div>').appendTo(blockCAP),
				//inputCAP = $('<input type="range" min="20" max="100" step="5" id="slider-cap" />').appendTo(r2),
				inputCAP = $('<div class="slider" />').appendTo(r2),
				labelCAP = $('<div class="text">80%</div>').appendTo(r2),

				bg1 = $('<div class="btn-group full-width">').appendTo(colLeft),
				btnDestroy = $('<button title="Destroy" class="btn btn-default"><span class="glyphicon glyphicon-trash"></span></button>').appendTo(bg1),
				btnScreen = $('<button title="Open screen" class="btn btn-default"><span class="glyphicon glyphicon-eye-open"></span></button>').appendTo(bg1),
				btnLogs = $('<a title="Open Application Website" class="btn btn-default"><span class="glyphicon glyphicon-new-window"></span></a>').appendTo(bg1),
				btnApply = $('<button class="btn btn-default full-width" style="width: 90px;">Apply</button>').appendTo(bg1);

			var blockStatus = $('<div></div>').appendTo(colRight),
				h1 = $('<h4>Subsystem status</h4>').appendTo(blockStatus),
				u1 = $('<ul class="list-status list-unstyled"></ul>').appendTo(blockStatus),
				r1 = $('<li></li>').appendTo(u1),
				lblWebAPI = $('<span class="label label-success">Ok</span>').appendTo(r1),
				t1 = $('<span>&nbsp; CernVM WebAPI</span>').appendTo(r1),

				r2 = $('<li></li>').appendTo(u1),
				lblVM = $('<span class="label label-danger">Error</span>').appendTo(r2),
				t1 = $('<span>&nbsp; Virtual machine</span>').appendTo(r2),

				r4 = $('<li></li>').appendTo(u1),
				lblSoftware = $('<span class="label label-success">Ok</span>').appendTo(r4),
				t1 = $('<span>&nbsp; Scientific software</span>').appendTo(r4),

				r3 = $('<li></li>').appendTo(u1),
				lblJob = $('<span class="label label-success">Ok</span>').appendTo(r3),
				t1 = $('<span>&nbsp; Processing work</span>').appendTo(r3);

			var blockProgress = $('<div></div>').appendTo(colRight),
				h1 = $('<hr />').appendTo(blockProgress),
				pbHost = $('<div class="progress"></div>').appendTo(blockProgress),
				pbBar = $('<div class="progress-bar progress-bar-striped"></div>').css('width','60%').html("60%").appendTo(pbHost),
				lbStatus = $('<div class="status-text text-overflow">Virtual machine is ready to be fired out of a cannon to the sun.</div>').appendTo(blockProgress);

			var popoverError = $('<div class="popover-failure text-center alert alert-danger" role="alert"></div>').appendTo(row).hide(),
				h1 = $('<h4>An error occured</h4>').appendTo(popoverError),
				povError = $('<div></div>').appendTo(popoverError),
				b1 = $('<br />').appendTo(popoverError),
				btnPovDismiss = $('<div class="btn btn-danger">Close</div>').appendTo(popoverError);

			// Update inputs with avmInstance state
			//inputRAM.attr("value", avmInstance.config.memory); 
			labelRAM.text(avmInstance.config.memory);
			//inputCPU.attr("value", avmInstance.config.cpus); 
			labelCPU.text(avmInstance.config.cpus);
			//inputCAP.attr("value", avmInstance.config.cap); 
			labelCAP.text(avmInstance.config.cap+"%");

			// Bind UI callbacks
			var onlyCap = true;
			$(inputRAM).slider({
				'min'   : 128,
				'max'	: 2048,
				'step'	: 64,
				'value'	: avmInstance.config.memory,
				'change': function( ev, ui ) {
					avmInstance.config.memory = parseInt(ui.value);
					labelRAM.text(avmInstance.config.memory);
					onlyCap = false;
				}
			});
			$(inputCPU).slider({
				'min'   : 1,
				'max'	: 4,
				'step'	: 1,
				'value'	: avmInstance.config.cpus,
				'change': function( ev, ui ) {
					avmInstance.config.cpus = parseInt(ui.value);
					labelCPU.text(avmInstance.config.cpus);
					onlyCap = false;
				}
			});
			$(inputCAP).slider({
				'min'   : 20,
				'max'	: 100,
				'step'	: 5,
				'value'	: avmInstance.config.cap,
				'change': function( ev, ui ) {
					avmInstance.config.cap = parseInt(ui.value);
					labelCAP.text(avmInstance.config.cap+"%");
				}
			});
			$(btnPovDismiss).click(function() {
				popoverError.fadeOut();
				avmInstance.acknowlege('error');
			});
			$(btnApply).click(function() {
				if (onlyCap) {
					avmInstance.applyCap();
				} else {
					avmInstance.applyAll();
					onlyCap = true;
					// Forward analytics event
					$(window).trigger("analytics.actions.apply");
				}
			});
			$(btnDestroy).click(function() {
				if (!avmInstance.wa_session) return;
				if (window.confirm("This action will remove completely the Virtual Machine from your computer.")) {
					// Forward analytics event
					$(window).trigger("analytics.actions.remove");
					// Close session
					avmInstance.wa_session.close();
				}
			});
			$(btnScreen).click(function() {
				if (!avmInstance.wa_session) return;
				avmInstance.wa_session.openRDPWindow()
				avmInstance.wa_session.__lastRDPWindow.focus();
				// Forward analytics event
				$(window).trigger("analytics.actions.open_rdp");
			});
			$(btnLogs).mousedown(function() {
				if (!avmInstance.wa_session) return;
				if (!avmInstance.apiAvailable) return;
				btnLogs.attr("href", avmInstance.wa_session.apiURL);
				btnLogs.attr("target", "_blank");
				// Forward analytics event
				$(window).trigger("analytics.actions.open_web");
			});


			// Apply state to the label
			var applyState = function(flag, lblElm) {
				if (flag == FLAG_PENDING) {
					lblElm.attr("class", "label label-info");
					lblElm.text("Partial");
				} else if (flag == FLAG_READY) {
					lblElm.attr("class", "label label-success");
					lblElm.text("Ready");
				} else if (flag == FLAG_ERROR) {
					lblElm.attr("class", "label label-danger");
					lblElm.text("Error");
				} else if (flag == FLAG_NOT_READY) {
					lblElm.attr("class", "label label-default");
					lblElm.text("None");
				} else if (flag == FLAG_READY_NOT_ACTIVE) {
					lblElm.attr("class", "label label-warning");
					lblElm.text("Inactive");
				} else {
					lblElm.attr("class", "label label-default");
					lblElm.text("Unknown");
				}
			}

			// Register listeners
			avmInstance.setListener('flagChanged', function(state) {
				
				// Unified WebAPI/Session state
				if (state.webapi == FLAG_READY) {
					if (state.webapi_session == FLAG_NOT_READY) state.webapi_session = FLAG_PENDING;
					applyState(state.webapi_session, lblWebAPI);
				} else {
					applyState(state.webapi, lblWebAPI);
				}

				// Update VM state
				applyState(state.vm, lblVM);

				// Unified agent/api state
				if (state.api == FLAG_READY) {
					if (state.agent == FLAG_NOT_READY) state.agent = FLAG_PENDING;
					applyState(state.agent, lblSoftware);
				} else {
					applyState(state.api, lblSoftware);
				}

				// Update job state
				applyState(state.job, lblJob);

			});
			avmInstance.setListener('progress', function(message, value) {
				pbBar.css("width", (value*100)+"%").text( Number(value*100).toFixed(0) + "%");
				lbStatus.text(message);
			});
			avmInstance.setListener('progressActive', function(active) {
				if (active) {
					pbBar.addClass('active');
				} else {
					pbBar.removeClass('active');
				}
			});
			avmInstance.setListener('error', function(message) {
				popoverError.show();
				povError.text(message);
			});

		}

		///////////////////////////////////////////////
		//               * ACCOUNTING *              //
		///////////////////////////////////////////////

		/**
		 * Initialize footer buttons
		 */
		ChallengeInterface.prototype.accFrameInit = function() {


			// Monitor changes on account information
			this.loginInterface.onUserLogin((function(userInfo) {
				// Update frame information
				this.accFrameDefine(userInfo);
				// Update VM information
				avm.setProperty("challenge-login", this.loginInterface.freeze());
			}).bind(this));
			this.loginInterface.onUserLogout((function(prevInfo) {
				// Update frame information
				this.accFrameUndefine();
				// Update VM information
				avm.setProperty("challenge-login", this.loginInterface.freeze());
			}).bind(this));

			// Check if the user is already loaded
			if (this.loginInterface.userInfo != null) {
				this.accFrameDefine(this.loginInterface.userInfo);
			} else {
				this.accFrameUndefine();
			}

			// Bind log-in button
			this.accBtnLogin.click((function() {
				this.loginInterface.showAccountWindow();
			}).bind(this));
			this.accBtnCredits.click((function() {
				this.loginInterface.showAccountWindow( this.loginInterface.vmid(), this.loginInterface.username() );
			}).bind(this));
			this.accBtnLogout.click((function() {
				this.loginInterface.logout();
			}).bind(this));

		}

		/**
		 * Account information defined
		 */
		ChallengeInterface.prototype.accFrameDefine = function(info) {
			this.accInfoPicture.show();
			this.accInfoName.show();
			this.accBtnCredits.show();
			this.accBtnLogout.show();
			this.accBtnLogin.hide();

			// Greet the user
			this.accInfoName.text( info['displayName'] );
			this.accInfoName.attr({ 'href': info['profileUrl'] });
			this.accInfoPicture.css({ 'background-image': 'url('+info['picture']+')' });

			// If we have AVM, update vmid
			if (this.avm) {
				this.avm.config.vmid = info['uuid'];
				if (info && (info['boinc'] !== undefined)) {
					this.avm.config.boinc_username = info['boinc']['name'];
					this.avm.config.boinc_authenticator = info['boinc']['authenticator'];
					this.avm.config.boinc_userid = info['boinc']['userid'];
				} else {
					this.avm.config.boinc_username = "";
					this.avm.config.boinc_authenticator =  "";
					this.avm.config.boinc_userid = "";
				}
				this.avm.applyAll();
			}

			// Fire analytics info
			$(window).trigger("analytics.actions.login", [info['provider']] );

		}

		/**
		 * Account information undefined
		 */
		ChallengeInterface.prototype.accFrameUndefine = function() {
			this.accInfoPicture.hide();
			this.accInfoName.hide();
			this.accBtnCredits.hide();
			this.accBtnLogout.hide();
			this.accBtnLogin.show();

			// If we have AVM, update vmid
			if (this.avm) {
				this.avm.config.vmid = this.loginInterface.anonymousID;
				this.avm.config.boinc_username = "";
				this.avm.config.boinc_authenticator =  "";
				this.avm.config.boinc_userid = "";
				this.avm.applyAll();
			}

			// Fire analytics info
			$(window).trigger("analytics.actions.logout");

		}

		///////////////////////////////////////////////
		//             * EXPOSED API *               //
		///////////////////////////////////////////////

		/**
		 * Bind events to an autonomous VM instance
		 */
		ChallengeInterface.prototype.bindToAVM = function( avm ) {
			
			// Keep reference
			this.avm = avm;

			// Keep avm state
			this.avmState = -1;

			// Get login information from the VM session
			avm.getProperty("challenge-login", (function(data){
				this.loginInterface.thaw( data );
			}).bind(this));

			// Bind gauge listeners
			avm.addListener('monitor.eventRate', (function(rate) {
				if (rate > 0) {
					this.gaugeFrameStatus("You are now creating virtual collisions");
					// Forward analytics
					$(window).trigger("analytics.vm.collisions");
				}
				this.gaugeFrameGauges.eventRate.rundial("value", rate);
			}).bind(this));
			avm.addListener('monitor.cpuLoad', (function(one, five, fifteen) {
				this.gaugeFrameGauges.cpuLoad.rundial("value", five*100);
			}).bind(this));
			avm.addListener('monitor.progress', (function(overall) {
				this.gaugeFrameGauges.progress.rundial("value", overall*100);
				if (overall >= 0.99) {
					this.gaugeFrameStatus("Completing analysis and sending results");
				}
			}).bind(this));

			// Bind progress events
			avm.addListener('progress', (function(message, value) {
				this.gaugeFrameProgress( value, message );
			}).bind(this));
			avm.addListener('progressActive', (function(active) {
				if (!active) {
					this.gaugeFrameProgress(false);
					this.gaugeFrameAlert(false);
				}
			}).bind(this));

			// Handle error events
			avm.addListener('error', (function(message) {

				// Check for critical errors (on webAPI or on Session)
				if (this.avm.statusFlags.webapi == FLAG_ERROR) {
					this.gaugeFrameAlert("Challenge Aborted", "Could not Initialize CernVM WebAPI. " + message);
					this.footerPowerBtnDisabled(true);
					this.descFrameSetActive( this.FRAME_RECOVERY );

				} else if (this.avm.statusFlags.webapi_session == FLAG_ERROR) {
					this.gaugeFrameAlert("Challenge Aborted", "Could not start a WebAPI session. " + message);
					this.footerPowerBtnDisabled(true);
					this.descFrameSetActive( this.FRAME_RECOVERY );

				} else {

				}

			}).bind(this));


			// Register webAPI state changes
			avm.addListener('webapiStateChanged', (function(state) {
				if (state) {
					this.descFrameSetActive( this.FRAME_INTRO );

					// Save login information
					avm.setProperty("challenge-login", this.loginInterface.freeze());

					// Update the VMID
					this.avm.config.vmid = this.loginInterface.vmid();

					// Update BOINC profile
					var info = this.loginInterface.userInfo;
					if (info && (info['boinc'] !== undefined)) {
						this.avm.config.boinc_username = info['boinc']['name'];
						this.avm.config.boinc_authenticator = info['boinc']['authenticator'];
						this.avm.config.boinc_userid = info['boinc']['userid'];
					} else {
						this.avm.config.boinc_username = "";
						this.avm.config.boinc_authenticator =  "";
						this.avm.config.boinc_userid = "";
					}

				} else {
					this.descFrameSetActive( this.FRAME_RECOVERY );
					this.gaugeFrameWarn("Can you try refreshing?", "Lost connection with the CernVM WebAPI.");
				}
			}).bind(this));

			// Handle job description information
			avm.addListener('monitor.jobInfo', (function(desc) {
				if (this.avmState != STATE_RUNNING) return;
				if (this.shutdownCommandActive) return;

				this.descFrameSetActive( this.FRAME_LIVE );
				this.descFrameSetLiveConfig(desc);
			}).bind(this));

			// Hanlde API state changes
			avm.addListener('apiStateChanged', (function(state) {
				if (state) {
					// Online!
					this.gaugeFrameStatus("Downloading and configuring scientific software");				
					// Forward analytics
					$(window).trigger("analytics.vm.booted")
				} else {
					// Offline
					this.gaugeFrameStatus("Disconnected from the instance");
				}
			}).bind(this));

			// Handle vm state changes
			avm.addListener('genericStateChanged', (function(state) {
				this.avmState = state;
				if (state == STATE_RUNNING) {
					// [VM Entered Running state]

					// Enable 'stop' button
					this.footerPowerBtnMode( false, false );
					// Display the 'starting' frame until we get api_ready
					this.descFrameSetActive( this.FRAME_STARTING );

					// If VM was already running, enable showing idle
					this.gaugeFrameStatus("The Virtual Machine is booting");
					this.dontShowIdle = false;

				} else if (state == STATE_STOPPED) {
					// [VM Entered Stopped state]

					// Enable 'play' button
					this.footerPowerBtnMode( false, true );
					// Reset gauges - they are now invalid
					this.gaugeFrameResetGauges();
					// Show the idle frame only if allowed
					if (!this.dontShowIdle)
						this.descFrameSetActive( this.FRAME_IDLE );

					// Any shutdown command is not any more active
					this.gaugeFrameStatus("The Virtual Machine is ready");
					this.shutdownCommandActive = false;

				} else {
					// [VM is in any state other than above]

					// Disable power button
					this.footerPowerBtnMode( true );
					// Reset gauges - they are now invalid
					this.gaugeFrameResetGauges();
					// If VM was already running, enable showing idle
					this.dontShowIdle = false;

				}
			}).bind(this));

		}

		//////////////////////////////
		return ChallengeInterface;
	}();


	// Check what configuration to load based on the hash URL
	var hash = window.location.hash, context_id = "challenge-t4t";
	if (hash[0] == "#") hash = hash.substr(1);
	if (hash.length > 0) context_id=hash;

	// Create a system messages helper class
	var sysMessages = new SystemMessages( "messages" );

	// Create a login interface
	var loginInterface = new LoginInterface( "https://test4theory.cern.ch/challenge" );

	// Create an AVM for this session
	var avm = new AutonomousVM('http://test4theory.cern.ch/vmcp?config='+context_id);

	// Create the challenge interface
	var challenge = new ChallengeInterface( sysMessages, loginInterface );
	challenge.bindToAVM(avm);

	// Resize description frame well in order to fit height
	var resizeDesc = function() {
		var h = $(window).height() - 370;
		if (h<100) h=100;
		$("#description-frame .well").css({
			'height': h
		})
	};
	$(window).resize(resizeDesc);
	resizeDesc();

});