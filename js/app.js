var _rawContentId = "raw_content";
var _processedContentId = "processed_content";
var _shiftDurationHours = "shift_duration_hours";
var _shiftDurationMinutes = "shift_duration_minutes";
var _shiftDurationSeconds = "shift_duration_seconds";
var _shiftDurationMilliseconds = "shift_duration_milliseconds";

function isNumber(e) {
  e = e ? e : window.event;
  var charCode = e.which ? e.which : e.keyCode;
  if (charCode > 31 && (charCode < 48 || charCode > 57) && charCode !== 45) {
    return false;
  }
  return true;
}

function validateNumber(e) {
  if (e.srcElement.value) {
    if (parseInt(e.srcElement.value.trim(), 10) > parseInt(e.srcElement.max, 10)) {
      e.srcElement.value = e.srcElement.max;
    }
    if (parseInt(e.srcElement.value.trim(), 10) < parseInt(e.srcElement.min, 10)) {
      e.srcElement.value = e.srcElement.min;
    }
  }
}

function zeroFilled(e) {
  let value = e.srcElement.value;
  let valueWidth = e.srcElement.max.length;
  if (value) {
    if (parseInt(value, 10) > 0) {
      e.srcElement.value = (new Array(valueWidth).join("0") + value).substr(-valueWidth);
    } else {
      let operator = value.charAt(0);
      value = value.split(operator)[1];
      value = (new Array(valueWidth).join("0") + value).substr(-valueWidth);
      e.srcElement.value = operator + value;
    }
  }
}

function setContent(elmentId, content) {
  document.getElementById(elmentId).value = content;
}

function getContent(elmentId) {
  return document.getElementById(elmentId).value;
}

function handleFiles(files) {
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    var reader = new FileReader();
    reader.onload = function (e) {
      setContent(_rawContentId, e.target.result);
      document.querySelector("#fileName").innerHTML = document.getElementById("fileElem").files[0].name;
    };
    reader.readAsText(file);
  }
}

function process() {
  let timeArray = [_shiftDurationHours, _shiftDurationMinutes, _shiftDurationSeconds, _shiftDurationMilliseconds];
  for (let i = 0; i < timeArray.length; i++) {
    let timeInput = timeArray[i];
    let timeInputElement = document.querySelector(`#${timeInput}`);
    let e = { srcElement: timeInputElement };
    zeroFilled(e);
    if (!timeInputElement.value) {
      let valueWidth = timeInputElement.max.length;
      timeInputElement.value = new Array(valueWidth + 1).join("0").substr(-valueWidth);
    }
  }
  if (!document.getElementById("raw_content").value.trim()) {
    setContent(_processedContentId, "");
    setTimeout(() => {
      alert("No subtitle source found !");
    }, 250);
    return;
  }
  var content = getContent(_rawContentId);
  var shiftDuration = moment.duration({
    milliseconds: Number(getContent(_shiftDurationMilliseconds)),
    seconds: Number(getContent(_shiftDurationSeconds)),
    minutes: Number(getContent(_shiftDurationMinutes)),
    hours: Number(getContent(_shiftDurationHours)),
    days: 0,
    weeks: 0,
    months: 0,
    years: 0,
  });
  var timeCode_Fromat = "HH:mm:ss,SSS";
  var timeCode_RgxPattern = "(\\d{2}:\\d{2}:\\d{2},\\d{3})";
  var timeCodesLine_RgxPattern = timeCode_RgxPattern + ".*-->.*" + timeCode_RgxPattern + "(?:\\r?\\n)";
  var t = moment(0, "HH");
  var timeCode_Rgx = new RegExp(timeCode_RgxPattern, "g");
  var timeCodesLine_Rgx = new RegExp(timeCodesLine_RgxPattern, "g");
  var startTime, endTime;
  setContent(_processedContentId, "");
  var result = content.replace(timeCodesLine_Rgx, function (timeCodeLineMatch) {
    var result = timeCodeLineMatch.replace(timeCode_Rgx, function (timeCodeMatch) {
      return moment(timeCodeMatch, timeCode_Fromat).add(shiftDuration).format(timeCode_Fromat);
    });
    return result;
  });
  setContent(_processedContentId, result);
  if (document.getElementById("processed_content").value.trim()) {
    saveTextAsFile();
  }
}

function saveTextAsFile() {
  var textToWrite = document.getElementById("processed_content").value;
  var textFileAsBlob = new Blob([textToWrite], { type: "text/plain" });
  var fileNameToSaveAs =
    document.getElementById("fileElem").files.length > 0
      ? document.getElementById("fileElem").files[0].name.replace(".srt", "") + "-resync.srt"
      : Date.now() + "-resync.srt";
  var downloadLink = document.createElement("a");
  downloadLink.download = fileNameToSaveAs;
  downloadLink.innerHTML = "Download File";
  if (window.webkitURL != null) {
    downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
  } else {
    downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
    downloadLink.onclick = destroyClickedElement;
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
  }
  downloadLink.click();
}

function raw_contentOnInput(el) {
  if (!el.value.trim()) {
    document.getElementById("processed_content").value = "";
  }
}

function procsessed_contentOnKeyPress(event) {
  event.preventDefault();
  let charCode = event.which || event.keyCode || event.charCode;
  if (charCode == 8 || charCode == 46) {
    return true;
  }
  return false;
}
