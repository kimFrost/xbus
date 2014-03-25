window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame	||
		window.webkitRequestAnimationFrame	||
		window.mozRequestAnimationFrame		||
		window.oRequestAnimationFrame		||
		window.msRequestAnimationFrame 		||
		function(/* function */ callback, /* DOMElement */ element){
			window.setTimeout(callback, 1000 / 60);
	};
})();
/**---------------------------------------
	TimeString v0.0.21
---------------------------------------**/
;(function($, window, document, requestAnimFrame, undefined) {
	var _Timestring = function(optionArg) {
		var private = {};
		var public = this;
		private.default_options = {
			complete: null,
			e: null,
			obj: null,
			json: null,
			array: null,
			boolean: null,
			string: null,
			index: null,
			special: null
		};
		public.options = {
			crossfade: false,
			volume: 1.0,
			fixedUpdateInterval: 1000,
			responsive: false,
			checkers: {
				movie: {
					use: true,
					attrSelector: "data-timestring-movie"
				},
				scene: {
					use: false,
					attrSelector: "data-timestring-scene"
				},
				group: {
					use: true,
					attrSelector: "data-timestring-group"
				}
			},
			drawingType: {
				canvas: true,
				video: false,
				flash: false
			},
			size: {
				width: 960,
				height: 540
			}
		};
		private.data = {
			fps: 0,
			rootElem: null,
			fallBackPlayer: null,
			fallBackPlayerContainer: null,
			videoContainer: null,
			bufferContainer: null,
			sceneContainer: null,
			renderView: null,
			renderViewCtx: null,
			scenes: [],
			movies: [],
			states: {
				playing: false,
				paused: false,
				error: false
			}
		};
		private.internal = {
			asignedIds: [],
			fixedUpdateTimer: null,
			triggerQueue: [],
			logCount: 0,
			userAgent: "",
			devices: {
				ios: false,
				android: false,
				ie8: false
			},
			support: {
				canvasVideoDrawing: false,
				html5video: false
			},
			lastFrameOptions: null,
			libs: {
				mediaElementPlayer: null
			},
			states: {
				ready: false,
				initialized: false,
				error: false
			}
	};
/**---------------------------------------
	Create & Init
---------------------------------------**/
		// Parse plugin create options
		private.create = function() {

			//if (private.data.rootElem === undefined || private.data.rootElem === null || private.data.rootElem === "") {
				//return false;
			//}

			// Parse plugin arguments
			if (optionArg != undefined) {
				for (var key in optionArg) {
					for (var option in private.data) {
						if (option === key) {
							private.data[option] = optionArg[key];
						}
					}
					for (var option in public.options) {
						if (option === key) {
							public.options[option] = optionArg[key];
						}
					}
				}
			}

			// Detech User Agent
			if (navigator.appVersion.indexOf("MSIE 8") != -1) {
				private.internal.devices.ie8 = true;
				private.data.rootElem.addClass("spokesperson--ie8");
			}

			if (private.data.rootElem === null || private.data.rootElem.length < 1) {
				return false;
			}

			//private.internal.devices.ie8 = true; // FINDME

			// Create containers for movies and canvases
			private.data.rootElem.addClass('timestring');
			//private.data.rootElem.append('<div id="fps"></div>');
			private.data.videoContainer = $('<div class="timestring__videos"></div>').appendTo(private.data.rootElem);
			private.data.bufferContainer = $('<div class="timestring__buffers"></div>').appendTo(private.data.rootElem);
			private.data.sceneContainer = $('<div class="timestring__scenes"></div>').appendTo(private.data.rootElem);


			private.data.renderView = $('<canvas width="'+public.options.size.width+'" height="'+public.options.size.height+'" class="timestring-view"></canvas>').appendTo(private.data.rootElem);
			if (!private.internal.devices.ie8) {
				private.data.renderViewCtx = private.data.renderView[0].getContext('2d');
				private.init();
			}
			else {
				// construct swf player and get reference to it.
				var fallbackContainerId = private.data.rootElem.attr('id') + "fallbackPlayer";
				private.data.fallBackPlayerContainer = $('<div class="timestring__fallbackContainer"></div>').appendTo(private.data.rootElem);
				$('<div id='+fallbackContainerId+'></div>').appendTo(private.data.fallBackPlayerContainer);

				// Get reference
				private.data.fallBackPlayer = $('#'+fallbackContainerId).jPlayer({
					size: {
						width: 960,
						height: 540
					},
					volume: public.options.volume,
					swfPath: "scripts/",
					ready: function() {
						private.init();
					},
					solution: "flash",
					supplied: "m4v"
				});
			}
		};
		// Initiate part of the plugin
		private.init = function() {

			public.resize();
			$(window).on('resize',function() {
				// use smart resize instead
				// If responsive only
				public.resize();
			});
			setInterval(function() {
				$('#fps').html('fps: '+private.data.fps);
				private.data.fps = 0;
			},1000);

			private.internal.states.ready = true;

			//private.kickIt();
		};
		// Initiate the runtime update of the plugin
		public.init = function() {

			if (!private.internal.states.ready) {
				setTimeout(function() {
					public.init();
				},500);
				return false;
			}

			if (private.data.rootElem === null || private.data.rootElem.length < 1) {
				return false;
			}

			if (!private.internal.states.initialized) {
				private.construct();

				if (private.internal.devices.ie8 || !public.options.drawingType.canvas) {
					private.data.bufferContainer.addClass("is-hidden");
				}

				if (!public.options.drawingType.video) {
					private.data.videoContainer.addClass("is-hidden");
				}

				private.setupBindings();
				public.update();

				// Fixed Update
				private.internal.fixedUpdateTimer = setInterval(function() {
					private.fixedUpdate();
				}, public.options.fixedUpdateInterval);
				// Setup trigger event listeners
				//private.setupTriggerEvents();

				private.internal.states.initialized = true;
				public.trigger("__init");
			}
		};
/**---------------------------------------
	Get Swf reference
---------------------------------------**/
		private.getSwfReference = function(swfID) {
			var reference = null;
			if(navigator.appName.indexOf("Microsoft") != -1){
				reference = window[swfID];
			}else{
				reference = document[swfID];
			}
			return reference;
		};
/**---------------------------------------
	Setup Bindings
---------------------------------------**/
		private.setupBindings = function() {
			$('[data-timestring-click]').each(function() {
				var $this = $(this);
				$this.on('click touchend', function() {
					var target = $(this).attr('data-timestring-click');
					var movie = private.getObj(target);
					if (movie != undefined) {
						movie.goto(0);
						movie.play();
					}
				});
			});
		};
/**---------------------------------------
 	Construct
 ---------------------------------------**/
		private.construct = function() {

			if (!private.internal.devices.ie8) {
				// Construct scenes
				for (var i=0;i<private.data.scenes.length;i++) {
					var scene = private.data.scenes[i];

					// buffer canvas for movies to be drawn onto;
					var sceneHtml = '<canvas id="'+scene.id+'" width="'+public.options.size.width+'" height="'+public.options.size.height+'">';
					sceneHtml += '</canvas>';
					scene.elem = $(sceneHtml).appendTo(private.data.sceneContainer);
					scene.ctx = scene.elem[0].getContext('2d');

					// Store movies relation in data list
					for (var m=0;m<private.data.movies.length;m++) {
						var movie = private.data.movies[m];
						if (movie.scene === scene.id)  {
							scene.movies.push(movie);
						}
					}
				}

				// Construct movies
				for (var i=0;i<private.data.movies.length;i++) {
					var movie = private.data.movies[i];

					// video tag to render native movies
					//var movieHtml = '<video id="'+movie.id+'" poster="" controls width="'+public.options.size.width+'" height="'+public.options.size.height+'" preload="none">';
					var movieHtml = '<video id="'+movie.id+'" poster="" width="'+public.options.size.width+'" height="'+public.options.size.height+'" preload="none">';
						movie.formats.forEach(function(format) {
							movieHtml += '<source src="'+format.path+'" type="'+format.type+'" />';
						});
					movieHtml += '</video>';
					movie.elem = $(movieHtml).appendTo(private.data.videoContainer);


					var movieBufferHtml = '<canvas id="buffer'+movie.id+'" width="'+public.options.size.width+'" height="'+public.options.size.height+'"></canvas>';
					movie.buffer.elem = $(movieBufferHtml).appendTo(private.data.bufferContainer);
					movie.buffer.ctx = movie.buffer.elem[0].getContext('2d');


					// Bind data object to dom elem
					movie.elem.data("timestring",movie);

					// Bind current time
					movie.elem.on("timeupdate", function(event) {
						var dataObj =  $(this).data("timestring");
						dataObj.time.current = this.currentTime;
						dataObj.time.currentLastUpdated = (Date.now || new Date().getTime)();
					});

					// Bind pause
					movie.elem.on("pause", function(event) {
						var dataObj =  $(this).data("timestring");
						dataObj.elem.removeClass("is-playing");
					});

					// Bind play
					movie.elem.on("play", function(event) {
						var dataObj =  $(this).data("timestring");
						dataObj.states.playing = true;
						dataObj.states.draw = true;
						dataObj.elem.addClass("is-playing");
					});
					movie.elem.on("playing", function(event) {
						var dataObj =  $(this).data("timestring");
						if (!dataObj.states.playing) {
							dataObj.states.playing = true;
							dataObj.states.draw = true;
							dataObj.elem.addClass("is-playing");
						}
					});

					// Bind ended
					movie.elem.on("ended", function(event) {
						var dataObj =  $(this).data("timestring");
						dataObj.pause();
						dataObj.states.draw = false;
						dataObj.states.playing = false;
						dataObj.elem.removeClass("is-playing");
						//public.trigger("__ended", $(this).data('timestring').id);
						public.trigger("__ended", dataObj.id);
					});

					// Bind movie length
					movie.elem.on("loadedmetadata", function(event) {
						var dataObj =  $(this).data("timestring");
						dataObj.time.length = this.duration;
						dataObj.states.metaLoaded = true;
					});

					movie.elem.on("ratechange", function(event) {
						var dataObj =  $(this).data("timestring");
						dataObj.time.playbackRate = this.playbackRate;
					});

					movie.temp = null;

					movie.elem.on("seeking", function(event) {
						var dataObj =  $(this).data("timestring");
						dataObj.states.seeking = true;
						dataObj.temp = event.timeStamp;

					});
					movie.elem.on("seeked", function(event) {
						var dataObj =  $(this).data("timestring");
						dataObj.states.seeking = false;
					});
				}
			}
			else if (private.internal.devices.ie8) {
				// Construct scenes
				for (var i=0;i<private.data.scenes.length;i++) {
					var scene = private.data.scenes[i];

					// Store movies relation in data list
					for (var m=0;m<private.data.movies.length;m++) {
						var movie = private.data.movies[m];
						if (movie.scene === scene.id)  {
							scene.movies.push(movie);
						}
					}
				}

				// Bind current time
				private.data.fallBackPlayer.on($.jPlayer.event.timeupdate, function(event) {
					var movieId = event.jPlayer.status.media.id;
					var dataObj = private.getObj(movieId);
					dataObj.time.current = event.jPlayer.status.currentTime;
					dataObj.time.currentLastUpdated = (Date.now || new Date().getTime)();
				});

				// Bind ended
				private.data.fallBackPlayer.on($.jPlayer.event.ended, function(event) {
					var movieId = event.jPlayer.status.media.id;
					var dataObj = private.getObj(movieId);
					dataObj.states.draw = false;
					dataObj.states.playing = false;
					public.trigger("__ended", movieId);
				});

				// Bind pause
				private.data.fallBackPlayer.on($.jPlayer.event.pause, function(event) {
					var movieId = event.jPlayer.status.media.id;
					var dataObj = private.getObj(movieId);
				});

				// Bind play
				private.data.fallBackPlayer.on($.jPlayer.event.play, function(event) {
					var movieId = event.jPlayer.status.media.id;
					var dataObj = private.getObj(movieId);
					dataObj.states.playing = true;
				});

				// Bind movie length
				private.data.fallBackPlayer.on($.jPlayer.event.timeupdate, function(event) {
					var movieId = event.jPlayer.status.media.id;
					var dataObj = private.getObj(movieId);
					dataObj.time.length = event.jPlayer.status.duration;
					dataObj.states.metaLoaded = true;
				});

				private.data.fallBackPlayer.on($.jPlayer.event.durationchange, function(event) {
					var movieId = event.jPlayer.status.media.id;
					var dataObj = private.getObj(movieId);
					dataObj.time.length = event.jPlayer.status.duration;
				});

			}
		};
/**---------------------------------------
 	Add Scene
 ---------------------------------------**/
		public.addScene = function(arg) {
			arg = (arg === undefined) ? {} : arg;
			var id = null;
			if (arg.id != undefined) id = arg.id;

			var triggers = [];
			if (arg.triggers != undefined && arg.triggers.length > 0) triggers = arg.triggers;

			var scene = {
				movies: [],
				elem: null,
				ctx: null,
				triggers: triggers,
				time: {
					length: -1,
					current: -1
				},
				effects: {
					alpha: 1.0
				},
				states: {
					draw: false,
					sleep: false
				}
			};
			scene.id = private.asignId(id, scene);

			private.data.scenes.push(scene);
		};
/**---------------------------------------
 	Add Movie
 ---------------------------------------**/
		public.addMovie = function(arg) {
			arg = (arg === undefined) ? {} : arg;
			var id = null;
			if (arg.id != undefined) id = arg.id;

			var triggers = [];
			if (arg.triggers != undefined && arg.triggers.length > 0) triggers = arg.triggers;


			var formats = [];
			if (arg.ogg != undefined) {
				formats.push({
					type: "video/ogg",
					path: arg.ogg
				});
			}
			if (arg.webm != undefined) {
				formats.push({
					type: "video/webm",
					path: arg.webm
				});
			}
			if (arg.mp4 != undefined) {
				formats.push({
					type: "video/mp4",
					path: arg.mp4
				});
			}

			var movie = {
				formats: formats,
				scene: arg.scene,
				elem: null,
				buffer: {
					elem: null,
					ctx: null
				},
				size: {
					width: public.options.size.width,
					height: public.options.size.height
				},
				triggers: triggers,
				time: {
					current: -1,
					playbackRate: 0,
					length: -1,
					currentLastUpdated: -1
				},
				effects: {
					alpha: 1.00
				},
				states: {
					draw: false,
					playing: false,
					sleep: false,
					seeking: false,
					metaLoaded: false
				}
			};
			movie.id = private.asignId(id, movie);

			// Asign trigger target to self id, if no target is set
			if (!private.internal.devices.ie8) {
				movie.triggers.forEach(function(trigger) {
					if (trigger.target == undefined) {
						trigger.target = movie.id;
					}
				});
			}
			else {
				//Ie 8 doesnt support forEach
				for (var i=0;i<movie.triggers.length;i++) {
					var trigger = movie.triggers[i];
					if (trigger.target == undefined) {
						trigger.target = movie.id;
					}
				}
			}

			// Movie methods
			movie.play = function() {
				this.states.draw = true;
				this.states.playing = true;

				// Pause all other movies
				for (var i=0;i<private.data.movies.length;i++) {
					var _movie = private.data.movies[i];
					if (_movie.id != this.id && _movie.states.playing) {
						_movie.pause();
					}
				}
				if (!private.internal.devices.ie8) {
					this.elem[0].play();
					this.time.playbackRate = this.elem[0].playbackRate;
				}
				else {
					this.time.playbackRate = 1;
					var sources = [];
					for (var i=0;i<this.formats.length;i++) {
						var format = this.formats[i];
						sources.push({
							src: format.path,
							type: format.type
						});
						if (format.type == "video/mp4") {
							private.data.fallBackPlayer.jPlayer("setMedia", {
								m4v: format.path,
								id: this.id
							}).jPlayer("play");


						}
					}
				}
				var sceneObj = private.getObj(this.scene);
				sceneObj.states.draw = true;
			};
			movie.pause = function() {
				this.states.draw = false;
				this.states.playing = false;
				if (!private.internal.devices.ie8) {
					this.elem[0].pause();
				}
				else {
					private.data.fallBackPlayer.jPlayer("pause");
				}
				var sceneObj = private.getObj(this.scene);
				sceneObj.states.draw = false;
			};
			movie.goto = function(time) {
				if (this.states.metaLoaded) {
					// Make sceenshot for buffer
					if (this.states.draw && !this.states.sleep) {
						private.drawBuffer(this.id);
					}

					// Set time in movie
					if (!private.internal.devices.ie8) {
						this.elem[0].currentTime = time;
					}
					else {
						private.data.fallBackPlayer.jPlayer("play", time);
					}
				}
			};

			private.data.movies.push(movie);
		};
/**---------------------------------------
	Add Trigger
---------------------------------------**/
		public.addTrigger = function(arg) {
			arg = (arg === undefined) ? {} : arg;
			var id = null;
			if (arg.id != undefined) id = arg.id;

			var trigger = {
				id: private.asignId(id)
			};

			private.data.triggers.push(trigger);
		};

/**---------------------------------------
	Play
---------------------------------------**/
		public.play = function(id, fromStart) {
			id = (id === undefined) ? null : id;
			fromStart = (fromStart === undefined) ? false : id;
			for (var i=0;i<private.data.movies.length;i++) {
				var movie = private.data.movies[i];
				if (movie.id === id) {
					if (movie.states.playing) {
						if (fromStart) movie.goto(0.1);
					}
					else {
						movie.play();
						if (fromStart) movie.goto(0.1);
					}
					break;
				}
			}
		};
/**---------------------------------------
	Pause
---------------------------------------**/
		public.pause = function(id) {
			id = (id === undefined) ? null : id;
			if (id != null) {
				for (var i=0;i<private.data.movies.length;i++) {
					var movie = private.data.movies[i];
					if (movie.id === id) {
						movie.pause();
						break;
					}
				}
			}
			else {
				// Find all movies playing and pause them
				for (var i=0;i<private.data.movies.length;i++) {
					var movie = private.data.movies[i];
					if (movie.states.playing) {
						movie.pause();
					}
				}
			}
		};
/**---------------------------------------
	Resize
---------------------------------------**/
		public.resize = function() {
			//windowWidth = $(window).width();
			//windowHeight = $(window).height();
			//canvasWidth = canvas.width;
			//canvasHeight = canvas.height;
			//ctx = canvas.getContext('2d');
			//this.draw();
		};
/**---------------------------------------
	Parse option
---------------------------------------**/
		private.parseOptions = function(option, value) {
			if (option != undefined && value != undefined) {
				if (!private.internal.devices.ie8) {
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
				else {
					// Ie 8 option parsing

				}
			}
		};
/**---------------------------------------
	Update options values
---------------------------------------**/
		public.updateOptionValues = function() {
			// Dirty check options
			if (private.internal.lastFrameOptions != null) {
				for (var option in public.options) {
					var lastFrameOption = private.internal.lastFrameOptions[option];
					// Detect options change between frames
					if (public.options[option] != lastFrameOption) {
						// Options has change in public options
						private.parseOptions(option, public.options[option]);
						private.internal.lastFrameOptions[option] = public.options[option];
					}
				}
			}
			else {
				// Clone public options to last frame options and parse options
				private.internal.lastFrameOptions = {};
				for (var option in public.options) {
					private.parseOptions(option, public.options[option]);
					private.internal.lastFrameOptions[option] = public.options[option];
				}
			}
		};
/**---------------------------------------
	 Update
---------------------------------------**/
		public.update = function() {
			requestAnimFrame(public.update);
			public.updateOptionValues();
			//public.drawScenes();
			public.draw();
		};
/**---------------------------------------
	 Fixed update
---------------------------------------**/
		private.fixedUpdate = function() {
			private.checkTriggers();
			private.checkClasses();
		};
/**---------------------------------------
	 Checker Classes
---------------------------------------**/
		private.checkClasses = function() {
			if (public.options.checkers.movie.use) {
				//public.checkers.movie.attrSelector
				// Check movie specific bindings
				private.data.rootElem.find('['+public.options.checkers.movie.attrSelector+']').each(function(){
					var $this = $(this);
					var value = $this.attr(public.options.checkers.movie.attrSelector);

					var movie = private.getObj(value);
					if  (movie != undefined) {
						if (movie.states.draw) {
							$this.addClass('is-playing');
						}
						else {
							$this.removeClass('is-playing');
						}
					}
				});
			}
			// Check scene specific bindings
			if (public.options.checkers.scene.use) {
				private.data.rootElem.find('['+public.options.checkers.scene.attrSelector+']').each(function(){

				});
			}
			// Check group specific bindings
			if (public.options.checkers.group.use) {
				//private.data.rootElem.find('['+public.options.checkers.group.attrSelector+']').each(function(){

				//});
			}
		};
/**---------------------------------------
	Toggle group classes // The logic isn't quite right
---------------------------------------**/
		public.showGroup = function(groupName) {
			if (public.options.checkers.group.use) {
				private.data.rootElem.find('['+public.options.checkers.group.attrSelector+']').each(function(){
					var $this = $(this);
					var value = $this.attr(public.options.checkers.group.attrSelector);
					if (value == groupName) {
						$this.addClass("is-active");
					}
				});
			}
		};
		public.hideGroup = function(groupName) {
			groupName = (groupName === undefined) ? null : groupName;
			if (public.options.checkers.group.use) {
				private.data.rootElem.find('['+public.options.checkers.group.attrSelector+']').each(function(){
					var $this = $(this);
					if (groupName != null) {
						var value = $this.attr(public.options.checkers.group.attrSelector);
						if (value == groupName) {
							$this.removeClass("is-active");
						}
					}
					else {
						$this.removeClass("is-active");
					}
				});
			}
		};
/**---------------------------------------
	Trigger a trigger event
---------------------------------------**/
		public.trigger = function(trigger, keyId) {
			keyId = (keyId === undefined) ? null : keyId;

			private.internal.triggerQueue.push({
				name: trigger,
				keyId: keyId,
				triggered: false,
				timesMovieLooped: 0,
				timesSceneLooped: 0
			});
		};
/**---------------------------------------
	Parse Trigger
---------------------------------------**/
		private.parseTrigger = function(trigger, data) {
			var triggerApi = {
				target: null,
				self: data,
				showGroup: function(groupName) {
					public.showGroup(groupName);
				},
				hideGroup: function(groupName) {
					public.hideGroup(groupName);
				}
			}

			// Validate trigger time

			// Has action and target
			if (trigger.action != undefined && trigger.target != undefined) {
				triggerApi.target = private.getObj(trigger.target);
				if ($.isFunction(trigger.action)) {
					trigger.action(triggerApi);
				}
				else {

				}
			}
			// Only has action
			else if (trigger.action != undefined) {
				if ($.isFunction(trigger.action)) {
					trigger.action(triggerApi);
				}
				else {

				}
			}
			// Only has target
			else if (trigger.target != undefined) {
				triggerApi.target = private.getObj(trigger.target);

			}
		};
/**---------------------------------------
	 Check Triggers (trigger listeners)
---------------------------------------**/
		private.checkTriggers = function() {

			for (var i=0;i<private.data.scenes.length;i++) {
				var scene = private.data.scenes[i];
				if (!scene.states.sleep) {
					if (scene.triggers.length > 0) {
						for (var m=0;m<scene.triggers.length;m++) {
							var trigger = scene.triggers[m];
							for (var mm=0;mm<private.internal.triggerQueue.length;mm++) {
								var queuedTrigger = private.internal.triggerQueue[mm];
								if (queuedTrigger.name === trigger.trigger) {
									if (queuedTrigger.keyId != null) {
										if (queuedTrigger.keyId === scene.id) {
											// Trigger the trigger
											private.parseTrigger(trigger, scene);
											// Remove trigger from queue at end
											queuedTrigger.triggered = true;
										}
									}
									else {
										// Trigger the trigger
										private.parseTrigger(trigger, scene);
										// Remove trigger from queue at end
										queuedTrigger.triggered = true;
									}
									queuedTrigger.timesSceneLooped++;
								}
								else if (typeof queuedTrigger.name == "number") {

								}
							}
						}
					}
					for (var ii=0;ii<scene.movies.length;ii++) {
						var movie = scene.movies[ii];
						var timeSinceMovieTimeUpdated = (Date.now || new Date().getTime)() - movie.time.currentLastUpdated;
						if (!movie.states.sleep) {
							if (movie.triggers.length > 0) {
								for (var m=0;m<movie.triggers.length;m++) {
									var trigger = movie.triggers[m];
									var timeSinceMovieTriggerLastChecked = (Date.now || new Date().getTime)() - trigger.triggerCheckedAt;
									for (var mm=0;mm<private.internal.triggerQueue.length;mm++) {
										var queuedTrigger = private.internal.triggerQueue[mm];
										if (queuedTrigger.name === trigger.trigger) {
											if (queuedTrigger.keyId != null) {
												if (queuedTrigger.keyId === movie.id) {
													// Trigger the trigger
													private.parseTrigger(trigger, movie);
													// Remove trigger from queue at end
													queuedTrigger.triggered = true;
												}
											}
											else {
												// Trigger the trigger
												private.parseTrigger(trigger, movie);
												private.parseTrigger(trigger, movie);
												// Remove trigger from queue at end
												queuedTrigger.triggered = true;
											}
											queuedTrigger.timesMovieLooped++;
										}
									}
									// Check movie current time if trigger is a number
									if (typeof trigger.trigger == "number" && movie.states.playing == true) {


										var maxDiff = (movie.time.playbackRate * timeSinceMovieTimeUpdated);
										var diff = movie.time.current - trigger.trigger;
										diff = diff * 1000; // Convert from sec to millisec
										var triggerType = (trigger.type === undefined) ? "on" : trigger.type;

										if (triggerType === "adjacent") {
											/*
											//Not supported anymore
											if (diff <= maxDiff && diff >= -maxDiff) {
												private.parseTrigger(trigger, movie);
											}
											*/
										}
										else if (triggerType === "on") {
											if (movie.time.playbackRate > 0) {
												//if (diff <= maxDiff && diff <= timeSinceMovieTriggerLastChecked && movie.time.current >= trigger.trigger) {
												if (diff <= timeSinceMovieTriggerLastChecked && movie.time.current >= trigger.trigger) {

													private.parseTrigger(trigger, movie);
												}
											}
											else if (movie.time.playbackRate < 0) {
												if (diff >= maxDiff && diff >= timeSinceMovieTriggerLastChecked && movie.time.current <= trigger.trigger) {
													private.parseTrigger(trigger, movie);
												}
											}
										}
										else if (triggerType === "after") {
											if (movie.time.playbackRate > 0) {
												if (diff >= 0) {
													private.parseTrigger(trigger, movie);
												}
											}
											else if (movie.time.playbackRate < 0) {
												if (diff <= 0) {
													private.parseTrigger(trigger, movie);
												}
											}

										}
									}
									// Movie trigger last checked
									trigger.triggerCheckedAt = (Date.now || new Date().getTime)();
								}
							}
						}
					}
				}
			}
			// Remove triggered triggers
			for (var i=0;i<private.internal.triggerQueue.length;i++) {
				var trigger = private.internal.triggerQueue[i];
				if (trigger.triggered) {
					private.internal.triggerQueue.splice(i,1);
				}
				else if (trigger.timesMovieLooped > 0) {
					private.internal.triggerQueue.splice(i,1);
				}
			}
		};
/**---------------------------------------
	 Draw scene
---------------------------------------**/
		public.drawScenes = function() {
			for (var i=0;i<private.data.scenes.length;i++) {
				var scene = private.data.scenes[i];
				if (!scene.states.sleep) {
					for (var m=0;m<private.data.movies.length;m++) {
						var movie = private.data.movies[m];
						if (movie.scene === scene.id && movie.states.draw) {
							// Render movie to scene
							scene.ctx.drawImage(movie.elem[0], 0, 0, movie.elem.width(), movie.elem.height());
						}
					}
				}
			}
		};
/**---------------------------------------
	 Draw
---------------------------------------**/
		public.draw = function() {

			if (!private.internal.devices.ie8 && public.options.drawingType.canvas) {
				//private.data.renderViewCtx.clearRect(0, 0, public.options.size.width, public.options.size.height);

				//private.data.renderViewCtx.save();

				//private.data.renderViewCtx.globalAlpha = 1.0;
				//private.data.renderViewCtx.fillStyle = "#dc0f0f";
				//private.data.renderViewCtx.fillRect(0,0, public.options.size.width, public.options.size.height);

				private.data.renderViewCtx.globalAlpha = 1;

				// Draw active scenes to view
				for (var i=0;i<private.data.scenes.length;i++) {
					var scene = private.data.scenes[i];
					if (scene.states.draw) {
						//private.data.renderViewCtx.drawImage(scene.elem[0], 0, 0, public.options.size.width, public.options.size.height);
						for (var m=0;m<private.data.movies.length;m++) {
							var movie = private.data.movies[m];
							if (movie.scene === scene.id && movie.states.draw) {
								// Render movie to view
								private.data.renderViewCtx.globalAlpha = movie.effects.alpha;
								if (movie.states.seeking) {
									private.data.renderViewCtx.drawImage(movie.buffer.elem[0], 0, 0, movie.size.width, movie.size.height);
								}
								else {
									private.data.renderViewCtx.drawImage(movie.elem[0], 0, 0, movie.size.width, movie.size.height);
								}
							}
						}
					}
				}
			}

			private.data.fps++;
		};
		private.drawBuffer = function(id) {
			var obj = private.getObj(id);
			if (obj.buffer != undefined) {
				if (!private.internal.devices.ie8 && public.options.drawingType.canvas) {
					if (obj.buffer.elem != null && obj.buffer.ctx != null && obj.elem != null) {
						obj.buffer.ctx.drawImage(obj.elem[0], 0, 0, obj.size.width, obj.size.height);
					}
				}
			}
		};
/**---------------------------------------
	 Get Data Object (High performance by direct reference)
---------------------------------------**/
		private.getObj = function(objId) {
			if (objId != undefined && objId != "") {
				for (var i=0;i<private.internal.asignedIds.length;i++) {
					var idObj = private.internal.asignedIds[i];
					if (objId === idObj.id) {
						return idObj.data;
					}
				}
			}
		};
/**---------------------------------------
	 Log
---------------------------------------**/
		// Console log
		private.log = function(msg) {
			try {
				if (private.internal.logCount > 200) {
					console.clear();
					private.internal.logCount = 0;
				}
				console.log(msg);
				private.internal.logCount++;
			}
			catch(err) {
				//send error to developer platform
			}
		};
/**---------------------------------------
	 Asign Id
---------------------------------------**/
		private.asignId = function(id, dataObj) {
			id = (id === undefined) ? null : id;
			dataObj = (dataObj === undefined) ? null : dataObj;
			var idFree = false,
				count = 0;
			while (!idFree) {
				if (id === null || count > 0) {
					id = private.returnRandomId();
				}
				idFree = private.validateId(id);
				count++;
			}
			private.internal.asignedIds.push({
				id: id,
				data: dataObj
			});
			return id.toString();
		};
		private.returnRandomId = function() {
			var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			var id = "";
			for (var i=0;i<5;i++) {
				id += chars.charAt(Math.floor(Math.random() * chars.length));
			}
			return id;
		};
		private.validateId = function(id) {
			var found = false;
			for (var i=0;i<private.internal.asignedIds.length;i++) {
				var asignedId = private.internal.asignedIds[i];
				if (id === asignedId.id) found = true;
				break;
			}
			return !found;
		};
/**---------------------------------------
	 Callback
---------------------------------------**/
		private.callback = function(options) {
			var o = jQuery.extend({}, private.default_options, options || {});
			if (o.complete && typeof(o.complete) === 'function') {
				o.complete();
			}
		};

		// Create
		private.create();
	};
	// Expose to window scope
	window.Timestring = _Timestring;
})(jQuery, window, window.document, window.requestAnimFrame);