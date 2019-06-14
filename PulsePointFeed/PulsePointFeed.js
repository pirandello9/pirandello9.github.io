
// Global vars
var gStrLastJson = "";
var gArrAlerts = [];
var gArrActiveCalls = [];
var gDivCurrCall = null;
var gLinkCurrAddress = null;



function init()
{
	//#############
	//var eltUnitInput = document.getElementById("UnitInput");
	//eltUnitInput.addEventListener("keydown", function(evt) { unitInput_onKeyDown(eltUnitInput, evt); })
	//#############
	
	var strCurrUnit = localStorage.getItem("currUnit");
	if (strCurrUnit)
	{
		var eltUnitInput = document.getElementById("UnitInput");
		eltUnitInput.value = strCurrUnit;
	}
	
	updateTimes();
	setInterval(updateTimes, 10000);  // once every 10 secs
	
	// Header is fixed, so pad the rest of the content (Calls) down to just under the header
	var divPageHeader = document.getElementById("PageHeader");
	var divCalls = document.getElementById("Calls");
	divCalls.style.paddingTop = divPageHeader.offsetHeight + "px";
	
	//var divCall = addDiv(divCalls, "");
	//divCall.innerText = "Testing..."
	//+ "Now is the time for all good men to come to the aid of their country.  "
	//+ "Now is the time for all good men to come to the aid of their country.  "
	//+ "Now is the time for all good men to come to the aid of their country.  "
	//+ "Now is the time for all good men to come to the aid of their country.  "
	//+ "Now is the time for all good men to come to the aid of their country.  "
	//+ "Now is the time for all good men to come to the aid of their country.  "
	//+ "Now is the time for all good men to come to the aid of their country.  "
	//+ "Now is the time for all good men to come to the aid of their country.  "
	//+ "Now is the time for all good men to come to the aid of their country.  "
	//+ "Now is the time for all good men to come to the aid of their country.  "
	//+ "Now is the time for all good men to come to the aid of their country.  "
	//+ "Now is the time for all good men to come to the aid of their country.  "
	//+ "Now is the time for all good men to come to the aid of their country.  "
	//+ "Now is the time for all good men to come to the aid of their country.  "
	//+ "Now is the time for all good men to come to the aid of their country.  "
	//+ "Now is the time for all good men to come to the aid of their country.  "
	//+ "Now is the time for all good men to come to the aid of their country.  "
	//+ "Now is the time for all good men to come to the aid of their country.  "
	//+ "Now is the time for all good men to come to the aid of their country.  "
	//+ "Now is the time for all good men to come to the aid of their country.  "
	//+ "Now is the time for all good men to come to the aid of their country.  "
	//;
	
	refreshData();
}


function updateTimes()
{
	var now = new Date();
	//var arrRelTimes = document.getElementById("Calls").getElementsByClassName("RelTime");
	var arrRelTimes = Array.from(document.getElementById("Calls").getElementsByClassName("RelTime"));
	var eltRefreshedTime = document.getElementById("RefreshedTime");
	arrRelTimes.push(eltRefreshedTime);
	
	for (var i = 0; i < arrRelTimes.length; i++)
	{
		var eltRelTime = arrRelTimes[i];
		var strRelTime;
		if (!eltRelTime.time)
			strRelTime = "...";
		else
		{
			var nDiffMilliSecs = (now - eltRelTime.time);
			var fDiffMins = nDiffMilliSecs / 60000.0;
			if (fDiffMins < 1.0)
			{
				var nDiffSecs = Math.round(nDiffMilliSecs / 1000.0);
				if (nDiffSecs <= 5)
					strRelTime = "now";
				else if (nDiffSecs < 50)
					strRelTime = "< " + (Math.floor(nDiffSecs / 10) + 1) + "0s";	// space after "<" is "hair space"
				else
					strRelTime = "< 1m";																					// space after "<" is "hair space"
				//strRelTime = Math.round(nDiffMilliSecs / 1000.0) + "s";
			}
			else if (fDiffMins > 1440.0)
				strRelTime = Math.round(fDiffMins / 1440.0) + "d";
			else if (fDiffMins > 99.0)
				strRelTime = Math.round(fDiffMins / 60.0) + "h";
			else
				strRelTime = Math.round(fDiffMins) + "m";
		}
		
		if (eltRelTime.strRelTime !== strRelTime)
		{
			eltRelTime.strRelTime = strRelTime;
			eltRelTime.innerText = strRelTime;
		}
	}
}


function updatePage()
{
	var strCurrUnit = document.getElementById("UnitInput").value.toUpperCase();
	var divCalls = document.getElementById("Calls");
	
	// Empty out Calls div
	while (divCalls.firstChild)
		divCalls.removeChild(divCalls.firstChild);
	
	gDivCurrCall = null;
	gLinkCurrAddress = null;
	
	addSpacer(divCalls);
	
	for (var i = 0; i < gArrActiveCalls.length; i++)
	{
		var objIncident = gArrActiveCalls[i];
		
		//<div class="Call CurrCall">
		//  <div class="LeftRight">
		//    <div class="Deemphasize">Structure Fire (1A)</div>
		//    <div class="RelTime"><1m</div>
		//  </div>
		//  <div class="UnitsEtc">CMD12: <span class="Units">B1, B5, E1, <span class="CurrUnit">E23</span>, E34, T1, U34A, U34B</span> (5’s)</div>
		//  <a class="LeftLeft" href="">
		//    <div>Story Rd & Hopkins Dr&nbsp;</div>
		//    <div>(Golden Wheel MHP)</div>
		//  </a>
		//</div>
		
		// Compose the text...
		var strTypeCode = objIncident.type || "unk";
		var strTypeImageUrl = "https://web.pulsepoint.org/assets/images/list/" + strTypeCode.toLowerCase() + "_list.png";
		
		var strCallType = objIncident.typeName;
		if (objIncident.alarm)
			strCallType += " (" + objIncident.alarm + "A)";
		if (objIncident.cmd)
			strCallType += ": " + objIncident.cmd;
		
		var bIncludesCurrUnit = false;
		var arrUnits = objIncident.units;
		var strUnits = "";
		if (arrUnits)
		{
			for (var j = 0; j < arrUnits.length; j++)
			{
				if (j !== 0)
					strUnits += ", ";
				
				var objUnit = arrUnits[j];
				var strUnit = objUnit.id;
				if (strUnit === strCurrUnit)
				{
					bIncludesCurrUnit = true;
					strUnit = '<span class="CurrUnit">' + strUnit + '</span>';
				}
				if (objUnit.status === "DP")
					strUnit = '<span class="EnRoute">' + strUnit + '</span>';
				else if (objUnit.status === "TR")
					strUnit += "&raquo;&#10010;";   // double right angle-bracket + thick cross (for "transporting")
				
				strUnits += strUnit
			}
		}
		
		var strUnitsEtc = '<span class="Units">' + strUnits + '</span>';
		if (objIncident.firstDue)
			strUnitsEtc += " (" + objIncident.firstDue + "&rsquo;s)";
		
		// Create and insert the elements...
		var divCall = addDiv(divCalls, (bIncludesCurrUnit? "Call CurrCall" : "Call"));
		
		var divTypeAndTime = addDiv(divCall, "LeftRight");
		var divType = addDiv(divTypeAndTime, "Deemphasize", strCallType);
		var imgType = document.createElement("img");
		imgType.className = "CallTypeIcon";
		imgType.src = strTypeImageUrl;
		divType.insertBefore(imgType, divType.firstChild);
		addDiv(divTypeAndTime, "RelTime", "-").time = new Date(objIncident.time);
		
		//if (objIncident.cmd)
		//  addDiv(divCall, null, objIncident.cmd);
		
		addDiv(divCall, "UnitsEtc", strUnitsEtc);
		
		var linkAddress = document.createElement("a");
		linkAddress.className = "Address LeftLeft";
		linkAddress.href = getMapLink(objIncident.latlong);
		linkAddress.target = "_blank";
		linkAddress.onclick = onCallAddressClicked;
		divCall.appendChild(linkAddress);
		if (objIncident.placeName || objIncident.public)
		{
			addDiv(linkAddress, null, objIncident.address + "&nbsp;");
			addDiv(linkAddress, null, "(" + (objIncident.placeName || "public") + ")");
		}
		else
			addDiv(linkAddress, null, objIncident.address);
		
		if (bIncludesCurrUnit)
		{
			gDivCurrCall = divCall;
			gLinkCurrAddress = linkAddress;
		}
		
		addSpacer(divCalls);
	}
	
	updateTimes();
}


function scrollToCurrCall()
{
	if (gDivCurrCall)
		gDivCurrCall.scrollIntoView({behavior: "smooth", block: "end", inline: "start"});
}


function getMapLink(strDest)
{
	const kStrDirectionsUrl = "https://www.google.com/maps/dir/?api=1&destination=%s&travelmode=driving";
	return kStrDirectionsUrl.replace("%s", strDest);
}


function onCallAddressClicked()
{
	// this keyword inside the handler is set to the DOM element
	console.log("ADDRESS CLICKED: " + this.href);
	
	// Remember the most recently clicked call address
	localStorage.setItem("lastCallAddressClicked", this.href);
	
	return true; // continue with default handling of event
}


function updateRefreshedTime()
{
	var now = new Date();
	//var options = { timeZone:'America/Los_Angeles' };
	var options = {hour: 'numeric', minute: '2-digit', hour12: 'true'};
	var strDateTime = now.toLocaleTimeString("en-US", options);
	strDateTime = strDateTime.replace(/ \b([AP]M)\b/i, "$1").toLowerCase();
	
	var eltRefreshedTime = document.getElementById("RefreshedTime");
	eltRefreshedTime.innerText = strDateTime;
}


function addDiv(appendInElt, strClasses, strText)
{
	var div = document.createElement("div");
	if (strClasses)
		div.className = strClasses;
	if (strText)
		div.innerHTML = strText;
	if (appendInElt)
		appendInElt.appendChild(div);
	return div;
}


function addSpacer(div)
{
	var hr = document.createElement("hr");
	hr.className = "Spacer";
	div.appendChild(hr);
}


function refreshData()
{
	animateRefresh(true);
	console.log("Requesting pulsepoint data...");
	
	
	var TESTING = false;
	
	//############### FOR TESTING... ###################
	if (TESTING)
	{
		var objResponse =
			{"activeCalls": [
				{
					"time": "2019-06-04T04:22:30Z",
					"type": "ME",
					"typeName": "Medical",
					"latlong": "37.3701980556,-121.8429499722",
					"address": "McKee Rd",
					"public": true,
					"units": [
						{"id": "E2", "status": "TR"}
					]
				},
				{
					"time": "2019-06-04T04:17:30Z",
					"type": "PS",
					"typeName": "Public Service",
					"latlong": "37.3436547778,-121.8375635556",
					"address": "Story Rd & Hopkins Dr",
					"public": true,
					"units": [
						{"id": "E16", "status": "OS"},
						{"id": "T16", "status": "OS"}
					]
				},
				{
					"time": "2019-06-04T04:15:27Z",
					"type": "SF",
					"typeName": "Structure Fire",
					"alarm": "1",
					"cmd": "CMD12",
					"latlong": "37.2836453333,-121.7904331389",
					"address": "Mountaire Ct",
					"units": [
						{"id": "B1", "status": "OS"},
						{"id": "B5", "status": "DP"},
						{"id": "E23", "status": "OS"},
						{"id": "E34", "status": "OS"},
						{"id": "T1", "status": "DP"},
						{"id": "U34A", "status": "OS"},
						{"id": "U34B", "status": "OS"}
					],
					"firstDue": 5
				},
				{
					"time": "2019-06-04T04:12:21Z",
					"type": "CMA",
					"typeName": "Carbon Monoxide",
					"latlong": "37.2984915556,-121.8680324167",
					"address": "213 Azevedo Cir",
					"placeName": "Golden Wheel MHP",
					"units": [
						{"id": "E26", "status": "OS"}
					]
				},
				{
					"time": "2019-06-04T04:10:35Z",
					"type": "ME",
					"typeName": "Medical",
					"latlong": "37.2299803611,-121.8684615556",
					"address": "Fleetwood Dr",
					"firstDue": "22",
					"units": [
						{"id": "E17", "status": "OS"}
					]
				}
			]
		};
		
		onDataReceived(JSON.stringify(objResponse));
	}
	else
	{
		var objReq = new XMLHttpRequest();
		objReq.addEventListener("load", onDataReceived);
		//objReq.open("GET", "https://script.google.com/macros/s/AKfycbwAN-d88IGiGX6t7ddHp2pidzzfco6JjWKawzp-hAhrEHwxMI5J/exec");
		//objReq.open("GET", "http://localhost:4000/");
		objReq.open("GET", "https://acpulsepoint.herokuapp.com/");
		objReq.send();
	}
}


function onDataReceived()
{
	animateRefresh(false);
	
	//var strResponseJson = this.responseText;
	var strResponseJson = this.responseText || arguments[0];  //########### FOR TESTING
	//console.log(strResponseJson);
	
	//updateRefreshedTime();
	var eltRefreshedTime = document.getElementById("RefreshedTime");
	eltRefreshedTime.time = new Date();
	updateTimes();

	if (strResponseJson === gStrLastJson)
		console.log("Received same as current data from pulsepoint");
	else
	{
		var objResponse = JSON.parse(strResponseJson);
		gStrLastJson = strResponseJson;
		gArrAlerts = objResponse.alerts;
		gArrActiveCalls = objResponse.activeCalls;
		
		if (gArrAlerts)
			console.log("Received ALERTS from pulsepoint:\n%s", gArrActiveCalls.length, JSON.stringify(gArrAlerts, undefined, 2));
		
		console.log("Received %d active calls from pulsepoint", gArrActiveCalls.length);
		
		updatePage();
	}
	
	scrollToCurrCall();
	
	if (gLinkCurrAddress && (gLinkCurrAddress.href !== localStorage.getItem("lastCallAddressClicked")))
		clickElement(gLinkCurrAddress);
}


function animateRefresh(bOn)
{
	const kstrRefreshStaticImg = "PulsePointFeed/RefreshButton.gif";
	const kstrRefreshAnimImg = "PulsePointFeed/RefreshAnim.gif";
	
	document.getElementById("RefreshButton").src = (bOn? kstrRefreshAnimImg : kstrRefreshStaticImg);
}


function unitInput_selectNumber(eltUnitInput)
{
	var strCurrVal = eltUnitInput.value;
	var nFrom = 0;
	var nTo = strCurrVal.length;
	var match = /^([A-Z]+)\d*$/i.exec(strCurrVal);
	if (match)
		nFrom = match[1].length;
	
	eltUnitInput.setSelectionRange(nFrom, nTo);
	//eltUnitInput.selectionStart = nFrom;
	//eltUnitInput.selectionEnd = nTo;
}


// NOTE: Only handling onKeyDown to catch backspace/delete and pass them to unitInput_onKeyPress
// (since they don't generate onKeyPress events)
function unitInput_onKeyDown(eltUnitInput, evt)
{
	var ch = evt.which || evt.keyCode || evt.key.charCodeAt(0);
	alert(ch);
	
	if (ch === 8 || ch === 46)	// backspace, delete
		return unitInput_onKeyPress(eltUnitInput, evt);
	else
		return true;
}


function unitInput_onKeyPress(eltUnitInput, evt)
{
	var ch = evt.which || evt.keyCode || evt.key.charCodeAt(0);
	//console.log(ch);
	
	// NOTE: Backspace/delete don't generate onKeyPress, so catching them via onKeyDown and passing them here
	var bIsBackspaceOrDelete = (ch === 8 || ch === 46);
	var bIsNumberOrLetter = (ch >= 48 && ch <= 57) || (ch >= 97 && ch <= 122) || (ch >= 65 && ch <= 90);
	
	if (bIsBackspaceOrDelete || bIsNumberOrLetter)
	{
		var strVal = eltUnitInput.value;
		var nSelStart = eltUnitInput.selectionStart;
		var nSelEnd = eltUnitInput.selectionEnd;

		if (bIsNumberOrLetter)
			// Number/letter: replace selected text (or empty selection) with added char
			strVal = strVal.substr(0, nSelStart) + String.fromCharCode(ch) + strVal.substr(nSelEnd);
		else if (nSelStart !== nSelEnd)
			// Backspace/delete with non-empty selection: delete selected text
			strVal = strVal.substr(0, nSelStart) + strVal.substr(nSelEnd);
		else if (ch === 8)
			// backspace: delete 1 char left of nSelStart
			strVal = strVal.substr(0, nSelStart - 1) + strVal.substr(nSelStart);
		else // (ch === 46)
			// delete: delete 1 char right of nSelStart
			strVal = strVal.substr(0, nSelStart) + strVal.substr(nSelStart + 1);
		
		strVal = strVal.toUpperCase();
		
		var strCurrUnit = null;
		var strUnitNumber = null;
		
		//######## EVENTUALLY MORE VALIDATION? (E.G. RESTRICT TO [ETUS]\d{1,3} and PREVENT LEADING ZERO AFTER LETTER ???)
		var match = /^[A-Z]{1,3}(\d{0,3})$/.exec(strVal);
		if (match)
			[strCurrUnit, strUnitNumber] = match;
		else if (bIsBackspaceOrDelete)
			// Allow validation fail only if backspace/delete
			strCurrUnit = strVal;
		else
		{
			// Otherwise, i.e. for added number/letter, prevent it if it would cause validation fail
			evt.preventDefault();
			return false;
		}
		
		//console.log("strCurrUnit = %s  /  strUnitNumber = %s", strCurrUnit, strUnitNumber);
		
		if (strUnitNumber)
		{
			var nStationNumber = parseInt(strUnitNumber, 10) % 100;  // just last 2 digits of unit number
			var strMapAddressUrl = getMapLink("San Jose Fire Department Station " + nStationNumber);
			document.getElementById("UnitStationLink").href = strMapAddressUrl;
		}
		
		localStorage.setItem("currUnit", strCurrUnit);
		setTimeout(updatePage, 10);
		//setTimeout(scrollToCurrCall, 20);
		return true;
	}
	else if (ch === 13)
	{
		// Special case for iOS Safari: extra unfocus actions in order to make iOS keyboard dismiss
		document.activeElement.blur();
		eltUnitInput.blur();
		window.focus();
		
		setTimeout(updatePage, 10);
		setTimeout(scrollToCurrCall, 20);
		return true;
	}
	else
	{
		// Prevent all other keys
		evt.preventDefault();
		return false;
	}
	// NOTE: No need to check for any cursor-movement keys here, as they don't generate onKeyPress events
}


function clickElement(elt)
{
	elt.focus();
	elt.click();
	var objEvent = document.createEvent("HTMLEvents");
	objEvent.initEvent("click", false, true);
	elt.dispatchEvent(objEvent);
	elt.blur();
}

