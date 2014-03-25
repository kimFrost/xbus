
/**---------------------------------------
 Selectzilla v0.0.4
---------------------------------------**/
;(function(window, document, undefined) {
	var private = new Frostforge();
	var _Selectzilla = function(optionArg) {
		this.data = {

		};
		this.logPrivates = function() {
			private.asignId("sdd22dd");
			console.log(private);
		};



		console.log("create");
		console.log(optionArg);


		// Create plugin data through frostforge
		private.create(optionArg);
		console.log(private);
	}
	// Expose to window scope
	window.Selectzilla = _Selectzilla;
})(window, window.document);