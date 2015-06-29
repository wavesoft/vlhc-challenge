$(function() {

	/**
	 * Add comma thousand separator
	 */
	function numberWithCommas(x) {
	    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	/**
	 */
	var DynamicInfo = function() {

		/**
		 * DynamicWebInfo renders dynamic information in the web interface 
		 */
		var DynamicWebInfo = function( baseDir ) {

		}

		/**
		 * Update presentation information
		 */
		DynamicWebInfo.prototype.update = function() {

		}

		return DynamicWebInfo;
	}();

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
			$(hostElm).load( this.baseDir + "/" + visit_doc, function() {

				// Upon completion, register analytics callbacks
				$(hostElm).find("*[data-event]").click(function(e) {
					var elm = $(this),
						evName = elm.data('event'),
						evData = elm.data(),
						evURL = elm.attr('href'),
						prop = {
							'url': evURL
						};

					// Don't continue if event not defined
					if (!evName)
						return;

					// Keep event properties
					for (var k in evData) {
						if ((k.substr(0,5) == "event") && (k.length > 5)) {
							prop[k.substr(5,1).toLowerCase() + k.substr(6)] = evData[k];
						}
					}

					// Trigger event
					analytics.fireEvent( evName, prop );

				});

			});

		};



		//////////////////////////////
		return SystemMessages;
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
		var ChallengeInterface = function( systemMessages ) {

			// Keep references of subsystems
			this.systemMessages = systemMessages;

			// Gauge frame & subparts
			this.gaugeFrame = $("#gauge-frame");
			this.gagueFrameTitle = $("#gauge-frame-title");
			this.gaugeFrameAlertOverlay = $("#gauge-frame .panel-alert");
			this.gaugeFrameWarnOverlay = $("#gauge-frame .panel-warn");
			this.gaugeFrameProgressOverlay = $("#gauge-frame .back-progress");

			// The gauges in the interface
			this.gaugeFrameGauges = {
				jobsCompl 	: $("#inp-jobs"),
				activity 	: $("#inp-activity"),
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

			// Description frame dynamic buttons
			this.descFrameBtnSims = $("#live-see-sims");
			this.descFrameBtnDisplay = $("#live-see-display");

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
			this.footerBtnTrash = $("#btn-remove");

			// Start frame shuffler
			setInterval(this.descFrameSetShuffle.bind(this), 30000);

			// Start account information probing
			this.gaugeFrameUpdateAccountDetails();

			// Initialize footer 
			this.footerInit();

			// We are initialized, register an away alerter
			this.alertOnUnload = false;
			$(window).bind('beforeunload', (function() {
				if (this.alertOnUnload) {
					return "Your virtual machine will keep running in the background, even if you close this window. \n\nIf you want to stop the Virtual Machine, visit again this page and click the Stop button in the bottom!";
				}
			}).bind(this));

			// Initialize dumbq front-end
			this.dumbq = new DumbQ.Frontend();

			// Initialize front-end bindings to DumbQ
			this.dumbqFrontendInit();

			// The number of running instances
			this.instances = [];
			this.lastMachineVMID = null;
			this.machineVMID = null;
			this.activeDescTab = null;

		}

		///////////////////////////////////////////////
		//            * DUMBQ FRONT-END *            //
		///////////////////////////////////////////////

		/**
		 * Initialize dumbq front-end binding components
		 */
		ChallengeInterface.prototype.dumbqFrontendInit = function() {

			// Update gauges on metrics event
			$(this.dumbq).on('metrics_details', (function(e, metrics) {

				// Update activity and progress
				this.gaugeFrameGauges.activity.rundial( "value", metrics.activity * 100 );
				this.gaugeFrameGauges.progress.rundial( "value", metrics.progress * 100 );

			}).bind(this));

			// 
			$(this.dumbq).on('online', (function(e, machine) {
				// Mark as online
				this.gaugeFrameStatus("Waiting for a project to begin");				
				this.descFrameSetActive( this.FRAME_WAITJOB );
				this.descFrameResetTabs();
				this.instances = [];
				// Update AVM
				if (this.avm) {
					this.avm.statusFlags.agent = CVM.FLAG_READY;
					this.avm.statusFlags.job = CVM.FLAG_PENDING;
					this.avm.notifyFlagChange();
				}
				// Claim worker
				this.machineVMID = machine['vmid'];
				this.lastMachineVMID = this.machineVMID;
				CreditPiggy.claimWorker( machine['vmid'] );
			}).bind(this));
			$(this.dumbq).on('offline', (function(e, machine) {
				// Mark offline
				this.gaugeFrameStatus("Disconnected from the Virtual Machine");
				this.descFrameSetActive( this.FRAME_IDLE );
				// Update AVM
				if (this.avm) {
					this.avm.statusFlags.agent = CVM.FLAG_NOT_READY;
					this.avm.statusFlags.job = CVM.FLAG_NOT_READY;
					this.avm.notifyFlagChange();
				}
				// Reset machine ID
				this.machineVMID = null;
			}).bind(this));

			// 
			$(this.dumbq).on('online_instance', (function(e, instance, metrics) {
				// Update instance metrics
				instance['metrics'] = metrics
				// Update instance record
				instance['tab'] = this.descFrameCreateTab( instance );
				this.instances.push(instance);
				// Check for what to show
				if (this.instances.length == 1) {
					this.descFrameSetActive( this.FRAME_LIVE );
					this.gaugeFrameStatus("You are now contributing");
				}
				// Update AVM
				if (this.avm) {
					this.avm.statusFlags.job = CVM.FLAG_READY;
					this.avm.notifyFlagChange();
				}
			}).bind(this));
			$(this.dumbq).on('offline_instance', (function(e, instance) {
				// Remove instance record
				this.descFrameRemoveTab( instance['tab'] );
				for (var i=0; i<this.instances.length; i++) {
					if (this.instances[i].uuid == instance.uuid) {
						this.instances.splice(i,1);
						break;
					}
				}
				// Check for what to show
				if (this.instances.length == 0) {
					this.descFrameSetActive( this.FRAME_WAITJOB );
					this.gaugeFrameStatus("Waiting for a project to begin");				

					// Update AVM
					if (this.avm) {
						this.avm.statusFlags.job = CVM.FLAG_READY_NOT_ACTIVE;
						this.avm.notifyFlagChange();
					}

				}
			}).bind(this));
			$(this.dumbq).on('metrics_instance', (function(e, metrics, instance ) {
				// Update instance metrics
				instance['metrics'] = metrics;
				// Update tab
				this.descFrameUpdateTab( instance['tab'], instance );
				// Update details
				if (this.activeDescTab == instance['uuid'])
					this.descFrameUpdateStatus( instance );
			}).bind(this));

		}

		///////////////////////////////////////////////
		//             * GAUGE FRAME *               //
		///////////////////////////////////////////////

		/**
		 * Initialize gauge frame components
		 */
		ChallengeInterface.prototype.gaugeFrameInit = function() {

			// Create the four gauges
			this.gaugeFrameGauges.activity.rundial({
				min: 0, max: 100, step: 10,
				format: function(x) { return parseInt(x).toString() + " %"; }
			});
			this.gaugeFrameGauges.progress.rundial({
				min: 0, max: 100, step: 1,
				format: function(x) { return parseInt(x).toString() + " %"; }
			});
			this.gaugeFrameGauges.jobsCompl.rundial({
				min: 0, max: 1000000000, step: 1,
				format: function(x) { return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
			});
			this.gaugeFrameGauges.ranking.rundial({
				min: 0, max: 1000000000, step: 1,
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
		 * Update gauge frame using the current information
		 */
		ChallengeInterface.prototype.gaugeFrameUpdateAccountDetails = function() {

			// Get user profile from creditpiggy
			var profile = CreditPiggy.profile,
				counters = profile ? (profile.counters || {}) : {};

			// Update social
			if (profile) {
				this.accInfoName.text( profile['display_name'] );
				this.accInfoName.attr({ 'href': profile['profile_url'] });
				this.accInfoPicture.css({ 'background-image': 'url('+profile['profile_image']+')' });				
			}

			// Update counters
			if (profile && (counters['rank'] !== undefined) && (counters['jobs'] !== undefined)) {
				this.gaugeFrameGauges.ranking.rundial("value", counters['rank']);
				this.gaugeFrameGauges.jobsCompl.rundial("value", counters['jobs']);
			} else {
				this.gaugeFrameGauges.ranking.rundial("value", 0);
				this.gaugeFrameGauges.jobsCompl.rundial("value", 0);
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
			this.gaugeFrameGauges.activity.rundial("value", 0);
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

			// Bind open VM display
			this.descFrameBtnDisplay.click((function(e) {
				if (!this.avm.wa_session) return;
				this.avm.wa_session.openRDPWindow()
				this.avm.wa_session.__lastRDPWindow.focus();
				// Forward analytics event
				analytics.fireEvent("actions.open_rdp");
				// Prevent default event
				e.preventDefault();
				e.stopPropagation();
			}).bind(this));

			// Get live-content tab elements
			this.descLiveTabs = this.descriptionFrames[ this.FRAME_LIVE ].find(".nav-tabs");
			this.descLiveContent = this.descriptionFrames[ this.FRAME_LIVE ].find(".tab-content");
			this.descLiveStatus = this.descriptionFrames[ this.FRAME_LIVE ].find('.status-flag > span');

		}

		/**
		 * Reset all tabs in the live desc frame
		 */
		ChallengeInterface.prototype.descFrameResetTabs = function() {
			this.descLiveTabs.empty();
			this.descLiveContent.empty();
			this.activeDescTab = null;
		}

		/**
		 * Update tab status
		 */
		ChallengeInterface.prototype.descFrameUpdateStatus = function( inst ) {

			// Keyword-color mapping
			var kw = {
				'label label-success' : [ 'ok','live','working','active','run','executing','ready','success' ],
				'label label-warning' : [ 'warn','warning','unexpected','terminated','exception' ],
				'label label-danger'  : [ 'error','problem','danger','fault' ],
				'label label-info'    : [ 'wait','pend','schedule','paused','sleep','stale' ],
			};

			// If we don't have an instance, hide it
			if (!inst) {
				this.descLiveStatus.hide();
				return;
			}

			// Look for status
			var status = 'running';
			if (inst['metrics'] && inst['metrics']['status'])
				status = inst['metrics']['status'];

			// Show and update
			this.descLiveStatus.show().text(status.charAt(0).toUpperCase() + status.slice(1));

			// Pick color
			var color = 'label label-primary',
				lstatus = status.toLowerCase();

			colorpick:
			for (var k in kw) {
				var words = kw[k];
				for (var i=0; i<words.length; i++) {
					if (lstatus.indexOf(words[i]) >= 0) {
						color = k;
						break colorpick;
					}
				}
			}

			// Set color
			this.descLiveStatus.attr('class', color);

		}

		/**
		 * Create a tab in the desc frame
		 */
		ChallengeInterface.prototype.descFrameCreateTab = function( desc ) {
			var tid = 't-'+desc.uuid,
				index = (this.instances.length + 1),
				title = desc['metrics']['title'] || desc.project,
				url = this.avm.wa_session.apiURL + desc.wwwroot,
				tab = $('<li role="presentation"><a href="#'+tid+'" aria-controls="home" role="tab" data-toggle="tab"> CPU-'+index+' <em>('+title+')</em></a></li>')
						.appendTo(this.descLiveTabs),
				content = $('<div role="tabpanel" class="tab-pane" id="'+tid+'"></div>')
						.appendTo(this.descLiveContent),
				iframe = $('<iframe src="'+url+'" frameborder="0"></iframe>')
						.appendTo(content);

			// Select first tab
			if (this.descLiveTabs.find(".active").length == 0) {
				this.descLiveTabs.find("li").first().addClass("active");
				this.descLiveContent.find("div").first().addClass("active");
				this.activeDescTab = desc['uuid'];
				this.descFrameUpdateStatus( desc );
			}

			// On click update instance status
			$(tab).click((function() {
				this.activeDescTab = desc['uuid'];
				this.descFrameUpdateStatus( desc );
				this.descFrameRefreshTab( desc );
			}).bind(this));

			// If we have only one instance, make full screen
			if (index == 1) {
				this.descLiveTabs.hide();
				this.descLiveContent.addClass("tab-pane-full");
			} else {
				this.descLiveTabs.show();
				this.descLiveContent.removeClass("tab-pane-full");
			}

			// Keep instances in desc
			desc.iframe = iframe;

			return [tid, tab, content, iframe, url];
		}

		/**
		 * Remove a tab from the desc frame
		 */
		ChallengeInterface.prototype.descFrameRemoveTab = function( tab ) {
			// Remove tab DOM elements
			tab[1].remove();
			tab[2].remove();
		}

		/**
		 * Update tab status
		 */
		ChallengeInterface.prototype.descFrameUpdateTab = function( desc ) {

			// Calculate the URL of the iframe
			var wwwroot = this.avm.wa_session.apiURL + desc.wwwroot;

			// Check if we have a webapp
			if (desc['metrics'] && (desc['metrics']['webapp'] !== undefined)) {
				wwwroot += "/" + desc['metrics']['webapp'];
			// Check if we have a dynamic frame
			} else if (desc['metrics'] && (desc['metrics']['webinfo'] !== undefined)) {

			}

		}

		/**
		 * Refresh tab contents
		 */
		ChallengeInterface.prototype.descFrameRefreshTab = function( desc ) {

			// Calculate the URL of the iframe
			var wwwroot = this.avm.wa_session.apiURL + desc.wwwroot;

			// Check if we have a webapp
			if (desc['metrics'] && (desc['metrics']['webapp'] !== undefined)) {
				wwwroot += "/" + desc['metrics']['webapp'];
			// Check if we have a dynamic frame
			} else if (desc['metrics'] && (desc['metrics']['webinfo'] !== undefined)) {

			}

			// Navigate to refresh
			desc.iframe.attr('src', wwwroot);

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
			} else if (index == this.FRAME_WAITJOB) {
				this.systemMessages.fetchAndRender( "waitjob", dynamicDocElm );
			}

		}

		/**
		 * Show a status message on the collider screen of the descFrame
		 */
		ChallengeInterface.prototype.descFrameShowPopup = function( message ) {
			var msg = $("#live-popup-message");
			msg.html(message);
			if (!msg.is(":visible")) {
				msg.fadeIn();
			}
		}

		/**
		 * Hide a status message from the collider screen
		 */
		ChallengeInterface.prototype.descFrameHidePopup = function() {
			$("#live-popup-message")
				.fadeOut();
		}

		/**
		 * Automatic shuffling of the description frame system messages
		 */
		ChallengeInterface.prototype.descFrameSetShuffle = function( index ) {
			if (this.descriptionActiveFrame == this.FRAME_LIVE) {
				this.systemMessages.fetchAndRender( "live", this.descriptionDynamicDocElm );
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
						// Create controls
						this.footerCreateAVMControls($("#challenge-popup-status"));
						// Create close button
						var titleDOM = $("#challenge-popup-status").parent().siblings(".popover-title"),
							btnClose = $('<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>').appendTo(titleDOM);
						btnClose.click((function() {
							this.footerBtnGear.popover('hide');
						}).bind(this));

					}).bind(this), 10);
					return '<div id="challenge-popup-status"></div>';
				}).bind(this),
			});

			// Setup destroy button click
			this.footerBtnTrash.click((function() {
				if (!this.avm.wa_session) return;
				if (this.avm.wa_last_state == 0) return;
				if (window.confirm("This action will remove completely the Virtual Machine from your computer.")) {
					// Forward analytics event
					analytics.fireEvent("actions.remove");
					// Close session
					this.avm.wa_session.close();
					// Remove this worker
					if (this.lastMachineVMID) CreditPiggy.releaseWorker( this.lastMachineVMID );
				}
			}).bind(this));

			// Setup power button click
			this.footerBtnPower.click((function() {
				if (this.footerBtnStart) {
					// Start VM
					this.avm.start({
						'boinc_userid': boinc_user,
						'boinc_hostid': boinc_host
					});
					// After we clicked 'start' we can show
					// the idle screen.
					this.dontShowIdle = false;

					// Forward analytics event
					analytics.fireEvent("actions.start");

					// Analytics goal tracking
					analytics.fireIncrementalEvent(
						'goals.start', 	// Event to fire
						{ }, 			// Static properties
						'times', 		// The property to store the value

						// Update and get the value of the accumulator
						analytics.accumulate('goals.start.accumulator', 1)
					);

				} else {
					// Stop VM
					this.avm.stop();
					this.shutdownCommandActive = true;
					this.gaugeFrameResetGauges();
					this.descFrameSetActive( this.FRAME_IDLE );

					// Forward analytics event
					analytics.fireEvent("actions.stop");
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
				//btnDestroy = $('<button title="Remove Virtual Machine" class="btn btn-default"><span class="glyphicon glyphicon-trash"></span></button>').appendTo(bg1),
				btnScreen = $('<button title="See Job Status" class="btn btn-default"><span class="glyphicon glyphicon-eye-open"></span></button>').appendTo(bg1),
				logsDropup = $('<div class="btn-group dropup"></div>').appendTo(bg1),
				btnApply = $('<button class="btn btn-default full-width" style="width: 122px;">Apply</button>').appendTo(bg1);

			var btnLogs = $('<button class="btn btn-default dropdown-toggle" type="button" id="dropdownLogsMenu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><span class="glyphicon glyphicon-new-window"></span><span class="caret"></span></button>').appendTo(logsDropup),
				btnLogsGroup = $('<ul class="dropdown-menu" aria-labelledby="dropdownLogsMenu"></ul>').appendTo(logsDropup);

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
					analytics.fireEvent("actions.cap",{
						"cap": avmInstance.config.cap,
					});
				} else {
					avmInstance.applyAll();
					onlyCap = true;
					// Forward analytics event
					analytics.fireEvent("actions.apply",{
						"cap": avmInstance.config.cap,
						"cpus": avmInstance.config.cpus,
						"memory": avmInstance.config.memory,
					});
				}
			});
			/*
			$(btnDestroy).click(function() {
				if (!avmInstance.wa_session) return;
				if (window.confirm("This action will remove completely the Virtual Machine from your computer.")) {
					// Forward analytics event
					analytics.fireEvent("actions.remove");
					// Close session
					avmInstance.wa_session.close();
				}
			});
			*/
			$(btnScreen).click(function() {
				if (!avmInstance.wa_session) return;
				avmInstance.wa_session.openRDPWindow()
				avmInstance.wa_session.__lastRDPWindow.focus();
				// Forward analytics event
				analytics.fireEvent("actions.open_rdp");
			});
			$(btnLogs).mousedown((function() {
				btnLogsGroup.empty();
				if (!avmInstance.wa_session || !avmInstance.apiAvailable || !this.instances.length) {
					$('<li class="disabled"><a href="#">No active projects</a></li>')
						.appendTo(btnLogsGroup);
				} else {
					for (var i=0; i<this.instances.length; i++) {
						var inst = this.instances[i],
							title = 'CPU-' + (i+1) + ' ' + ((inst['metrics'] ? inst['metrics']['title'] : undefined) || inst.project);
						$('<li><a href="'+avmInstance.wa_session.apiURL+'/'+inst['wwwroot']+'" target="_blank">'+title+'</a></li>')
							.appendTo(btnLogsGroup)
							.click(function(e) {
								analytics.fireEvent("actions.open_web");
							});
					}
				}
			}).bind(this));

			// Apply state to the label
			var applyState = function(flag, lblElm) {
				if (flag == CVM.FLAG_PENDING) {
					lblElm.attr("class", "label label-info");
					lblElm.text("Partial");
				} else if (flag == CVM.FLAG_READY) {
					lblElm.attr("class", "label label-success");
					lblElm.text("Ready");
				} else if (flag == CVM.FLAG_ERROR) {
					lblElm.attr("class", "label label-danger");
					lblElm.text("Error");
				} else if (flag == CVM.FLAG_NOT_READY) {
					lblElm.attr("class", "label label-default");
					lblElm.text("None");
				} else if (flag == CVM.FLAG_READY_NOT_ACTIVE) {
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
				if (state.webapi == CVM.FLAG_READY) {
					if (state.webapi_session == CVM.FLAG_NOT_READY) state.webapi_session = CVM.FLAG_PENDING;
					applyState(state.webapi_session, lblWebAPI);
				} else {
					applyState(state.webapi, lblWebAPI);
				}

				// Update VM state
				applyState(state.vm, lblVM);

				// Unified agent/api state
				if (state.api == CVM.FLAG_READY) {
					if (state.agent == CVM.FLAG_NOT_READY) state.agent = CVM.FLAG_PENDING;
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

			//
			// Handle Logins from CreditPiggy Interface
			//
			$(CreditPiggy).on('login',(function(e, profile, userAction) {
				// Update frame information
				this.accFrameDefine( profile );
				// Update account details
				this.gaugeFrameUpdateAccountDetails( );
				// Update globa ID
				if (analytics) {
					analytics.setGlobal("userid", profile["id"]);
					analytics.fireEvent("actions.login", { "userid": profile["id"] });
				}
				// Claim machine if we have a this.machineVMID
				if (this.machineVMID) CreditPiggy.claimWorker( this.machineVMID );
			}).bind(this));

			//
			// Handle Logouts from CreditPiggy Interface
			//
			$(CreditPiggy).on('logout',(function(e, profile, userAction) {
				// Update frame information
				this.accFrameUndefine();
				// Update account details
				this.gaugeFrameUpdateAccountDetails();
				// Switch userid to anonymous
				if (analytics) {
					analytics.setGlobal("userid", "a:"+analytics.trackingID);
					analytics.fireEvent("actions.logout");
				}
				// Reset token only if from user action
				if (userAction) {
					// Update VM information
					avm.setProperty("challenge-login", "" );
				}
			}).bind(this));

			//
			// Handle profile updates from CreditPiggy Interface
			//
			$(CreditPiggy).on('profile',(function(e, profile) {
				// Update account details
				this.gaugeFrameUpdateAccountDetails();

				// Analytics goal tracking
				if (analytics) {
					var counters = profile ? (profile.counters || {}) : {};

					// Get total number of CPU Time
					if (counters['job/cpuusage'] !== undefined) {
						analytics.fireIncrementalEvent(
							'goals.cputime', 	// Event to fire
							{ },				// Static properties
							{
								'property'	: 'hours',							// Property to update
								'value'		: counters['job/cpuusage'] / 3600,	// Convert to hours
								'interval' 	: 1 								// Send every hour
							}
						);
					}

					// Get total number of jobs completed
					if (counters['slots/completed'] !== undefined) {
						analytics.fireIncrementalEvent(
							'goals.jobs', 		// Event to fire
							{ },				// Static properties
							{
								'property'	: 'jobs',							// Property to update
								'value'		: counters['slots/completed'],		// Get completed jobs
								'interval' 	: 10								// Send every 10 jobs
							}
						);
					}

				}
			}).bind(this));


			//
			// Store authentication token when it's changed
			//
			$(CreditPiggy).on('token', (function(e, newToken, userAction) {
				// If this was from a user action, or if the challenge-login
				// token is empty, update it
				if (newToken || (!newToken && userAction)) {
					avm.setProperty( "challenge-login", newToken || "");
				}
			}).bind(this));

			//
			// CreditPiggy is ready to receive a session thaw event
			//
			$(CreditPiggy).on('thaw', (function(e, sessionToken) {
				// Get login information from the VM session
				this.avm.getProperty("challenge-login", (function(data){
					CreditPiggy.thawSession( data );
				}).bind(this));
			}).bind(this));

			// Assume frame is undefined
			this.accFrameUndefine();

			// Bind log-in button
			this.accBtnLogin.click((function() {
				CreditPiggy.showLogin();
			}).bind(this));
			this.accBtnCredits.click((function() {
				CreditPiggy.showWebsiteStatus();
			}).bind(this));
			this.accBtnLogout.click((function() {
				CreditPiggy.logout();
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

			// Thaw possible session information
			avm.getProperty("analytics", (function(data){
				if (!data) return;
				var tid = analytics.trackingID;
				// Import new store data
				analytics.importStore(data);
				// Detect changes in TrackID
				if (analytics.trackingID != tid) analytics.fireEvent("link.trackids", { "trackid2": tid })
			}).bind(this));

			// Listen for analytics permanent data updates and
			// store them in the vm to share across browsers
			$(analytics).on('changed', (function(e, data) {
				avm.setProperty("analytics", data);
			}).bind(this));

			// When focusing, update the values
			$(window).on('focus', (function() {

				// Import analytics properties
				avm.getProperty("analytics", (function(data){
					if (!data) return;
					var tid = analytics.trackingID;
					// Import new store data
					analytics.importStore(data);
					// Detect changes in TrackID
					if (analytics.trackingID != tid) analytics.fireEvent("link.trackids", { "trackid2": tid })
				}).bind(this));

			}).bind(this));

			// When blurring, store the values
			$(window).on('blur', (function() {
				avm.setProperty("analytics", analytics.exportStore());
			}).bind(this));

			// // Get login information from the VM session
			// avm.getProperty("challenge-login", (function(data){
			// 	alert("Thaw: "+data);
			// 	CreditPiggy.thawSession( data );
			// }).bind(this));

			// // Bind gauge listeners
			// var lastProgress = 0;
			// avm.addListener('monitor.cpuLoad', (function(one, five, fifteen) {
			// 	//this.gaugeFrameGauges.cpuLoad.rundial("value", five*100);
			// }).bind(this));
			// avm.addListener('monitor.progress', (function(overall) {
			// 	this.gaugeFrameGauges.progress.rundial("value", overall*100);
			// 	lastProgress = overall;
			// 	if (overall >= 0.99) {
			// 		this.gaugeFrameStatus("Completing analysis and sending results");
			// 		this.descFrameShowPopup("Completing analysis and sending results");
			// 	}
			// }).bind(this));
			// avm.addListener('monitor.activity', (function(rate) {
			// 	if (rate > 0) {
			// 		if (lastProgress < 0.99) {
			// 			this.gaugeFrameStatus("You are now creating virtual collisions");
			// 			this.descFrameHidePopup();
			// 		}
			// 		// Forward analytics
			// 		analytics.fireEvent("vm.collisions");
			// 	}
			// 	this.gaugeFrameGauges.activity.rundial("value", rate);
			// }).bind(this));

			// // Handle job description information
			// avm.addListener('monitor.jobInfo', (function(desc) {
			// 	if (this.avmState != STATE_RUNNING) return;
			// 	if (this.shutdownCommandActive) return;

			// 	this.descFrameSetActive( this.FRAME_LIVE );
			// 	this.descFrameSetLiveConfig(desc);
			// }).bind(this));

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
				if (this.avm.statusFlags.webapi == CVM.FLAG_ERROR) {
					this.gaugeFrameAlert("Challenge Aborted", "Could not Initialize CernVM WebAPI. " + message);
					this.footerPowerBtnDisabled(true);
					this.descFrameSetActive( this.FRAME_RECOVERY );

				} else if (this.avm.statusFlags.webapi_session == CVM.FLAG_ERROR) {
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
				} else {
					this.descFrameSetActive( this.FRAME_RECOVERY );
					this.gaugeFrameWarn("Can you try refreshing?", "Lost connection with the CernVM WebAPI.");
					this.alertOnUnload = false;
				}
			}).bind(this));

			// Hanlde API state changes
			avm.addListener('apiStateChanged', (function(state, api) {
				if (state) {
					// Online!
					this.gaugeFrameStatus("Downloading and configuring scientific software");				
					// Forward analytics
					analytics.fireEvent("vm.booted")
					// Enable peek button
					this.descFrameBtnSims.removeClass("disabled");
					this.descFrameBtnSims.attr("href", api);
					this.descFrameBtnDisplay.removeClass("disabled");
					// Enable DumbQ polling
					this.dumbq.enable(api);
					// Update AVM
					if (this.avm) {
						this.avm.statusFlags.vm = CVM.FLAG_READY;
						this.avm.notifyFlagChange();
					}
				} else {
					// Offline
					this.gaugeFrameStatus("Disconnected from the instance");
					// Disable peek button
					this.descFrameBtnSims.addClass("disabled");
					this.descFrameBtnSims.attr("href", "javascript:;");
					this.descFrameBtnDisplay.removeClass("disabled");
					// Disable DumbQ polling
					this.dumbq.disable();
					// Update AVM
					if (this.avm) {
						this.avm.statusFlags.vm = CVM.FLAG_READY_NOT_ACTIVE;
						this.avm.notifyFlagChange();
					}
				}
			}).bind(this));

			// Handle states where destroy button is not active
			avm.addListener('vmStateChanged', (function(state) {
				if (state == 0) {
					this.footerBtnTrash.addClass("disabled");
				} else {
					this.footerBtnTrash.removeClass("disabled");
				}
			}).bind(this));

			// Handle vm state changes
			avm.addListener('genericStateChanged', (function(state) {
				this.avmState = state;
				if (state == CVM.STATE_RUNNING) {
					// [VM Entered Running state]
					this.alertOnUnload = true;

					// Enable 'stop' button
					this.footerPowerBtnMode( false, false );
					// Display the 'starting' frame until we get api_ready
					this.descFrameSetActive( this.FRAME_STARTING );

					// If VM was already running, enable showing idle
					this.gaugeFrameStatus("The Virtual Machine is booting");
					this.dontShowIdle = false;

				} else if (state == CVM.STATE_STOPPED) {
					// [VM Entered Stopped state]
					this.alertOnUnload = false;

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
					this.alertOnUnload = false;

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
	var hash = window.location.hash, context_id = "challenge-dumbq", vm_suffix = "",
		boinc_user = "", boinc_host = "";
	if (hash[0] == "#") hash = hash.substr(1);

	// Parse additional parameters from the URL
	if (hash.length > 0) {
		// Tokenize
		var result = {};
		hash.split("&").forEach(function(part) {
			var item = part.split("=");
			result[item[0]] = decodeURIComponent(item[1]);
		});

		// Override parameters
		if (result['c'] !== undefined) {
			context_id = result['c'];
		}
		if (result['n'] !== undefined) {
			vm_suffix = result['n'];
		}
		if (result['boinc_user'] !== undefined) {
			boinc_user = result['boinc_user'];
		}
		if (result['boinc_host'] !== undefined) {
			boinc_host = result['boinc_host'];
		}

	}

	// Create a system messages helper class
	var sysMessages = new SystemMessages( "messages" );
	// Create an AVM for this session
	var avm = new CVM.AutonomousVM('http://test4theory.cern.ch/vmcp?config='+context_id+'&suffix='+vm_suffix);
	// Create the challenge interface
	var challenge = new ChallengeInterface( sysMessages );

	// Bind challenge to AVM
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

	// Initialize Creditpiggy
	CreditPiggy.configure('efc98cfc58eb4526b2babbbc871bec11');

	// Initialize default analytics tracking ID (to anonymous)
	if (analytics) analytics.setGlobal('userid', 'a:'+analytics.trackingID);

	// Tooltips use body container
	$('[data-toggle=tooltip]').tooltip({container: 'body'});


});