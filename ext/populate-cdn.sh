#!/bin/bash

# Make directories
[ ! -d js ] && mkdir js
[ ! -d css ] && mkdir css
[ ! -d css/images ] && mkdir css/images
[ ! -d fonts ] && mkdir fonts

# Bootstrap
wget -c -O css/bootstrap.min.css http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css
wget -c -O js/bootstrap.min.js http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js
wget -c -O fonts/glyphicons-halflings-regular.eot http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/fonts/glyphicons-halflings-regular.eot
wget -c -O fonts/glyphicons-halflings-regular.svg http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/fonts/glyphicons-halflings-regular.svg
wget -c -O fonts/glyphicons-halflings-regular.ttf http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/fonts/glyphicons-halflings-regular.ttf
wget -c -O fonts/glyphicons-halflings-regular.woff http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/fonts/glyphicons-halflings-regular.woff

# jQuery
wget -c -O js/jquery-1.11.0.min.js http://code.jquery.com/jquery-1.11.0.min.js

# jQuery UI
wget -c -O css/jquery-ui.css http://code.jquery.com/ui/1.11.1/themes/smoothness/jquery-ui.css
wget -c -O css/images/ui-bg_glass_75_e6e6e6_1x400.png http://code.jquery.com/ui/1.11.1/themes/smoothness/images/ui-bg_glass_75_e6e6e6_1x400.png
wget -c -O css/images/ui-bg_glass_75_dadada_1x400.png http://code.jquery.com/ui/1.11.1/themes/smoothness/images/ui-bg_glass_75_dadada_1x400.png
wget -c -O css/images/ui-bg_glass_65_ffffff_1x400.png http://code.jquery.com/ui/1.11.1/themes/smoothness/images/ui-bg_glass_65_ffffff_1x400.png
wget -c -O css/images/ui-bg_flat_75_ffffff_40x100.png http://code.jquery.com/ui/1.11.1/themes/smoothness/images/ui-bg_flat_75_ffffff_40x100.png
wget -c -O js/jquery-ui.js http://code.jquery.com/ui/1.11.1/jquery-ui.js

# HTML5 compatibility
wget -c -O js/html5shiv.min.js http://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js
wget -c -O js/respond.min.js http://oss.maxcdn.com/respond/1.4.2/respond.min.js

# jQuery Plugin : Cookie
wget -c -O js/jquery.cookie.js http://cdn.rawgit.com/carhartl/jquery-cookie/master/src/jquery.cookie.js

# DumbQ Front-End
wget -c -O js/dumbq.min.js https://raw.githubusercontent.com/wavesoft/dumbq/master/frontend/dumbq.min.js

# Credit Piggy
wget -c -O js/creditpiggy.min.js https://raw.githubusercontent.com/wavesoft/creditpiggy/master/creditpiggy-api/js/creditpiggy.min.js

# CCL-Tracker
wget -c -O js/analytics.min.js https://raw.githubusercontent.com/wavesoft/ccl-tracker/master/analytics.min.js
