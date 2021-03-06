<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>CERN Challenge Dashboard</title>

		<!-- OpenGraph Properties -->
		<meta property="og:title" content="CERN Public Computing Challenge 2015" />
		<meta property="og:headline" content="Be part of the CERN's 2015 edition of the Computing Challenge" />
		<meta property="og:description" content="Join the CERN Computing challenge and join the big community of volunteers for science!" />
		<meta property="og:image" content="http://test4theory.cern.ch/vlhc/style/img/thumb.png" />
		<meta property="og:image:secure_url" content="https://test4theory.cern.ch/vlhc/style/img/thumb.png" />

		<!-- Bootstrap -->
		<link rel="stylesheet" href="ext/css/bootstrap.min.css">
		<!-- jQuery UI -->
		<link rel="stylesheet" href="ext/css/jquery-ui.css">
		<!-- Stylesheets -->
		<link rel="stylesheet" href="style/css/challenge.css">

		<!-- Rundial -->
		<link rel="stylesheet" href="style/css/rundial.css">

		<!-- HTML5 Shim and Respond.js IE8 support of HTML5 elements and media queries -->
		<!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
		<!--[if lt IE 9]>
		  <script src="ext/js/html5shiv.min.js"></script>
		  <script src="ext/js/respond.min.js"></script>
		<![endif]-->

		<!-- Redirect if we are on https (WebAPI does not work over HTTPS) -->
		<script type="text/javascript">
		if (window.location.protocol == "https:")
			window.location = "http:" + window.location.toString().substr(6);
		</script>

	</head>
	<body class="fixed-fullscreen">

		<div id="challenge" class="content-fluid fullscreen">

			<div id="gauge-frame" class="frame frame-status">
				<div class="container">

					<div class="panel panel-default">

						<div class="panel-heading">
							<div class="back-progress">
								<div class="back-animation"></div>
							</div>
							<span id="gauge-frame-title">Contacting CernVM WebAPI</span>
							<div class="account-frame">
								<div id="acc-picture"></div>
								<a id="acc-name" target="_blank" href="#">Anonymous</a>
								&nbsp;
								<a id="btn-login" class="btn btn-success btn-sm">
									Log-in and keep track of your progress
								</a>
								<button id="btn-credits" class="btn btn-default btn-sm">
									Progress details
								</button>								
							</div>
						</div>
						<div class="panel-body">

							<div class="widgets">
								<div class="row">
								  <div class="col-xs-3">
									<h3>Activity</h3>
									<div class="details">How actively your virtual machine utilizes your CPU.</div>
									<input class="ui-dial" id="inp-activity" value="0"></input>
								  </div>
								  <div class="col-xs-3">
									<h3>Progress</h3>
									<div class="details">What fraction of the current job is completed.</div>
									<input class="ui-dial" id="inp-progress" value="0"></input>
								  </div>
								  <div class="col-xs-3">
									<h3>Contribution</h3>
									<div class="details">How many simulation jobs your virtual machine has processed.</div>
									<input class="ui-dial" id="inp-jobs" value="0"></input>
								  </div>
								  <div class="col-xs-3">
									<h3>Ranking</h3>
									<div class="details">Your ranking among the volunteers in this challenge, by number of jobs completed.</div>
									<input class="ui-dial" id="inp-ranking" value="0"></input>
								  </div>
								</div>
							</div>

							<div class="dynamic-content" id="global-dynamic-content">
							</div>

						</div>

						<div class="panel-alert">
							<h1>Challenge Aborted</h1>
							<p>Could not start session: User denied</p>
						</div>
						<div class="panel-warn">
							<h1>Try reloading!</h1>
							<p>Could not start session: User denied</p>
						</div>


					</div>
					
				</div>
			</div>

			<div id="description-frame" class="frame frame-description">
				<div class="container">
					<div class="well">

						<div class="desc-install">
							<h1>Welcome to the CERN Public Computing Challenge</h1>
						</div>

						<div class="desc-intro">
							<div class="dynamic-content">
							</div>
						</div>

						<div class="desc-starting">
							<h1>Your virtual accelerator is initializing <img src="style/img/vmspinner.gif" /> </h1>
							<div class="dynamic-content">
							</div>
						</div>

						<div class="desc-waitjob">
							<h1>We are waiting for a project to arrive <img src="style/img/vmspinner.gif" /> </h1>
							<div class="dynamic-content">
							</div>
						</div>
						
						<div class="desc-recovery">
							<h1>An error occured</h1>
							<p>
								It looks that something went wrong while trying to prepare your computer for the <em>CERN Public Computing Challenge</em>.
							</p>
							<p>
								Try the following solutions:
								<ul>
									<li>
										Refresh the website <img src="style/img/refresh.png" alt="Refresh" align="absmiddle" />
									</li>
									<li>
										Close the challenge website, wait 30 seconds and open it again
									</li>
								</ul>
							</p>
							<p>
								If nothing of the above works for you, you can check for a solution in the <a href="http://test4theory.cern.ch/challenge/#disqus" target="_blank">Challenge Discussion</a>.
							</p>
						</div>

						<div class="desc-idle">
							<h1>The challenge is paused</h1>
							<p>
								Your virtual accelerator is stopped... when your science fever is back, click <em>Start</em> to start again!
							</p>
						</div>

						<div class="desc-live">
							<ul class="nav nav-tabs" role="tablist">
								<li role="presentation">
									<a href="#t-status-tab">My Achievements</a>
								</li>
							</ul>
							<div class="tab-content">
								<div role="tabpanel" class="tab-pane" id="t-status-tab">
									<div id="creditpiggy-embed"></div>
								</div>
							</div>
						</div>

					</div>
				</div>
			</div>

			<div class="button-footer">
				<div class="container">
					<div class="text-center">
						<button class="btn btn-primary btn-lg-w btn-lg" id="btn-power">Start</button>
						<div class="btn-group" role="group">
							<button class="btn btn-default btn-lg" id="btn-status" data-toggle="tooltip" data-placement="top" title="More options here"><span class="glyphicon glyphicon-cog"></span></button>
							<button id="btn-remove" class="btn btn-default btn-lg disabled" data-toggle="tooltip" data-placement="top" title="Remove VM from computer"><span class="glyphicon glyphicon-trash"></span></button>
						</div>
					</div>
				</div>
			</div>

			<div class="disclaimer-footer">
				<a href="#" data-toggle="modal" data-target="#modal-boinc" id="a-boinc">BOINC</a> | 
				<a href="#" data-toggle="modal" data-target="#modal-disclaimer">About</a>
			</div>

			<div class="social-footer">
				<span class="st_sharethis_large" displayText="ShareThis"></span>
				<span class="st_googleplus_large" displayText="Google +"></span>
				<span class="st_facebook_large" displayText="Facebook"></span>
				<span class="st_twitter_large" displayText="Tweet"></span>
				<span class="st_email_large" displayText="Email"></span>
			</div>

			<div id="modal-disclaimer" class="modal fade">
			  <div class="modal-dialog">
				<div class="modal-content">
				  <div class="modal-header">
					<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
					<h4 class="modal-title">Disclaimer &amp; Credits</h4>
				  </div>
				  <div class="modal-body">
					<p class="text-center">
						<img src="style/img/logo/cern.jpg" height="64" alt="CERN Logo" />&nbsp;
						<img src="style/img/logo/citizen_cyberlab.jpg" height="64" alt="Citizen Cyberlab" />&nbsp;
						<img src="style/img/logo/fp7.jpg" height="64" alt="Seventh Framework Programe" />&nbsp;
						<img src="style/img/logo/eu.jpg" height="64" alt="European Union" />&nbsp;
						<img src="style/img/logo/ccc.png" height="64" alt="Citizen Cyberscience Center" />
					</p>
					<p>
						The <em>CERN Public Computing Challenge</em> is a project developed by <a target="_blank" href="http://cern.ch">CERN</a>with the support of the EC project <a target="_blank" href="http://citizencyberlab.eu/">Citizen Cyberlab</a>, and the Citizen <a target="_blank" href="http://www.citizencyberscience.net">Cyberscience Centre</a>.
					</p>
					<p>
						Information about resources used in this page:
						<ul>
							<li>Various icons in this webpage are from <a href="http://www.freepik.com" title="Freepik">Freepik</a> and are licensed under <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0">CC BY 3.0</a></li>
							<li>The CernVM WebAPI installs the <a href="https://www.virtualbox.org/wiki">VirtualBox</a> hypervisor which is licensed under GNU General Public License (GPL) version 2</li>
							<li>The CernVM WebAPI installs the <em>Oracle VM VirtualBox Extension Pack</em> only after user's confirmation, which is licensed under <a href="https://www.virtualbox.org/wiki/VirtualBox_PUEL">VirtualBox Personal Use and Evaluation License (PUEL)</a></li> 
						  </ul>
					  </p>
				  </div>
				  <div class="modal-footer">
					<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
				  </div>
				</div><!-- /.modal-content -->
			  </div><!-- /.modal-dialog -->
			</div><!-- /.modal -->

			<div id="modal-boinc" class="modal fade">
			  <div class="modal-dialog">
				<div class="modal-content">
				  <div class="modal-header">
					<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
					<h4 class="modal-title">BOINC Profile</h4>
				  </div>
				  <div class="modal-body">
		  			<p>
		  				If you are coming from Test4Theory and you want to receive <strong>in addition MCPlots stats</strong> for your contribution, please fill-in the following information from your <a href="http://lhcathome2.cern.ch/vLHCathome/login_form.php?next_url=home.php" target="_blank">Test4Theory BOINC</a> profile:
		  			</p>
		  			<form>
	  				  <div class="form-group">
					    <label for="exampleInputEmail1">BOINC User ID:</label>
					    <input type="text" class="form-control" id="boinc-user-id" placeholder="(None)">
					  </div>
	  				  <div class="form-group">
					    <label for="exampleInputEmail1">BOINC Host ID:</label>
					    <input type="text" class="form-control" id="boinc-host-id" placeholder="(None)">
					  </div>
	  				</form>

				  </div>
				  <div class="modal-footer">
					<button type="button" class="btn btn-default" id="btn-boinc-apply">Apply</button>
				  </div>
				</div><!-- /.modal-content -->
			  </div><!-- /.modal-dialog -->
			</div><!-- /.modal -->

		</div>

		<!-- Libraries -->
		<script src="ext/js/jquery-1.11.0.min.js"></script>
		<script src="ext/js/jquery-ui.js"></script>
		<script src="ext/js/bootstrap.min.js"></script>
		<script src="ext/js/jquery.cookie.js"></script>
		<script src="ext/js/dumbq.min.js"></script>
		<script src="ext/js/analytics.min.js"></script>
		<script src="ext/js/creditpiggy.min.js"></script>
		<script src="script/lib/rundial.js"></script>

		<script src="http://cernvm.cern.ch/releases/webapi/js/cvmwebapi-latest.js"></script>
		<script src="script/lib/cvmwebapi-avm.js"></script>

		<!-- Challenge -->
		<script src="script/challenge-common.js"></script>
		<script src="script/challenge-run.js"></script>

		<!-- Google Tag Manager -->
		<noscript><iframe src="//www.googletagmanager.com/ns.html?id=GTM-5JPWNS"
		height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
		<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
		new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
		j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
		'//www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
		})(window,document,'script','dataLayer','GTM-5JPWNS');</script>
		<!-- End Google Tag Manager -->
	
		<!-- ShareThis -->
		<script type="text/javascript">var switchTo5x=true;</script>
		<script type="text/javascript" src="http://w.sharethis.com/button/buttons.js"></script>
		<script type="text/javascript">stLight.options({publisher: "b6ab7194-4d0a-4d5e-b1bf-762e8b833510", doNotHash: false, doNotCopy: true, hashAddressBar: false});</script>
		<!-- End of ShareThis -->

	</body>
</html>
