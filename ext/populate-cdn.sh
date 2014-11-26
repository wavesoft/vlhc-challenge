#!/bin/bash

# Make directories
[ ! -d js ] && mkdir js
[ ! -d css ] && mkdir css
[ ! -d css/img ] && mkdir css/img
[ ! -d fonts ] && mkdir fonts

# Bootstrap
wget -O css/bootstrap.min.css http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css
wget -O js/bootstrap.min.js http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js
wget -O css/images/ui-bg_flat_75_ffffff_40x100.png http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/images/ui-bg_flat_75_ffffff_40x100.png
wget -O css/images/ui-bg_glass_75_e6e6e6_1x400.png http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/images/ui-bg_glass_75_e6e6e6_1x400.png
wget -O css/images/ui-bg_glass_75_dadada_1x400.png http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/images/ui-bg_glass_75_dadada_1x400.png

# jQuery
wget -O js/jquery-1.11.0.min.js http://code.jquery.com/jquery-1.11.0.min.js

# jQuery UI
wget -O css/jquery-ui.css http://code.jquery.com/ui/1.11.1/themes/smoothness/jquery-ui.css
wget -O js/jquery-ui.js http://code.jquery.com/ui/1.11.1/jquery-ui.js

# HTML5 compatibility
wget -O js/html5shiv.min.js http://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js
wget -O js/respond.min.js http://oss.maxcdn.com/respond/1.4.2/respond.min.js

# jQuery Plugin : Cookie
wget -O js/jquery.cookie.js http://cdn.rawgit.com/carhartl/jquery-cookie/master/src/jquery.cookie.js
