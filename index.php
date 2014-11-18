<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>CernVM WebAPI</title>

		<!-- Bootstrap -->
		<link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css">
		<!-- jQuery UI -->
		<link rel="stylesheet" href="//code.jquery.com/ui/1.11.1/themes/smoothness/jquery-ui.css">
		<!-- Stylesheets -->
		<link rel="stylesheet" href="style/css/challenge.css">

		<!-- Rundial -->
		<link rel="stylesheet" href="style/css/rundial.css">

		<!-- HTML5 Shim and Respond.js IE8 support of HTML5 elements and media queries -->
		<!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
		<!--[if lt IE 9]>
		  <script src="//oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
		  <script src="//oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
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
									Log-in to collect credit
								</a>
								<button id="btn-credits" class="btn btn-default btn-sm">
									Show Credits
								</button>								
							</div>
						</div>
						<div class="panel-body">

							<div class="widgets">
								<div class="row">
								  <div class="col-xs-3">
									<h3>Workload</h3>
									<div class="details">How much your virtual CPU is loaded with work.</div>
									<input class="ui-dial" id="inp-cpuload" value="0"></input>
								  </div>
								  <div class="col-xs-3">
									<h3>Event Rate</h3>
									<div class="details">How many events per minute your virtual machine is producing.</div>
									<input class="ui-dial" id="inp-eventrate" value="0"></input>
								  </div>
								  <div class="col-xs-3">
									<h3>Progress</h3>
									<div class="details">What fraction of the current job is completed.</div>
									<input class="ui-dial" id="inp-progress" value="0"></input>
								  </div>
								  <div class="col-xs-3">
									<h3>Ranking</h3>
									<div class="details">Your ranking among the volunteers competing in this challenge.</div>
									<input class="ui-dial" id="inp-ranking" value="0"></input>
								  </div>
								</div>
							</div>
						</div>

						<div class="panel-alert">
							<h1>Challenge Aborted</h1>
							<p>Could not start session: User denied</p>
						</div>

					</div>
					
				</div>
			</div>

			<div id="description-frame" class="frame frame-description">
				<div class="container">
					<div class="well">

						<div class="desc-install">
							<h1>Welcome to the Virtual LHC Challenge</h1>
						</div>

						<div class="desc-intro">
							<br />
							<p>
								
							</p>
							<div class="dynamic-content">
							</div>
						</div>

						<div class="desc-starting">
							<h1>Your virtual accelerator is initializing <img src="style/img/vmspinner.gif" /> </h1>
							<div class="dynamic-content">
							</div>
						</div>

						<div class="desc-recovery">
							<h1>Chill... bad things happen</h1>
							<p>
								It looks that something went wrong while trying to prepare your computer for the <em>Virtual LHC Challenge</em>.
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
								If nothing of the above works for you, you can check for a solution in the <a href="http://lhcathome2.cern.ch/vLHCathome/forum_help_desk.php" target="_blank">LHC@Home BOINC Forum</a>.
							</p>
						</div>

						<div class="desc-idle">
							<br />
							<p><em>(We are now Idle. Here will be a teaser showing various facts about CERN and LHC)</em></p>
						</div>

						<div class="desc-waitjob">
							<br />
							<p><em>(We are waiting for a task. Here will be a more proper interface.)</em></p>
						</div>
						<div class="desc-live">
							<br />
							<p><em>(We are now live. Here will be a proper description regarding the kind of the simulation you are currently working on. For now, some debug details are shown below)</em></p>
							<pre id="live-debug">
							</pre>
						</div>


					</div>
				</div>
			</div>

			<div class="button-footer">
				<div class="container">
					<div class="text-center">
						<button class="btn btn-primary btn-lg-w btn-lg" id="btn-power">Start</button>
						<a class="btn btn-default btn-lg" id="btn-status"><span class="glyphicon glyphicon-cog"></span></a>
					</div>
				</div>
			</div>

			<div class="disclaimer-footer">
				<a href="#" data-toggle="modal" data-target="#modal-disclaimer">Disclaimer &amp; Credits</a>
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
						<img src="style/img/logo/cern.jpg" alt="CERN Logo" />&nbsp;
						<img src="style/img/logo/citizen_cyberlab.jpg" alt="Citizen Cyberlab" />&nbsp;
						<img src="style/img/logo/fp7.jpg" alt="Seventh Framework Programe" />&nbsp;
						<img src="style/img/logo/eu.jpg" alt="European Union" />
					</p>
					<p>The <em>Virtual LHC Challenge</em> is a project developed by <a href="http://cern.ch">CERN</a> with the partnership of the <a href="http://citizencyberlab.eu/">Citizen Cyberlab</a>. The project is funded by the <a href="http://ec.europa.eu/research/fp7/index_en.cfm">Seventh Framework Programme</a> of the European Eunion.</p>
					<p>
						Credits about resources used in this page:
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

			<div id="modal-credits" class="modal fade">
			  <div class="modal-dialog">
				<div class="modal-content">
				  <div class="modal-header">
					<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
					<h4 class="modal-title">User Credits</h4>
				  </div>
				  <div class="modal-body">

		  			<p>Log-in with one of your prefered social account and start collecting credits! The first 50 users with the biggest credit will participate on the preliminary beta of the upcoming <em>Virtual Atom Smasher</em> game!</p>
				  	<div class="row">
				  		<div class="col-sm-6" id="credits">
				  			<div class="banner">
				  				<div class="banner-image" style=""></div>
				  				<div class="banner-leaves">
				  				</div>
				  			</div>
				  		</div>
				  		<div class="col-sm-6">
							<p><button class="btn btn-block btn-primary"><img class="pull-left" src="style/img/icons/social-fb.png" /> Log-in with Facebook</button></p>
							<p><button class="btn btn-block btn-danger"><img class="pull-left" src="style/img/icons/social-g.png" /> Log-in with Google+</button></p>
							<p><button class="btn btn-block btn-info"><img class="pull-left" src="style/img/icons/social-twitter.png" /> Log-in with Twitter</button></p>
							<p><button class="btn btn-block btn-success"><img class="pull-left" src="style/img/icons/social-boinc.png" /> Log-in with BOINC</button></p>
				  		</div>
				  	</div>

				  </div>
				  <div class="modal-footer">
					<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
				  </div>
				</div><!-- /.modal-content -->
			  </div><!-- /.modal-dialog -->
			</div><!-- /.modal -->

		</div>

		<!-- Libraries -->
		<script src="//code.jquery.com/jquery-1.11.0.min.js"></script>
		<script src="//code.jquery.com/ui/1.11.1/jquery-ui.js"></script>
		<script src="//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js"></script>
		<script src="//cernvm.cern.ch/releases/webapi/js/cvmwebapi-2.0.9.js"></script>
		<script src="//cdn.rawgit.com/carhartl/jquery-cookie/master/src/jquery.cookie.js"></script>
		<script src="script/lib/rundial.js"></script>
		<!-- Challenge -->
		<script src="script/challenge-common.js"></script>
		<script src="script/challenge-run.js"></script>

	</body>
</html>
