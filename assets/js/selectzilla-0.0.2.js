
/**---------------------------------------
 Selectzilla v0.0.2
---------------------------------------**/
;(function(window, document, undefined) {
	var private = new Frostforge();
	var _Selectzilla = function(optionArg) {

		this.logPrivates = function() {
			console.log(private);
		};
	}

	/*
	var _Selectzilla = function(optionArg) {
		//this.api = new Frostforge();
		//var private = {};
		//var public = this;

		console.log(this);
		//console.log(private);

		//_Selectzilla.log("This is a test");

	};
	*/
	// Expose to window scope
	window.Selectzilla = _Selectzilla;
})(window, window.document);