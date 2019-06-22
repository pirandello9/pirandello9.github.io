
// Global consts
const kstrServerUrl = "https://acpulsepoint.herokuapp.com/";
const kstrDataUrl = kstrServerUrl;

// Global vars
var gbOnMobile = isOnMobile();
var gStrLastJson = "";
var gArrAlerts = [];
var gArrActiveCalls = [];
var gDivCurrCall = null;
var gstrCurrCallMapUrl = null;



function init()
{
	//#############
	//var eltUnitInput = document.getElementById("UnitInput");
	//eltUnitInput.addEventListener("keydown", function(evt) { unitInput_onKeyDown(eltUnitInput, evt); })
	//#############

	//################# TESTING #################
	document.getElementById("ModalOverlay").style.display = "block";
	document.getElementById("WaitCallModal").style.display = "block";
	document.getElementById("Calls").style.position = "fixed";
	//################# TESTING #################

	var strCurrUnit = localStorage.getItem("currUnit");
	if (strCurrUnit)
	{
		var eltUnitInput = document.getElementById("UnitInput");
		eltUnitInput.value = strCurrUnit;
		unitInput_saveValue(eltUnitInput, strCurrUnit, false);
	}
	
	if (gbOnMobile)
	{
		// Since map links open the map app on mobile, remove target="_blank" attribute
		// to avoid unnecessarily opening a new tab
		document.getElementById("MapStationLink").removeAttribute("target");
		document.getElementById("MapCallLink").removeAttribute("target");
	}
	
	updateTimes();
	setInterval(updateTimes, 10000);  // once every 10 secs
	
	// Header is floating fixed, so pad the rest of the content (Calls) down to just below header
	var divPageHeader = document.getElementById("PageHeader");
	var divCalls = document.getElementById("Calls");
	divCalls.style.paddingTop = divPageHeader.offsetHeight + "px";
	
	refreshData();
}


function isOnMobile()
{
	var strUserAgent = navigator.userAgent || navigator.vendor || window.opera;
	
	// iOS detection from http://stackoverflow.com/a/9039885/177710
	if (/iPad|iPhone|iPod/.test(strUserAgent) && !window.MSStream)
		return true;

	if (/android/i.test(strUserAgent))
		return true;
	
	return false;
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
	const knNewCallAgeMillis = 4 * 60000;		// consider call "new" if < 4 minutes old
	
	var nNowMillis = (new Date()).getTime();
	var strCurrUnit = document.getElementById("UnitInput").value.toUpperCase();
	var divCalls = document.getElementById("Calls");
	
	// Empty out Calls div
	while (divCalls.firstChild)
		divCalls.removeChild(divCalls.firstChild);
	
	var divCurrCall = null;
	var strCurrCallMapUrl = null;
	var divMaybeCurrCall = null;
	var strMaybeCurrCallMapUrl = null;
	
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
		var callTime = new Date(objIncident.time);
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
					strUnit += '&ctdot;<img class="TransportIcon" src="PulsePointFeed/TransportIcon.png" />'
				
				strUnits += strUnit
			}
		}
		
		var bNoUnits = !strUnits;
		if (bNoUnits)
			strUnits = "???";
		
		var strUnitsEtc = '<span class="Units">' + strUnits + '</span>';
		if (objIncident.firstDue)
			strUnitsEtc += " (" + objIncident.firstDue + "&rsquo;s)";
		
		// Create and insert the elements...
		var divCall = addDiv(divCalls, "Call");
		
		var divTypeAndTime = addDiv(divCall, "LeftRight");
		var divType = addDiv(divTypeAndTime, "Deemphasize", strCallType);
		var imgType = document.createElement("img");
		imgType.className = "CallTypeIcon";
		imgType.src = strTypeImageUrl;
		divType.insertBefore(imgType, divType.firstChild);
		addDiv(divTypeAndTime, "RelTime", "-").time = callTime;
		
		//if (objIncident.cmd)
		//  addDiv(divCall, null, objIncident.cmd);
		
		addDiv(divCall, "UnitsEtc", strUnitsEtc);
		
		var strMapCallUrl = getMapUrl(objIncident.latlong);
		var linkAddress = document.createElement("a");
		linkAddress.className = "Address LeftLeft";
		linkAddress.href = strMapCallUrl;
		linkAddress.onclick = onCallAddressClicked;
		// Since map links open the map app on mobile, exclude target="_blank" attribute
		// to avoid unnecessarily opening a new tab
		if (!gbOnMobile)
			linkAddress.target = "_blank";
		
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
			divCurrCall = divCall;
			strCurrCallMapUrl = strMapCallUrl;
		}
		else if (bNoUnits && ((nNowMillis - callTime.getTime()) < knNewCallAgeMillis))
		{
			divMaybeCurrCall = divCall;
			strMaybeCurrCallMapUrl = strMapCallUrl;
		}
		
		addSpacer(divCalls);
	}
	
	gDivCurrCall = divCurrCall || divMaybeCurrCall;
	gstrCurrCallMapUrl = strCurrCallMapUrl || strMaybeCurrCallMapUrl;
	
	if (gDivCurrCall)
		gDivCurrCall.className += " CurrCall";
	
	updateTimes();
}


function scrollToCurrCall()
{
	if (gDivCurrCall)
		gDivCurrCall.scrollIntoView({behavior: "smooth", block: "start", inline: "start"});
}


function getMapUrl(strDest)
{
	const kStrDirectionsUrl = "https://www.google.com/maps/dir/?api=1&destination=%s&travelmode=driving";
	const kStrAppDirectionsUrl = "comgooglemapsurl://www.google.com/maps/dir/?api=1&destination=%s&travelmode=driving";
	
	//var strUrl = gbOnMobile? kStrAppDirectionsUrl : kStrDirectionsUrl;
	var strUrl = kStrDirectionsUrl;		//#####################################
	return strUrl.replace("%s", strDest);
}


function onCallAddressClicked()
{
	// this keyword inside the handler is set to the DOM element
	console.log("ADDRESS CLICKED: " + this.href);
	
	// Remember the most recently clicked call address
	localStorage.setItem("lastCallAddressClicked", this.href);
	
	return true; // continue with default handling of event
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


function refreshData(fcnAfterComplete)
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
					"time": "2019-06-17T03:18:30Z",
					"type": "PS",
					"typeName": "Public Service",
					"latlong": "37.3436547778,-121.8375635556",
					"address": "Story Rd & Hopkins Dr",
					"public": true,
					"units": []
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
		
		updateWithReceivedData(JSON.stringify(objResponse));
	}
	else
	{
		var objReq = new XMLHttpRequest();
		objReq.fcnAfterComplete = fcnAfterComplete;
		objReq.addEventListener("load", updateWithReceivedData);
		//objReq.open("GET", "https://script.google.com/macros/s/AKfycbwAN-d88IGiGX6t7ddHp2pidzzfco6JjWKawzp-hAhrEHwxMI5J/exec");
		//objReq.open("GET", "http://localhost:4000/");
		objReq.open("GET", kstrDataUrl);
		objReq.send();
	}
}


function updateWithReceivedData(strResponseJson)
{
	strResponseJson = this.responseText || strResponseJson;
	
	animateRefresh(false);
	document.getElementById("RefreshedTime").time = new Date();

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
	
	if (this.fcnAfterComplete)
		this.fcnAfterComplete();
}


function animateRefresh(bOn)
{
	const kstrRefreshStaticImg = "PulsePointFeed/RefreshButton.gif";
	const kstrRefreshAnimImg = "PulsePointFeed/RefreshAnim.gif";
	
	document.getElementById("RefreshButton").src = (bOn? kstrRefreshAnimImg : kstrRefreshStaticImg);
}


function unitInput_onFocus(eltUnitInput)
{
	// Select just the number portion
	var strCurrVal = eltUnitInput.value;
	var nFrom = 0;
	var nTo = strCurrVal.length;
	var match = /^([A-Z]+)\d*$/i.exec(strCurrVal);
	if (match)
		nFrom = match[1].length;
	
	eltUnitInput.setSelectionRange(nFrom, nTo);
}


function unitInput_onBlur(eltUnitInput)
{
	// To hilite the current call (in case it didn't update while editing the input)
	setTimeout(updatePage, 100);
}


// NOTE: Only handling onKeyDown to catch backspace/delete and pass them to unitInput_onKeyPress
// (since they don't generate onKeyPress events)
function unitInput_onKeyDown(eltUnitInput, evt)
{
	var ch = evt.which || evt.keyCode || evt.key.charCodeAt(0);
	
	if (ch === 8 || ch === 46)	// backspace, delete
		return unitInput_onKeyPress(eltUnitInput, evt);
	
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
		var strVal = eltUnitInput.value.toUpperCase();
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
		
		var bRequireValidValue = !bIsBackspaceOrDelete;  // allow validation fail only if backspace/delete
		if (unitInput_saveValue(eltUnitInput, strVal, bRequireValidValue))
			return true;

		// The added number/letter causes validation fail, so prevent the keypress
		evt.preventDefault();
		return false;
	}
	else if (ch === 13)
	{
		// Special case for iOS Safari: extra unfocus actions in order to make iOS keyboard dismiss
		document.activeElement.blur();
		eltUnitInput.blur();
		window.focus();
		
		// Note: updatePage will happen here via unitInput_onBlur
		setTimeout(scrollToCurrCall, 150);
		evt.preventDefault();
		return false;
	}
	else
	{
		// Prevent all other keys
		evt.preventDefault();
		return false;
	}
	// NOTE: No need to check for any cursor-movement keys here, as they don't generate onKeyPress events
}


function unitInput_saveValue(eltUnitInput, strVal, bRequireValidValue)
{
	strVal = strVal.toUpperCase();
	
	var strCurrUnit = null;
	var strUnitNumber = null;
	
	//######## EVENTUALLY MORE VALIDATION? (E.G. RESTRICT TO [ETUS]\d{1,3} and PREVENT LEADING ZERO AFTER LETTER ???)
	var match = /^[A-Z]{1,3}(\d{0,3})$/.exec(strVal);
	if (match)
		[strCurrUnit, strUnitNumber] = match;
	else if (bRequireValidValue)
		return false
	else // (!bRequireValidValue)
		strCurrUnit = strVal;		// accept value even though it fails validation
	
	//console.log("strCurrUnit = %s  /  strUnitNumber = %s", strCurrUnit, strUnitNumber);
	
	var strMapStationUrl = "";
	if (strUnitNumber)
	{
		var nStationNumber = parseInt(strUnitNumber, 10) % 100;  // just last 2 digits of unit number
		strMapStationUrl = getMapUrl("San Jose Fire Department Station " + nStationNumber);
	}
	document.getElementById("MapStationLink").href = strMapStationUrl;
	
	localStorage.setItem("currUnit", strCurrUnit);
	setTimeout(updatePage, 100);
	//setTimeout(scrollToCurrCall, 150);
	return true;
}


// Do synchronous requests in order to "connect" redirect/popup to user's click (and thus avoid redirect/popup-blocking)
function awaitAndMapCallForUnit()
{
	//refreshData(awaitAndMapCallForUnit3);
	document.getElementById("ModalOverlay").style.display = "block";
	document.getElementById("WaitCallModal").style.display = "block";
	document.getElementById("Calls").style.position = "fixed";
	
	animateRefresh(true);
	setTimeout(awaitAndMapCallForUnit2, 100);
}
function awaitAndMapCallForUnit3()
{
	objReq = new XMLHttpRequest();
	objReq.open("GET", kstrServerUrl + "wait?m=4000", false);  // 'false' makes the request synchronous
	objReq.send();
	refreshData(awaitAndMapCallForUnit4);
}
function awaitAndMapCallForUnit4()
{
	objReq = new XMLHttpRequest();
	objReq.open("GET", kstrServerUrl + "wait?m=4000", false);  // 'false' makes the request synchronous
	objReq.send();
	refreshData(awaitAndMapCallForUnit5);
}
function awaitAndMapCallForUnit5()
{
	objReq = new XMLHttpRequest();
	objReq.open("GET", kstrServerUrl + "wait?m=4000", false);  // 'false' makes the request synchronous
	objReq.send();
	refreshData(awaitAndMapCallForUnit6);
}
function awaitAndMapCallForUnit6()
{
	window.location.href = getMapUrl("San Jose Fire Department Station 34");
}


function awaitAndMapCallForUnit2()
{
  const knWaitBetweenRequestsMillisec = 5000;   // 5 seconds
  //const knTimeoutMillisec = 60000;              // 60 seconds
  const knTimeoutMillisec = 30000;              // 30 seconds #################### FOR TESTING
  const kstrWaitUrl = kstrServerUrl + "wait?m=" + knWaitBetweenRequestsMillisec;
  
  var nTimeoutTime = (new Date()).getTime() + knTimeoutMillisec;
	while (!gDivCurrCall && (new Date()).getTime() < nTimeoutTime)
	{
		animateRefresh(true);
		var objReq = new XMLHttpRequest();
		objReq.open("GET", kstrDataUrl, false);  // 'false' makes the request synchronous
		objReq.send();
		updateWithReceivedData(objReq.responseText);
		//var TEST = document.getElementById("Calls").offsetHeight;
		//TEST = window.getComputedStyle(document.getElementById("Calls"));
		
		animateRefresh(true);
		objReq = new XMLHttpRequest();
		objReq.open("GET", kstrWaitUrl, false);  // 'false' makes the request synchronous
		objReq.send();
	}
	
	animateRefresh(false);
	//if (gDivCurrCall)
	//	window.location.href = gstrCurrCallMapUrl;
	window.location.href = getMapUrl("San Jose Fire Department Station 34");	//############## FOR TESTING
}

