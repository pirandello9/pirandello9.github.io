
// Global vars
var gStrCurrentUnit = "";
var gStrLastJson = "";


function reqListener()
{
  console.log(this.responseText);
}


function init()
{
  gStrCurrentUnit = localStorage.getItem("currUnit");
  if (gStrCurrentUnit)
    document.getElementById("unitInput").value = gStrCurrentUnit;
  
  updateTimes();
  setInterval(updateTimes, 10000);  // once every 10 secs
  
  refreshData();
  

  return;
  
  
  ///////////////////////////////////////////
  console.log("Requesting pulsepoint data...");
  
  var oReq = new XMLHttpRequest();
  oReq.addEventListener("load", reqListener);
  oReq.open("GET", "https://script.google.com/macros/s/AKfycbwAN-d88IGiGX6t7ddHp2pidzzfco6JjWKawzp-hAhrEHwxMI5J/exec");
  oReq.send();
}


function updateTimes()
{
  var dateTimeCurr = new Date();
  
  
}


function updatePage(arrActiveIncs)
{
  
  
  
  for (var i = 0; i < arrActiveIncs.length; i++)
  {
    //var eltTR = document.createElement("tr");
    //var eltTD = document.createElement("td");
    
  }
  
  
  //var strLocale = 'en-US';
  //var options = { timeZone:'America/Los_Angeles' };
  var now = new Date();
  //var options = {month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: 'true'};
  var options = {hour: 'numeric', minute: '2-digit', hour12: 'true'};
  var strDateTime = now.toLocaleTimeString("en-US", options);
  strDateTime = strDateTime.replace(/ \b([AP]M)\b/i, "$1").toLowerCase();
  //strDateTime = strDateTime.replace(/,/g, "");
  
  var eltRefreshedTime = document.getElementById("refreshed");
  eltRefreshedTime.innerText = strDateTime;
}


function refreshData()
{
  animateRefresh(true);
  
  //############### FOR TESTING... ###################
  setTimeout(onDataReceived, 2500);
}


function onDataReceived()
{
  animateRefresh(false);
  
  //############### FOR TESTING... ###################
  var arrActiveIncs =
  [
    {
      "time": "2019-06-04T04:24:08Z",
      "type": "Medical",
      "latlong": "37.3701980556,-121.8429499722",
      "address": "Mckee Rd",
      "public": true,
      "units": [
        "E2"
      ]
    },
    {
      "time": "2019-06-04T04:17:30Z",
      "type": "Public Service",
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
      "type": "Medical",
      "latlong": "37.2836453333,-121.7904331389",
      "address": "Mountaire Ct",
      "units": [
        "E24",
        "E624"
      ]
    },
    {
      "time": "2019-06-04T04:12:21Z",
      "type": "Carbon Monoxide",
      "latlong": "37.2984915556,-121.8680324167",
      "address": "213 Azevedo Cir",
      "units": [
        "E26"
      ]
    },
    {
      "time": "2019-06-04T04:10:35Z",
      "type": "Medical",
      "latlong": "37.2299803611,-121.8684615556",
      "address": "Fleetwood Dr",
      "firstDue": "22",
      "units": [
        "E17"
      ]
    }
  ];
  
  updatePage(arrActiveIncs);
}


function animateRefresh(bOn)
{
  const kstrRefreshStaticImg = "RefreshButton.gif";
  const kstrRefreshAnimImg = "RefreshAnim.gif";
  
  document.getElementById("RefreshButton").src = (bOn? kstrRefreshAnimImg : kstrRefreshStaticImg);
}


function unitInput_selectNumber(eltUnitInput)
{
  var strCurrVal = eltUnitInput.value;
  var nFrom = 0;
  var nTo = strCurrVal.length;
  var arrMatch = /^([A-Z]+)\d+$/i.exec(strCurrVal);
  if (arrMatch)
    nFrom = arrMatch[1].length;
  
  eltUnitInput.setSelectionRange(nFrom, nTo);
}


function unitInput_changed(eltUnitInput, bDone)
{
  var val = eltUnitInput.value.match(/^[A-Z]{1,3}\d{0,3}/i);
  //######## EVENTUALLY MORE VALIDATION? (E.G. RESTRICT TO [ETUS]\d{1,3} ???)
  gStrCurrentUnit = val? val.toString().toUpperCase() : "";
  eltUnitInput.value = gStrCurrentUnit;
  
  localStorage.setItem("currUnit", gStrCurrentUnit);

  if (bDone)
    eltUnitInput.blur();
  
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
