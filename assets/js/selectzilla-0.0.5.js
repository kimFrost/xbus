
/**---------------------------------------
 Selectzilla v0.0.5
---------------------------------------**/
;(function(window, document, undefined) {
	var private = new Frostforge();
	var _Selectzilla = function(optionArg) {
		this.data = {
			groupSelector: "[data-select-group]",
			valueSelector: "[data-select-value]"
		}
		this.logPrivates = function() {
			private.asignId("sdd22dd");
			console.log(private);
		};

		private.setup = function() {

		}

		//console.log("create");
		//console.log(optionArg);

		// Set frostforge event bindings
		// Init Binding
		jQuery(window).on('frostforge.init', function() {
			//private.log("--> init");
		});
		// Fixed update binding
		jQuery(window).on('frostforge.fixedUpdate', function() {
			//private.log("--> fixedUpdate");
		});
		// Construct binding on window and elems
		jQuery('.recipes__filters').on('frostforge.construct', function(event, data) {
			//private.log("--> constuct");
			//private.log(event);
			//private.log(data);
		});

		// Create plugin data through frostforge
		private.create(optionArg);

		// Merge frostforge data into Selectzilla data
		private.log(private.data);
		private.log(private.options);

		//console.log(private);
	}
	// Expose to window scope
	window.Selectzilla = _Selectzilla;
})(window, window.document);