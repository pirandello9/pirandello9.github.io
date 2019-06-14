
// Global vars
var gStrCurrentUnit = "";  //////################ I DON'T THINK THIS GLOBAL IS NEEDED (?) ###########
var gStrLastJson = "";
var gArrAlerts = [];
var gArrActiveCalls = [];
var gDivCurrCall = null;
var gLinkCurrAddress = null;



function init()
{
	gStrCurrentUnit = localStorage.getItem("currUnit");
	if (gStrCurrentUnit)
	{
		var eltUnitInput = document.getElementById("UnitInput");
		eltUnitInput.value = gStrCurrentUnit;
		unitInput_changed(eltUnitInput);
	}
	
	updateTimes();
	setInterval(updateTimes, 10000);  // once every 10 secs
	
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
					strRelTime = "<" + (Math.floor(nDiffSecs / 10) + 1) + "0s";
				else
					strRelTime = "<1m";
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
	var strCurrUnit = document.getElementById("UnitInput").value;
	var divCalls = document.getElementById("Calls");
	
	// Empty out Calls div
	while (divCalls.firstChild)
		divCalls.removeChild(divCalls.firstChild);
	
	gDivCurrCall = null;
	gLinkCurrAddress = null;
	
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
		
		var hr = document.createElement("hr");
		hr.className = "Spacer";
		divCalls.appendChild(hr);
	}
	
	updateTimes();
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
	
	if (gDivCurrCall)
		gDivCurrCall.scrollIntoView({behavior: "smooth", block: "end", inline: "start"});
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


// Called for onKeyDown and onKeyUp  #########--> REMOVED onKeyUp="unitInput_changed(this, event)"
function unitInput_changed(eltUnitInput, event)
{
	var strVal = eltUnitInput.value;
	var nSelStart = eltUnitInput.selectionStart;
	var strAddedChar = "";
	
	if (event)
	{
		var ch = event.which || event.keyCode;
		if (ch === 13)
		{
			// Do some seemingly redundant unfocus actions in order to dismiss iOS keyboard
			document.activeElement.blur();
			eltUnitInput.blur();
			window.focus();
			
			// Special case for iOS Safari: the updatePage() for each keypress doesn't always work (?)
			updatePage();
			return false; // prevent default handling of event
		}
		
		// Special case for iOS Safari: typing doesn't always replace currently selected text (?),
		// so manually delete selection for relevent chars
		
		var bDeleteSelected = (ch === 8 || ch === 46);					// backspace, delete
		
		if ((ch >= 48 && ch <= 57) || (ch >= 97 && ch <= 122) || (ch >= 65 && ch <= 90))		// digits, lowercase/uppercase letters
		{
			strAddedChar = String.fromCharCode(ch);
			bDeleteSelected = true;
			
			//console.log("SEL:  %s - %s", eltUnitInput.selectionStart, eltUnitInput.selectionEnd);
			//alert("SEL:  " + eltUnitInput.selectionStart + " - " + eltUnitInput.selectionEnd);
			
			//save the original cursor position
			//var nSelStart = eltUnitInput.selectionStart
			//strVal = strVal.substr(0, nSelStart) + strVal.substr(eltUnitInput.selectionEnd);
			//eltUnitInput.value = strVal;
			//restore original cursor position
			//eltUnitInput.selectionStart = eltUnitInput.selectionEnd = nSelStart;
			//alert('HERE');
		}
		
		if (bDeleteSelected)
			strVal = strVal.substr(0, nSelStart) + strVal.substr(eltUnitInput.selectionEnd);
	}
	
	gStrCurrentUnit = "";
	var strMapAddressUrl = "";
	
	if (strAddedChar)
	{
		strTestVal = (strVal.substr(0, nSelStart) + strAddedChar + strVal.substr(nSelStart)).toUpperCase();
	
		//######## EVENTUALLY MORE VALIDATION? (E.G. RESTRICT TO [ETUS]\d{1,3} ???)
		var match = /^[A-Z]{1,3}(\d{0,3})/.exec(strTestVal);
		if (!match || match[0] !== strTestVal)
			return false;
		
		if (match)
		{
			gStrCurrentUnit = match[0].toUpperCase();
			var strStationNumber = match[1];
			if (strStationNumber)
			{
				var nStationNumber = parseInt(strStationNumber, 10) % 100;  // just last 2 digits of unit number
				strMapAddressUrl = getMapLink("San Jose Fire Department Station " + nStationNumber);
			}
		}
	}
	
	//eltUnitInput.value = gStrCurrentUnit;
	//eltUnitInput.setSelectionRange(nSelStart, nSelStart);
	
	localStorage.setItem("currUnit", gStrCurrentUnit);
	
	document.getElementById("UnitStationLink").href = strMapAddressUrl;
	
	setTimeout(updatePage, 10);
	return true;
	
	//updatePage();
	//
	//return false; // prevent default handling of event
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




//function updateAssignedTimeIndicators(dateTimeCurr)
//{
//  const kstrNextMarker = "?";  // (? seems too big/garish on iphone)
//  var arrAssignedTables = document.querySelectorAll("table.AssignedTable");
//  for (var i = 0; i < arrAssignedTables.length; i++)
//  {
//    var eltAssignedTable = arrAssignedTables[i];
//    var strShiftDate = eltAssignedTable.getAttribute("data-date");
//    for (var j = 0; j < eltAssignedTable.rows.length; j++)
//    {
//      var eltRow = eltAssignedTable.rows[j];
//      eltRow.classList.remove("Past");
//      eltRow.classList.remove("Current");
//      var strTimes = eltRow.getAttribute("data-times");
//      if (strTimes)
//      {
//        var strStartTime = strTimes.substr(0, 5);
//        var datetimeStart = getDatetimeInShift(strShiftDate, strStartTime, false);
//        if (dateTimeCurr > datetimeStart)
//        {
//          var strEndTime = strTimes.substr(strTimes.length - 5);
//          var datetimeEnd = getDatetimeInShift(strShiftDate, strEndTime, true);
//          //alert("curr = " + dateTimeCurr + "\nstart = " + datetimeStart + "\nend = " + datetimeEnd);
//          eltRow.classList.add((dateTimeCurr < datetimeEnd)? "Current" : "Past");
//        }
//        else
//        {
//          eltRow.cells[0].textContent = kstrNextMarker;
//          return;
//        }
//      }
//    }
//  }
//}
//
//function getDatetimeInShift(strShiftDate, strTime, bIsEndTime)
//{
//  var nHour = parseInt(strTime.substr(0, 2), 10);
//  var bNextMorning = bIsEndTime? (nHour <= 8) : (nHour < 8);
//  var datetime = new Date(strShiftDate + " " + strTime);
//  if (bNextMorning)
//    datetime.setDate(datetime.getDate() + 1);
//  return datetime;
//}
