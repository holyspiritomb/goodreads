// This script is run when visiting a Goodreads page

var libraryDivPlaceholders = "";
var tableUpdateCheckInterval = null;
var showOnPages = {};
var showFormat = {};
var libraryClassNames = [];
var debugMode = {};
var debugging = false;
var waitingOnAvailability = false;
var loaded = false;


function debugConsole(stuff) {
    if (debugging){
        console.log("AGF debug:", stuff);
    } else {
        return;
    }
}

function addSettingsButton(elem, position) {
    let settingsButtonDiv = document.createElement("div");
    settingsButtonDiv.classList.add("AGF_settings");
    let settingsLink = document.createElement("a");
    settingsLink.target = "_blank";
    settingsLink.href = chrome.runtime.getURL("src/options/index.html");
    let settingsImg = document.createElement("img");
    settingsImg.classList.add("AGimg");
    settingsImg.src = chrome.runtime.getURL('icons/icon25.png');
    settingsImg.title = "Available Reads Settings";
    settingsImg.alt = "Available Reads Settings";
    settingsImg.style.width = "16px";
    settingsImg.style.height = "16px";
    settingsLink.appendChild(settingsImg);
    if (elem == "form#perPageForm"){
        settingsLink.append(" Available Reads Settings");
    }
    settingsButtonDiv.appendChild(settingsLink);
    debugConsole(settingsButtonDiv);
    if (document.querySelector(elem)){
        document.querySelector(elem).insertAdjacentElement(position, settingsButtonDiv);
    }
}

function sortRowsByStatus() {
	var sortAsc = true;
	if (document.querySelector("#AGsort").classList.contains("AGasc")) {
		sortAsc = true;
	} else if (document.querySelector("#AGsort").classList.contains("AGdesc")) {
		sortAsc = false;
	} else {
		return;
	}

	// initialize the map
	var bookList = [];

	waitingOnAvailability = false;

	document.querySelectorAll("tr.bookalike").forEach((element) => {
		bookList.push(element);
		if (!waitingOnAvailability) {
			for (var l in libraryClassNames) {
				if (element.classList.contains(libraryClassNames[l])) {
					waitingOnAvailability = true;
					break;
				}
			}
		}
	});

	// sort books into lists by their current status
	bookList.sort(function(a, b) {
		x = parseFloat(a.getAttribute("AGsortScore"));
		y = parseFloat(b.getAttribute("AGsortScore"));
		if (x < y) {
			return -1;
		}
		if (x > y) {
			return 1;
		}
		return 0;
	});

	if (sortAsc) {
		bookList.reverse();
	}

	// move the rows in sorted order
	var prevRow = null;
	for (var b in bookList) {
		let row = bookList[b];
		row.parentElement.removeChild(row);
		if (!prevRow) {
			row.prepend(document.querySelector("tbody#booksBody"));
		} else {
			row.after(prevRow);
		}
		prevRow = row;
	}
}

// for title and author remove parentheticals, remove [&|,], and trim whitespace
function cleanTitleForSearch(title) {
	return title.replace(/\(.*\)/, "").replace(/^\s+|\s+$/g, '').replace(/[&|,]/g, ' ').replace(/: .*/, '').replace(/[ ]+/, ' ');
}
function cleanAuthorForSearch(author) {
	return author.replace(/^\s+|\s+$/g, '').replace(/[&|,]/g, ' ').replace(/(?:^|\W)(?:[A-Z]\.)+/g, ' ').replace(/[ ]+/, ' ');
}

// send search requests to Overdrive
function getOverdriveAvailability() {
	if (!libraryDivPlaceholders || libraryDivPlaceholders.length == 0) {
		return;
	}

	// check for tags on either a single book review page or the bookshelf page
	var book = document.querySelector("h1.Text__title1");
	var booklist = document.querySelectorAll('.responsiveBook');
	var booklist2 = document.querySelectorAll('table.tableList tr');
	var bookshelves = document.querySelectorAll('div#shelvesSection');
    var bookshelvesMobile = document.querySelectorAll('html.mobile ul.bookList');

	// if a single book page
	if (showOnPages["descriptionPage"] && book && !document.querySelector("div#AGtable")) {
        addSettingsButton(".BookPageMetadataSection__description", "afterend");
		var id = "SINGLEBOOK";

		// inject the table we're going to populate
		let agDiv = document.createElement("div");
		agDiv.id = "AGtable";
		let agTab = document.createElement("table");
		let agTrOne = document.createElement("tr");
		let agTdTop = document.createElement("td");
		agTdTop.valign = "top";
		agTdTop.innerHTML = "<b>Libby Availability:</b>";
		agTrOne.appendChild(agTdTop);
		agTab.appendChild(agTrOne);
		let agTrTwo = document.createElement("tr");
		let agTdBottom = document.createElement("td");
		agTdBottom.style.paddingLeft = "10px";
		agTdBottom.style.whitespace = "nowrap";
		agTdBottom.valign = "top";
		agTdBottom.className = "AGAVAIL" + id;
		agTdBottom.innerHTML = libraryDivPlaceholders;
		agTrTwo.appendChild(agTdBottom);
		agTab.appendChild(agTrTwo);
		agDiv.appendChild(agTab);
		debugConsole(agDiv);
		document.querySelector('.BookPageMetadataSection__description').insertAdjacentElement("afterend", agDiv);
		// send a message for the background page to make the request
		chrome.runtime.sendMessage({
			type: "FROM_AG_PAGE",
			id: id,
			title: cleanTitleForSearch(book.textContent),
			author: cleanAuthorForSearch(document.querySelector(".ContributorLink__name").textContent)
		});
	} else if (showOnPages["listPage"] && booklist && booklist.length > 0) { // else if on a book list page
		booklist.forEach((element) =>  {
			//element.querySelector(".objectLockupContent__secondary").classList.add("AGloading");
			var id = element.querySelector('a').getAttribute("href").replace(/[^a-zA-Z0-9]/g,'');
			var title = element.querySelector('a.gr-h3').textContent;
			var author = element.querySelector('[itemprop=author]').textContent;

			// set a "Loading..." message for this listing
			element.querySelector(".communityRating").parentElement.insertAdjacentHTML("afterend", "<div id='AGtable'><table><tr><td valign=top><b>Libby Availability:</b></td></tr><tr><td style='padding-left:10px' valign=top class='AGAVAIL" + id + "'>" + libraryDivPlaceholders + "</td></tr></table></div>");
			// send a message for the background page to make the request
			chrome.runtime.sendMessage({
				type: "FROM_AG_PAGE",
				id: id,
				title: cleanTitleForSearch(title),
				author: cleanAuthorForSearch(author)
			});
		});	
	} else if (showOnPages["listPage"] && booklist2 && booklist2.length > 0) { // else if on a book list page
		booklist2.forEach((element) =>  {
			//element.querySelector("div a.gr-button").classList.add("AGloading");
			var id = element.querySelector('a.bookTitle').getAttribute("href").replace(/[^a-zA-Z0-9]/g,'');
			var title = element.querySelector('a.bookTitle').textContent;
			var author = element.querySelector('a.authorName').textContent;

			// set a "Loading..." message for this listing
			element.querySelector(".minirating").parentElement.insertAdjacentHTML("afterend","<div id='AGtable' class='AG2'><table><tr><td valign=top><b>Libby Availability:</b></td></tr><tr><td style='padding-left:10px' valign=top class='AGAVAIL" + id + "'>" + libraryDivPlaceholders + "</td></tr></table></div>");
			// send a message for the background page to make the request
			chrome.runtime.sendMessage({
				type: "FROM_AG_PAGE",
				id: id,
				title: cleanTitleForSearch(title),
				author: cleanAuthorForSearch(author)
			});
		});
	} else if (showOnPages["shelfPage"] && bookshelvesMobile && bookshelvesMobile.length > 0) { // else if on my book shelf page
        addSettingsButton("ul.responsiveSiteFooter__linkList", "beforebegin");
	} else if (showOnPages["shelfPage"] && bookshelves && bookshelves.length > 0) { // else if on my book shelf page
        addSettingsButton("form#perPageForm", "beforebegin");
		// inject the table column we're going to populate
		if (!document.querySelector("th.overdrive")) {
			document.querySelector("th.avg_rating").insertAdjacentHTML("afterend",'<th class="header field overdrive libby"><a href="#" id=AGsort>libby</a></th>');

			// if the header is clicked to sort the column
			document.querySelector("#AGsort").addEventListener("click", function(e) {
				var element = document.querySelector("#AGsort");
				var arrow = document.querySelector("th img");
				arrow.parentElement.removeChild(arrow);
				arrow.after(element);
				if (element.classList.contains('AGdesc')) {
					element.classList.remove('AGdesc');
					element.classList.add('AGasc');
					if (arrow.getAttribute("alt").indexOf("Up") >= 0) {
						arrow.classList.add("flip-vertical");
					} else {
						arrow.classList.remove("flip-vertical");
					}
				} else {
					element.classList.remove('AGasc');
					element.classList.add('AGdesc');
					if (arrow.getAttribute("alt").indexOf("Down") >= 0) {
						arrow.classList.add("flip-vertical");
					} else {
						arrow.classList.remove("flip-vertical");
					}
				}

				sortRowsByStatus();
				return false;
			});
		}

		// iterate through every listing in the list that we haven't seen before
		document.querySelectorAll("tr.bookalike:not(.AGseen)").forEach((element) => {
			var id = element.getAttribute("id");

			// set a "Loading..." message for this listing
			var avg_col = element.querySelector("td.avg_rating");
			avg_col.insertAdjacentHTML("afterend", '<td style="white-space:nowrap" class="field AGcol AGAVAIL' + id + '">' + libraryDivPlaceholders + '</td>');
			// mark the row as seen
			element.classList.add("AGseen");
			// send a message for the background page to make the request
			chrome.runtime.sendMessage({
				type: "FROM_AG_PAGE",
				id: id,
				title: cleanTitleForSearch(element.querySelector("td.title a").textContent),
				author: cleanAuthorForSearch(element.querySelector("td.author a").textContent)
			});

			libraryClassNames.forEach(function(className) {
				element.classList.add(className);
			});
			waitingOnAvailability = true;
		});

		// start a check every 2 seconds if new rows are added in case infinte scrolling is on
		//   or if a book's position is manually changed
		if (tableUpdateCheckInterval == null) {
			tableUpdateCheckInterval = setInterval(function() {
				if (document.querySelectorAll("tr.bookalike:not(.AGseen)").length > 0) {
					getOverdriveAvailability();
				}
				// sort rows by availability if necessary
				if (waitingOnAvailability) {
					sortRowsByStatus();
				}
			}, 2000);
		}
	}
}

function injectAvailableReads() {
	if (!loaded) {
		loaded = true;
			// if document has been loaded, inject CSS styles
			document.getElementsByTagName('body')[0].insertAdjacentHTML("beforebegin", `<style>
                div.AGF_settings a{text-decoration:none;}
                #AGtable a{text-decoration:none}
                div#AGtable {visibility:visible;display:block;}
                div#AGtable > table {width:100%;}
                div#AGtable td.AGAVAILbookDetails {visibility:visible;}
                div#AGtable table tr td {display:flex;flex-direction:column;}
                div#AGtable table tr td > div::before{content: attr(class) ':';font-weight: bold;display:block;}
                td.AGcol > div::before {content:attr(class) ':';font-weight:bold;display:block;}
                td.AGAVAILSINGLEBOOK > div{display:flex;flex-direction:row;}
                td.AGAVAILSINGLEBOOK > div::before{content: attr(class) ':';font-weight: bold;flex-basis: 6.5em;}
				.AGline{display:none;}
				font:hover hr.AGline{margin-left:5px;border:thin solid #c6c8c9;position:absolute;display:inline}
				.AGtitle{display:none;}
				font:hover span.AGtitle{z-index:999;background-color:white;position: absolute;margin-left:10px;margin-top:-1px;padding-left:5px;padding-right:5px;display:inline;border:thin solid #c6c8c9}
				.flip-vertical {-moz-transform: scaleY(-1);-webkit-transform: scaleY(-1);-o-transform: scaleY(-1);transform: scaleY(-1);-ms-filter: flipv; /*IE*/filter: flipv;}
				</style>`);
		chrome.storage.sync.get("debugMode", function(obj){
			debugMode = obj["debugMode"];
			debugging = debugMode["debug"];
		});
        addSettingsButton("#bookLinks", "beforebegin");

		chrome.storage.sync.get("showOnPages", function(obj) {
			showOnPages = obj["showOnPages"];
			chrome.storage.sync.get("showFormat",function(obj) {
				showFormat = obj["showFormat"];
				chrome.storage.sync.get("libraries", function(obj) {
					var libraries = obj["libraries"];
					libraryDivPlaceholders = "";
					for (var l in libraries) {
						if(!libraries[l].url) {
							libraries[l].url = libraries[l];
						}
						var libraryName = libraries[l].url.replace(/\..*/, '');
						// load placeholders for different library results
						libraryDivPlaceholders += "<div class='" + libraryName;

						if (libraries.length == 1) {
							libraryDivPlaceholders += "'><font color=lightgray><small><i><span class=status>Loading...</i></span></small></font></div>";
						} else {
							libraryDivPlaceholders += "'><font color=lightgray><small><i><span class=status>Loading " + libraryName + "...</i></span></small></font></div>";
						}

						libraryClassNames.push("AGloading" + libraryName);
					}
					getOverdriveAvailability();
				});
			});
		});
	}
}

// wait for the document to load before injecting code
window.addEventListener("load", (event) => injectAvailableReads);
// if in Firefox we missed the load event, add after a delay
setTimeout(injectAvailableReads, 3000);

function odSearchToLibby(a) {
	debugConsole(a);
	let libbyUrl = a.replace("://thunder.api.overdrive.com/v2/libraries/", "://libbyapp.com/search/").replace("/media?query=", "/search/query-").replace("&creator=", "%20");
	libbyUrl = libbyUrl + "/page-1";
    debugConsole(libbyUrl);
	return libbyUrl;
}

// listen for search results from background page
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	var listingStr = "<font class='AGnone AGresult' color=gray>not found<hr width=10px class=AGline><span class='AGtitle'>searched " + message.libraryShortName + " for: <i>" + message.searchTerm + "</i></span></font>";
	var sortScore = 9999;
	var onlyRecommendations = true;

	for (var bookIndex in message.books) {
		var book = message.books[bookIndex];
        debugConsole(book);
		var audioStr = "";
		var audioClass = "";
		var newScore = 0;
		var optionalBookTitle = "";

		// reset listingStr if starting a new row, otherwise add a line break
		if (bookIndex == 0) {
			listingStr = "";
		} else if (listingStr.length > 0 && book.totalCopies) {
			listingStr += "<br>";
		}

		// continue if none were found
		if (!book.totalCopies) { continue }
		// continue if we found and audio book and don't want that format
		if (!showFormat['audioBook'] && book.isAudio) { continue }
		// continue if we found an ebook and don't want that format
		if (!showFormat['eBook'] && !book.isAudio) { continue }
		// if option for showing book title and author is set, create the string
		if (showFormat['optionalBookTitle']) { 
			optionalBookTitle = "<font color=gray> - <i>" + book.title + "</i> by " + book.author + "</font>";
		}

		onlyRecommendations = false;

		// if an audiobook, add a headphone icon
		if (book.isAudio) {
            audioStr = ' \uD83C\uDFA7';
			audioClass = "Audio";
			newScore = 90;
		} else {
			audioStr = "";
			audioClass = "";
		}

        const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");

        let availColor;
        let holdColor;
        if (darkThemeMq.matches) {
            availColor = "limegreen";
            holdColor = "orange";
        } else {
            availColor = "#080";
            holdColor = "#C80";
        }

		var copiesStr = "";
		if (book.alwaysAvailable) { // if always available
			copiesStr = `color=${availColor}><span class=status>always available</span>`;
			newScore += -1;
		} else if (book.holds != null && book.holds >= 0) { // if there's a wait list with count
			copiesStr = `color=${holdColor}><span class=status>` + book.holds + "/" + book.totalCopies + " holds</span>";
			newScore += 1000 + book.holds / book.totalCopies;
		} else if (book.holds && isNaN(book.holds)) { // if there's a wait list with no count
			copiesStr = `color=${holdColor}><span class=status>place hold</span>`;
			newScore += 1000;
		} else if (book.totalCopies > 0) { // if available copies found with count
			copiesStr = `color=${availColor}><span class=status>` + book.totalCopies + " available</span>";
			newScore += -1;
		} else if (book.totalCopies) { // if available copies found with no count
			copiesStr = `color=${availColor}><span class=status>available</span>`;
			newScore += -1;
		} else if (!book.totalCopies && showFormat['multipleNotFounds']) { // if no copies found
			listingStr = "<font class='AGnone AGresult' color=gray><span class=status>not found</span><hr width=10px class=AGline><span class='AGtitle'>searched for: " + message.searchTerm + "</span></font>";
			newScore += 9999;
		} else { // unknown error occured
			console.error("Available Goodreads error:", copiesStr, book, message);
			listingStr += "<font class='AGcopy AGresult' color=red><span class=status>unknown</span><span class='AGtitle'>" + book.title + "</span></font>";
			newScore += 99999;
		}

		if (newScore < sortScore) {
			sortScore = newScore;
		}

		// if copies are found, append to listing string
		if (copiesStr) {
			listingStr += "<font class='AGcopy AGresult' style='white-space: nowrap;'" + copiesStr + audioStr + optionalBookTitle + "<hr width=10px class=AGline><span class='AGtitle'>" + message.libraryStr + audioStr + book.title + "</span></font>";
		}
	}
	if (onlyRecommendations && message.books && message.books.length > 0) {
		sortScore = 9998;
		listingStr = "<font color=#C60>request<hr width=10px class=AGline><span class='AGtitle'>Recommend " + message.libraryShortName + " add this to their collection</span></font>";
	}

	// only show one not found result if the option is set
	if (showFormat['onlyOneNotFound']) {
		// if this result is a not found, don't add it
		if (listingStr.includes(">not found<") && document.querySelector("td.AGAVAIL" + message.id + " .AGresult")) {
			listingStr = "";

		// else remove any existing "not found"
		} else {
			var existingNotFound = document.querySelector("td.AGAVAIL" + message.id + " .AGnone");
			if (existingNotFound) {
				existingNotFound.innerHTML = "";
			}
		}
	}

	// inject listing into a cell's div based on review id and library
	let libbyMessageUrl = odSearchToLibby(message.url);
	document.querySelector("td.AGAVAIL" + message.id + " div." + message.libraryShortName).innerHTML = '<a target="_blank" href="' + libbyMessageUrl + '">' + listingStr + '</a>';

	let row = document.querySelector("tr#" + message.id);
	let oldScore = row.getAttribute("AGsortScore");
	if (!oldScore || sortScore < oldScore) {
		row.setAttribute("AGsortScore", sortScore);
	}

	document.querySelector("tr#" + message.id).classList.remove("AGloading" + message.libraryShortName);
});
