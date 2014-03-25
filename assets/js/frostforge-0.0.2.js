
/**---------------------------------------
 Frost Forge v0.0.2
---------------------------------------**/
;(function(window, document, undefined) {
	var private = {
		privateFunc: function() {
			console.log("privateFunc");
		}
	};
	var public = function() {
		this.func = function() {
			console.log("func");

		};
	};

	// Expose to window scope
	window.Frostforge = public;

})(window, window.document);

// TO DO
// - Remove all jquery dependencies
// - Use querySelector/querySelectorAll instead
