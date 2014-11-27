$(function() {

	/**
	 * Handle '.fullscreen' classes
	 */
	function resize_fullscreen() {
		var h = window.innerHeight;
		if (h<480) h=480;
		$(".fullscreen").css({ 'min-height': h });
	}
	resize_fullscreen();
	$(window).resize(resize_fullscreen);

	/**
	 * Handle '.top-scroll', '.not-top-scroll' classes
	 */
	function update_top_scroll() {
		if ($(document.body).scrollTop() > 0) {
			$(document.body).removeClass("top-scroll");			
			$(document.body).addClass("no-top-scroll");
		} else {
			$(document.body).addClass("top-scroll");
			$(document.body).removeClass("no-top-scroll");
		}
	}
	update_top_scroll();
	$(window).scroll(update_top_scroll);

	/**
	 * Initialize tooltips
	 */
	$(function () {
	  $('[data-toggle="tooltip"]').tooltip()
	});

	/**
	 * Smooth scroll '#' targets
	 */
	$('a[href*=#]:not([href=#])').click(function() {
		if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
			var target = $(this.hash);
			target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
			if (target.length) {
				$('html,body').animate({
					scrollTop: target.offset().top
				}, 1000);
				return false;
			}
		}
	});

});
