var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
var db;
var object_result = [];
var dbName = "gradingDB";
var ver;

window.onload = function() {
	openDb(dbName, "create table Student (StudentID, Name, Birthdate, Phone, Email, DepartmentID); create table Course (CourseID, Name, DepartmentID); create table Department (DepartmentID, Name, Phone, Email); create table Enrollment (SidCidT, StudentID, CourseID, Term, Grade)");
	var URL = window.location.href;
	if (URL.indexOf("main.html") != -1) {
		setTimeout("showAllStu()", 200);
	} else if (URL.indexOf("course.html") != -1) {
		setTimeout("showAllCourse()", 200);
	} else if (URL.indexOf("department.html") != -1) {
		setTimeout("showAllDepart()", 200);
	} else if (URL.indexOf("enrollment.html") != -1) {
		setTimeout("showAllEnroll()", 200);
	} else if (URL.indexOf("grading.html") != -1) {
		setTimeout("setupGrading()", 200);
	} else {}
}

function exe() {
	msg.style.display = "block";
	statusMsg.innerText = '';
	var command=document.getElementById('command').value;
	runSQL(dbName, command, "record");
}

function showAllStu() {
	document.getElementById('statusMsg').innerText = '';
	document.getElementById('searchID').style.display = "none";
	runSQL(dbName, "SELECT DepartmentID FROM Department", "hided_record");
	runSQL(dbName, "SELECT * FROM Student", "record");
	
	document.getElementById('modifyRecord').style.display = "block";
	setTimeout("addCol_Stu()", 200);
}

function addCol_Stu () {
	var table = document.getElementsByTagName('table');
	for (var i=0; i<table[0].rows.length; i++) {
		var newCell = table[0].rows[i].insertCell(-1);
		if (i != 0 ) {
			newCell.innerHTML = '<input type="button" value="Update" onclick="updateStu_form(' + i + ');">';
			newCell.innerHTML += '<input type="button" value="Delete" style="margin-left: 5px" onclick="delStu_action(' + i + ');">';
		} else {
			newCell.innerHTML = "Action";
		}
	}
}

function delStu_action (row) {
	document.getElementById('statusMsg').innerText = '';
	var table = document.getElementsByTagName('table');
	var sid = table[0].rows[row].cells[6].innerText;
	var confirmDel = confirm("Deletion confirm?\nStudent ID: " + sid) 
	if (confirmDel == true) {
		runSQL(dbName, "DELETE FROM Student WHERE StudentID = " + sid);
	}
	setTimeout("showAllStu()", 200);
}

function updateStu_form (row) {
	record.innerHTML = record.innerHTML.substring(0, record.innerHTML.indexOf("</table>")+8);
	document.getElementById('modifyRecord').style.display = "none";
	document.getElementById('statusMsg').innerText = '';
	var table = document.getElementsByTagName('table');
	var depart_value = table[0].rows[row].cells[2].innerText;
	for (var i=0; i<table[0].rows.length; i++) {
		table[0].rows[i].deleteCell(7);
	}
	
	for (var i=1; i<=5; i++) {
		if (i==2) {
			table[0].rows[row].cells[2].innerHTML = '<select id="updateStu_Depart">';
			table[0].rows[row].cells[2].innerHTML += '</select>';
		} else {
			table[0].rows[row].cells[i].innerHTML = '<input type="text" value="' + table[0].rows[row].cells[i].innerHTML + '">';
		}
	}
	
	for (var j=1; j<table[1].rows.length; j++) {
		if (table[1].rows[j].cells[1].innerText == depart_value) {
			updateStu_Depart.innerHTML += '<option selected="selected">' + table[1].rows[j].cells[1].innerText + '</option>';
		} else {
			updateStu_Depart.innerHTML += '<option>' + table[1].rows[j].cells[1].innerText + '</option>';
		}
	}
	
	record.innerHTML += '<br><input type="button" value="Save" onclick="updateStu_action(' + row +')">';
	record.innerHTML += '<input type="button" value="Cancel" style="margin-left: 10px" onclick="showAllStu()">';
}

function isValidDate(s) {
	var bits = s.split('-');
	var y = bits[0], m = bits[1], d = bits[2];
	var daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
	
	if ( (!(y % 4) && y % 100) || !(y % 400)) {
		daysInMonth[1] = 29;
	}
	return d <= daysInMonth[--m]
}

function updateStu_action (row) {
	var table = document.getElementsByTagName('table');
	var box = document.getElementsByTagName('input');
	var errorMsg = '';
	
	if (!box[4].value) {
		errorMsg += 'Birthdate cannot be NULL\n';
	}else if (!isValidDate(box[4].value)) {
		errorMsg += 'Birthdate: "' + box[4].value + '" is not a valid date\n';
	}
	
	if (!box[5].value) {
		errorMsg += 'Email cannot be NULL\n';
	}
	
	if (!box[6].value) {
		errorMsg += 'Name cannot be NULL\n';
	}
	
	if (!box[7].value) {
		errorMsg += 'Phone cannot be NULL\n';
	} else if (isNaN(box[7].value)) {
		errorMsg += 'Phone: "' + box[7].value + '" should be a number\n';
	}
	
	if (errorMsg) {
		alert(errorMsg);
		return;
	}
	
	runSQL(dbName, 'UPDATE Student SET Birthdate="' + box[4].value + '", DepartmentID="' + updateStu_Depart.value + '", Email="' + box[5].value + '", Name="' + box[6].value + '", Phone=' + box[7].value + ' WHERE StudentID =' + table[0].rows[row].cells[6].innerText);
	setTimeout("showAllStu()", 200);
}

function insertStu_addRow () {
	record.innerHTML = record.innerHTML.substring(0, record.innerHTML.indexOf("</table>")+8);
	document.getElementById('statusMsg').innerText = '';
	var table = document.getElementsByTagName('table');
	
	for (var i=0; i<table[0].rows.length; i++) {
		table[0].rows[i].deleteCell(7);
	}
	var row = table[0].insertRow(table[0].rows.length);
	for (var i=0; i<7; i++) {
		var newCell = row.insertCell(i);
		if (i==0) {
			newCell.innerHTML = table[0].rows.length-1;
		} else if (i==2){
			newCell.innerHTML = '<select id="updateStu_Depart">';
			newCell.innerHTML += '</select>';
		} else if (i==1){
			newCell.innerHTML = '<input type="text" value="yyyy-mm-dd">';
		} else {
			newCell.innerHTML = '<input type="text">';
		}
	}
	
	for (var j=1; j<table[1].rows.length; j++) {
		updateStu_Depart.innerHTML += '<option>' + table[1].rows[j].cells[1].innerText + '</option>';
	}
	document.getElementById('modifyRecord').style.display = "none";
	record.innerHTML += '<br><input type="button" value="Save" onclick="insertStu_action()">';
	record.innerHTML += '<input type="button" value="Cancel" style="margin-left: 10px" onclick="showAllStu()">';
}

function insertStu_action() {
	var table = document.getElementsByTagName('table');
	var box = document.getElementsByTagName('input');
	var errorMsg = '';
	
	if (!box[4].value) {
		errorMsg += 'Birthdate cannot be NULL\n';
	}else if (!isValidDate(box[4].value)) {
		errorMsg += 'Birthdate: "' + box[4].value + '" is not a valid date\n';
	}
	
	if (!box[5].value) {
		errorMsg += 'Email cannot be NULL\n';
	}
	
	if (!box[6].value) {
		errorMsg += 'Name cannot be NULL\n';
	}
	
	if (!box[7].value) {
		errorMsg += 'Phone cannot be NULL\n';
	} else if (isNaN(box[7].value)) {
		errorMsg += 'Phone: "' + box[7].value + '" should be a number\n';
	}
	
	if (!box[8].value) {
		errorMsg += 'StudentID cannot be NULL\n';
	} else if (isNaN(box[8].value)) {
		errorMsg += 'StudetnID: "' + box[8].value + '" should be a number\n';
	}
	
	if (errorMsg) {
		alert(errorMsg);
		return;
	}
	
	runSQL(dbName, 'INSERT INTO Student VALUES ("' + box[4].value + '", "' + updateStu_Depart.value + '", "' + box[5].value + '", "' + box[6].value + '", ' + box[7].value + ', ' + box[8].value + ')');
	setTimeout("showAllStu()", 200);
}

function searchStu() {
	document.getElementById('searchID').style.display = "block";
	document.getElementById('modifyRecord').style.display = "none";
	document.getElementById('sidText').value = '';
	document.getElementById('statusMsg').innerText = '';
	record.innerHTML = '';
}

function searchStuGo() {
	var sid=document.getElementById('sidText').value;
	if (sid && isNaN(sid) == false) {
		runSQL(dbName, "SELECT * FROM Student WHERE StudentID = " + sid, "record");
	} else {
		alert('Student ID should be a number');
	}
}

function getXMLHttp() {
	var xmlhttp;
	if (window.XMLHttpRequest) {
		xmlhttp=new XMLHttpRequest();
	} else {
		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	return xmlhttp;
}

function HandleResponse(response) {
	document.getElementById('statusMsg').innerText = response;
}

function uploadStu_handler() {
	delStu_php();
}

function delStu_php() {
	document.getElementById('statusMsg').innerText = '';
	var xmlhttp = getXMLHttp();
	
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			uploadStu_php();
		}		
	}
	
	xmlhttp.open("POST", "main.php", true); 
	xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xmlhttp.send("requestType=delStu");

}

function uploadStu_php() {
	document.getElementById('statusMsg').innerText = '';
	var row_count = 0;
	var object_result = [];
	
	var request=indexedDB.open(dbName);
	request.onsuccess = function (e) {
		db = this.result;
		var transaction=db.transaction(["Student"]);
		var objectstore=transaction.objectStore("Student");
		var request = objectstore.openCursor();
		request.onsuccess = function(e) {
			var cursor = e.result || e.target.result;
			if (cursor) {
	
				var data ='{';
				for (var field in cursor.value) {
					if (typeof cursor.value[field] =="string") {
						data += field + ': "' + cursor.value[field] + '", ';
					} else {
						data += field + ': ' + cursor.value[field] + ',';
					}
				}

				data = data.slice(0, -1);
				data +='}';
				
				eval('object_result[row_count] =' +data);
				row_count++;
				data = '';
				
				cursor.continue();
			}
		}
		
		transaction.oncomplete = function(event) {
			var value = '';
			for (var i=0; i<Object.keys(object_result).length; i++) {
				for (var field in object_result[i]) {
					value += field+i + "=" + object_result[i][field] + "&";
				}
			}
			value = value.slice(0, -1);
			XHRtoUploadStu(row_count, value);
		}
	}
}

function XHRtoUploadStu(row_count, value) {
	var xmlhttp = getXMLHttp();
	
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			document.getElementById('statusMsg').innerText = xmlhttp.responseText;
		}
	}
	xmlhttp.open("POST", "main.php", true); 
	xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xmlhttp.send("requestType=uploadStu&rowCount=" + row_count + '&' + value);
}

function downloadStu_handler() {
	var modifyRecord = document.getElementById('modifyRecord');
	if (modifyRecord) {modifyRecord.style.display = "none";}
	downloadStu_php();
}

function XHRtoDownloadStu() {
	var xmlhttp = getXMLHttp();
	
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			runSQL(dbName, "DELETE FROM Student");
			var arr = xmlhttp.responseText.split('|');
			downloadStu_localInsert(arr);
			document.getElementById('statusMsg').innerText = "Synchronize - Success";
			record.innerHTML = '';
		}
	}
	
	xmlhttp.open("POST", "main.php", true); 
	xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xmlhttp.send("requestType=downloadStu");
}

function downloadStu_php() {
	document.getElementById('statusMsg').innerText = '';
	XHRtoDownloadStu();
}

function downloadStu_localInsert(arr) {
	var objectList = [];
	for (var i=0; i<arr.length-1; i++) {
		eval('objectList[i] =' +arr[i]);
		var command = 'INSERT INTO Student VALUES ("' + objectList[i].Birthdate + '", "' + objectList[i].DepartmentID + '", "' + objectList[i].Email + '", "' +  objectList[i].Name + '", ' + objectList[i].Phone + ', ' + objectList[i].StudentID + ')';
		runSQL(dbName, command);
	}
}

function searchCourse() {
	document.getElementById('searchID').style.display = "block";
	document.getElementById('modifyRecord').style.display = "none";
	document.getElementById('cidText').value = '';
	document.getElementById('statusMsg').innerText = '';
	record.innerHTML = '';
}

function searchCourseGo() {
	var cid=document.getElementById('cidText').value;
	runSQL(dbName, 'SELECT * FROM Course WHERE CourseID = "' + cid + '"', "record");
}

function insertCourse_addRow() {
	record.innerHTML = record.innerHTML.substring(0, record.innerHTML.indexOf("</table>")+8);
	document.getElementById('statusMsg').innerText = '';
	var table = document.getElementsByTagName('table');
	
	for (var i=0; i<table[0].rows.length; i++) {
		table[0].rows[i].deleteCell(4);
	}
	var row = table[0].insertRow(table[0].rows.length);
	for (var i=0; i<4; i++) {
		var newCell = row.insertCell(i);
		if (i==0) {
			newCell.innerHTML = table[0].rows.length-1;
		} else if (i==2){
			newCell.innerHTML = '<select id="updateStu_Depart">';
			newCell.innerHTML += '</select>';
		} else {
			newCell.innerHTML = '<input type="text">';
		}
	}
	for (var j=1; j<table[1].rows.length; j++) {
		updateStu_Depart.innerHTML += '<option>' + table[1].rows[j].cells[1].innerText + '</option>';
	}
	
	document.getElementById('modifyRecord').style.display = "none";
	record.innerHTML += '<br><input type="button" value="Save" onclick="insertCourse_action()">';
	record.innerHTML += '<input type="button" value="Cancel" style="margin-left: 10px" onclick="showAllCourse()">';
}

function showAllCourse() {
	document.getElementById('statusMsg').innerText = '';
	document.getElementById('searchID').style.display = "none";
	runSQL(dbName, "SELECT DepartmentID FROM Department", "hided_record");
	runSQL(dbName, "SELECT * FROM Course", "record");
	document.getElementById('modifyRecord').style.display = "block";
	setTimeout("addCol_Course()", 200);
}

function addCol_Course() {
	var table = document.getElementsByTagName('table');
	for (var i=0; i<table[0].rows.length; i++) {
		var newCell = table[0].rows[i].insertCell(-1);
		if (i != 0 ) {
			newCell.innerHTML = '<input type="button" value="Update" onclick="updateCourse_form(' + i + ');">';
			newCell.innerHTML += '<input type="button" value="Delete" style="margin-left: 5px" onclick="delCourse_action(' + i + ');">';
		} else {
			newCell.innerHTML = "Action";
		}
	}
}

function updateCourse_form(row) {
	record.innerHTML = record.innerHTML.substring(0, record.innerHTML.indexOf("</table>")+8);
	document.getElementById('modifyRecord').style.display = "none";
	document.getElementById('statusMsg').innerText = '';
	var table = document.getElementsByTagName('table');
	var depart_value = table[0].rows[row].cells[2].innerText;
	for (var i=0; i<table[0].rows.length; i++) {
		table[0].rows[i].deleteCell(4);
	}
	
	for (var i=2; i<=3; i++) {
		if (i==2) {
			table[0].rows[row].cells[2].innerHTML = '<select id="updateStu_Depart">';
			table[0].rows[row].cells[2].innerHTML += '</select>';
		} else {
			table[0].rows[row].cells[i].innerHTML = '<input type="text" value="' + table[0].rows[row].cells[i].innerHTML + '">';
		}
	}
	
	for (var j=1; j<table[1].rows.length; j++) {
		if (table[1].rows[j].cells[1].innerText == depart_value) {
			updateStu_Depart.innerHTML += '<option selected="selected">' + table[1].rows[j].cells[1].innerText + '</option>';
		} else {
			updateStu_Depart.innerHTML += '<option>' + table[1].rows[j].cells[1].innerText + '</option>';
		}
	}
	
	record.innerHTML += '<br><input type="button" value="Save" onclick="updateCourse_action(' + row +')">';
	record.innerHTML += '<input type="button" value="Cancel" style="margin-left: 10px" onclick="showAllCourse()">';
}

function delCourse_action(row) {
	document.getElementById('statusMsg').innerText = '';
	var table = document.getElementsByTagName('table');
	var cid = table[0].rows[row].cells[1].innerText;
	var confirmDel = confirm("Deletion confirm?\nCourse ID: " + cid) 
	if (confirmDel == true) {
		runSQL(dbName, 'DELETE FROM Course WHERE CourseID = "' + cid + '"');
	}
	setTimeout("showAllCourse()", 200);
}

function updateCourse_action(row) {
	var table = document.getElementsByTagName('table');
	var box = document.getElementsByTagName('input');
	var errorMsg = '';

	
	if (!box[4].value) {
		errorMsg += 'Name cannot be NULL\n';
	}
	
	if (errorMsg) {
		alert(errorMsg);
		return;
	}
	
	runSQL(dbName, 'UPDATE Course SET DepartmentID="' + updateStu_Depart.value + '", Name="' + box[4].value + '" WHERE CourseID ="' + table[0].rows[row].cells[1].innerText + '"');
	setTimeout("showAllCourse()", 200);
}

function insertCourse_action() {
	var table = document.getElementsByTagName('table');
	var box = document.getElementsByTagName('input');
	var errorMsg = '';
	
	if (!box[4].value) {
		errorMsg += 'CourseID cannot be NULL\n';
	}
	
	if (!box[5].value) {
		errorMsg += 'Name cannot be NULL\n';
	}
	
	if (errorMsg) {
		alert(errorMsg);
		return;
	}
	
	runSQL(dbName, 'INSERT INTO Course VALUES ("' + box[4].value + '", "' + updateStu_Depart.value + '", "' + box[5].value + '")');
	setTimeout("showAllCourse()", 200);
}

function uploadCourse_handler() {
	delCourse_php();
}

function delCourse_php() {
	document.getElementById('statusMsg').innerText = '';
	var xmlhttp = getXMLHttp();
	
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			uploadCourse_php();
		}
	}
	
	xmlhttp.open("POST", "main.php", true); 
	xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xmlhttp.send("requestType=delCourse");
}

function uploadCourse_php() {
	document.getElementById('statusMsg').innerText = '';
	var row_count = 0;
	var object_result = [];
	
	var request=indexedDB.open(dbName);
	request.onsuccess = function (e) {
		db = this.result;
		var transaction=db.transaction(["Course"]);
		var objectstore=transaction.objectStore("Course");
		var request = objectstore.openCursor();
		request.onsuccess = function(e) {
			var cursor = e.result || e.target.result;
			if (cursor) {
	
				var data ='{';
				for (var field in cursor.value) {
					if (typeof cursor.value[field] =="string") {
						data += field + ': "' + cursor.value[field] + '", ';
					} else {
						data += field + ': ' + cursor.value[field] + ',';
					}
				}

				data = data.slice(0, -1);
				data +='}';
				
				eval('object_result[row_count] =' +data);
				row_count++;
				data = '';
				
				cursor.continue();
			}
		}
		
		transaction.oncomplete = function(event) {
			var value = '';
			for (var i=0; i<Object.keys(object_result).length; i++) {
				for (var field in object_result[i]) {
					value += field+i + "=" + object_result[i][field] + "&";
				}
			}
			value = value.slice(0, -1);
			XHRtoUploadCourse(row_count, value);
		}
	}
}

function XHRtoUploadCourse(row_count, value) {
	var xmlhttp = getXMLHttp();
	
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			document.getElementById('statusMsg').innerText = xmlhttp.responseText;
		}
	}
	
	xmlhttp.open("POST", "main.php", true); 
	xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xmlhttp.send("requestType=uploadCourse&rowCount=" + row_count + '&' + value);
}

function downloadCourse_handler() {
	var modifyRecord = document.getElementById('modifyRecord');
	if (modifyRecord) {modifyRecord.style.display = "none";}
	downloadCourse_php();
}

function downloadCourse_php() {
	document.getElementById('statusMsg').innerText = '';
	XHRtoDownloadCourse();
}

function XHRtoDownloadCourse() {
	var xmlhttp = getXMLHttp();
	
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			runSQL(dbName, "DELETE FROM Course");
			var arr = xmlhttp.responseText.split('|');
			downloadCourse_localInsert(arr);
			document.getElementById('statusMsg').innerText = "Synchronize - Success";
			record.innerHTML = '';
		}
	}
	
	xmlhttp.open("POST", "main.php", true); 
	xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xmlhttp.send("requestType=downloadCourse");
}

function downloadCourse_localInsert(arr) {
	var objectList = [];
	for (var i=0; i<arr.length-1; i++) {
		eval('objectList[i] =' +arr[i]);
		var command = 'INSERT INTO Course VALUES ("' + objectList[i].CourseID + '", "' + objectList[i].DepartmentID + '", "' +  objectList[i].Name + '")';
		runSQL(dbName, command);
	}
}

function uploadAll_handler() {
	uploadStu_handler(); 
	uploadCourse_handler();
	uploadDepart_handler();
	uploadEnroll_handler();
}

function downloadAll_handler() {
	var msg = document.getElementById('msg');
	if (msg) {msg.style.display = "none";}
	downloadStu_handler(); 
	downloadCourse_handler();
	downloadDepart_handler();
	downloadEnroll_handler();
}

function setupGrading() {
	runSQL(dbName, "SELECT CourseID, Term FROM Enrollment", "hided_record");
	setTimeout("updateSelectG()", 200);
}

function updateSelectG() {
	var courseID = new Array ();
	var term = new Array ();
	var table = document.getElementsByTagName('table');
	
	for (var i=1; i<table[0].rows.length; i++) {
		var isCourseExist = false;
		for (var j=0; j<courseID.length; j++) {
			if (courseID[j] == table[0].rows[i].cells[1].innerText) {
				isCourseExist = true;
			}
		}
		if (isCourseExist == false) {
			courseID[courseID.length] = table[0].rows[i].cells[1].innerText;
		}
		
		var isTermExist = false;
		for (var j=0; j<term.length; j++) {
			if (term[j] == table[0].rows[i].cells[2].innerText) {
				isTermExist = true;
			}
		}
		if (isTermExist == false) {
			term[term.length] = table[0].rows[i].cells[2].innerText;
		}
	}
	
	for (var i=0; i<courseID.length; i++) {
		searchCourse_grade.innerHTML += '<option>' + courseID[i] + '</option>';
	}
	
	for (var i=0; i<term.length; i++) {
		searchTerm_grade.innerHTML += '<option>' + term[i] + '</option>';
	}
}

function showSelectedCourse() {
	Stu_record_G.innerHTML = '';
	var courseInput = document.getElementById('searchCourse_grade').value;
	var termInput = document.getElementById('searchTerm_grade').value;
	document.getElementById('statusMsg').innerText = '';
		
	runSQL(dbName, 'SELECT StudentID, Grade FROM Enrollment WHERE CourseID="' + courseInput + '" and Term="' + termInput + '"', "record" );
	setTimeout("addUpdateBotton()", 200);
}

function addUpdateBotton() {
	record.innerHTML = record.innerHTML.replace("Enrollment", "Grade");
	record.innerHTML += '<br><input type="button" value="Update" onclick="updateG_form()">';
	var table = document.getElementsByTagName('table');
	table[1].onmouseout=function(){ returnInfoColor() };
	for (var i=1; i<table[1].rows.length; i++) {
		table[1].rows[i].onmouseover=function(){ showStu_G(this.cells[1].innerText) };
	}
}

function showStu_G(sid) {
	var table = document.getElementsByTagName('table');
	for (var i=1; i<table[1].rows.length; i++) {
		if (table[1].rows[i].cells[1].innerText == sid) {
			table[1].rows[i].style.backgroundColor = '#C1FFC1';
		} else {
			table[1].rows[i].style.backgroundColor = "";
		}
	}
	runSQL(dbName, "SELECT StudentID, Name, DepartmentID, Email, Phone, Birthdate FROM Student WHERE StudentID = " + sid, "Stu_record_G");
}

function updateG_form() {
	record.innerHTML = record.innerHTML.substring(0, record.innerHTML.indexOf("</table>")+8);
	record.innerHTML += '<br><input type="button" value="Save" onclick="updateG_action()">';
	record.innerHTML += '<input type="button" value="Cancel" style="margin-left: 10px" onclick="showSelectedCourse()">';
	document.getElementById('statusMsg').innerText = '';
	
	var table = document.getElementsByTagName('table');
	table[1].onmouseout=function(){ returnInfoColor() };
	for (var i=1; i<table[1].rows.length; i++) {
		table[1].rows[i].onmouseover=function(){ showStu_G(this.cells[1].innerText) };
		table[1].rows[i].cells[2].innerHTML = '<input type="text" value="' + table[1].rows[i].cells[2].innerHTML + '">';
	}
	
}

function updateG_action() {
	Stu_record_G.innerHTML = '';
	var table = document.getElementsByTagName('table');
	var box = document.getElementsByTagName('input');
	var tableInfo = table[1].innerHTML;
	var gradeValue = new Array();
	
	for (var i=1; i<table[1].rows.length; i++) {
		gradeValue[i] = box[i].value;
	}
	
	for (var i=1; i<table[1].rows.length; i++) {
		runSQL(dbName, 'UPDATE Enrollment SET Grade="' + gradeValue[i] + '"' + ' WHERE StudentID =' + table[1].rows[i].cells[1].innerText + ' AND CourseID ="' + document.getElementById('searchCourse_grade').value + '"');
		record.innerHTML += "<table>" + tableInfo + "</table>";
	}
	setTimeout("showSelectedCourse()", 200);
}

function showAllDepart() {
	document.getElementById('statusMsg').innerText = '';
	document.getElementById('searchID').style.display = "none";
	runSQL(dbName, "SELECT * FROM Department", "record");
	document.getElementById('modifyRecord').style.display = "block";
	setTimeout("addCol_Depart()", 200);
}

function addCol_Depart() {
	var table = document.getElementsByTagName('table');
	for (var i=0; i<table[0].rows.length; i++) {
		var newCell = table[0].rows[i].insertCell(-1);
		if (i != 0 ) {
			newCell.innerHTML = '<input type="button" value="Update" onclick="updateDepart_form(' + i + ');">';
			newCell.innerHTML += '<input type="button" value="Delete" style="margin-left: 5px" onclick="delDepart_action(' + i + ');">';
		} else {
			newCell.innerHTML = "Action";
		}
	}
}

function updateDepart_form(row) {
	record.innerHTML = record.innerHTML.substring(0, record.innerHTML.indexOf("</table>")+8);
	document.getElementById('modifyRecord').style.display = "none";
	document.getElementById('statusMsg').innerText = '';
	var table = document.getElementsByTagName('table');
	for (var i=0; i<table[0].rows.length; i++) {
		table[0].rows[i].deleteCell(5);
	}
	
	for (var i=2; i<=4; i++) {
		table[0].rows[row].cells[i].innerHTML = '<input type="text" value="' + table[0].rows[row].cells[i].innerHTML + '">';
	}
		
	record.innerHTML += '<br><input type="button" value="Save" onclick="updateDepart_action(' + row +')">';
	record.innerHTML += '<input type="button" value="Cancel" style="margin-left: 10px" onclick="showAllDepart()">';
}

function delDepart_action(row) {
	document.getElementById('statusMsg').innerText = '';
	var table = document.getElementsByTagName('table');
	var did = table[0].rows[row].cells[1].innerText;
	var confirmDel = confirm("Deletion confirm?\nDepartment ID: " + did) 
	if (confirmDel == true) {
		runSQL(dbName, 'DELETE FROM Department WHERE DepartmentID = "' + did + '"');
	}
	setTimeout("showAllDepart()", 200);
}

function updateDepart_action(row) {
	var table = document.getElementsByTagName('table');
	var box = document.getElementsByTagName('input');
	var errorMsg = '';
	
	if (!box[4].value) {
		errorMsg += 'Email cannot be NULL\n';
	}
	
	if (!box[5].value) {
		errorMsg += 'Name cannot be NULL\n';
	}
	
	if (!box[6].value) {
		errorMsg += 'Phone cannot be NULL\n';
	} else if (isNaN(box[6].value)) {
		errorMsg += 'Phone: "' + box[6].value + '" should be a number\n';
	}
	
	if (errorMsg) {
		alert(errorMsg);
		return;
	}
	
	runSQL(dbName, 'UPDATE Department SET Email="' + box[4].value + '", Name="' + box[5].value + '", Phone=' + box[6].value + ' WHERE DepartmentID ="' + table[0].rows[row].cells[1].innerText + '"');
	setTimeout("showAllDepart()", 200);
}

function insertDepart_addRow() {
	record.innerHTML = record.innerHTML.substring(0, record.innerHTML.indexOf("</table>")+8);
	document.getElementById('statusMsg').innerText = '';
	var table = document.getElementsByTagName('table');
	
	for (var i=0; i<table[0].rows.length; i++) {
		table[0].rows[i].deleteCell(5);
	}
	var row = table[0].insertRow(table[0].rows.length);
	for (var i=0; i<5; i++) {
		var newCell = row.insertCell(i);
		if (i==0) {
			newCell.innerHTML = table[0].rows.length-1;
		} else {
			newCell.innerHTML = '<input type="text">';
		}
	}

	document.getElementById('modifyRecord').style.display = "none";
	record.innerHTML += '<br><input type="button" value="Save" onclick="insertDepart_action()">';
	record.innerHTML += '<input type="button" value="Cancel" style="margin-left: 10px" onclick="showAllDepart()">';
}

function insertDepart_action() {
	var table = document.getElementsByTagName('table');
	var box = document.getElementsByTagName('input');
	var errorMsg = '';
	
	if (!box[4].value) {
		errorMsg += 'DepartmentID cannot be NULL\n';
	}
	
	if (!box[5].value) {
		errorMsg += 'Email cannot be NULL\n';
	}
	
	if (!box[6].value) {
		errorMsg += 'Name cannot be NULL\n';
	}
	
	if (!box[7].value) {
		errorMsg += 'Phone cannot be NULL\n';
	} else if (isNaN(box[7].value)) {
		errorMsg += 'Phone: "' + box[7].value + '" should be a number\n';
	}
		
	if (errorMsg) {
		alert(errorMsg);
		return;
	}
	
	runSQL(dbName, 'INSERT INTO Department VALUES ("' + box[4].value + '", "' + box[5].value + '", "' + box[6].value + '", ' + box[7].value + ')');
	setTimeout("showAllDepart()", 200);
}

function searchDepart() {
	document.getElementById('searchID').style.display = "block";
	document.getElementById('modifyRecord').style.display = "none";
	document.getElementById('didText').value = '';
	document.getElementById('statusMsg').innerText = '';
	record.innerHTML = '';
}

function searchDepartGo() {
	var did=document.getElementById('didText').value;
	runSQL(dbName, 'SELECT * FROM Department WHERE DepartmentID = "' + did + '"', "record");
}

function uploadDepart_handler() {
	delDepart_php();
}

function delDepart_php() {
	document.getElementById('statusMsg').innerText = '';
	var xmlhttp = getXMLHttp();
	
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			uploadDepart_php();
		}
	}
	
	xmlhttp.open("POST", "main.php", true); 
	xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xmlhttp.send("requestType=delDepart");
	
}

function uploadDepart_php() {
	document.getElementById('statusMsg').innerText = '';
	var row_count = 0;
	var object_result = [];
	
	var request=indexedDB.open(dbName);
	request.onsuccess = function (e) {
		db = this.result;
		var transaction=db.transaction(["Department"]);
		var objectstore=transaction.objectStore("Department");
		var request = objectstore.openCursor();
		request.onsuccess = function(e) {
			var cursor = e.result || e.target.result;
			if (cursor) {
	
				var data ='{';
				for (var field in cursor.value) {
					if (typeof cursor.value[field] =="string") {
						data += field + ': "' + cursor.value[field] + '", ';
					} else {
						data += field + ': ' + cursor.value[field] + ',';
					}
				}

				data = data.slice(0, -1);
				data +='}';
				
				eval('object_result[row_count] =' +data);
				row_count++;
				data = '';
				
				cursor.continue();
			}
		}
		
		transaction.oncomplete = function(event) {
			var value = '';
			for (var i=0; i<Object.keys(object_result).length; i++) {
				for (var field in object_result[i]) {
					value += field+i + "=" + object_result[i][field] + "&";
				}
			}
			value = value.slice(0, -1);
			XHRtoUploadDepart(row_count, value);
		}
	}
}

function XHRtoUploadDepart(row_count, value) {
	var xmlhttp = getXMLHttp();
	
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			document.getElementById('statusMsg').innerText = xmlhttp.responseText;
		}
	}
	
	xmlhttp.open("POST", "main.php", true); 
	xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xmlhttp.send("requestType=uploadDepart&rowCount=" + row_count + '&' + value);
}

function downloadDepart_handler() {
	var modifyRecord = document.getElementById('modifyRecord');
	if (modifyRecord) {modifyRecord.style.display = "none";}
	downloadDepart_php();
}

function downloadDepart_php() {
	document.getElementById('statusMsg').innerText = '';
	XHRtoDownloadDepart();
}

function XHRtoDownloadDepart() {
	var xmlhttp = getXMLHttp();
	
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			runSQL(dbName, "DELETE FROM Department");
			var arr = xmlhttp.responseText.split('|');
			downloadDepart_localInsert(arr);
			document.getElementById('statusMsg').innerText = "Synchronize - Success";
			record.innerHTML = '';
		}
	}
	
	xmlhttp.open("POST", "main.php", true); 
	xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xmlhttp.send("requestType=downloadDepart");
}

function downloadDepart_localInsert(arr) {
	var objectList = [];
	for (var i=0; i<arr.length-1; i++) {
		eval('objectList[i] =' +arr[i]);
		var command = 'INSERT INTO Department VALUES ("' + objectList[i].DepartmentID + '", "' + objectList[i].Email + '", "' +  objectList[i].Name + '", ' + objectList[i].Phone + ')';
		runSQL(dbName, command);
	}
}

function showAllEnroll() {
	Course_record.style.display = "none";
	Stu_record.style.display = "none";
	document.getElementById('statusMsg').innerText = '';
	document.getElementById('searchID').style.display = "none";
	runSQL(dbName, "SELECT CourseID, Name FROM Course", "Course_record");
	runSQL(dbName, "SELECT StudentID, Name, DepartmentID FROM Student", "Stu_record");
	runSQL(dbName, "select Student.StudentID, Student.Name, Course.CourseID, Course.Name, Enrollment.Term from Student, Enrollment, Course where Student.StudentID = Enrollment.StudentID and Enrollment.CourseID = Course.CourseID", "record");
	document.getElementById('modifyRecord').style.display = "block";
	setTimeout("addCol_Enroll()", 200);
}

function addCol_Enroll() {
	var table = document.getElementsByTagName('table');
	if (table[0].innerText.length > 61) {
		for (var i=0; i<table[0].rows.length; i++) {
			var newCell = table[0].rows[i].insertCell(-1);
			if (i != 0 ) {
				newCell.innerHTML += '<input type="button" value="Delete" style="margin-left: 5px" onclick="delEnroll_action(' + i + ');">';
			} else {
				newCell.innerHTML = "Action";
			}
		}
	}
}

function returnInfoColor() {
	var table = document.getElementsByTagName('table');
	for (var i=1; i<table[0].rows.length; i++) {
		table[0].rows[i].style.backgroundColor = "";
	}
	for (var i=1; i<table[1].rows.length; i++) {
		table[1].rows[i].style.backgroundColor = "";
	}
	for (var i=1; i<table[2].rows.length; i++) {
		table[2].rows[i].style.backgroundColor = "";
	}
}

function changeInfoColor(sid, cid) {
	var table = document.getElementsByTagName('table');
	for (var i=1; i<table[0].rows.length; i++) {
		if (table[0].rows[i].cells[1].innerText == sid && table[0].rows[i].cells[2].innerText == cid) {
			table[0].rows[i].style.backgroundColor = "#C1FFC1";
		} else {
			table[0].rows[i].style.backgroundColor = "";
		}
	}
	for (var i=1; i<table[1].rows.length; i++) {
		if (table[1].rows[i].cells[1].innerText == sid) {
			table[1].rows[i].style.backgroundColor = "#C1FFC1";
		} else {
			table[1].rows[i].style.backgroundColor = "";
		}
	}
	for (var i=1; i<table[2].rows.length; i++) {
		if (table[2].rows[i].cells[1].innerText == cid) {
			table[2].rows[i].style.backgroundColor = "#C1FFC1";
		} else {
			table[2].rows[i].style.backgroundColor = "";
		}
	}
}

function delEnroll_action(row) {
	document.getElementById('statusMsg').innerText = '';
	var table = document.getElementsByTagName('table');
	var sid = table[0].rows[row].cells[2].innerText;
	var cid = table[0].rows[row].cells[4].innerText;
	var term = table[0].rows[row].cells[3].innerText;
	var confirmDel = confirm("Deletion confirm?\nStudent ID: " + sid + "\nCourse ID: " + cid + "\nTerm: " + term) 
	if (confirmDel == true) {
		runSQL(dbName, 'DELETE FROM Enrollment WHERE SidCidT = "' + sid + "_" + cid + "_" + term + '"');
	}
	setTimeout("showAllEnroll()", 200);
}

function insertEnroll_changeContent() {
	runSQL(dbName, "SELECT StudentID, CourseID, Term FROM Enrollment", "record");
	setTimeout("insertEnroll_addRow()", 200);
}

function insertEnroll_addRow() {
	record.innerHTML = record.innerHTML.substring(0, record.innerHTML.indexOf("</table>")+8);
	document.getElementById('statusMsg').innerText = '';
	var table = document.getElementsByTagName('table');
	Course_record.style.display = "block";
	Stu_record.style.display = "block";

	var row = table[0].insertRow(table[0].rows.length);
	for (var i=0; i<4; i++) {
		var newCell = row.insertCell(i);
		if (i==0) {
			newCell.innerHTML = table[0].rows.length-1;
		} else if (i==1){
			newCell.innerHTML = '<select id="insertEnroll_StuInfo">';
			newCell.innerHTML += '</select>';
		} else if (i==2){
			newCell.innerHTML = '<select id="insertEnroll_CourseInfo">';
			newCell.innerHTML += '</select>';
		} else {
			newCell.innerHTML = '<select id="insertEnroll_TermInfo">';
			newCell.innerHTML += '</select>';
		}
	}
	
	for (var j=1; j<table[2].rows.length; j++) {
		insertEnroll_CourseInfo.innerHTML += '<option>' + table[2].rows[j].cells[1].innerText + '</option>';
	}
	
	for (var j=1; j<table[1].rows.length; j++) {
		insertEnroll_StuInfo.innerHTML += '<option>' + table[1].rows[j].cells[1].innerText + '</option>';
	}
	
	insertEnroll_TermInfo.innerHTML += '<option>2012A</option><option>2012B</option><option>2013A</option><option>2013B</option>';
	
	document.getElementById('modifyRecord').style.display = "none";
	record.innerHTML += '<br><input type="button" value="Save" onclick="insertEnroll_action()">';
	record.innerHTML += '<input type="button" value="Cancel" style="margin-left: 10px" onclick="showAllEnroll()">';
}

function insertEnroll_action() {
	var table = document.getElementsByTagName('table');
	var box = document.getElementsByTagName('input');
	var errorMsg = '';
	
	if (!box[6].value) {
		errorMsg += 'Term cannot be NULL\n';
	}

	if (errorMsg) {
		alert(errorMsg);
		return;
	}
	
	runSQL(dbName, 'INSERT INTO Enrollment VALUES ("' + insertEnroll_CourseInfo.value + '", "", "' + insertEnroll_StuInfo.value + "_" + insertEnroll_CourseInfo.value + "_" + insertEnroll_TermInfo.value + '", ' + insertEnroll_StuInfo.value + ', "' + insertEnroll_TermInfo.value + '")');
	setTimeout("showAllEnroll()", 200);
}

function searchEnroll() {
	document.getElementById('searchID').style.display = "block";
	document.getElementById('modifyRecord').style.display = "none";
	document.getElementById('sidText').value = '';
	document.getElementById('cidText').value = '';
	document.getElementById('statusMsg').innerText = '';
	record.innerHTML = '';
	Course_record.innerHTML = '';
	Stu_record.innerHTML = '';
}

function searchEnrollGo_Stu() {
	var sid=document.getElementById('sidText').value;
	document.getElementById('cidText').value = '';
	if (sid && isNaN(sid) == false) {
		runSQL(dbName, "SELECT StudentID, CourseID, Term FROM Enrollment WHERE StudentID = " + sid, "record");
	} else {
		alert('Student ID should be a number');
	}
}

function searchEnrollGo_Course() {
	var cid=document.getElementById('cidText').value;
	document.getElementById('sidText').value = '';
	runSQL(dbName, "SELECT CourseID, Term, StudentID FROM Enrollment WHERE CourseID = " + cid, "record");
}

function uploadEnroll_handler() {
	try {
		delEnroll_php();
	} catch (err) {
		document.getElementById('statusMsg').innerText = 'No network connection';
		return;
	}
}

function delEnroll_php() {
	document.getElementById('statusMsg').innerText = '';
	var xmlhttp = getXMLHttp();
	
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			uploadEnroll_php();
		}
	}
	
	xmlhttp.open("POST", "main.php", true); 
	xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xmlhttp.send("requestType=delEnroll");
}

function uploadEnroll_php() {
	document.getElementById('statusMsg').innerText = '';
	var row_count = 0;
	var object_result = [];
	
	var request=indexedDB.open(dbName);
	request.onsuccess = function (e) {
		db = this.result;
		var transaction=db.transaction(["Enrollment"]);
		var objectstore=transaction.objectStore("Enrollment");
		var request = objectstore.openCursor();
		request.onsuccess = function(e) {
			var cursor = e.result || e.target.result;
			if (cursor) {
	
				var data ='{';
				for (var field in cursor.value) {
					if (typeof cursor.value[field] =="string") {
						data += field + ': "' + cursor.value[field] + '", ';
					} else {
						data += field + ': ' + cursor.value[field] + ',';
					}
				}

				data = data.slice(0, -1);
				data +='}';
				
				eval('object_result[row_count] =' +data);
				row_count++;
				data = '';
				
				cursor.continue();
			}
		}
		
		transaction.oncomplete = function(event) {
			var value = '';
			for (var i=0; i<Object.keys(object_result).length; i++) {
				for (var field in object_result[i]) {
					value += field+i + "=" + object_result[i][field] + "&";
				}
			}
			value = value.slice(0, -1);
			XHRtoUploadEnroll(row_count, value);
		}
	}
}

function XHRtoUploadEnroll(row_count, value) {
	var xmlhttp = getXMLHttp();
	
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			document.getElementById('statusMsg').innerText = xmlhttp.responseText;
		}
	}
	
	xmlhttp.open("POST", "main.php", true); 
	xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xmlhttp.send("requestType=uploadEnroll&rowCount=" + row_count + '&' + value);
}

function downloadEnroll_handler() {
	var modifyRecord = document.getElementById('modifyRecord');
	if (modifyRecord) {modifyRecord.style.display = "none";}
	downloadEnroll_php();
}

function downloadEnroll_php() {
	document.getElementById('statusMsg').innerText = '';
	XHRtoDownloadEnroll();
}

function XHRtoDownloadEnroll() {
	var xmlhttp = getXMLHttp();
	
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			runSQL(dbName, "DELETE FROM Enrollment");
			var arr = xmlhttp.responseText.split('|');
			downloadEnroll_localInsert(arr);
			document.getElementById('statusMsg').innerText = "Synchronize - Success";
			record.innerHTML = '';
		}
	}
	
	xmlhttp.open("POST", "main.php", true); 
	xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xmlhttp.send("requestType=downloadEnroll");
}

function downloadEnroll_localInsert(arr) {
	var objectList = [];
	for (var i=0; i<arr.length-1; i++) {
		eval('objectList[i] =' +arr[i]);
		var command = 'INSERT INTO Enrollment VALUES ("' + objectList[i].CourseID + '", "' + objectList[i].Grade + '", "' + objectList[i].SidCidT + '", ' +  objectList[i].StudentID + ', "' + objectList[i].Term + '")';
		runSQL(dbName, command);
	}
}