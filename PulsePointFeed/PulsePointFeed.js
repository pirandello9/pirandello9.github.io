
// Global vars
var gStrCurrentUnit = "";
var gStrLastJson = "";
var gArrActiveIncs = [];



function init()
{
  gStrCurrentUnit = localStorage.getItem("currUnit");
  if (gStrCurrentUnit)
    document.getElementById("UnitInput").value = gStrCurrentUnit;
  
  updateTimes();
  setInterval(updateTimes, 10000);  // once every 10 secs
  
  refreshData();
}


function updateTimes()
{
  var now = new Date();
  var arrRelTimes = document.getElementById("Calls").getElementsByClassName("RelTime");
  for (var i = 0; i < arrRelTimes.length; i++)
  {
    var eltRelTime = arrRelTimes[i];
    var strRelTime;
    var nDiffMilliSecs = (now - eltRelTime.callTime);
    var fDiffMins = nDiffMilliSecs / 60000;
    if (fDiffMins < 1.0)
      strRelTime = "<1m";
    else if (fDiffMins > 1440.0)
      strRelTime = Math.round(fDiffMins / 1440.0) + "d";
    else if (fDiffMins > 99.0)
      strRelTime = Math.round(fDiffMins / 60.0) + "h";
    else
      strRelTime = Math.round(fDiffMins) + "m";
    
    if (eltRelTime.strRelTime !== strRelTime)
    {
      eltRelTime.strRelTime = strRelTime;
      eltRelTime.innerText = strRelTime;
    }
  }
}


function updatePage()
{
  const kStrDirectionsUrl = "https://www.google.com/maps/dir/?api=1&destination=%s&travelmode=driving";

  var strCurrUnit = document.getElementById("UnitInput").value;
  var divCalls = document.getElementById("Calls");
  
  // Empty out Calls div
  while (divCalls.firstChild)
    divCalls.removeChild(divCalls.firstChild);
  
  for (var i = 0; i < gArrActiveIncs.length; i++)
  {
    var objIncident = gArrActiveIncs[i];
    
    //"time": "2019-06-04T04:17:30Z",
    //"type": "Public Service",
    //"alarm": "2"
    //"latlong": "37.3436547778,-121.8375635556",
    //"address": "Story Rd & Hopkins Dr",
    //"placeName": "Golden Wheel MHP",
    //"public": true,
    //"units": ["E16","T16"],
    //"firstDue": "34",
    //"cmd": "CMD12",
    
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
    
    var arrUnits = objIncident.units;
    var bIncludesCurrUnit = arrUnits.includes(strCurrUnit);
    var strUnitsEtc = '<span class="Units">' + arrUnits.join(", ") + '</span>';
    if (bIncludesCurrUnit)
    {
      var strEmphasizedUnit = '<span class="CurrUnit">' + strCurrUnit + '</span>';
      strUnitsEtc = strUnitsEtc.replace(new RegExp("\\b" + strCurrUnit + "\\b"), strEmphasizedUnit);
    }
    if (objIncident.firstDue)
      strUnitsEtc += " (" + objIncident.firstDue + "&rsquo;s)";
    
    var strMapAddressUrl = kStrDirectionsUrl.replace("%s", objIncident.latlong);
    
    // Create and insert the elements...
    var divCall = addDiv(divCalls, (bIncludesCurrUnit? "Call CurrCall" : "Call"));
    
    var divTypeAndTime = addDiv(divCall, "LeftRight");
    var divType = addDiv(divTypeAndTime, "Deemphasize", strCallType);
    var imgType = document.createElement("img");
    imgType.className = "CallTypeIcon";
    imgType.src = strTypeImageUrl;
    divType.insertBefore(imgType, divType.firstChild);
    addDiv(divTypeAndTime, "RelTime", "-").callTime = new Date(objIncident.time);
    
    //if (objIncident.cmd)
    //  addDiv(divCall, null, objIncident.cmd);
    
    addDiv(divCall, "UnitsEtc", strUnitsEtc);
    
    var linkAddress = document.createElement("a");
    linkAddress.className = "Address LeftLeft";
    linkAddress.href = strMapAddressUrl;
    linkAddress.target = "_blank";
    divCall.appendChild(linkAddress);
    if (objIncident.placeName || objIncident.public)
    {
      addDiv(linkAddress, null, objIncident.address + "&nbsp;");
      addDiv(linkAddress, null, "(" + (objIncident.placeName || "public") + ")");
    }
    else
      addDiv(linkAddress, null, objIncident.address);
    
    var hr = document.createElement("hr");
    hr.className = "Spacer";
    divCalls.appendChild(hr);
  }
  
  updateTimes();
  
  //var strLocale = 'en-US';
  //var options = { timeZone:'America/Los_Angeles' };
  var now = new Date();
  //var options = {month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: 'true'};
  var options = {hour: 'numeric', minute: '2-digit', hour12: 'true'};
  var strDateTime = now.toLocaleTimeString("en-US", options);
  strDateTime = strDateTime.replace(/ \b([AP]M)\b/i, "$1").toLowerCase();
  //strDateTime = strDateTime.replace(/,/g, "");
}


function updateRefreshedTime()
{
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
    var arrActiveIncs =
      [
        {
          "time": "2019-06-04T04:22:30Z",
          "type": "ME",
          "typeName": "Medical",
          "latlong": "37.3701980556,-121.8429499722",
          "address": "McKee Rd",
          "public": true,
          "units": [
            "E2"
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
            "E16",
            "T16"
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
            "B1",
            "B5",
            "E23",
            "E34",
            "T1",
            "U34A",
            "U34B"
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
            "E26"
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
            "E17"
          ]
        }
      ];
    
    onDataReceived(JSON.stringify(arrActiveIncs));
  }
  else
  {
    var objReq = new XMLHttpRequest();
    objReq.addEventListener("load", onDataReceived);
    objReq.open("GET", "https://script.google.com/macros/s/AKfycbwAN-d88IGiGX6t7ddHp2pidzzfco6JjWKawzp-hAhrEHwxMI5J/exec");
    objReq.send();
  }
}


function onDataReceived()
{
  animateRefresh(false);
  
  //var strResponseJson = this.responseText;
  var strResponseJson = this.responseText || arguments[0];  //########### FOR TESTING
  //console.log(strResponseJson);
  
  updateRefreshedTime();
  
  if (strResponseJson === gStrLastJson)
    console.log("Received same as current data from pulsepoint");
  else
  {
    gStrLastJson = strResponseJson;
    gArrActiveIncs = JSON.parse(strResponseJson);
    
    console.log("Received %d active calls from pulsepoint", gArrActiveIncs.length);
    
    
    
    updatePage();
  }
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
  var arrMatch = /^([A-Z]+)\d*$/i.exec(strCurrVal);
  if (arrMatch)
    nFrom = arrMatch[1].length;
  
  eltUnitInput.setSelectionRange(nFrom, nTo);
}


function unitInput_changed(eltUnitInput, event)
{
  var char = event.which || event.keyCode;
  if (char === 13)
  {
    // Do some seemingly redundant unfocus actions in order to dismiss iOS keyboard
    document.activeElement.blur();
    eltUnitInput.blur();
    window.focus();
    return;
  }

  var val = eltUnitInput.value.match(/^[A-Z]{1,3}\d{0,3}/i);
  //######## EVENTUALLY MORE VALIDATION? (E.G. RESTRICT TO [ETUS]\d{1,3} ???)
  gStrCurrentUnit = val? val.toString().toUpperCase() : "";
  eltUnitInput.value = gStrCurrentUnit;
  
  localStorage.setItem("currUnit", gStrCurrentUnit);
  
  updatePage();
  
  return false; // prevent default handling of event
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
