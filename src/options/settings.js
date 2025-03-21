var libraryCheckInterval = null;
var oldLibraries = null;

if (typeof browser == "undefined") {
  // `browser` is not defined in Chrome, but Manifest V3 extensions in Chrome
  // also support promises in the `chrome` namespace, like Firefox. To easily
  // test the example without modifications, polyfill "browser" to "chrome".
  globalThis.browser = chrome;
}

// load and display newest settings
function loadLibraries() {
	chrome.storage.sync.get("libraries", function(obj) {
		var libraries = {};
		// initialize settings
		if (!obj || !obj["libraries"]) {
			chrome.storage.sync.set({
				libraries: libraries
			});
		} else {
			libraries = obj["libraries"];
		}

		// keep track if the list of libraries has been changed
		var changed = false;
		if (!oldLibraries || Object.keys(libraries).length != Object.keys(oldLibraries).length) {
			changed = true;
		}

		var keys = [];
		var updated = false;
		// convert library data to objects rather than strings
		for (var libraryName in libraries) {
			if (typeof libraries[libraryName] === "string") {
				var libraryUrl = libraries[libraryName];
				$("#urlText").val(libraryUrl);
				libraries[libraryName] = {
					url: libraryUrl,
					newDesign: true
				};
				updated = true;
			}

			if (!changed && libraries[libraryName].url.localeCompare(oldLibraries[libraryName].url) != 0) {
				changed = true;
			}
			keys.push(libraryName);
		}
		if (updated) {
			chrome.storage.sync.set({ libraries: libraries });
		}
		// don't clear and repopulate the listbox if the setting hasn't been changed
		if (changed) {
			oldLibraries = libraries;

			keys.sort();
			$("#libraryList").empty();
			// get the keys and sort the libraries alphabetically
			for (var key in keys) {
				$("#libraryList").append("<option value='" + keys[key] + "'>" + keys[key] + "</option>");
			}

			// if the list selection was lost, disable the delete button
			if ($("#libraryList :selected").length > 0) {
				$("#deleteButton").prop('disabled', false);
			} else {
				$("#deleteButton").prop('disabled', true);
			}
			// if there are libraries in the list, show the success message
			if (Object.keys(libraries).length > 0) {
				$("#libraryLabel").css("color", "black");
				$("#successText").show();
			}
		}
	});
}

function validateInput() {
	var invalid = false;
	// validate the url
	var library = $("#urlText").val();
	if (library.length > 0) {
		library = library.replace(/^https?:\/\//, '').replace(/overdrive.com.*/, 'overdrive.com').replace(/libraryreserve.com.*/, 'libraryreserve.com');
		var newDesign = !$("#newDesign").prop("checked");
		if (!newDesign && library.indexOf('.overdrive.com') < 1) {
			$("#errorText").css('display', 'inline');
			$("#urlLabel").css("color", "#d00");
			invalid = true;
		} else {
			$("#urlLabel").css("color", "black");
			$("#errorText").hide();
		}
	} else {
		$("#urlLabel").css("color", "#d00");
		invalid = true;
	}
	// validate the name
	if ($("#nameText").val().length == 0) {
		$("#nameLabel").css("color", "#d00");
		invalid = true;
	} else {
		$("#nameLabel").css("color", "black");
	}

	if (invalid) {
		$("#saveButton").prop('disabled', true);
	} else {
		$("label").css("color", "black");
		$("#saveButton").prop('disabled', false);
	}
}

	loadLibraries();
	// disable all buttons
	$("button").prop('disabled', true);
    $("#exportButton").prop('disabled', false);
    $("#importButton").prop('disabled', false);
    // $("#requestPerm").prop('disabled', false);
    $("#showPerm").prop('disabled', false);
	$("#errorText").hide();
	$("#successText").hide();
	// when a library is selected, populate input fields
	$("#libraryList").click(function() {
		var libraryName = $("#libraryList option:selected").text().replace(/[^ -~]+/g, "");
		$("#nameText").val(libraryName);
		$("#urlText").prop('disabled', true);
		$("#urlText").val('loading value...');
		$("#newDesign").prop('checked', false);
		chrome.storage.sync.get("libraries", function(obj) {
			var libraries = obj["libraries"];
			$("#urlText").val(libraries[libraryName].url);
			$("#urlText").prop('disabled', false);
			$("#newDesign").prop('checked', !libraries[libraryName].newDesign);
			validateInput();
		});
	});
    $("#showPerm").click(function() {
        browser.permissions.getAll().then((permissions) => {
            document.getElementById('permBox').innerText = JSON.stringify(permissions);
        });
    });

	chrome.storage.sync.get("showOnPages", function(obj) {
		var showOnPages = obj["showOnPages"];
		if (!showOnPages) {
			showOnPages = {
				descriptionPage: true,
				shelfPage: true,
				listPage: false
			};
			chrome.storage.sync.set({
				showOnPages: showOnPages
			}, null);
		}
		$("input.showRadio").each(function(index, value) {
			if (showOnPages[$(this).val()]) {
				$(this).prop('checked', true);
			} else {
				$(this).prop('checked', false);
			}
		});
	});

	chrome.storage.sync.get("showFormat", function(obj) {
		var showFormat = obj["showFormat"];
		if (!showFormat) {
			showFormat = {
				audioBook: true,
				eBook: true,
				optionalBookTitle: false,
				onlyOneNotFound: false
			};
			chrome.storage.sync.set({
				showFormat: showFormat
			}, null);
		}
		$("input.showFormat").each(function(index, value) {
			if (showFormat[$(this).val()]) {
				$(this).prop('checked', true);
			} else {
				$(this).prop('checked', false);
			}
		});
	});

	chrome.storage.sync.get("debugMode", function(obj) {
		var debugMode = obj["debugMode"];
		if (!debugMode) {
			debugMode = {debug: false};
			chrome.storage.sync.set({
				debugMode: debugMode
			}, null);
		}
		$("input.debugMode").each(function(index, value) {
			if (debugMode[$(this).val()]) {
				$(this).prop('checked', true);
                $(".debug").show();
			} else {
				$(this).prop('checked', false);
                $(".debug").hide();
			}
		});
	});
	// refresh the settings every second for an update,
	//   this is done since the primary way of adding libraries is through another tab
	if (!libraryCheckInterval) {
		var libraryCheckInterval = setInterval(function() {
			loadLibraries();
		}, 1000);
	}

	$("#urlText").on('input', function() {
		validateInput();
	});
	$("#nameText").on('input', function() {
		validateInput();
	});

	// when the list selection is changed
	$("#libraryList").change(function() {
		if ($("#libraryList :selected").length > 0) {
			$("#deleteButton").prop('disabled', false);
		} else {
			$("#deleteButton").prop('disabled', true);
		}
	});

	// when the show settings are changed
	$("input.showRadio").change(function() {
		var showOnPages = {};
		$("input.showRadio").each(function(index, value) {
			showOnPages[$(this).val()] = $(this).is(':checked');
		});
		$("input.showRadio").prop('disabled', true);
		chrome.storage.sync.set({
			showOnPages: showOnPages
		}, function() {
			$("input.showRadio").prop('disabled', false);
		});
	});

	// when the format settings are changed
	$("input.showFormat").change(function() {
		var showFormat = {};
		$("input.showFormat").each(function(index, value) {
			showFormat[$(this).val()] = $(this).is(':checked');
		});
		$("input.showFormat").prop('disabled', true);
		chrome.storage.sync.set({
			showFormat: showFormat
		}, function() {
			$("input.showFormat").prop('disabled', false);
		});
	});
	// when the debug settings are changed
	$("input.debugMode").change(function() {
		var debugMode = {};
		$("input.debugMode").each(function(index, value) {
			debugMode[$(this).val()] = $(this).is(':checked');
		});
		$("input.debugMode").prop('disabled', true);
		chrome.storage.sync.set({
			debugMode: debugMode
		}, function() {
			$("input.debugMode").prop('disabled', false);
		});
	});

	$("#saveButton").click(function() {
		var libraryName = $("#nameText").val().replace(/[^ -~]+/g, "");
		chrome.storage.sync.get("libraries", function(obj) {
			var libraries = obj["libraries"];
			let libraryUrl = $("#urlText").val().replace(/^https?:\/\//, '').replace(/overdrive.com.*/, 'overdrive.com').replace(/libraryreserve.com.*/, 'libraryreserve.com');
			let newDesign = !$("#newDesign").prop("checked");
			libraries[libraryName] = {
				url: libraryUrl,
				newDesign: newDesign
			};
			$("#urlText").val(libraryUrl);
			chrome.storage.sync.set({
				libraries: libraries
			}, function() {
				// when save is complete, refresh the list
				loadLibraries();
			});
		});
	});

	$("#deleteButton").click(function() {
		var libraryName = $("#nameText").val().replace(/[^ -~]+/g, "");
		chrome.storage.sync.get("libraries", function(obj) {
			var libraries = obj["libraries"];
			delete libraries[libraryName];
			if (Object.keys(libraries).length < 1) {
				$("#libraryLabel").css("color", "#d00");
				$("#successText").hide();
			}
			chrome.storage.sync.set({
				libraries: libraries
			}, function() {
				// when delete is complete refresh the list
				loadLibraries();
			});
		});
	});

    $("#exportButton").click(function () {
        console.log("export clicked");
        chrome.storage.sync.get("libraries", function (obj) {
            console.log(obj);
            let libraries = JSON.stringify(obj["libraries"]);
            $("#exportBox").text(libraries);
        });
    });

    $("#importButton").click(function () {
        $("#importButton").prop('disabled',true);
        console.log("import clicked");
        var importedlibraries = $("#exportBox").value;
        console.log(importedlibraries);
        var libraries = {};
        libraries = JSON.parse(importedlibraries);
		console.log(importedlibraries);
        chrome.storage.sync.set({
            libraries: libraries
        }, function () {
            console.log("imported");
        });
    });
