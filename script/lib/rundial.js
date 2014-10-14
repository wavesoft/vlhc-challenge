
$.fn.rundial = function(a1,a2) {

	return this.each(function(i, domElm) {
		var elm = $(domElm),
			action = a1 || 'create',
			rundial = elm.data('rundial');

		// Constructor
		if (!rundial || (action == 'create')) {
			var cfg = a1 || {};

			// Setup rundial config
			rundial = {

				// Basic
				'min'				: cfg.min || parseFloat(elm.attr("data-min")) || 0,
				'max'				: cfg.max || parseFloat(elm.attr("data-max")) || 100,
				'width'				: cfg.width || 'auto',
				'height'			: cfg.height || Math.max( elm.height(), 64 ),
				'step'				: cfg.step || parseFloat(elm.attr("data-step")) || 1,
				'value'				: cfg.value || parseFloat(elm.val()) || parseFloat(elm.attr('value')) || cfg.min,

				// Advanced
				'dampValue'			: cfg.dampValue || 10,
				'updateDelay'		: cfg.updateDelay || 30,
				'format'			: cfg.format || function(v) { return String(v); },

				'overflowText'		: cfg.overflowText || '(!)',
				'overflowElmClass'	: cfg.overflowElmClass || 'rundial-warn',
				'overflowClass'		: cfg.overflowClass || 'rundial-overrun',

				'underflowText'		: cfg.underflowText || '(!)',
				'underflowElmClass'	: cfg.underflowElmClass || 'rundial-warn',
				'underflowClass'	: cfg.underflowClass || 'rundial-underrun',

				'adoptClasses'		: (cfg.adoptClasses == undefined) ? true : cfg.adoptClasses,
				'ascending'			: (cfg.ascending == undefined) ? false : cfg.ascending,

				// Private
				'_lastTargetVal'	: 0,
				'_useVal'			: $(elm).is("input"),
				'_input'			: $(elm),
				'_activeTimer'		: 0,

			};

			// Update value on the element
			if (rundial._useVal) {
				rundial._input.val(rundial.value);
			} else {
				rundial._input.attr('value', rundial.value);
			}

			// Create & Next UI components
			var e = $('<div class="rundial"></div>'),
				h = $('<div class="rundial-host"></div>').appendTo(e),
				i = $('<div class="rundial-indicator-bar"></div>').appendTo(h),
				v = [
					$('<div class="rundial-value">-1</div>').appendTo(h),
					$('<div class="rundial-value">0</div>').appendTo(h).css({'font-weight':'bold'}),
					$('<div class="rundial-value">1</div>').appendTo(h)
				];

			// Style input
			if ((rundial.width != 'auto') && (rundial.width)) {
				e.css({	width: rundial.width });
			};
			if ((rundial.height != 'auto') && (rundial.height)) {
				e.css({	height: rundial.height });
			};

			// Check for adopting classes
			if (rundial.adoptClasses) {
				e.attr("class", elm.attr("class"));
				e.addClass("rundial");
			}

			// Update rundial data
			rundial.container = e;
			rundial.host = h;
			rundial.valueElements = v;

			rundial.wrapStep = function(v) {
				if (v > this.max) v = this.max;
				if (v < this.min) v = this.min;
				return Math.round((v-this.min) / this.step) * this.step + this.min;
			}

			rundial.setValue = function(v) {

				var scale_factor = 0.5, /* How hight (in % of parent) is each letter */
					v_curr   = this.wrapStep(v),
					v_before = v_curr - this.step,
					v_after  = v_curr + this.step,
					ofs = ( this.ascending ? (v_curr - v) : (v - v_curr) )/this.step,
					y0 = this.height*(1 - scale_factor)/2,
					y = y0 + ofs*this.height*scale_factor;
				
				// Set positions
				var iTop=0, iBottom=2;
				if (!this.ascending) {
					iTop=2, iBottom=0;
				}

				if (this.ascending) {
					this.valueElements[iTop].css({ 
						top: y - this.height*scale_factor 
					});
					this.valueElements[iBottom].css({ 
						top: y + this.height*scale_factor 
					});
				} else {
					this.valueElements[iTop].css({ 
						top: y + this.height*scale_factor 
					});
					this.valueElements[iBottom].css({ 
						top: y - this.height*scale_factor 
					});
				}
				this.valueElements[1].css({ 
					top: y 
				});

				// Set texts
				if (v_before < this.min) {
					if (v < this.min) {
						this.valueElements[iTop].html( this.underflowText );
						this.valueElements[iTop].addClass( this.underflowElmClass );
					} else {
						this.valueElements[iTop].text("");
						this.valueElements[iTop].removeClass( this.underflowElmClass );
					}
				} else {
					this.valueElements[iTop].text( this.format(v_before) );
					this.valueElements[iTop].removeClass( this.underflowElmClass );
				}
				if (v_after > this.max) {
					if (v > this.max) {
						this.valueElements[iBottom].html( this.overflowText );
						this.valueElements[iBottom].addClass( this.overflowElmClass );
					} else {
						this.valueElements[iBottom].text("");
						this.valueElements[iBottom].removeClass( this.overflowElmClass );
					}
				} else {
					this.valueElements[iBottom].text( this.format(v_after) );
					this.valueElements[iBottom].removeClass( this.overflowElmClass );
				}				
				this.valueElements[1].text( this.format(v_curr) );

				// Set styles
				if (v < this.min) {
					rundial.host.addClass( this.underflowClass );
				} else {
					rundial.host.removeClass( this.underflowClass );
				}
				if (v > this.max) {
					rundial.host.addClass( this.overflowClass );
				} else {
					rundial.host.removeClass( this.overflowClass );
				}

			}
			rundial.tick = function() {
				
				// Find the value we should target
				var targetVal;
				if (this._useVal) {
					targetVal = parseFloat(this._input.val());
				} else {
					targetVal = parseFloat(this._input.attr('value'));
				}

				// Use previous target if found invalid something
				if (isNaN(targetVal)) targetVal = this._lastTargetVal;
				this._lastTargetVal = targetVal;

				// Bounce underflows
				if (targetVal < this.min) {
					targetVal = this.min - ((this.min - targetVal) / (this.max - this.min)) * this.step/2;
					if (targetVal < this.min - this.step/2) targetVal = this.min - this.step/2;
				} 

				// Bounce overflows
				else if (targetVal > this.max) {
					targetVal = this.max + ((targetVal - this.max) / (this.max - this.min)) * this.step/2;
					if (targetVal > this.max + this.step/2) targetVal = this.max + this.step/2;
				}

				// Apply it graduately
				if (Math.abs(targetVal - this.value) > 0.01) {
					this.value += (targetVal - this.value) / this.dampValue;
					this.setValue(this.value);
				} else if (targetVal != this.value) {
					this.value = targetVal;
					this.setValue(this.value);
					// Stop timer
					clearInterval(this._activeTimer);
					this._activeTimer = 0;
				}

			}
			rundial.startTimer = function() {
				var self = this;
				if (this._activeTimer)
					clearInterval(this._activeTimer);

				// Start interval
				this._activeTimer = setInterval(
					function() {  self.tick(); },
					rundial.updateDelay
				);
			}

			// Trigger startTimer on change
			elm.change(function() {
				rundial.startTimer();
			});

			// Set dial value
			rundial.setValue( rundial.value );

			// Store rundial data
			elm.data('rundial', rundial);

			// Replace input
			e.insertBefore(elm);
			elm.hide();
		}

		else if (action == 'value') {

			if (a2 == undefined) {
				
				// Get value
				var targetVal;
				if (rundial._useVal) {
					targetVal = parseFloat(rundial._input.val());
				} else {
					targetVal = parseFloat(rundial._input.attr('value'));
				}
				return targetVal;

			} else {

				// Set value
				if (rundial._useVal) {
					rundial._input.val(a2);
				} else {
					rundial._input.attr('value', a2);
				}
				rundial.startTimer();

			}

		}

	});
};