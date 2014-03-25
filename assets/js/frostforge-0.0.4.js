
/**---------------------------------------
 Frost Forge v0.0.4
---------------------------------------**/
;(function(window, document, undefined) {
	var private = {
		default_options: {
			complete: null,
			e: null,
			obj: null,
			json: null,
			array: null,
			boolean: null,
			string: null,
			index: null,
			special: null
		},
		data: {
			rootElem: 'body',
			rootElemList: [],
			asignedIds: [],
			fixedUpdateTimer: null,
			logCount: 0,
			lastFrameOptions: null,
			fixedUpdateInterval: 1000,
			states: {
				initialized: false,
				error: false
			}
		},
		options: {},
/**---------------------------------------
	Create & Init
---------------------------------------**/
		// Parse plugin create options
		create: function(optionArg) {
			// Parse plugin arguments
			if (optionArg != undefined) {
				for (var key in optionArg) {
					var found = false;
					for (var option in private.data) {
						if (option === key) {
							private.data[option] = optionArg[key];
							found = true;
						}
					}
					for (var option in public.options) {
						if (option === key) {
							private.options[option] = optionArg[key];
							found = true;
						}
					}
					if (!found) {
						private.options[key] = optionArg[key];
					}
				}
			}

			// store elements selected by selector(optionArg.elemSelector)
			this.data.rootElem = document.querySelectorAll(optionArg.rootElem);
			this.data.rootElemList = document.querySelectorAll(optionArg.rootElemList);

			// Create containers used for runtime use

			// Init private part of plugin
			this.init();
		},
		// Initiate the runtime update of the plugin
		init: function() {
			if (!this.data.states.initialized) {
				this.construct();
				// Fixed Update
				var _this = this; // ugly
				this.data.fixedUpdateTimer = setInterval(function() {
					_this.fixedUpdate();
				}, this.data.fixedUpdateInterval);
				this.data.states.initialized = true;
				jQuery(this.data.rootElem).trigger('frostforge.init');
			}
		},
/**---------------------------------------
	Construct
---------------------------------------**/
	construct: function() {
		jQuery(this.data.rootElem).trigger('frostforge.construct');
		for (var i=0; i<this.data.rootElemList.length; i++) {
			var elem = this.data.rootElemList[i];
			//this.log(elem);
			//dispatchEvent // not supported by ie9 and lower
			jQuery(elem).trigger('frostforge.construct', {
				elem: elem
			});
		}
	},
/**---------------------------------------
	Parse option
---------------------------------------**/
	parseOptions: function(option, value) {
		if (option != undefined && value != undefined) {
			if (option == "volume") {
				// Set volume of all videos
				for (var i=0;i<private.data.movies.length;i++) {
					var movie = private.data.movies[i];
					movie.elem[0].volume = value;
				}
			}
			else if (option == "size") {

			}
			else if (option == "crossfade") {

			}
		}
	},
/**---------------------------------------
	Update options values
---------------------------------------**/
	updateOptionValues: function() {
		// Dirty check options
		if (this.data.lastFrameOptions != null) {
			for (var option in public.options) {
				var lastFrameOption = this.data.lastFrameOptions[option];
				// Detect options change between frames
				if (public.options[option] != lastFrameOption) {
					// Options has change in public options
					this.data.parseOptions(option, public.options[option]);
					this.data.lastFrameOptions[option] = public.options[option];
				}
			}
		}
		else {
			// Clone public options to last frame options and parse options
			this.data.lastFrameOptions = {};
			for (var option in public.options) {
				this.data.parseOptions(option, public.options[option]);
				this.data.lastFrameOptions[option] = public.options[option];
			}
		}
	},
/**---------------------------------------
	Fixed update
---------------------------------------**/
		fixedUpdate: function() {
			//private.log("fixedUpdate");
			jQuery(this.data.rootElem).trigger('frostforge.fixedUpdate', {

			});
		},
/**---------------------------------------
	Get Data Object (High performance by direct reference)
---------------------------------------**/
		getObj: function(objId) {
			if (objId != undefined && objId != "") {
				for (var i=0;i<this.data.asignedIds.length;i++) {
					var idObj = this.data.asignedIds[i];
					if (objId === idObj.id) {
						return idObj.data;
					}
				}
			}
		},
/**---------------------------------------
	Log
---------------------------------------**/
		// Console log
		log: function(msg) {
			try {
				if (this.data.logCount > 200) {
					console.clear();
					this.data.logCount = 0;
				}
				console.log(msg);
				this.data.logCount++;
			}
			catch(err) {
				//send error to developer platform
			}
		},
/**---------------------------------------
	Asign Id (Returns the validated and asigned ID)
---------------------------------------**/
		asignId: function(id, dataObj) {
			id = (id === undefined) ? null : id;
			dataObj = (dataObj === undefined) ? null : dataObj;
			var idFree = false,
				count = 0;
			while (!idFree) {
				if (id === null || count > 0) {
					id = this.returnRandomId();
				}
				idFree = this.validateId(id);
				count++;
			}
			this.data.asignedIds.push({
				id: id,
				data: dataObj
			});
			return id.toString();
		},
		returnRandomId: function() {
			var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			var id = "";
			for (var i=0;i<5;i++) {
				id += chars.charAt(Math.floor(Math.random() * chars.length));
			}
			return id;
		},
		validateId: function(id) {
			var found = false;
			for (var i=0;i<this.data.asignedIds.length;i++) {
				var asignedId = this.data.asignedIds[i];
				if (id === asignedId.id) found = true;
				break;
			}
			return !found;
		},
/**---------------------------------------
	Callback
---------------------------------------**/
		callback: function(options) {
			var o = this.merge(this.default_options, options || {});
			//var o = jQuery.extend({}, private.default_options, options || {});
			if (o.complete && typeof(o.complete) === 'function') {
				o.complete();
			}
		},
/**---------------------------------------
	Merge two objects
---------------------------------------**/
		merge: function(obj1, obj2) {
			var obj3 = {};
			for (var attrname in obj1) {
				obj3[attrname] = obj1[attrname];
			}
			for (var attrname in obj2) {
				obj3[attrname] = obj2[attrname];
			}
			return obj3;
		}
	};
/**---------------------------------------
	Public
---------------------------------------**/
	var public = function() {
		// Move private data for external public use
		this.data = private.data;
		this.options = private.options;
		// Merge two objects
		this.merge = function(obj1, obj2) {
			return private.merge(obj1, obj2);
		};
		// Asign Id
		this.asignId = function(id, dataObj) {
			return private.asignId(id, dataObj);
		};
		// Create and construct
		this.create = function(optionArg) {
			private.create(optionArg);
		};
		// Console log with clear limit
		this.log = function(msg) {
			private.log(msg);
		}
	};

	// Expose to window scope
	window.Frostforge = public;

})(window, window.document);

// TO DO
// - Remove all jquery dependencies
// - Use querySelector/querySelectorAll instead
