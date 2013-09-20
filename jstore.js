var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;

var db;
var ver=1;
var operator_V;
var hashTableSize = 26669; //For hash join
var object_result =[];

String.prototype.hashCode = function(){
    var hash = 0, i, char;
    if (this.length == 0) return hash;
    for (i = 0; i < this.length; i++) {
        char = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

function compare(var1, var2, operator) {
	switch (operator) {
		case '=':
			return var1==var2;
		case '>':
			return var1>var2;
		case '<':
			return var1<var2;
		case '>=':
			return var1>=var2;
		case '<=':
			return var1<=var2;
		case '!=':
			return var1!=var2;	
		case '<>':
			return var1!=var2;
	}
}

//Open Database
function openDb(dbName, command) {
	var req = indexedDB.open(dbName);
	req.onsuccess = function (evt) {
		db = this.result;
		ver = db.version;
		db.close();
	};

	req.onerror = function (evt) {
		console.error("openDb:", evt.target.errorCode);
	};

	req.onupgradeneeded = function (evt) {
		console.log("openDb.onupgradeneeded");
		runSQL(dbName, command);
	};
}

function commandFormatting(command) {
	command=command.replace(/\s,/g,",");
	command=command.replace(/,\s/g,",");
	command=command.replace(/\n/g,"");
	command=command.replace(/\s;/g,";");
	command=command.replace(/;\s/g,";");
	command=command.replace(/=/g," = ");
	command=command.replace(/  +/g," ");
	command=command.replace(/>/g," > ");
	command=command.replace(/</g," < ");
	command=command.replace(/< *>/g," <> ");
	command=command.replace(/< *=/g," <= ");
	command=command.replace(/> *=/g," >= ");
	command=command.replace(/! *=/g," != ");
	command=command.replace(/  +/g," ");
	
	var commands=command.split(';');
	
	return commands;
} 
	
function getSQLResult() {
	return object_result;
}	
	
//Run SQL command
function runSQL(dbName, command, location) {
	try {
		var record = document.getElementById("record");
		var table_1 = document.getElementById("table_1");
		var table_2 = document.getElementById("table_2");
		var msg = document.getElementById("msg");
		if (location) { location.innerHTML = ''; }
		if (table_1) { table_1.innerHTML = ''; }
		if (table_2) { table_2.innerHTML = ''; }
		if (msg) { msg.innerHTML = ''; }
		
		if (!dbName) {
			if (msg) { msg.innerHTML = 'Missed dbName\n'; }
			return;
		}
		
		var commands=commandFormatting(command);
		
		for (var i=0; i<commands.length; i++) {
			if (!commands[i]) {
				return;
			}
			var command_arr = commands[i].split(' ');
			
			switch (command_arr[0].toLowerCase()) {
						
				case 'select':
					commands[i]= commands[i].replace(/'/g,"");
					commands[i] = addSpaceHandler(commands[i]);
					command_arr = commands[i].split(' ');
					command_arr = removeSpaceHandler(command_arr);
					selectHandler(dbName, command_arr, location);
					break;
						
				case 'create':
					if (command_arr[1].toLowerCase() == 'table') {
						commands[i]=commands[i].replace(/[\(\)]/g,"");
						command_arr = commands[i].split(' ');
						createTableHandler(dbName, command_arr);
						printDBInformation(dbName);
					} else {
						if (msg) { msg.innerHTML += 'ERROR[16]: Wrong command<br/>'; }
					}
					if (record) { record.innerHTML = ''; }
					if (table_1) { table_1.innerHTML = ''; }
					if (table_2) { table_2.innerHTML = ''; }
					break;
					
				case 'drop':
					if (command_arr[1].toLowerCase() == 'table') {
						deleteTableHandler(dbName, command_arr[2]);
						printDBInformation(dbName);
					} else {
						if (msg) { msg.innerHTML += 'ERROR[15]: Wrong command<br/>'; }
					}
					if (record) { record.innerHTML = ''; }
					if (table_1) { table_1.innerHTML = ''; }
					if (table_2) { table_2.innerHTML = ''; }
					break;	
					
				case 'insert':
					if (command_arr[1].toLowerCase() == 'into' || (command_arr[1].toLowerCase() == 'ignore' && command_arr[2].toLowerCase() == 'into')) {
						insertHandler(dbName, commands[i]);
					} else {
						if (msg) { msg.innerHTML += 'ERROR[2]: Wrong command<br/>'; }
					}
					if (record) { record.innerHTML = ''; }
					if (table_1) { table_1.innerHTML = ''; }
					if (table_2) { table_2.innerHTML = ''; }
					break;
						
				case 'delete':
					commands[i] = addSpaceHandler(commands[i]);
					command_arr = commands[i].split(' ');
					command_arr = removeSpaceHandler(command_arr);
					if (command_arr[1].toLowerCase() == 'from') {
						deleteHandler(dbName, command_arr);
					} else {
						if (msg) { msg.innerHTML += 'ERROR[14]: Wrong command<br/>' ; }
						record.innerHTML = '';
					}
					if (record) { record.innerHTML = ''; }
					if (table_1) { table_1.innerHTML = ''; }
					if (table_2) { table_2.innerHTML = ''; }
					break;
						
				case 'update':
					commands[i]= commands[i].replace(/,/g," ");
					updateHandler(dbName, commands[i]);
					if (record) { record.innerHTML = ''; }
					if (table_1) { table_1.innerHTML = ''; }
					if (table_2) { table_2.innerHTML = ''; }
					break;
						
				default:
					if (msg) { msg.innerHTML += 'ERROR[1]: Wrong command' + ' (' + command_arr[0] + ')<br/>' ; }
					if (record) { record.innerHTML = ''; }
			}
		}
	}catch(err){
		if (msg) { msg.innerHTML = 'ERROR[27]: Wrong command<br/>'; }
	}
}

	
	
//Print the information about the Database
function printDBInformation(dbName) {
	var DBinfo = document.getElementById("DBinfo");
	if (!DBinfo) {
		return;
	}
	var req = indexedDB.open(dbName);
	req.onsuccess = function (evt) {
		db = this.result;
		DBinfo.innerHTML = '';
		var sName = db.name;
		var dVersion = db.version;
		var dTableNames = db.objectStoreNames;
		var strNames = "IndexedDB name: " + sName + "<br> version: " + dVersion + "<br> object stores: ";
			for (var i = 0; i < dTableNames.length; i++) {
				strNames = strNames + dTableNames[i] + ", ";
			}
		DBinfo.innerHTML += '<section>' + strNames + '</section>';
		db.close();
	};

	req.onerror = function (evt) {
		console.error("openDb:", evt.target.errorCode);
	};
}
	

function displayTable(objectList) {
	var record = document.getElementById("record");
	
	var table_info = '';
	var row_count = 0;
	table_info += '<table><tr class="first_row">';
	for (var field in objectList[0]) {
		table_info += '<td>' + field + '</td>';
	}
	table_info += '</tr><tr>';
	
	for (var i=0; i<Object.keys(objectList).length; i++) {
		for (var field in objectList[0]) {
			table_info += '<td>' + objectList[i][field] + '</td>';
		}
		table_info += '</tr>';
		row_count++;
	}
	table_info += '</table><br/>';
	
	if (record) { record.innerHTML = table_info; }
	
	if (row_count == 1){
		if (record) { record.innerHTML = '1 row is selected.<br/>'; }
	} else {
		if (record) { record.innerHTML = row_count + ' rows are selected.<br/>'; }
	}
	
	return table_info;
}

function displayTable_V(objectList, table, table_name) {
	var table_info = '';
	var row_count=1;
	table_info += '<h3 id="' + table + 'name">' + table_name + '</h3>';
	table_info += '<div id="' + table + '_v"><table><tr class="first_row"><td></td>';
	for (var field in objectList[0]) {
		table_info += '<td>' + field + '</td>';
	}
	table_info += '</tr><tr>';
	
	for (var i=0; i<Object.keys(objectList).length; i++) {
		table_info += '<td>' + row_count + '</td>';
		for (var field in objectList[0]) {
			table_info += '<td>' + objectList[i][field] + '</td>';
		}
		row_count++;
		table_info += '</tr>';
	}
	table_info += '</table></div><br/>';
	
	document.getElementById(table).innerHTML = table_info;
		
	return table_info;
}

function visual() {
	var record = document.getElementById("record");
	var table_1 = document.getElementById("table_1");
	var table_2 = document.getElementById("table_2");
	
	if (!record || !table_1 || !table_2) {
		return;
	}
	
	if (!record.innerHTML) {
		return;
	}

	if (document.getElementById('hashjoin').checked == true) {
		var temp_table = table_1.innerHTML;
		table_1.innerHTML = table_2.innerHTML;
		table_2.innerHTML = temp_table;
		
		visual_hash();
		
		temp_table = table_1.innerHTML;
		table_1.innerHTML = table_2.innerHTML;
		table_2.innerHTML = temp_table;
	} else if (document.getElementById('sortmergejoin').checked == true) {
		visual_sort();
	} else {
		visual_loop();
	}
}

function visual_loop_initial(table1_rows_count, table2_rows_count, field1, field2) {
	var record = document.getElementById("record");
	var table_1 = document.getElementById("table_1");
	var table_2 = document.getElementById("table_2");
	
	if (!record || !table_1 || !table_2) {
		return;
	}
	
	record.innerHTML = record.innerHTML.substring(0, record.innerHTML.indexOf("</table>")+8);
	record.innerHTML += "<br>";
	
	var table1_rows = document.getElementById('table_1').getElementsByTagName('tr');
	var table2_rows = document.getElementById('table_2').getElementsByTagName('tr');
	var table3_rows = document.getElementById('record').getElementsByTagName('tr');
	var table1_data = document.getElementById('table_1').getElementsByTagName('td');
	var table2_data = document.getElementById('table_2').getElementsByTagName('td');
	var field1_no;
	var field2_no;
	var column1 = table1_data.length / table1_rows.length;
	var column2 = table2_data.length / table2_rows.length;
	
	for (var i=1; i<table3_rows.length; i++) {
		table3_rows[i].style.display = "none";
	}
	
	for (var i=0; i<table1_data.length; i++) {
		if (table1_data[i].innerText == field1) {
			field1_no = i;
			table1_data[i].style.textDecoration = 'underline';
			break;
		}
	}
	
	for (var i=0; i<table2_data.length; i++) {
		if (table2_data[i].innerText == field2) {
			field2_no = i;
			table2_data[i].style.textDecoration = 'underline';
			break;
		}
	}
	
	table1_rows[1].style.backgroundColor = '#C1FFC1';
	table_1.innerHTML += "Row 1's " + table1_data[field1_no].innerText + " value is " + '"' + table1_data[column1+field1_no].innerText + '"';
	table2_rows[1].style.backgroundColor = '#C1FFC1';
	table_2.innerHTML += "Row 1's " + table2_data[field2_no].innerText + " value is " + '"' + table2_data[column2+field2_no].innerText + '"';
	if (compare(table1_data[table1_rows_count*column1+field1_no].innerText, table2_data[table2_rows_count*column2+field2_no].innerText, operator_V)) {
		table3_rows[1].style.backgroundColor = '#C1FFC1'; 
		table3_rows[1].style.display = 'table-row';
		record.innerHTML += table_1name.innerText + "'s " + '"'+ table1_data[column1+field1_no].innerText + '" ' + operator_V + ' ';
		record.innerHTML += table_2name.innerText + "'s " + '"'+ table2_data[column2+field2_no].innerText + "\"<br>";
		record.innerHTML += "Row 1 is added";
	} else {
		record.innerHTML += table_1name.innerText + "'s " + '"'+ table1_data[column1+field1_no].innerText + '" not' + operator_V + ' ';
		record.innerHTML += table_2name.innerText + "'s " + '"'+ table2_data[column2+field2_no].innerText + "\"<br>";
		record.innerHTML += "No data is added";
	}
}

function visual_loop() {
	var record = document.getElementById("record");
	var table_1 = document.getElementById("table_1");
	var table_2 = document.getElementById("table_2");
	
	if (!record || !table_1 || !table_2) {
		return;
	}

	var table1_rows = document.getElementById('table_1').getElementsByTagName('tr');
	var table2_rows = document.getElementById('table_2').getElementsByTagName('tr');
	var table3_rows = document.getElementById('record').getElementsByTagName('tr');
	var table1_data = document.getElementById('table_1').getElementsByTagName('td');
	var table2_data = document.getElementById('table_2').getElementsByTagName('td');
	var field1_no;
	var field2_no;
	var column1 = table1_data.length / table1_rows.length;
	var column2 = table2_data.length / table2_rows.length;
	var table1_rows_count;
	var table2_rows_count;
	var table3_rows_count =0;
		
	for (var i=1; i<table1_rows.length; i++) {
		if (table1_rows[i].style.backgroundColor != "") {
			table1_rows_count = i;
			break;
		}
	}
	
	for (var i=1; i<table2_rows.length; i++) {
		if (table2_rows[i].style.backgroundColor != "") {
			table2_rows_count = i;
			break;
		}
	}
	
	for (var i=1; i<table3_rows.length; i++) {
		if (table3_rows[i].style.backgroundColor == "rgb(193, 255, 193)") {
			table3_rows_count = i;
			break;
		}
		if (table3_rows[i].style.display == "none") {
			table3_rows_count = i-1;
			break;
		}
	}
	
	table_1.innerHTML = table_1.innerHTML.substring(0, table_1.innerHTML.indexOf("</table>")+8);
	table_2.innerHTML = table_2.innerHTML.substring(0, table_2.innerHTML.indexOf("</table>")+8);
	record.innerHTML = record.innerHTML.substring(0, record.innerHTML.indexOf("</table>")+8);
	
	if (!table1_rows_count || !table2_rows_count) {
		record.innerHTML += "<br>" + (table3_rows.length-1) + " rows are selected";
		return;
	}
	
	for (var i=0; i<table1_data.length; i++) {
		if (table1_data[i].style.textDecoration == 'underline') {
			field1_no = i;
			break;
		}
	}
	
	for (var i=0; i<table2_data.length; i++) {
		if (table2_data[i].style.textDecoration == 'underline') {
			field2_no = i;
			break;
		}
	}

	table_1.innerHTML += "<br>";
	table_2.innerHTML += "<br>";
	record.innerHTML += "<br>";
	
	if (table1_rows_count != table1_rows.length-1 || table2_rows_count != table2_rows.length-1){
		
		if (table2_rows_count != table2_rows.length-1) {
			table2_rows[table2_rows_count].style.backgroundColor = '';
			table2_rows_count++;
			table2_rows[table2_rows_count].style.backgroundColor = '#C1FFC1';
			table_2.innerHTML += "Read next row<br>";
		} else if (table2_rows_count == table2_rows.length-1) {
			table1_rows[table1_rows_count].style.backgroundColor = '';
			table2_rows[table2_rows_count].style.backgroundColor = '';
			table2_rows_count = 1;
			table1_rows_count++;
			table1_rows[table1_rows_count].style.backgroundColor = '#C1FFC1';
			table2_rows[table2_rows_count].style.backgroundColor = '#C1FFC1';
			table_1.innerHTML += "Since whole " + table_2name.innerText + " is scanned, read next row<br>";
			table_2.innerHTML += "Whole table is scanned.  Go back to Row 1<br>";
		} else {}
		
		table_1.innerHTML += "Row " + table1_rows_count + "'s " + table1_data[field1_no].innerText + " value is " + '"' + table1_data[table1_rows_count*column1+field1_no].innerText + '"';
		table_2.innerHTML += "Row " + table2_rows_count + "'s " + table2_data[field2_no].innerText + " value is " + '"' + table2_data[table2_rows_count*column2+field2_no].innerText + '"';

		if (compare(table1_data[table1_rows_count*column1+field1_no].innerText, table2_data[table2_rows_count*column2+field2_no].innerText, operator_V)) {
			if (table3_rows_count !=0) {
				table3_rows[table3_rows_count].style.backgroundColor = '';
			}
			table3_rows_count++;
			table3_rows[table3_rows_count].style.display = 'table-row';
			table3_rows[table3_rows_count].style.backgroundColor = '#C1FFC1';
			record.innerHTML += table_1name.innerText + "'s " + '"'+ table1_data[table1_rows_count*column1+field1_no].innerText + '" ' + operator_V + ' ';
			record.innerHTML += table_2name.innerText + "'s " + '"'+ table2_data[table2_rows_count*column2+field2_no].innerText + "\"<br>";
			record.innerHTML += "Row " + table3_rows_count + " is added";
		} else {
			record.innerHTML += table_1name.innerText + "'s " + '"'+ table1_data[table1_rows_count*column1+field1_no].innerText + '" not ' + operator_V + ' ';
			record.innerHTML += table_2name.innerText + "'s " + '"'+ table2_data[table2_rows_count*column2+field2_no].innerText + "\"<br>";
			record.innerHTML += "No data is added";
			if (table3_rows_count < table3_rows.length) {
				if (table3_rows_count !=0) {
					table3_rows[table3_rows_count].style.backgroundColor = '';
				}
			}
		}
	} else {
		table1_rows[table1_rows_count].style.backgroundColor = '';
		table2_rows[table2_rows_count].style.backgroundColor = '';
		table3_rows[table3_rows.length-1].style.backgroundColor = '';
		record.innerHTML += (table3_rows.length-1) + " rows are selected";
	}
}
	
function visual_sort_initial(table1_rows_count, table2_rows_count, field1, field2) {
	var record = document.getElementById("record");
	var table_1 = document.getElementById("table_1");
	var table_2 = document.getElementById("table_2");
	
	if (!record || !table_1 || !table_2) {
		return;
	}	
	
	record.innerHTML = record.innerHTML.substring(0, record.innerHTML.indexOf("</table>")+8);
	record.innerHTML += "<br>";
	var table1_rows = document.getElementById('table_1').getElementsByTagName('tr');
	var table2_rows = document.getElementById('table_2').getElementsByTagName('tr');
	var table3_rows = document.getElementById('record').getElementsByTagName('tr');
	var table1_data = document.getElementById('table_1').getElementsByTagName('td');
	var table2_data = document.getElementById('table_2').getElementsByTagName('td');
	var field1_no;
	var field2_no;
	var column1 = table1_data.length / table1_rows.length;
	var column2 = table2_data.length / table2_rows.length;
	var table3_rows_count = 1;
	
	for (var i=1; i<table3_rows.length; i++) {
		table3_rows[i].style.display = "none";
	}
	
	for (var i=0; i<table1_data.length; i++) {
		if (table1_data[i].innerText == field1) {
			field1_no = i
			table1_data[i].style.textDecoration = 'underline';
			break;
		}
	}
	
	for (var i=0; i<table2_data.length; i++) {
		if (table2_data[i].innerText == field2) {
			field2_no = i;
			table2_data[i].style.textDecoration = 'underline';
			break;
		}
	}
	
	
	table1_rows[1].style.backgroundColor = '#C1FFC1';
	table_1.innerHTML += "Row 1's " + table1_data[field1_no].innerText + " value is " + '"' + table1_data[column1+field1_no].innerText + '"';
	table2_rows[1].style.backgroundColor = '#C1FFC1';
	table_2.innerHTML += "Row 1's " + table2_data[field2_no].innerText + " value is " + '"' + table2_data[column2+field2_no].innerText + '"';
	if (table1_data[table1_rows_count*column1+field1_no].innerText == table2_data[table2_rows_count*column2+field2_no].innerText) {
		table3_rows[1].style.backgroundColor = '#C1FFC1'; 
		table3_rows[1].style.display = 'table-row';
		record.innerHTML += table_1name.innerText + "'s " + '"'+ table1_data[column1+field1_no].innerText + "\" = ";
		record.innerHTML += table_2name.innerText + "'s " + '"'+ table2_data[column2+field2_no].innerText + "\"<br>";
		record.innerHTML += "Row 1 is added";
	} else {
		record.innerHTML += table_1name.innerText + "'s " + '"'+ table1_data[column1+field1_no].innerText + "\" != ";
		record.innerHTML += table_2name.innerText + "'s " + '"'+ table2_data[column2+field2_no].innerText + "\"<br>";
		record.innerHTML += "No data is added";
	}
}


function visual_sort() {
	var record = document.getElementById("record");
	var table_1 = document.getElementById("table_1");
	var table_2 = document.getElementById("table_2");
	
	if (!record || !table_1 || !table_2) {
		return;
	}

	var table1_rows = document.getElementById('table_1').getElementsByTagName('tr');
	var table2_rows = document.getElementById('table_2').getElementsByTagName('tr');
	var table3_rows = document.getElementById('record').getElementsByTagName('tr');
	var table1_data = document.getElementById('table_1').getElementsByTagName('td');
	var table2_data = document.getElementById('table_2').getElementsByTagName('td');
	var field1_no;
	var field2_no;
	var column1 = table1_data.length / table1_rows.length;
	var column2 = table2_data.length / table2_rows.length;
	var table1_rows_count;
	var table2_rows_count;
	var table3_rows_count =0;
	var same =1;
	
	for (var i=1; i<table1_rows.length; i++) {
		if (table1_rows[i].style.backgroundColor != "") {
			table1_rows_count = i;
			break;
		}
	}
	
	for (var i=1; i<table2_rows.length; i++) {
		if (table2_rows[i].style.backgroundColor != "") {
			table2_rows_count = i;
			break;
		}
	}
	
	for (var i=1; i<table3_rows.length; i++) {
		if (table3_rows[i].style.backgroundColor == "rgb(193, 255, 193)") {
			table3_rows_count = i;
			break;
		}
		if (table3_rows[i].style.display == "none") {
			table3_rows_count = i-1;
			break;
		}
	}

	table_1.innerHTML = table_1.innerHTML.substring(0, table_1.innerHTML.indexOf("</table>")+8);
	table_2.innerHTML = table_2.innerHTML.substring(0, table_2.innerHTML.indexOf("</table>")+8);
	record.innerHTML = record.innerHTML.substring(0, record.innerHTML.indexOf("</table>")+8);
	
	if (!table1_rows_count || !table2_rows_count) {
		record.innerHTML += "<br>" + (table3_rows.length-1) + " rows are selected";
		return;
	}
	
	for (var i=0; i<table1_data.length; i++) {
		if (table1_data[i].style.textDecoration == 'underline') {
			field1_no = i;
			break;
		}
	}
	
	for (var i=0; i<table2_data.length; i++) {
		if (table2_data[i].style.textDecoration == 'underline') {
			field2_no = i;
			break;
		}
	}	
	
	for (var i=table2_rows_count; i>1; i--) {
		if (table2_data[i*column2+field2_no].innerText != table2_data[(i-1)*column2+field2_no].innerText) {
			same = i;
			break;
		}
	}
	
	table_1.innerHTML += "<br>";
	table_2.innerHTML += "<br>";
	record.innerHTML += "<br>";
	
	if (table3_rows_count < table3_rows.length-1){
		var table1_value = table1_data[table1_rows_count*column1+field1_no].innerText;
		var table2_value = table2_data[table2_rows_count*column2+field2_no].innerText;
		if(isNaN(table1_value) ==  false){
			table1_value = parseInt(table1_value);
			table2_value = parseInt(table2_value);
		}
		
		if ((table1_value > table2_value) || (table2_rows_count != table2_rows.length-1 && table2_data[table2_rows_count*column2+field2_no].innerText == table2_data[(table2_rows_count+1)*column2+field2_no].innerText)) {
			table2_rows[table2_rows_count].style.backgroundColor = '';
			table2_rows_count++;
			table2_rows[table2_rows_count].style.backgroundColor = '#C1FFC1';
			table_2.innerHTML += "Since " + table_1name.innerText + "'s Row " + table1_rows_count + ' "' + table1_data[(table1_rows_count)*column1+field1_no].innerText + "\" > "; 
			table_2.innerHTML += table_2name.innerText + "'s Row " + (table2_rows_count-1) + ' "' + table2_data[(table2_rows_count-1)*column2+field2_no].innerText + '", read next row<br>';
		} else {
			table1_rows[table1_rows_count].style.backgroundColor = '';
			table1_rows_count++;
			table1_rows[table1_rows_count].style.backgroundColor = '#C1FFC1';
			table_1.innerHTML += "Since " + table_1name.innerText + "'s Row " + (table1_rows_count-1) + ' "' + table1_data[(table1_rows_count-1)*column1+field1_no].innerText + "\" <= "; 
			table_1.innerHTML += table_2name.innerText + "'s Row " + (table2_rows_count) + ' "' + table2_data[(table2_rows_count)*column2+field2_no].innerText + '", read next row<br>';
			if ((table1_rows_count<table1_rows.length && table1_data[table1_rows_count*column1+field1_no].innerText == table1_data[(table1_rows_count-1)*column1+field1_no].innerText) ||
				table1_data[table1_rows_count*column1+field1_no].innerText == table2_data[(table2_rows_count)*column2+field2_no].innerText) {
				table2_rows[table2_rows_count].style.backgroundColor = '';
				if (table2_rows_count != same) {
					table_2.innerHTML += "Go back to row which has the same value<br>";
					table2_rows_count = same;
				}
				table2_rows[table2_rows_count].style.backgroundColor = '#C1FFC1';
			}
		}
		table_1.innerHTML += "Row " + table1_rows_count + "'s " + table1_data[field1_no].innerText + " value is " + '"' + table1_data[table1_rows_count*column1+field1_no].innerText + '"';
		table_2.innerHTML += "Row " + table2_rows_count + "'s " + table2_data[field2_no].innerText + " value is " + '"' + table2_data[table2_rows_count*column2+field2_no].innerText + '"';
	} else {
		table1_rows[table1_rows_count].style.backgroundColor = '';
		table2_rows[table2_rows_count].style.backgroundColor = '';
		record.innerHTML += (table3_rows.length-1) + " rows are selected";
	}
	
	if (table1_data[table1_rows_count*column1+field1_no].innerText == table2_data[table2_rows_count*column2+field2_no].innerText) {
		if (table3_rows_count !=0) {
			table3_rows[table3_rows_count].style.backgroundColor = '';
		}
		table3_rows_count++;
		if (table3_rows_count < table3_rows.length) {
			table3_rows[table3_rows_count].style.display = 'table-row';
			table3_rows[table3_rows_count].style.backgroundColor = '#C1FFC1';
			record.innerHTML += table_1name.innerText + "'s " + '"'+ table1_data[table1_rows_count*column1+field1_no].innerText + "\" = ";
			record.innerHTML += table_2name.innerText + "'s " + '"'+ table2_data[table2_rows_count*column2+field2_no].innerText + "\"<br>";
			record.innerHTML += "Row " + table3_rows_count + " is added";
		}
	} else {
		record.innerHTML += table_1name.innerText + "'s " + '"'+ table1_data[table1_rows_count*column1+field1_no].innerText + "\" != ";
		record.innerHTML += table_2name.innerText + "'s " + '"'+ table2_data[table2_rows_count*column2+field2_no].innerText + "\"<br>";
		record.innerHTML += "No data is added";
		if (table3_rows_count !=0) {
			table3_rows[table3_rows_count].style.backgroundColor = '';
		}
	}
}

function visual_hash_initial(table1_rows_count, table2_rows_count, field1, field2) {
	var record = document.getElementById("record");
	var table_1 = document.getElementById("table_1");
	var table_2 = document.getElementById("table_2");
	
	if (!record || !table_1 || !table_2) {
		return;
	}

	record.innerHTML = record.innerHTML.substring(0, record.innerHTML.indexOf("</table>")+8);
	record.innerHTML += "<br>";
	var table1_rows = document.getElementById('table_1').getElementsByTagName('tr');
	var table2_rows = document.getElementById('table_2').getElementsByTagName('tr');
	var table3_rows = document.getElementById('record').getElementsByTagName('tr');
	var table1_data = document.getElementById('table_1').getElementsByTagName('td');
	var table2_data = document.getElementById('table_2').getElementsByTagName('td');
	var field1_no;
	var field2_no;
	var column1 = table1_data.length / table1_rows.length;
	var column2 = table2_data.length / table2_rows.length;
	var firstHashTable = [];
	
	var match_arr;
	
	for (var i=1; i<table3_rows.length; i++) {
		table3_rows[i].style.display = "none";
	}
	
	for (var i=0; i<table1_data.length; i++) {
		if (table1_data[i].innerText == field1) {
			field1_no = i;
			table1_data[i].style.textDecoration = 'underline';
			break;
		}
	}
	
	for (var i=0; i<table2_data.length; i++) {
		if (table2_data[i].innerText == field2) {
			field2_no = i;
			table2_data[i].style.textDecoration = 'underline';
			break;
		}
	}
	
	for (var i=1; i<table1_rows.length; i++) {
		var hash_value = (table1_data[i*column1+field1_no].innerText.hashCode())%hashTableSize;
		if (firstHashTable[hash_value] == null) {
			firstHashTable[hash_value] = i.toString();
		} else {
			firstHashTable[hash_value] += ',' + i.toString();
		}
	}
	
	for (var i=1; i<table2_rows.length; i++) {
		var hash_value = (table2_data[i*column2+field2_no].innerText.hashCode())%hashTableSize;
		if (firstHashTable[hash_value] != null) {
			match_arr = firstHashTable[hash_value].split(',');
			break;
		}
	}
	
	var table_1_comment = "";
	table_1_comment += "Hash table of " + table_1name.innerText + " (Hashed by " + table1_data[field1_no].innerText + ")<br>";
	table_1_comment += "<table><tr class='first_row'><td>Hash Value</td><td>Rows</td>";
		
	for (var i=0; i<firstHashTable.length; i++) {
		if (firstHashTable[i] != null) {
			table_1_comment += "<tr><td>" + i + "</td>" + "<td>" + firstHashTable[i] + "</td></tr>";
		}
	}
	
	table_1_comment += " </table></br>";
	table_1_hash.innerHTML = table_1_comment;
	//
	var table1_hash_rows = document.getElementById('table_1_hash').getElementsByTagName('tr');
	var table1_hash_data = document.getElementById('table_1_hash').getElementsByTagName('td');
	//
	if (match_arr && (table1_data[match_arr[0]*column1+field1_no].innerText == table2_data[table2_rows_count*column2+field2_no].innerText)) {
		table1_rows[match_arr[0]].style.backgroundColor = '#C1FFC1'; 
		table_1.innerHTML += "Match record is found from the hash table<br>";
		table_1.innerHTML += "Hash value: " + (table1_data[match_arr[0]*column1+field1_no].innerText.hashCode())%hashTableSize + " -> Row " + match_arr[0] + "<br>";
		table_1.innerHTML += "Row "+ match_arr[0] + "'s " + table1_data[field1_no].innerText + " value is " + '"' + table1_data[match_arr[0]*column1+field1_no].innerText +'"';
		table3_rows[1].style.backgroundColor = '#C1FFC1'; 
		table3_rows[1].style.display = 'table-row';
		
		for (var i=1; i < table1_hash_rows.length; i++) {
			if (table1_hash_data[i*2].innerText == (table1_data[match_arr[0]*column1+field1_no].innerText.hashCode())%hashTableSize) {
				table1_hash_rows[i].style.backgroundColor = '#C1FFC1'; 
			}
		}
		
		record.innerHTML += table_1name.innerText + "'s " + '"'+ table1_data[match_arr[0]*column1+field1_no].innerText + "\" = ";
		record.innerHTML += table_2name.innerText + "'s " + '"'+ table2_data[column2+field2_no].innerText + "\"<br>";
		record.innerHTML += "Row 1 is added";
	} else {
		record.innerHTML += "No data which has hash value " + '"' + (table2_data[column2+field2_no].innerText.hashCode())%hashTableSize + '" in the hash table<br>';
		record.innerHTML += "No data is added";
	}
	table2_rows[1].style.backgroundColor = '#C1FFC1';
	table_2.innerHTML += "Row 1's " + table2_data[field2_no].innerText + " value is " + '"' + table2_data[column2+field2_no].innerText + '"<br>';
	table_2.innerHTML += "Hash value: " + (table2_data[column2+field2_no].innerText.hashCode())%hashTableSize + "<br>";
	table_2.innerHTML += "Check hash table to see if any match record can be found";
	table_1.innerHTML += "<br><br>" + table_1_hash.innerHTML;
	
	var temp_table = table_1.innerHTML;
	table_1.innerHTML = table_2.innerHTML;
	table_2.innerHTML = temp_table;
}

function visual_hash() {
	var record = document.getElementById("record");
	var table_1 = document.getElementById("table_1");
	var table_2 = document.getElementById("table_2");
	
	if (!record || !table_1 || !table_2) {
		return;
	}

	table_1.innerHTML = table_1.innerHTML.substring(0, table_1.innerHTML.indexOf("</table>")+8);
	var table1_rows = document.getElementById('table_1').getElementsByTagName('tr');
	var table2_rows = document.getElementById('table_2').getElementsByTagName('tr');
	var table3_rows = document.getElementById('record').getElementsByTagName('tr');
	var table1_data = document.getElementById('table_1').getElementsByTagName('td');
	var table2_data = document.getElementById('table_2').getElementsByTagName('td');
	var table1_hash_rows = document.getElementById('table_1_hash').getElementsByTagName('tr');
	var table1_hash_data = document.getElementById('table_1_hash').getElementsByTagName('td');
	var field1_no;
	var field2_no;
	var column1 = table1_data.length / table1_rows.length;
	var column2 = table2_data.length / table2_rows.length;
	var table1_rows_count;
	var table2_rows_count;
	var table3_rows_count;
	var firstHashTable = [];
	
	var match_arr;
	
	for (var i=1; i < table1_hash_rows.length; i++) {
		table1_hash_rows[i].style.backgroundColor = ''; 
	}
	
	for (var i=1; i<table1_rows.length; i++) {
		if (table1_rows[i].style.backgroundColor != "") {
			table1_rows_count = i;
			break;
		}
	}
	
	for (var i=1; i<table2_rows.length; i++) {
		if (table2_rows[i].style.backgroundColor != "") {
			table2_rows_count = i;
			break;
		}
	}
		
	for (var i=1; i<table3_rows.length; i++) {
		if (table3_rows[i].style.backgroundColor == "rgb(193, 255, 193)") {
			table3_rows_count = i;
			break;
		}
		if (table3_rows[i].style.display == "none") {
			table3_rows_count = i;
			break;
		}
	}
	
	table_2.innerHTML = table_2.innerHTML.substring(0, table_2.innerHTML.indexOf("</table>")+8);
	record.innerHTML = record.innerHTML.substring(0, record.innerHTML.indexOf("</table>")+8);
	
	if (!table2_rows_count) {
		record.innerHTML += "<br>" + (table3_rows.length-1) + " rows are selected";
		return;
	}
	
	for (var i=0; i<table1_data.length; i++) {
		if (table1_data[i].style.textDecoration == 'underline') {
			field1_no = i;
			break;
		}
	}
	
	for (var i=0; i<table2_data.length; i++) {
		if (table2_data[i].style.textDecoration == 'underline') {
			field2_no = i;
			break;
		}
	}	
	
	for (var i=1; i<table1_rows.length; i++) {
		var hash_value = (table1_data[i*column1+field1_no].innerText.hashCode())%hashTableSize;
		if (firstHashTable[hash_value] == null) {
			firstHashTable[hash_value] = i.toString();
		} else {
			firstHashTable[hash_value] += ',' + i.toString();
		}
	}
	
	for (var i=1; i<table1_rows.length; i++) {
		if (table1_rows[i].style.backgroundColor == "rgb(193, 255, 193)") {
			table1_rows_count = i;
			break;
		}
	}
	
	table_1.innerHTML += "<br>";
	table_2.innerHTML += "<br>";
	record.innerHTML += "<br>";
	
	if (table2_rows_count<table2_rows.length && table3_rows_count < table3_rows.length) {
		if (firstHashTable[table2_data[table2_rows_count*column2+field2_no].innerText.hashCode()%hashTableSize] != null) {
			match_arr = firstHashTable[table2_data[table2_rows_count*column2+field2_no].innerText.hashCode()%hashTableSize].split(',');
			for (var j=0; j<match_arr.length; j++) {
				if (table1_rows[parseInt(match_arr[j])].style.backgroundColor == "rgb(193, 255, 193)") {
					if (j+1<match_arr.length) {
						table1_rows[table1_rows_count].style.backgroundColor = '';
						table1_rows_count = parseInt(match_arr[j+1]);
						table1_rows[table1_rows_count].style.backgroundColor = 'rgb(193, 255, 193)';
					} else {
						if (table2_rows_count+1 < table2_rows.length && firstHashTable[table2_data[(table2_rows_count+1)*column2+field2_no].innerText.hashCode()%hashTableSize] != null) {
							match_arr = firstHashTable[table2_data[(table2_rows_count+1)*column2+field2_no].innerText.hashCode()%hashTableSize].split(',');
							table1_rows[table1_rows_count].style.backgroundColor = '';
							table1_rows_count = parseInt(match_arr[0]);
							table1_rows[table1_rows_count].style.backgroundColor = 'rgb(193, 255, 193)';
						} else {
							table1_rows[table1_rows_count].style.backgroundColor = '';
							table1_rows_count = '';
							table3_rows[table3_rows_count].style.backgroundColor = '';
						}
						table2_rows[table2_rows_count].style.backgroundColor = '';
						table2_rows_count++;
						if (table2_rows_count < table2_rows.length) {
							table2_rows[table2_rows_count].style.backgroundColor = 'rgb(193, 255, 193)';
						}
					}
					if (table1_rows_count) {
						table_1.innerHTML += "Match record is found from the hash table<br>";
						table_1.innerHTML += "Hash value: " + (table1_data[table1_rows_count*column1+field1_no].innerText.hashCode())%hashTableSize + " -> Row " + table1_rows_count + '<br>';
						table_1.innerHTML += "Row " + table1_rows_count + "'s " + table1_data[field1_no].innerText + " value is " + '"' + table1_data[table1_rows_count*column1+field1_no].innerText + '"';
						for (var i=1; i < table1_hash_rows.length; i++) {
							if (table1_hash_data[i*2].innerText == (table1_data[match_arr[0]*column1+field1_no].innerText.hashCode())%hashTableSize) {
								table1_hash_rows[i].style.backgroundColor = '#C1FFC1'; 
							}
						}
					}
					if (table2_rows_count < table2_rows.length) {
						table_2.innerHTML += "Row " + table2_rows_count + "'s " + table2_data[field2_no].innerText + " value is " + '"' + table2_data[table2_rows_count*column2+field2_no].innerText + '"<br>';
						table_2.innerHTML += "Hash value: " + (table2_data[table2_rows_count*column2+field2_no].innerText.hashCode())%hashTableSize + "<br>";
						table_2.innerHTML += "Check hash table to see if any match record can be found";
					}
					break;
				}
			}
		} else {
			table2_rows[table2_rows_count].style.backgroundColor = '';
			table2_rows_count++;
			table2_rows[table2_rows_count].style.backgroundColor = 'rgb(193, 255, 193)';
			
			if (table2_rows_count<table2_rows.length && table3_rows_count < table3_rows.length) {
				if (firstHashTable[table2_data[table2_rows_count*column2+field2_no].innerText.hashCode()%hashTableSize] != null) {
					match_arr = firstHashTable[table2_data[table2_rows_count*column2+field2_no].innerText.hashCode()%hashTableSize].split(',');
					table1_rows_count = parseInt(match_arr[0]);
					table1_rows[table1_rows_count].style.backgroundColor = 'rgb(193, 255, 193)';
				}
			}
			if (table1_data[table1_rows_count*column1+field1_no].innerText == table2_data[table2_rows_count*column2+field2_no].innerText) {
				table3_rows[table3_rows_count].style.backgroundColor = 'rgb(193, 255, 193)';
				table3_rows[table3_rows_count].style.display = 'table-row';
				record.innerHTML += table_1name.innerText + "'s " + '"'+ table1_data[table1_rows_count*column1+field1_no].innerText + "\" = ";
				record.innerHTML += table_2name.innerText + "'s " + '"'+ table2_data[table2_rows_count*column2+field2_no].innerText + "\"<br>";
				record.innerHTML += "Row " + table3_rows_count + " is added";
			}
			table_1.innerHTML += "Match record is found from the hash table<br>";
			table_1.innerHTML += "Hash value: " + (table1_data[table1_rows_count*column1+field1_no].innerText.hashCode())%hashTableSize + " -> Row " + table1_rows_count + '<br>';
			table_1.innerHTML += "Row " + table1_rows_count + "'s " + table1_data[field1_no].innerText + " value is " + '"' + table1_data[table1_rows_count*column1+field1_no].innerText + '"';
			for (var i=1; i < table1_hash_rows.length; i++) {
				if (table1_hash_data[i*2].innerText == (table1_data[match_arr[0]*column1+field1_no].innerText.hashCode())%hashTableSize) {
					table1_hash_rows[i].style.backgroundColor = '#C1FFC1'; 
				}
			}
			table_2.innerHTML += "Row " + table2_rows_count + "'s " + table2_data[field2_no].innerText + " value is " + '"' + table2_data[table2_rows_count*column2+field2_no].innerText + '"<br>';
			table_2.innerHTML += "Hash value: " + (table2_data[table2_rows_count*column2+field2_no].innerText.hashCode())%hashTableSize + "<br>";
			table_2.innerHTML += "Check hash table to see if any match record can be found";
			table_1.innerHTML += "<br><br>" + table_1_hash.innerHTML;
			return;
		}	
	}
	
	if (table3_rows_count < table3_rows.length-1) {
		if (table1_data[table1_rows_count*column1+field1_no].innerText == table2_data[table2_rows_count*column2+field2_no].innerText) {
			table3_rows[table3_rows_count].style.backgroundColor = '';
			table3_rows_count++;
			table3_rows[table3_rows_count].style.display = 'table-row';
			table3_rows[table3_rows_count].style.backgroundColor = 'rgb(193, 255, 193)';
			record.innerHTML += table_1name.innerText + "'s " + '"'+ table1_data[table1_rows_count*column1+field1_no].innerText + "\" = ";
			record.innerHTML += table_2name.innerText + "'s " + '"'+ table2_data[table2_rows_count*column2+field2_no].innerText + "\"<br>";
			record.innerHTML += "Row " + table3_rows_count + " is added";
		} else {
			record.innerHTML += "No data which has hash value " + '"' + (table2_data[table2_rows_count*column2+field2_no].innerText.hashCode())%hashTableSize + '" in the hash table<br>';
			record.innerHTML += "No data is added";
		}
		table_1.innerHTML += "<br><br>" + table_1_hash.innerHTML;
	} else {
		if (table1_rows_count) {
			table1_rows[table1_rows_count].style.backgroundColor = '';
		}
		if (table2_rows_count < table2_rows.length) {
			table2_rows[table2_rows_count].style.backgroundColor = '';
		}
		table3_rows[table3_rows_count].style.backgroundColor = '';
		record.innerHTML += (table3_rows.length-1) + " rows are selected";
		table_1.innerHTML = table_1.innerHTML.substring(0, table_1.innerHTML.indexOf("</table>")+8);
	}
}
	
function mergeSort(arr, field)
{
	var arr_length = Object.keys(arr).length;
    if (arr.length < 2)
        return arr;
 
    var middle = parseInt(arr_length / 2);
	
	var left = [];
	for (var i=0; i<middle; i++) {
		left[i] = arr[i];
	}
	
	var right = [];
	for (var i=0; i<arr_length - middle; i++) {
		right[i] = arr[middle + i];
	}
 
    return merge(mergeSort(left, field), mergeSort(right, field), field);
}
 
function merge(left, right, field)
{
    var result = [];
 
    while (Object.keys(left).length && Object.keys(right).length) {
        if (left[0][field] <= right[0][field]) {
            result.push(left.shift());
        } else {
            result.push(right.shift());
        }
    }
 
    while (Object.keys(left).length)
        result.push(left.shift());
 
    while (Object.keys(right).length)
        result.push(right.shift());
 
    return result;
}	


function multiJoinHandler(dbName, index_field, index_table, index_where, command_arr, location){
	var table_1 = document.getElementById("table_1");
	var table_2 = document.getElementById("table_2");
	var msg = document.getElementById("msg");
	
	if (location) {
		location = document.getElementById(location);
	} 
	
	var start=new Date().getTime();
	var end;
	var request=indexedDB.open(dbName);
	//if (location) { location.innerHTML = ''; }
	
	var req_tables = command_arr[index_table].split(',');
	
	var req_field = command_arr[index_field];
	var split_req_field = req_field.split(',');
	
	//Check if the required field contains . or not
	//select class>>>.<<<department, student>>>.<<<id from student, class where student.department = class.department
	for (var i=0; i<split_req_field.length; i++) {
		if (split_req_field.length == 1 && split_req_field[0] == '*') {
			break;
		}
		else if (split_req_field[i].search('\\.') == -1) {
			if (msg) { msg.innerHTML = 'ERROR[20]: Wrong input field (' + split_req_field[i] + ')<br/>'; }
			return;
		}
	}

	var field_table1 = [];
	var field_table1_count = 0;
	var field_table2 = [];
	var field_table2_count = 0;
	var field_table3 = [];
	var field_table3_count = 0;
	
	var table
	
	var first_result = [];
	var object_result =[];

	//Check if the required table correct
	//select >>>class<<<.department, >>>student<<<.id from student, class where student.department = class.department
	for (var i=0; i<split_req_field.length; i++) {
		if (split_req_field.length == 1 && split_req_field[0] == '*') {
			table = '*';
		} else {
			var str = split_req_field[i].split('.');
			table = str[0];
		}
		
		if (table == req_tables[0]) {
			field_table1[field_table1_count] = str[1];
			field_table1_count++;
		} else if (table == req_tables[1]) {
			field_table2[field_table2_count] = str[1];
			field_table2_count++;
		} else if (table == req_tables[2]) {
			field_table3[field_table3_count] = str[1];
			field_table3_count++;
		} else if (table == '*') {
			field_table1[0] = '*';
			field_table2[0] = '*';
			field_table3[0] = '*';
		} else {
			if (msg) { msg.innerHTML = 'ERROR[21]: Wrong input table (' + table + ')<br/>'; }
			return;
		}
	}
		
	
	var search_field1 = command_arr[index_where+1].split('.');
	var table1 = search_field1[0];
	var field1 = search_field1[1];
	
	var operator = command_arr[index_where+2];
	if (operator != '=') {
		if (msg) { msg.innerHTML += 'ERROR[5]: No such operator' + ' (' + operator + ')<br/>'; }
		return;
	}
	
	var search_field2 = command_arr[index_where+3].split('.');
	var table2 = search_field2[0];
	var field2 = search_field2[1];
	
	var logical_operator = command_arr[index_where+4];
	if (logical_operator.toLowerCase() != 'and') {
		if (msg) { msg.innerHTML += 'ERROR[5]: No such operator' + ' (' + operator + ')<br/>'; }
		return;
	}
	
	var search_field3 = command_arr[index_where+5].split('.');
	var table3 = search_field3[0];
	var field3 = search_field3[1];
	
	var operator2 = command_arr[index_where+6];
	if (operator2 != '=') {
		if (msg) { msg.innerHTML += 'ERROR[5]: No such operator' + ' (' + operator + ')<br/>'; }
		return;
	}
	
	var search_field4 = command_arr[index_where+7].split('.');
	var table4 = search_field4[0];
	var field4 = search_field4[1];
	
	if (req_tables[0] != table1 || req_tables[1] != table2 || req_tables[1] != table3 || req_tables[2] != table4) {
		if (msg) { msg.innerHTML += 'ERROR[23]: Tables not match (' + req_tables + '|' + table1 + ',' + table2 + ',' + table4 + ')'; }
			return;
	}
	
	request.onsuccess = function (e) {
		db = this.result;
		
		var dTableNames = db.objectStoreNames;
		var match_table=0;
		for (var i = 0; i < dTableNames.length; i++) {
			for (var j=0; j<req_tables.length; j++) {
				if  (req_tables[j] == dTableNames[i]) {
					match_table++;
				}
			}
		}
		if (match_table != req_tables.length) {
			if (msg) { msg.innerHTML = 'ERROR[22]: No such table (' + req_tables + ')<br/>'; }
			return;
		}
		
		var transaction = db.transaction([req_tables[0], req_tables[1], req_tables[2]]);
		
		var firstCursor;
		var firstCursorObj = {};
		var firstCount=0;
		var secondCursor;
		var secondCursorObj = {};
		var secondCount=0;
		var thirdCursor;
		var thirdCursorObj = {};
		var thirdCount=0;
		var row_count=0;
		var row_count2=0;
		
		var firstStore = transaction.objectStore(req_tables[0]);
		var req = firstStore.openCursor();
		req.onsuccess = function(event) {
			firstCursor = event.result || event.target.result;
			if (firstCursor) {
				var data ='{';
				
				for (var i=0; i<firstStore.indexNames.length; i++) {
					data += firstStore.indexNames[i];
					if (typeof firstCursor.value[firstStore.indexNames[i]] == "string") {
						data += ': "' + firstCursor.value[firstStore.indexNames[i]] + '"';
					} else {
						data += ': ' + firstCursor.value[firstStore.indexNames[i]];
					}
										
					if (i != firstStore.indexNames.length-1) {
						data += ',';
					}
				}
				
				data += '}';
				eval('firstCursorObj[firstCount] =' +data);
				firstCount++;
				data = '';
				firstCursor.continue();
			}
		};
		
		var secondStore = transaction.objectStore(req_tables[1]);
		var req = secondStore.openCursor();
		req.onsuccess = function(event) {
			secondCursor = event.result || event.target.result;
			if (secondCursor) {
				var data ='{';
				for (var i=0; i<secondStore.indexNames.length; i++) {
					data += secondStore.indexNames[i];
					
					if (typeof secondCursor.value[secondStore.indexNames[i]] == "string") {
						data += ': "' + secondCursor.value[secondStore.indexNames[i]] + '"';
					} else {
						data += ': ' + secondCursor.value[secondStore.indexNames[i]];
					}
					
					if (i != secondStore.indexNames.length-1) {
						data += ',';
					}
				}
				data += '}';
				eval('secondCursorObj[secondCount] =' +data);
				secondCount++;
				data = '';
				secondCursor.continue();
			}
		};
		
		var thirdStore = transaction.objectStore(req_tables[2]);
		var req = thirdStore.openCursor();
		req.onsuccess = function(event) {
			thirdCursor = event.result || event.target.result;
			if (thirdCursor) {
				var data ='{';
				
				for (var i=0; i<thirdStore.indexNames.length; i++) {
					data += thirdStore.indexNames[i];
					if (typeof thirdCursor.value[thirdStore.indexNames[i]] == "string") {
						data += ': "' + thirdCursor.value[thirdStore.indexNames[i]] + '"';
					} else {
						data += ': ' + thirdCursor.value[thirdStore.indexNames[i]];
					}
										
					if (i != thirdStore.indexNames.length-1) {
						data += ',';
					}
				}
				
				data += '}';
				eval('thirdCursorObj[thirdCount] =' +data);
				thirdCount++;
				data = '';
				thirdCursor.continue();
			}
		};
		
		transaction.oncomplete = function(event) {
			
			var outputStr = '<h3>' + req_tables[0] +' x '+ req_tables[1] +' x '+ req_tables[2] + '</h3>' + '<table><tr class="first_row">';
			outputStr += '<td></td>';
			
			for (var field in firstCursorObj[0]) {
			
				for (var i=0; i<field_table1.length; i++) {
					if (field_table1[i] == field || field_table1[0] == '*') {
						outputStr += '<td>' + table1 + '_' + field + '</td>';
					}
				}
			}
				
			for (var field in secondCursorObj[0]) {
				
				for (var i=0; i<field_table2.length; i++) {
					if (field_table2[i] == field || field_table2[0] == '*') {
						outputStr += '<td>' + table2 + '_' + field + '</td>';
					}
				}
			}
			
			for (var field in thirdCursorObj[0]) {
				
				for (var i=0; i<field_table3.length; i++) {
					if (field_table3[i] == field || field_table3[0] == '*') {
						outputStr += '<td>' + table4 + '_' + field + '</td>';
					}
				}
			}
					
			outputStr += '</tr><tr>';
			
			//=====================Hash Join==========================
			var firstHashTable = [];
			var firstSecondHashTable = [];
					
			for (var i=0; i<Object.keys(firstCursorObj).length; i++) {
				var hash_value = firstCursorObj[i][field1].toString().hashCode()%hashTableSize;
				if (firstHashTable[hash_value] == null) {
					firstHashTable[hash_value] = i.toString();
				} else {
					firstHashTable[hash_value] += ',' + i.toString();
				}
			}
					
			for (var i=0; i<Object.keys(secondCursorObj).length; i++) {
				var hash_value = secondCursorObj[i][field2].toString().hashCode()%hashTableSize;
				if (firstHashTable[hash_value] != null) {
					var match_arr = firstHashTable[hash_value].split(',');

					for (var j=0; j<match_arr.length; j++) {
						if (firstCursorObj[match_arr[j]][field1] == secondCursorObj[i][field2]) {
							var data ='{';
							
							for (var field in firstCursorObj[match_arr[j]]) {
								data += table1 + '_' + field;
									
								if (typeof firstCursorObj[match_arr[j]][field] == "string") {
									data += ': "' + firstCursorObj[match_arr[j]][field] + '",';
								} else {
									data += ': ' + firstCursorObj[match_arr[j]][field] + ',';
								}
							}
									
							for (var field in secondCursorObj[i]) {
								data += table2 + '_' + field;
									
								if (typeof secondCursorObj[i][field] == "string") {
									data += ': "' + secondCursorObj[i][field] + '",';
								} else {
									data += ': ' + secondCursorObj[i][field] + ',';
								}
							}
													
							data = data.slice(0, -1);
							data += '}';
							if (data != '}') {
								eval('first_result[row_count] =' +data);
								row_count++;
							}		
							data = '';		
						}
					}
				}
			}
			
			for (var i=0; i<Object.keys(first_result).length; i++) {
				var newField = table3 + '_' + field3;
				var hash_value = first_result[i][newField].toString().hashCode()%hashTableSize;
				if (firstSecondHashTable[hash_value] == null) {
					firstSecondHashTable[hash_value] = i.toString();
				} else {
					firstSecondHashTable[hash_value] += ',' + i.toString();
				}
			}
			
			for (var i=0; i<Object.keys(thirdCursorObj).length; i++) {
			
				var hash_value = thirdCursorObj[i][field4].toString().hashCode()%hashTableSize;
				if (firstSecondHashTable[hash_value] != null) {
					var match_arr = firstSecondHashTable[hash_value].split(',');

					for (var j=0; j<match_arr.length; j++) {
						if (first_result[match_arr[j]][newField] == thirdCursorObj[i][field4]) {
							outputStr += '<td>' + (row_count2+1) + '</td>';
							var data ='{';
							
							for (var field in first_result[match_arr[j]]) {
								if (field_table1[0] == '*') {
									data += field;
									if (typeof first_result[match_arr[j]][field] == "string") {
										data += ': "' + first_result[match_arr[j]][field] + '",';
									} else {
										data += ': ' + first_result[match_arr[j]][field] + ',';
									}
									outputStr += '<td>' + first_result[match_arr[j]][field] + '</td>';
								} else {
									for (var k=0; k<field_table1.length; k++) {
										if (table1 + '_' + field_table1[k] == field) {
											data += field;
										
											if (typeof first_result[match_arr[j]][field] == "string") {
												data += ': "' + first_result[match_arr[j]][field] + '",';
											} else {
												data += ': ' + first_result[match_arr[j]][field] + ',';
											}
											outputStr += '<td>' + first_result[match_arr[j]][field] + '</td>';
										}
									}
									for (var k=0; k<field_table2.length; k++) {
										if (table2 + '_' + field_table2[k] == field) {
											data += field;
										
											if (typeof first_result[match_arr[j]][field] == "string") {
												data += ': "' + first_result[match_arr[j]][field] + '",';
											} else {
												data += ': ' + first_result[match_arr[j]][field] + ',';
											}
											outputStr += '<td>' + first_result[match_arr[j]][field] + '</td>';
										}
									}
									
								}
							}
									
							for (var field in thirdCursorObj[i]) {
								
								for (var k=0; k<field_table3.length; k++) {
									if (field_table3[k] == field || field_table3[0] == '*') {
										data += table4 + '_' + field;
									
										if (typeof thirdCursorObj[i][field] == "string") {
											data += ': "' + thirdCursorObj[i][field] + '",';
										} else {
											data += ': ' + thirdCursorObj[i][field] + ',';
										}
										
										outputStr += '<td>' + thirdCursorObj[i][field] + '</td>';
									}
								}
								
							}
									
							outputStr += '</tr>';
									
							data = data.slice(0, -1);
							data += '}';
							if (data != '}') {
								eval('object_result[row_count2] =' +data);
								row_count2++;
							}		
							data = '';		
						}
					}
				}
			}
			
			outputStr += '</table><br/>';
			
			end = new Date().getTime();
			if (msg) { msg.innerHTML += 'Execution Time: ' + (end - start) + ' ms<br>'; }
			
			if (location) {
				location.innerHTML = outputStr;
				location.innerHTML += Object.keys(object_result).length + ' rows are selected.<br/>';
			}
			
								
			//=====================Hash Join==========================*/
		};

		db.close();
	};
}

function joinHandler(dbName, index_field, index_table, index_where, command_arr, location){
	var table_1 = document.getElementById("table_1");
	var table_2 = document.getElementById("table_2");
	var msg = document.getElementById("msg");
	if (location) {
		location = document.getElementById(location);
	} 

	var start=new Date().getTime();
	var end;
	var request=indexedDB.open(dbName);
	
	var req_tables = command_arr[index_table].split(',');
	
	var req_field = command_arr[index_field];
	var split_req_field = req_field.split(',');
	
	//Check if the required field contains . or not
	//select class>>>.<<<department, student>>>.<<<id from student, class where student.department = class.department
	for (var i=0; i<split_req_field.length; i++) {
		if (split_req_field.length == 1 && split_req_field[0] == '*') {
			break;
		}
		else if (split_req_field[i].search('\\.') == -1) {
			if (msg) { msg.innerHTML = 'ERROR[20]: Wrong input field (' + split_req_field[i] + ')<br/>'; }
			return;
		}
	}
	
	var field_table1 = [];
	var field_table1_count = 0;
	var field_table2 = [];
	var field_table2_count = 0;
	var table
	
	var object_result =[];
	
	//Check if the required table correct
	//select >>>class<<<.department, >>>student<<<.id from student, class where student.department = class.department
	for (var i=0; i<split_req_field.length; i++) {
		if (split_req_field.length == 1 && split_req_field[0] == '*') {
			table = '*';
		} else {
			var str = split_req_field[i].split('.');
			table = str[0];
		}
		
		if (table == req_tables[0]) {
			field_table1[field_table1_count] = str[1];
			field_table1_count++;
		} else if (table == req_tables[1]) {
			field_table2[field_table2_count] = str[1];
			field_table2_count++;
		} else if (table == '*') {
			field_table1[0] = '*';
			field_table2[0] = '*';
		} else {
			if (msg) { msg.innerHTML = 'ERROR[21]: Wrong input table (' + table + ')<br/>'; }
			return;
		}
	}
	
	var search_field1 = command_arr[index_where+1].split('.');
	var table1 = search_field1[0];
	var field1 = search_field1[1];
	
	var operator = command_arr[index_where+2];
	
	var search_field2 = command_arr[index_where+3].split('.');
	var table2 = search_field2[0];
	var field2 = search_field2[1];
	
	if (req_tables[0] != table1 || req_tables[1] != table2) {
		if (msg) { msg.innerHTML = 'ERROR[23]: Tables not match (' + req_tables + '|' + table1 + ',' + table2 + ')'; }
			return;
	}
	
	request.onsuccess = function (e) {
		db = this.result;
		
		var dTableNames = db.objectStoreNames;
		var match_table=0;
		for (var i = 0; i < dTableNames.length; i++) {
			for (var j=0; j<req_tables.length; j++) {
				if  (req_tables[j] == dTableNames[i]) {
					match_table++;
				}
			}
		}
		if (match_table != req_tables.length) {
			if (msg) { msg.innerHTML += 'ERROR[10]: Object store (' + req_tables + ') is not exist.<br/>'; }
			return;
		}
		
		var transaction = db.transaction([req_tables[0], req_tables[1]]);
		
		var firstCursor;
		var firstCursorObj = {};
		var firstCount=0;
		var secondCursor;
		var secondCursorObj = {};
		var secondCount=0;
		var row_count=0;
		
		var firstStore = transaction.objectStore(req_tables[0]);
		var req = firstStore.openCursor();
		req.onsuccess = function(event) {
			firstCursor = event.result || event.target.result;
			if (firstCursor) {
				var data ='{';
				
				for (var i=0; i<firstStore.indexNames.length; i++) {
					data += firstStore.indexNames[i];
					if (typeof firstCursor.value[firstStore.indexNames[i]] == "string") {
						data += ': "' + firstCursor.value[firstStore.indexNames[i]] + '"';
					} else {
						data += ': ' + firstCursor.value[firstStore.indexNames[i]];
					}
										
					if (i != firstStore.indexNames.length-1) {
						data += ',';
					}
				}
				
				data += '}';
				eval('firstCursorObj[firstCount] =' +data);
				firstCount++;
				data = '';
				firstCursor.continue();
			}
		};
		
		var secondStore = transaction.objectStore(req_tables[1]);
		var req = secondStore.openCursor();
		req.onsuccess = function(event) {
			secondCursor = event.result || event.target.result;
			if (secondCursor) {
				var data ='{';
				for (var i=0; i<secondStore.indexNames.length; i++) {
					data += secondStore.indexNames[i];
					
					if (typeof secondCursor.value[secondStore.indexNames[i]] == "string") {
						data += ': "' + secondCursor.value[secondStore.indexNames[i]] + '"';
					} else {
						data += ': ' + secondCursor.value[secondStore.indexNames[i]];
					}
					
					if (i != secondStore.indexNames.length-1) {
						data += ',';
					}
				}
				data += '}';
				eval('secondCursorObj[secondCount] =' +data);
				secondCount++;
				data = '';
				secondCursor.continue();
			}
		};
		
		
		transaction.oncomplete = function(event) {
			var nestloopjoinCheck = document.getElementById('nestloopjoin');
			var sortmergejoinCheck = document.getElementById('sortmergejoin');
			var hashjoinCheck = document.getElementById('hashjoin');
			var visualizationCheck = document.getElementById('visualization');
			
			var outputStr = ''; 
			if (visualizationCheck && visualizationCheck.checked == true) {
				outputStr += '<h2 style="color: red">Result</h2>';
			}
			outputStr += '<h3>' + req_tables[0] +' x '+ req_tables[1] +'</h3>' + '<table><tr class="first_row">';
			outputStr += '<td></td>';
			
			for (var field in firstCursorObj[0]) {
			
				for (var i=0; i<field_table1.length; i++) {
					if (field_table1[i] == field || field_table1[0] == '*') {
						outputStr += '<td>' + table1 + '_' + field + '</td>';
					}
				}
			}
				
			for (var field in secondCursorObj[0]) {
				
				for (var i=0; i<field_table2.length; i++) {
					if (field_table2[i] == field || field_table2[0] == '*') {
						outputStr += '<td>' + table2 + '_' + field + '</td>';
					}
				}
			}
					
			outputStr += '</tr><tr>';
			
			if (nestloopjoinCheck && nestloopjoinCheck.checked == true) {
				//=================Nested Loops Join==========================
				for (var i=0; i<Object.keys(firstCursorObj).length; i++) {
					for (var j=0; j<Object.keys(secondCursorObj).length; j++) {
						
						if (compare(firstCursorObj[i][field1], secondCursorObj[j][field2], operator)) {
							outputStr += '<td>' + (row_count+1) + '</td>';
							var data ='{';
							for (var field in firstCursorObj[i]) {
								for (var k=0; k<field_table1.length; k++) {
									if (field_table1[k] == field || field_table1[0] == '*') {
										data += table1 + '_' + field;
										
										if (typeof firstCursorObj[i][field] == "string") {
											data += ': "' + firstCursorObj[i][field] + '",';
										} else {
											data += ': ' + firstCursorObj[i][field] + ',';
										}
										
										outputStr += '<td>' + firstCursorObj[i][field] + '</td>';
										
									}	
								}
							}
							for (var field in secondCursorObj[j]) {
								for (var k=0; k<field_table2.length; k++) {
									if (field_table2[k] == field || field_table2[0] == '*') {
										data += table2 + '_' + field;
										
										if (typeof secondCursorObj[j][field] == "string") {
											data += ': "' + secondCursorObj[j][field] + '",';
										} else {
											data += ': ' + secondCursorObj[j][field] + ',';
										}
										
										outputStr += '<td>' + secondCursorObj[j][field] + '</td>';
										
									}	
								}
							}
							
							outputStr += '</tr>';
							
							data = data.slice(0, -1);
							data += '}';
							eval('object_result[row_count] =' +data);
							row_count++;
							data = '';
						}
					}
				}
				//=====================Nested Loops Join==========================*/
			} else if (sortmergejoinCheck && sortmergejoinCheck.checked == true) {
				//=====================Sort-merge Join==========================
				if (operator != '=') {
					if (msg) { msg.innerHTML += 'ERROR[5]: No such operator' + ' (' + operator + ')<br/>'; }
					return;
				}
				
				firstCursorObj = mergeSort(firstCursorObj, field1);
				secondCursorObj = mergeSort(secondCursorObj, field2);
						
				var i=0;
				var j=0;
				var prev_same=0;
				var same = 0;
				
				outputStr += '<td>' + 1 + '</td>';
				var data ='{';		
						
				if (firstCursorObj[0][field1] == secondCursorObj[0][field2]) {
					for (var field in firstCursorObj[i]) {
						for (var k=0; k<field_table1.length; k++) {
							if (field_table1[k] == field || field_table1[0] == '*') {
								data += table1 + '_' + field;
								
								if (typeof firstCursorObj[i][field] == "string") {
									data += ': "' + firstCursorObj[i][field] + '",';
								} else {
									data += ': ' + firstCursorObj[i][field] + ',';
								}

								outputStr += '<td>' + firstCursorObj[i][field] + '</td>';
							}
						}
					}
					for (var field in secondCursorObj[j]) {
					
						for (var k=0; k<field_table2.length; k++) {
							if (field_table2[k] == field || field_table2[0] == '*') {
								data += table2 + '_' + field;
								
								if (typeof secondCursorObj[j][field] == "string") {
									data += ': "' + secondCursorObj[j][field] + '",';
								} else {
									data += ': ' + secondCursorObj[j][field] + ',';
								}
								
								outputStr += '<td>' + secondCursorObj[j][field] + '</td>';
							}
						}	
					}
					outputStr += '</tr>';
				}
				
				data = data.slice(0, -1);
				data += '}';
				if (data != '}') {
					eval('object_result[row_count] =' +data);
					row_count++;
				}
					
				data = '';
						
				while (i<Object.keys(firstCursorObj).length && j<Object.keys(secondCursorObj).length) {
					var data ='{';
					
					for (var k=j; k>0; k--) {
						if (secondCursorObj[k][field2] != secondCursorObj[k-1][field2]) {
							same = k;
							break;
						}
					}
					
					if (firstCursorObj[i][field1] > secondCursorObj[j][field2]) {
						j++;
					} else if (j<Object.keys(secondCursorObj).length-1 && secondCursorObj[j][field2] == secondCursorObj[j+1][field2]) {
						j++
					} else {
						i++;
						if (i<Object.keys(firstCursorObj).length && firstCursorObj[i][field1] == firstCursorObj[i-1][field1]) {
							j=same;
						} 
						if (i<Object.keys(firstCursorObj).length && firstCursorObj[i][field1] == secondCursorObj[j][field2]) {
							j=same;
						}
					}

					if (i<Object.keys(firstCursorObj).length && j<Object.keys(secondCursorObj).length && firstCursorObj[i][field1] == secondCursorObj[j][field2]) {
						if (row_count!=0) {
							outputStr += '<td>' + (row_count+1) + '</td>';
						}	
						for (var field in firstCursorObj[i]) {
							for (var k=0; k<field_table1.length; k++) {
								if (field_table1[k] == field || field_table1[0] == '*') {
									data += table1 + '_' + field;
									
									if (typeof firstCursorObj[i][field] == "string") {
										data += ': "' + firstCursorObj[i][field] + '",';
									} else {
										data += ': ' + firstCursorObj[i][field] + ',';
									}

									outputStr += '<td>' + firstCursorObj[i][field] + '</td>';
								}
							}
						}
						for (var field in secondCursorObj[j]) {
						
							for (var k=0; k<field_table2.length; k++) {
								if (field_table2[k] == field || field_table2[0] == '*') {
									data += table2 + '_' + field;
									
									if (typeof secondCursorObj[j][field] == "string") {
										data += ': "' + secondCursorObj[j][field] + '",';
									} else {
										data += ': ' + secondCursorObj[j][field] + ',';
									}
									
									outputStr += '<td>' + secondCursorObj[j][field] + '</td>';
								}
							}								
						}
						
						outputStr += '</tr>';
					}
					
					data = data.slice(0, -1);
					data += '}';
					if (data != '}') {
						eval('object_result[row_count] =' +data);
						row_count++;
					}
					
					data = '';
				}
				//=====================Sort-merge Join==========================*/
			} else {
				//=====================Hash Join==========================
				var firstHashTable = [];
				if (operator != '=') {
					if (msg) { msg.innerHTML += 'ERROR[5]: No such operator' + ' (' + operator + ')<br/>'; }
					return;
				}
						
				for (var i=0; i<Object.keys(firstCursorObj).length; i++) {
					var hash_value = (firstCursorObj[i][field1].toString().hashCode())%hashTableSize;
					if (firstHashTable[hash_value] == null) {
						firstHashTable[hash_value] = i.toString();
					} else {
						firstHashTable[hash_value] += ',' + i.toString();
					}
				}
						
				for (var i=0; i<Object.keys(secondCursorObj).length; i++) {
					var hash_value = (secondCursorObj[i][field2].toString().hashCode())%hashTableSize;
					if (firstHashTable[hash_value] != null) {
						var match_arr = firstHashTable[hash_value].split(',');

						for (var j=0; j<match_arr.length; j++) {
							if (firstCursorObj[match_arr[j]][field1] == secondCursorObj[i][field2]) {
								outputStr += '<td>' + (row_count+1) + '</td>';
								var data ='{';
								
								for (var field in firstCursorObj[match_arr[j]]) {
									
									for (var k=0; k<field_table1.length; k++) {
										if (field_table1[k] == field || field_table1[0] == '*') {
											data += table1 + '_' + field;
										
											if (typeof firstCursorObj[match_arr[j]][field] == "string") {
												data += ': "' + firstCursorObj[match_arr[j]][field] + '",';
											} else {
												data += ': ' + firstCursorObj[match_arr[j]][field] + ',';
											}

											outputStr += '<td>' + firstCursorObj[match_arr[j]][field] + '</td>';
										}
									}
								}
										
								for (var field in secondCursorObj[i]) {
									
									for (var k=0; k<field_table2.length; k++) {
										if (field_table2[k] == field || field_table2[0] == '*') {
											data += table2 + '_' + field;
										
											if (typeof secondCursorObj[i][field] == "string") {
												data += ': "' + secondCursorObj[i][field] + '",';
											} else {
												data += ': ' + secondCursorObj[i][field] + ',';
											}
											
											outputStr += '<td>' + secondCursorObj[i][field] + '</td>';
										}
									}
									
								}
								
								outputStr += '</tr>';
										
								data = data.slice(0, -1);
								data += '}';
								if (data != '}') {
									eval('object_result[row_count] =' +data);
									row_count++;
								}
										
								data = '';
							}		
						}
					}
				}								
				//=====================Hash Join==========================*/
			}		
			outputStr += '</table><br/>';	
				
			end = new Date().getTime();
			if (msg) { msg.innerHTML += 'Execution Time: ' + (end - start) + ' ms<br>'; }
			console.log(end - start);
			
			if (location) { 
				location.innerHTML = outputStr; 
				location.innerHTML += Object.keys(object_result).length + ' rows are selected.<br/>';			
			}
			
			if (location && table_1 && table_2) {
				if (visualizationCheck && visualizationCheck.checked == true) {
					displayTable_V(firstCursorObj, "table_1", req_tables[0]);
					displayTable_V(secondCursorObj, "table_2", req_tables[1]);
					
					var nestloopjoinCheck = document.getElementById('nestloopjoin');
					var sortmergejoinCheck = document.getElementById('sortmergejoin');
					var hashjoinCheck = document.getElementById('hashjoin');
					operator_V = operator;
					
					if (hashjoinCheck && hashjoinCheck.checked == true) {
						visual_hash_initial(1,1, field1, field2);
					} else if (sortmergejoinCheck && sortmergejoinCheck.checked == true) {
						visual_sort_initial(1,1, field1, field2);
					} else if (nestloopjoinCheck && nestloopjoinCheck.checked == true) {
						visual_loop_initial(1,1, field1, field2);
					}
					
				} 
			}	
		};
		
		db.close();
	};
}

//select * from a right join b on a.b=b.b
function outerJoinHandler(dbName, index_field, index_table, index_on, command_arr, location) {
	var table_1 = document.getElementById("table_1");
	var table_2 = document.getElementById("table_2");
	var msg = document.getElementById("msg");

	if (location) {
		location = document.getElementById(location);
	} 	
	
	var request=indexedDB.open(dbName);
	
	var req_tables = [];
	req_tables[0] = command_arr[index_table];
	req_tables[1] = command_arr[index_table+3];
	
	var req_field = command_arr[index_field];
	var split_req_field = req_field.split(',');
	
	//Check if the required field contains . or not
	//select class>>>.<<<department, student>>>.<<<id from student, class where student.department = class.department
	for (var i=0; i<split_req_field.length; i++) {
		if (split_req_field.length == 1 && split_req_field[0] == '*') {
			break;
		}
		else if (split_req_field[i].search('\\.') == -1) {
			if (msg) { msg.innerHTML = 'ERROR[20]: Wrong input field (' + split_req_field[i] + ')<br/>'; }
			return;
		}
	}
	
	var field_table1 = [];
	var field_table1_count = 0;
	var field_table2 = [];
	var field_table2_count = 0;
	var table
	
	var object_result =[];
	var display_result = [];
	
	//Check if the required table correct
	//select >>>class<<<.department, >>>student<<<.id from student, class where student.department = class.department
	for (var i=0; i<split_req_field.length; i++) {
		if (split_req_field.length == 1 && split_req_field[0] == '*') {
			table = '*';
		} else {
			var str = split_req_field[i].split('.');
			table = str[0];
		}
		
		if (table == req_tables[0]) {
			field_table1[field_table1_count] = str[1];
			field_table1_count++;
		} else if (table == req_tables[1]) {
			field_table2[field_table2_count] = str[1];
			field_table2_count++;
		} else if (table == '*') {
			field_table1[0] = '*';
			field_table2[0] = '*';
		} else {
			if (msg) { msg.innerHTML = 'ERROR[21]: Wrong input table (' + table + ')<br/>'; }
			return;
		}
	}
	
	var search_field1 = command_arr[index_on+1].split('.');
	var table1 = search_field1[0];
	var field1 = search_field1[1];
	
	var operator = command_arr[index_on+2];
	if (operator != '=') {
		if (msg) { msg.innerHTML += 'ERROR[5]: No such operator' + ' (' + operator + ')<br/>'; }
		return;
	}
	
	var search_field2 = command_arr[index_on+3].split('.');
	var table2 = search_field2[0];
	var field2 = search_field2[1];
	
	if (req_tables[0] != table1 || req_tables[1] != table2) {
		if (msg) { msg.innerHTML = 'ERROR[23]: Tables not match (' + req_tables + '|' + table1 + ',' + table2 + ')'; }
			return;
	}
	
	request.onsuccess = function (e) {
		db = this.result;
		
		var dTableNames = db.objectStoreNames;
		var match_table=0;
		for (var i = 0; i < dTableNames.length; i++) {
			for (var j=0; j<req_tables.length; j++) {
				if  (req_tables[j] == dTableNames[i]) {
					match_table++;
				}
			}
		}
		if (match_table != req_tables.length) {
			if (msg) { msg.innerHTML += 'ERROR[10]: Object store (' + req_tables + ') is not exist.<br/>'; }
			return;
		}
		
		var transaction = db.transaction([req_tables[0], req_tables[1]]);
		
		var firstCursor;
		var firstCursorObj = {};
		var firstCount=0;
		var secondCursor;
		var secondCursorObj = {};
		var secondCount=0;
		
		var row_count=0;
		
		var firstStore = transaction.objectStore(req_tables[0]);
		var req = firstStore.openCursor();
		req.onsuccess = function(event) {
			firstCursor = event.result || event.target.result;
			if (firstCursor) {
				var data ='{';
				for (var i=0; i<firstStore.indexNames.length; i++) {
					data += firstStore.indexNames[i];
					
					if (typeof firstCursor.value[firstStore.indexNames[i]] == "string") {
						data += ': "' + firstCursor.value[firstStore.indexNames[i]] + '"';
					} else {
						data += ': ' + firstCursor.value[firstStore.indexNames[i]];
					}
					
					if (i != firstStore.indexNames.length-1) {
						data += ',';
					}
				}
				data += '}';
				eval('firstCursorObj[firstCount] =' +data);
				firstCount++;
				data = '';
				firstCursor.continue();
			}
		};
		
		var secondStore = transaction.objectStore(req_tables[1]);
		var req = secondStore.openCursor();
		req.onsuccess = function(event) {
			secondCursor = event.result || event.target.result;
			if (secondCursor) {
				var data ='{';
				for (var i=0; i<secondStore.indexNames.length; i++) {
					data += secondStore.indexNames[i];
					
					if (typeof secondCursor.value[secondStore.indexNames[i]] == "string") {
						data += ': "' + secondCursor.value[secondStore.indexNames[i]] + '"';
					} else {
						data += ': ' + secondCursor.value[secondStore.indexNames[i]];
					}

					if (i != secondStore.indexNames.length-1) {
						data += ',';
					}
				}
				data += '}';
				eval('secondCursorObj[secondCount] =' +data);
				secondCount++;
				data = '';
				secondCursor.continue();
			}
		};
		
		transaction.oncomplete = function(event) {
			
			var outputStr = '<h3>' + req_tables[0] +' x '+ req_tables[1] +'</h3>' + '<table><tr class="first_row">';
			outputStr += '<td></td>';
			
			for (var field in firstCursorObj[0]) {
			
				for (var i=0; i<field_table1.length; i++) {
					if (field_table1[i] == field || field_table1[0] == '*') {
						outputStr += '<td>' + table1 + '_' + field + '</td>';
					}
				}
			}
				
			for (var field in secondCursorObj[0]) {
				
				for (var i=0; i<field_table2.length; i++) {
					if (field_table2[i] == field || field_table2[0] == '*') {
						outputStr += '<td>' + table2 + '_' + field + '</td>';
					}
				}
			}
			
			outputStr += '</tr><tr>';
			
			if (command_arr[index_table+1].toLowerCase() == "left") {
				//=====================Nested Loop Join==========================
				for (var i=0; i<Object.keys(firstCursorObj).length; i++) {
					var sec_match_count = 0;
					for (var j=0; j<Object.keys(secondCursorObj).length; j++) {

						if (firstCursorObj[i][field1] == secondCursorObj[j][field2]) {
							outputStr += '<td>' + (row_count+1) + '</td>';
							var data ='{';
							
							for (var field in firstCursorObj[i]) {
								for (var k=0; k<field_table1.length; k++) {
									if (field_table1[k] == field || field_table1[0] == '*') {
										data += table1 + '_' + field;
										
										if (typeof firstCursorObj[i][field] == "string") {
											data += ': "' + firstCursorObj[i][field] + '",';
										} else {
											data += ': ' + firstCursorObj[i][field] + ',';
										}
										
										outputStr += '<td>' + firstCursorObj[i][field] + '</td>';

									}	
								}
							}

							for (var field in secondCursorObj[j]) {
								for (var k=0; k<field_table2.length; k++) {
									if (field_table2[k] == field || field_table2[0] == '*') {
										data += table2 + '_' + field;
										
										if (typeof secondCursorObj[j][field] == "string") {
											data += ': "' + secondCursorObj[j][field] + '",';
										} else {
											data += ': ' + secondCursorObj[j][field] + ',';
										}
										
										outputStr += '<td>' + secondCursorObj[j][field] + '</td>';
									}	
								}
							}
							outputStr += '</tr>';
							
							data=data.slice(0, -1);
							data += '}';
							eval('object_result[row_count] =' +data);
							row_count++;
							sec_match_count++;
							data = '';
							
						}
					}
							
					if (sec_match_count == 0) {
						outputStr += '<td>' + (row_count+1) + '</td>';
						var data ='{';
						for (var field in firstCursorObj[i]) {
							for (var k=0; k<field_table1.length; k++) {
								if (field_table1[k] == field || field_table1[0] == '*') {
									data += table1 + '_' + field;
										
									if (typeof firstCursorObj[i][field] == "string") {
										data += ': "' + firstCursorObj[i][field] + '",';
									} else {
										data += ': ' + firstCursorObj[i][field] + ',';
									}
										
									outputStr += '<td>' + firstCursorObj[i][field] + '</td>';
								}	
							}
						}
						for (var field in secondCursorObj[0]) {
							for (var k=0; k<field_table2.length; k++) {
								if (field_table2[k] == field || field_table2[0] == '*') {
									data += table2 + '_' + field;
									data += ': " ",';
									outputStr += '<td>' + ' ' + '</td>';
								}	
							}
						}
						
						outputStr += '</tr>';
						data = data.slice(0, -1);
						data += '}';
						eval('object_result[row_count] =' +data);
						row_count++;
						data = '';
					}
				}
				//=====================Nested Loop Join==========================*/
			} else {
				//=====================Nested Loop Join==========================
				for (var i=0; i<Object.keys(secondCursorObj).length; i++) {
					var sec_match_count = 0;
					for (var j=0; j<Object.keys(firstCursorObj).length; j++) {
						if (firstCursorObj[j][field1] == secondCursorObj[i][field2]) {
							outputStr += '<td>' + (row_count+1) + '</td>';
							var data ='{';
							for (var field in firstCursorObj[j]) {
								for (var k=0; k<field_table1.length; k++) {
									if (field_table1[k] == field || field_table1[0] == '*') {
										data += table1 + '_' + field;
										
										if (typeof firstCursorObj[j][field] == "string") {
											data += ': "' + firstCursorObj[j][field] + '",';
										} else {
											data += ': ' + firstCursorObj[j][field] + ',';
										}
										
										outputStr += '<td>' + firstCursorObj[j][field] + '</td>';

									}	
								}
							}
								
							for (var field in secondCursorObj[i]) {
								for (var k=0; k<field_table2.length; k++) {
									if (field_table2[k] == field || field_table2[0] == '*') {
										data += table2 + '_' + field;
										
										if (typeof secondCursorObj[i][field] == "string") {
											data += ': "' + secondCursorObj[i][field] + '",';
										} else {
											data += ': ' + secondCursorObj[i][field] + ',';
										}
										
										outputStr += '<td>' + secondCursorObj[i][field] + '</td>';
									}	
								}
							}
							outputStr += '</tr>';
							
							data = data.slice(0, -1);
							data += '}';
							eval('object_result[row_count] =' +data);
							row_count++;
							sec_match_count++;
							data = '';
							
						}
					}
					if (sec_match_count == 0) {
						outputStr += '<td>' + (row_count+1) + '</td>';
						var data ='{';

						for (var field in firstCursorObj[0]) {
							for (var k=0; k<field_table1.length; k++) {
								if (field_table1[k] == field || field_table1[0] == '*') {
									data += table1 + '_' + field;
									data += ': " ",';
									outputStr += '<td>' + ' ' + '</td>';
								}	
							}
						}
						
						for (var field in secondCursorObj[i]) {
							for (var k=0; k<field_table2.length; k++) {
								if (field_table2[k] == field || field_table2[0] == '*') {
									data += table2 + '_' + field;
										
									if (typeof secondCursorObj[i][field] == "string") {
										data += ': "' + secondCursorObj[i][field] + '",';
									} else {
										data += ': ' + secondCursorObj[i][field] + ',';
									}
									
									outputStr += '<td>' + secondCursorObj[i][field] + '</td>';
								}	
							}
						}
						outputStr += '</tr>';
						data = data.slice(0, -1);
						data += '}';
						eval('object_result[row_count] =' +data);
						row_count++;
						data = '';
					}
				}
				//=====================Nested Loop Join==========================*/
			}
			outputStr += '</table><br/>';
			
			console.log('End: ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds() + ':' + new Date().getMilliseconds());
			
			if (location) {
				location.innerHTML = outputStr;
				location.innerHTML += Object.keys(object_result).length + ' rows are selected.<br/>';
			}
		};
		db.close();
	};

}

		
function createTable(e, table, value) {
	var msg = document.getElementById("msg");
	var objectstore=e.currentTarget.result.createObjectStore(table,{keyPath: value[0]});
		
	for (var i = 0; i < value.length; i++) {
		objectstore.createIndex(value[i], value[i],{unique: false});
	}
		
	if (msg) { msg.innerHTML += 'Object store (' +table+ ') is created.<br>'; }
}
	
//Create new objectstore
function createTableHandler(dbName, command_arr){
	var msg = document.getElementById("msg");
	ver = ver + 1;
	var request=indexedDB.open(dbName, ver);
	
	request.onsuccess = function (e) {
		db = this.result;
		db.close();
	};
			
	request.onerror = function (e) {
		console.error(e.target.errorCode);
	};
			
	request.onupgradeneeded = function (e) {
		var req_table = command_arr[2];
		var value = command_arr[3].split(',');
		
		var dTableNames = e.currentTarget.result.objectStoreNames;
		
		var match_table=false;
		for (var i = 0; i < dTableNames.length; i++) {
			if  (req_table == dTableNames[i]) {
				match_table=true;
			}
		}
		if (match_table == true) {
			if (msg) { msg.innerHTML += 'ERROR[9]: Object store ('+ req_table +') already exist.<br>'; }
			return;
		}
		
		createTable(e, req_table, value);
	};
}

function deleteTableHandler(dbName, table){
	var msg = document.getElementById("msg");
	ver = ver + 1;
	var request=indexedDB.open(dbName, ver);
	
	request.onsuccess = function (e) {
		db = this.result;
		db.close();
	};
			
	request.onerror = function (e) {
		console.error(e.target.errorCode);
	};
			
	request.onupgradeneeded = function (e) {

		var dTableNames = e.currentTarget.result.objectStoreNames;
		
		var match_table=false;
		for (var i = 0; i < dTableNames.length; i++) {
			if  (table == dTableNames[i]) {
				match_table=true;
			}
		}
		if (match_table != true) {
			if (msg) { msg.innerHTML += 'ERROR[10]: Object store (' + table + ') is not exist.<br/>'; }
			return;
		}
		
		e.currentTarget.result.deleteObjectStore(table);
		if (msg) { msg.innerHTML += 'Object store (' +table+ ') is deleted.'; }
	};
}

//Handler SELECT command
function selectHandler(dbName, command_arr, location) {
	var msg = document.getElementById("msg");
	
	var index_field;
	var index_table;
	var index_where;
	var index_on;
	var isContainFrom = false;
	for (var i=1; i<command_arr.length; i++) {
		if (command_arr[i].toLowerCase() == 'from') {
			index_field = i-1;
			index_table = i+1;
			index_where = i+2;
			index_on = i+5;
			isContainFrom = true;
			break;
		}
	}
	
	var result = [];
	if (isContainFrom == false) {
		if (msg) { msg.innerHTML += 'ERROR[3]: Wrong command<br/>'; }
	} else if (command_arr[index_table].search(',') != -1) {
		if (command_arr.length == 8 && command_arr[index_table].split(',').length == 2) {
			joinHandler(dbName, index_field, index_table, index_where, command_arr, location);
		} else if (command_arr.length == 12 && command_arr[index_table].split(',').length == 3) {
			multiJoinHandler(dbName, index_field, index_table, index_where, command_arr, location);
		} else {
			if (msg) { msg.innerHTML += 'ERROR[19]: Wrong command<br/>'; }
		}
	} else if (index_table+4 < command_arr.length
			&& (command_arr[index_table+1].toLowerCase() == "left" || command_arr[index_table+1].toLowerCase() == "right") 
			&& command_arr[index_table+2].toLowerCase() == "join" && command_arr[index_table+4].toLowerCase() == "on") {
		outerJoinHandler(dbName, index_field, index_table, index_on, command_arr, location);
	} else if (index_where < command_arr.length && command_arr[index_where].toLowerCase() == 'where') {
		selectWhere(dbName, index_field, index_table, index_where, command_arr, location);
	} else if (command_arr.length == 4) {
		selectAll(dbName, command_arr[index_field], command_arr[index_table], location);
	} else {
		if (msg) { msg.innerHTML += 'ERROR[4]: Wrong command<br/>'; }
	}
}

function selectWhere(dbName, index_field, index_table, index_where, command_arr, location) {
	var msg = document.getElementById("msg");
	
	if (location) {
		location = document.getElementById(location);
	} 
	
	var start=new Date().getTime();
	var end;
	var req_field = command_arr[index_field];
	var req_table = command_arr[index_table];
	
	var index_search_field = new Array();
	var index_search_operator = new Array();
	var index_search_value = new Array();
	var index_search_logic = new Array();
	var field_count=0;
	for (var i=index_where; i<=(command_arr.length-4); i+=4) {
		index_search_field[field_count]=i+1;
		index_search_operator[field_count]=i+2;
		index_search_value[field_count]=i+3;
		index_search_logic[field_count]=i+4;
		
		field_count++;
	}
	
	
	var split_req_field = req_field.split(',');
	var object_result =[];
	var request=indexedDB.open(dbName);
	
	request.onsuccess = function (e) {
		db = this.result;
		var dTableNames = db.objectStoreNames;
		
		var match_table=false;
		for (var i = 0; i < dTableNames.length; i++) {
			if  (req_table == dTableNames[i]) {
				match_table=true;
			}
		}
		if (match_table == false) {
			if (msg) { msg.innerHTML += 'ERROR[10]: Object store (' + req_table + ') is not exist.<br/>'; }
			return;
		}
		
		var transaction=db.transaction([req_table]);
		var objectstore=transaction.objectStore(req_table);
		
		for (var i=0; i<index_search_field.length; i++) {
			
			var match_field = false;
			for (var j=0; j<objectstore.indexNames.length; j++){
				if (objectstore.indexNames[j] == command_arr[index_search_field[i]]) {
					match_field = true;
					break;
				}
			}
			if (match_field == false) {
				if (msg) { msg.innerHTML = "ERROR[18]: No such field (" + command_arr[index_search_field[i]] + ")<br/>"; }
				return;
			}
			
			if (command_arr[index_search_operator[i]] != '=' && command_arr[index_search_operator[i]] != '<=' && command_arr[index_search_operator[i]] != '<' && command_arr[index_search_operator[i]] != '>=' && command_arr[index_search_operator[i]] != '>' && command_arr[index_search_operator[i]] != '!=') {
				if (msg) { msg.innerHTML += 'ERROR[5]: No such operator' + ' (' + command_arr[index_search_operator[i]] + ')<br/>'; }
				return;
			}
			
			if (i<index_search_field.length-1) {
				if (command_arr[index_search_logic[i]].toLowerCase() != 'and') {
					if (msg) { msg.innerHTML += 'ERROR[5]: No such operator' + ' (' + command_arr[index_search_logic[i]] + ')<br/>'; }
					return;
				}
			} else if (command_arr[index_search_logic[i]]) {
				if (msg) { msg.innerHTML += 'ERROR[26]: Wrong command<br/>'; }
				return;
			}
		}
		
		var outputStr = '<h3>' + req_table + '</h3>' + '<table><tr class="first_row"><td></td>';
		
		if (split_req_field[0] != '*') {
			for (var i=0; i<split_req_field.length; i++) {
				var match_field = false;
				for (var j=0; j<objectstore.indexNames.length; j++){
					if (objectstore.indexNames[j] == split_req_field[i]) {
						match_field = true;
						break;
					}
				}
				if (match_field == true) {
					outputStr += '<td>' + split_req_field[i] + '</td>';
				} else {
					if (msg) { msg.innerHTML = "ERROR[18]: No such field (" + split_req_field[i] + ")<br/>"; }
					return;
				}
			}
		} else {
			for (var i=0; i<objectstore.indexNames.length; i++) {
				outputStr += '<td>' + objectstore.indexNames[i] + '</td>';
			}
		}
		
		outputStr += '</tr>';
		
		
		var request = objectstore.openCursor();
		
		var field_count=0;
		var row_count=0;
		request.onsuccess = function(e) {
			var cursor = e.result || e.target.result;
			
			if (cursor) {
				
				var data ='{';

					for (var field in cursor.value) {
							if (typeof cursor.value[field] =="string") {
								data += field + ': "' + cursor.value[field] + '"';
							} else {
								data += field + ': ' + cursor.value[field];
							}
							data += ',';
					}
				data = data.slice(0, -1);
				data +='}';
				
				if (data != '}') {
					eval('object_result[row_count] =' +data);
					row_count++;
					data = '';
				}
				
				cursor.continue();
			}
		};
		
		transaction.oncomplete = function(event) {	
			for (var i=0; i<index_search_field.length; i++) {
				var temp_result = [];
				var temp_count = 0;
				for (var j=0; j<Object.keys(object_result).length; j++) {
					var search_value = command_arr[index_search_value[i]].replace(/"/g, '');
					if (compare(object_result[j][command_arr[index_search_field[i]]], search_value, command_arr[index_search_operator[i]]) == true) {
						temp_result[temp_count] = object_result[j];
						temp_count++;
					}
				}
				object_result = temp_result;
			}	
			
			var row_count = 1;
			for (var i=0; i<Object.keys(object_result).length; i++) {
				outputStr += '<td>' + row_count + '</td>';
				for (var j=0; j<split_req_field.length ; j++) {
					for (var field in object_result[0]) {
						if (split_req_field[j] == field || split_req_field[0] == '*') {
							outputStr += '<td>' + object_result[i][field] + '</td>';
						}
					}
				}	
				outputStr += '</tr>';
				row_count++;
			}
			
			outputStr += '</table><br/>';
			if (location) {
				location.innerHTML = outputStr;
				location.innerHTML += Object.keys(object_result).length + ' rows are selected.<br/>';
			}
			end = new Date().getTime();
			if (msg) { msg.innerHTML += 'Execution Time: ' + (end - start) + ' ms<br>'; }
		};
		
		db.close();
	};
}

//Show SELECT records
function selectAll(dbName, req_field, req_table, location) {
	var msg = document.getElementById("msg");
	if (location) {
		location = document.getElementById(location);
	} 
	
	var start=new Date().getTime();
	var end;
	var split_req_field = req_field.split(',');
	
	var request=indexedDB.open(dbName);
	request.onsuccess = function (e) {
		db = this.result;
		var dTableNames = db.objectStoreNames;
		var match_table=false;
		for (var i = 0; i < dTableNames.length; i++) {
			if  (req_table == dTableNames[i]) {
				match_table=true;
			}
		}
		if (match_table == false) {
			if (msg) { msg.innerHTML += 'ERROR[10]: Object store (' + req_table + ') is not exist.<br/>'; }
			return;
		}
		
		var transaction=db.transaction([req_table]);
		var objectstore=transaction.objectStore(req_table);
		
		var outputStr = '<h3>' + req_table + '</h3>' + '<table><tr class="first_row"><td></td>';

		
		if (split_req_field[0] != '*') {
			for (var i=0; i<split_req_field.length; i++) {
				match_field = false;
				for (var j=0; j<objectstore.indexNames.length; j++){
					if (objectstore.indexNames[j] == split_req_field[i]) {
						match_field = true;
						break;
					}
				}
				if (match_field == true) {
					outputStr += '<td>' + split_req_field[i] + '</td>';
				} else {
					if (msg) { msg.innerHTML = "ERROR[18]: No such field (" + split_req_field[i] + ")<br/>"; }
					return;
				}
			}
		} else {
			for (var i=0; i<objectstore.indexNames.length; i++) {
				outputStr += '<td>' + objectstore.indexNames[i] + '</td>';
			}
		}

		outputStr += '</tr>';
		
		var request = objectstore.openCursor();
		var field_count=0;
		var row_count=0;
		request.onsuccess = function(e) {
			var cursor = e.result || e.target.result;
			
			if (cursor) {
				outputStr += '<tr>';
				outputStr += '<td>'+ (row_count+1) + '</td>';
			
				var data ='{';
				for (var i=0; i<req_field.length ; i++) {
					for (var field in cursor.value) {
						if (split_req_field[i] == field || split_req_field[0] == '*') {
							if (typeof cursor.value[field] =="string") {
								data += field + ': "' + cursor.value[field] + '"';
							} else {
								data += field + ': ' + cursor.value[field];
							}
							if (i != req_field.length-1 || (split_req_field[0] == '*' && i != objectstore.indexNames.length-1)) {
								data += ',';
							}
							
							outputStr += '<td>' + cursor.value[field] + '</td>';
							
							field_count += 1;
						}
					}
				}
				outputStr += '</tr>';
				data +='}';
				
				if (field_count == 0) {
					if (msg) { msg.innerHTML = "ERROR[18]: No such field (" + split_req_field[i] + ")<br/>"; }
					return;
				}
				
				eval('object_result[row_count] =' +data);
				row_count++;
				data = '';
				
				cursor.continue();
			}
		};
		
		transaction.oncomplete = function(event) {
			outputStr += '</table><br/>';
			
			if (location) {
				location.innerHTML = outputStr;
				location.innerHTML += row_count + ' rows are selected.<br/>';
			}
			
			end = new Date().getTime();
			if (msg) { msg.innerHTML += 'Execution Time: ' + (end - start) + ' ms<br>'; }

		};
		
		db.close();
	};
	
}		
	

function insertHandler(dbName, command){
	var msg = document.getElementById("msg");
	var index_table;
	var index_values;
	var index_update_values;
	var open_index = -1;
	var close_index = -1;
	var firstOpenFound = false;
	var firstCloseFound = false;
	var sec_open_index = -1;
	var sec_close_index = -1;
	
	for (var i=0; i<command.length; i++) {
		if (firstOpenFound == false || firstCloseFound == false) {
			if (command[i] == "(") {
				open_index = i;
				firstOpenFound = true;
				continue;
			} else if (command[i] == ")"){
				close_index = i;
				firstCloseFound = true;
				continue;
			}
		} else {
			if (command[i] == "(") {
				sec_open_index = i;
				continue;
			} else if (command[i] == ")"){
				sec_close_index = i;
				break;
			}
		}
	}
	
	if (open_index == -1 || close_index == -1) {
		if (msg) { msg.innerHTML += 'ERROR[12]: Wrong command<br/>'; }
		return;
	}
	
	command=command.replace(/[\(\)]/g,"");
	command = addSpaceHandler(command);
	var command_arr = command.split(' ');
	command_arr = removeSpaceHandler(command_arr);
	
	for (var i=2; i<command_arr.length; i++) {
		command_arr[i]=command_arr[i].replace(/<s>/g, " ");
		if (command_arr[i].toLowerCase() == 'values') {
			index_table = i-1;
			index_values = i+1;
			index_update_values = i+6;
		}
	}
		
	if (command_arr.length == 5) {
		addData(dbName, command_arr[index_table], command_arr[index_values]);
	} else if (command_arr.length == 6 && command_arr[1].toLowerCase() == 'ignore') {
		insertIgnore(dbName, command_arr[index_table], command_arr[index_values]);
	} else if (command_arr.length == 10 && command_arr[5].toLowerCase() == 'on' && command_arr[6].toLowerCase() == 'duplicate' && command_arr[7].toLowerCase() == 'key' && command_arr[8].toLowerCase() == 'update') {
		if (sec_open_index == -1 || sec_close_index == -1) {
			if (msg) { msg.innerHTML += 'ERROR[13]: Wrong command<br/>'; }
		}
		duplicateKeyUpdate(dbName, command_arr[index_table], command_arr[index_values], command_arr[index_update_values]);
	} else {
		if (msg) { msg.innerHTML += 'ERROR[6]: Wrong command<br/>'; }
	}
	
}	

function insertIgnore(dbName, table, values) {
	var msg = document.getElementById("msg");
	var request=indexedDB.open(dbName);
	request.onsuccess = function (e) {
		db = this.result;
		var value = values.split(',');
		var dTableNames = db.objectStoreNames;
		var match_table=false;
		for (var i = 0; i < dTableNames.length; i++) {
			if  (table == dTableNames[i]) {
				match_table=true;
			}
		}
		if (match_table == false) {
			if (msg) { msg.innerHTML += 'ERROR[10]: Object store (' + table + ') is not exist.<br/>'; }
			return;
		}
		
		var transaction=db.transaction([table], 'readwrite');
		var objectstore=transaction.objectStore(table);
		
		if (value.length != objectstore.indexNames.length) {
			if (msg) { msg.innerHTML += 'ERROR[11]: Property number is not matched.<br/>'; }
			return;
		}
		
		var index_key;
		for (var i=0; i<objectstore.indexNames.length; i++) {
			if (objectstore.indexNames[i] == objectstore.keyPath) {
				index_key = i;
				break;
			}
		}
			
		var index=objectstore.index(objectstore.keyPath);
		if (value[index_key].search('"') != -1) {
			var key_value = value[index_key].replace(/"/g, '');
			var range=IDBKeyRange.only(key_value);
		} else {
			var range=IDBKeyRange.only(parseInt(value[index_key]));
		}

		var request = index.openCursor(range);
		var insert_count =0;
		
		request.onsuccess = function(e) {
			var cursor = e.result || e.target.result;
			
			if (cursor == null) {
				var data ='{';
				for (var j=0; j<value.length; j++) {
					data += objectstore.indexNames[j];
					data += ': ';
					data += value[j];
					if (j != value.length-1) {
						data += ',';
					}
				}
				data += '}';

				eval('var obj_data=' +data);
				objectstore.add(obj_data);
				insert_count++;
			} 
		}
		
		
		transaction.oncomplete = function (e) {
			if (insert_count != 0) {
				if (msg) { msg.innerHTML += '1 object is inserted into the object store (' + table + ').<br/>'; }
			} else {
				if (msg) { msg.innerHTML += '1 object insertion is ignored (' + table + ').<br/>'; }
			}
		}
		
		db.close();
	};
}		

function duplicateKeyUpdate(dbName, table, values, update_values) {
	var msg = document.getElementById("msg");
	var request=indexedDB.open(dbName);
	request.onsuccess = function (e) {
		db = this.result;
		var value = values.split(',');
		var update_value = update_values.split(',');
		var dTableNames = db.objectStoreNames;
		var match_table=false;
		for (var i = 0; i < dTableNames.length; i++) {
			if  (table == dTableNames[i]) {
				match_table=true;
			}
		}
		if (match_table == false) {
			if (msg) { msg.innerHTML += 'ERROR[10]: Object store (' + table + ') is not exist.<br/>'; }
			return;
		}
		
		var transaction=db.transaction([table], 'readwrite');
		var objectstore=transaction.objectStore(table);
		
		if (value.length != objectstore.indexNames.length || update_value.length != objectstore.indexNames.length) {
			if (msg) { msg.innerHTML += 'ERROR[11]: Property number is not matched.<br/>'; }
			return;
		}
		
		var index_key;
		for (var i=0; i<objectstore.indexNames.length; i++) {
			if (objectstore.indexNames[i] == objectstore.keyPath) {
				index_key = i;
				break;
			}
		}
			
		var index=objectstore.index(objectstore.keyPath);
		if (value[index_key].search('"') != -1) {
			var key_value = value[index_key].replace(/"/g, '');
			var range=IDBKeyRange.only(key_value);
		} else {
			var range=IDBKeyRange.only(parseInt(value[index_key]));
		}

		var request = index.openCursor(range);
		var insert_count=0;
		var update_count=0;
		
		request.onsuccess = function(e) {
			var cursor = e.result || e.target.result;
			
			if (!cursor) {
				var data ='{';
				for (var j=0; j<value.length; j++) {
					data += objectstore.indexNames[j];
					data += ': ';
					data += value[j];
					if (j != value.length-1) {
						data += ',';
					}
				}
				data += '}';

				eval('var obj_data=' +data);
				objectstore.add(obj_data);
				insert_count++;
			} else {
				var data ='{';
				for (var j=0; j<update_value.length; j++) {
					data += objectstore.indexNames[j];
					data += ': ';
					data += update_value[j];
					if (j != update_value.length-1) {
						data += ',';
					}
				}
				data += '}';

				eval('var obj_data=' +data);
				objectstore.put(obj_data);
				update_count++;
			}
		}
		
		transaction.oncomplete = function (e) {
			if (insert_count != 0) {
				if (msg) { msg.innerHTML += '1 object is inserted into the object store (' + table + ').<br/>'; }
			} 
			if (update_count != 0) {
				if (msg) { msg.innerHTML += '1 object is updated in the object store (' + table + ').<br/>'; }
			} 
		}
		
		db.close();
	};
}		

//insert into class values (ABC, CS9999, Computing, 10:00)
function addData(dbName, table, values) {
	var msg = document.getElementById("msg");
	var request=indexedDB.open(dbName);
	request.onsuccess = function (e) {
		db = this.result;
		var value = values.split(',');
		var dTableNames = db.objectStoreNames;
		var match_table=false;
		for (var i = 0; i < dTableNames.length; i++) {
			if  (table == dTableNames[i]) {
				match_table=true;
			}
		}
		if (match_table == false) {
			if (msg) { msg.innerHTML += 'ERROR[10]: Object store (' + table + ') is not exist.<br/>'; }
			return;
		}
		
		var transaction=db.transaction([table], 'readwrite');
		var objectstore=transaction.objectStore(table);
		
		if (value.length != objectstore.indexNames.length) {
			if (msg) { msg.innerHTML += 'ERROR[11]: Property number is not matched.<br/>'; }
			return;
		}
		
		var index_key;
		for (var i=0; i<objectstore.indexNames.length; i++) {
			if (objectstore.indexNames[i] == objectstore.keyPath) {
				index_key = i;
				break;
			}
		}
			
		var index=objectstore.index(objectstore.keyPath);
		if (value[index_key].search('"') != -1) {
			var range=IDBKeyRange.only(value[index_key].replace(/"/g, ''));
		} else {
			var range=IDBKeyRange.only(parseInt(value[index_key]));
		}

		var request = index.openCursor(range);
		var insert_count = 0;
		var duplicate_count = 0;
		
		request.onsuccess = function(e) {
			var cursor = e.result || e.target.result;
			
			if (cursor == null) {
				var data ='{';
				for (var j=0; j<value.length; j++) {
					data += objectstore.indexNames[j];
					data += ': ';
					data += value[j];
					if (j != value.length-1) {
						data += ',';
					}
				}
				data += '}';

				eval('var obj_data=' +data);
				objectstore.add(obj_data);
				insert_count++;
			} else {
				duplicate_count++;
			}
		}
		
		transaction.oncomplete = function (e) {
			if (insert_count != 0) {
				if (msg) { msg.innerHTML += '1 object is inserted into the object store (' + table + ').<br/>'; }
			} 
			
			if (duplicate_count != 0) {
				if (msg) { msg.innerHTML += '1 object cannot be inserted into the object store (' + table + ') due to duplicate key.<br/>'; }
			} 
		}
		
		
		db.close();
	};
}		
	
function deleteHandler(dbName, command_arr) {
	var msg = document.getElementById("msg");
	var index_table = 2;
	var index_where = 3;
	var index_field = 4;
	var index_operator = 5;
	var index_value = 6;
	
	if (command_arr.length == 3) {
		deleteAllData(dbName, command_arr[index_table]);
	} else if (command_arr[index_where].toLowerCase() == 'where') {
		if (command_arr[index_value].search('"') != -1) {
			command_arr[index_value] = command_arr[index_value].replace(/"/g,"");
			deleteData(dbName, command_arr[index_table], command_arr[index_field], command_arr[index_operator], command_arr[index_value]);
		} else {
			deleteData(dbName, command_arr[index_table], command_arr[index_field], command_arr[index_operator], parseInt(command_arr[index_value]));
		}
	} else {
		if (msg) { msg.innerHTML += 'ERROR[7]: Wrong command<br/>'; }
	}
}

function deleteAllData(dbName, req_table) {
	var msg = document.getElementById("msg");
	var delete_count = 0;
	var request=indexedDB.open(dbName);
	request.onsuccess = function (e) {
		db = this.result;
			
		var dTableNames = db.objectStoreNames;
		var match_table=false;
		for (var i = 0; i < dTableNames.length; i++) {
			if  (req_table == dTableNames[i]) {
				match_table=true;
			}
		}
		if (match_table == false) {
			if (msg) { msg.innerHTML += 'ERROR[10]: Object store (' + req_table + ') is not exist.<br/>'; }
			return;
		}
		
		var transaction=db.transaction([req_table], 'readwrite');
		var objectstore=transaction.objectStore(req_table)
		
		var request = objectstore.openCursor();
		request.onsuccess = function(e) {
			var cursor = e.result || e.target.result;
			
			if (cursor) {
				var reqDel = cursor.delete();
				delete_count ++;				

				cursor.continue();
			}
		};
		
		transaction.oncomplete = function(e) {
			if (delete_count == 1) {
				if (msg) { msg.innerHTML = '1 object is deleted from the object store (' + req_table + ').<br/>'; }
			} else {
				if (msg) { msg.innerHTML = delete_count + ' objects are deleted from the object store (' + req_table + ').<br/>'; }
			}	
		}
		
		db.close();
	};
}

function deleteData(dbName, req_table, del_field, operator, del_value) {
	var msg = document.getElementById("msg");
	var request=indexedDB.open(dbName);
	request.onsuccess = function (e) {
		db = this.result;
			
		var dTableNames = db.objectStoreNames;
		var match_table=false;
		for (var i = 0; i < dTableNames.length; i++) {
			if  (req_table == dTableNames[i]) {
				match_table=true;
			}
		}
		if (match_table == false) {
			if (msg) { msg.innerHTML += 'ERROR[10]: Object store (' + req_table + ') is not exist.<br/>'; }
			return;
		}
		
		var transaction=db.transaction([req_table], 'readwrite');
		var objectstore=transaction.objectStore(req_table)
		var match_field = false;
		
		for (var i=0; i<objectstore.indexNames.length; i++) {
			if (objectstore.indexNames[i] == del_field) {
				match_field = true;
				break;
			}
		}
		if (match_field == false) {
			if (msg) { msg.innerHTML += 'ERROR[17]: No such field (' + del_field + ')<br/>'; }
			return;
		}
		
		var index=objectstore.index(del_field);
		var range;
		switch (operator) {
			case '=':
				range=IDBKeyRange.only(del_value);
				break;
				
			case '<=':
				range=IDBKeyRange.upperBound(del_value);
				break;
				
			case '<':
				range=IDBKeyRange.upperBound(del_value, true);
				break;
				
			case '>=':
				range=IDBKeyRange.lowerBound(del_value);
				break;
				
			case '>':
				range=IDBKeyRange.lowerBound(del_value, true);
				break;
				
			case '=':
				range=IDBKeyRange.only(del_value);
				break;
				
			default:
				if (msg) { msg.innerHTML += 'ERROR[5]: No such operator' + ' (' + operator + ')<br/>'; }
				return;
		}
		
		var delete_count =0;
		var request = index.openCursor(range);
		request.onsuccess = function(e) {
			var cursor = e.result || e.target.result;
			if (cursor) {
				var reqDel = cursor.delete();
				delete_count ++;				
				
				cursor.continue();
			}
		};
		
		transaction.oncomplete = function(e) {
			if (delete_count == 1) {
				if (msg) { msg.innerHTML = '1 object is deleted from the object store (' + req_table + ').<br/>'; }
			} else {
				if (msg) { msg.innerHTML = delete_count + ' objects are deleted from the object store (' + req_table + ').<br/>'; }
			}	
		}
		
		db.close();
	};
}	

function addSpaceHandler(string) {
	var quote = false;
	for (var i=0; i<string.length; i++) {
		if (string[i] == '"' && quote == false) {
			quote = true;
		} else if (string[i] == '"' && quote == true) {
			quote = false;
		} else if (quote == true && string[i] == " ") {
			string = string.substr(0, i) + "<s>" + string.substr(i+1);
		}
	}
	if (quote == true) {
		return "_quote_error";
	} else {
		return string;
	}
}

function removeSpaceHandler(command_arr) {
	for (var i=1; i<command_arr.length; i++) {
		command_arr[i]=command_arr[i].replace(/<s>/g, " ");
	}
	return command_arr;
}
		
function updateHandler(dbName, command) {
	var index_table = 1;
	var i;
	
	var indexOfSET = command.toLowerCase().indexOf("set");
	var indexOfWHERE = command.toLowerCase().indexOf("where");
	if (!indexOfSET || !indexOfWHERE) {
		if (msg) { msg.innerHTML = "ERROR[24]: Wrong command"; }
		return;
	}
	
	command = addSpaceHandler(command);
	if (command == "_quote_error") {
		if (msg) { msg.innerHTML = "ERROR[25]: Wrong command"; }
		return;
	}
	
	command_arr = command.split(" ");
	command_arr = removeSpaceHandler(command_arr);
		

	for (i=1; i<command_arr.length; i++) {
		if (command_arr[i].toLowerCase() == 'where') {
			index_where = i;
			break;
		}
	}
	
	var index_search_field = new Array();
	var index_search_operator = new Array();
	var index_search_value = new Array();
	var index_search_logic = new Array();
	var field_count=0;
	for (var i=index_where; i<=(command_arr.length-4); i+=4) {
		index_search_field[field_count]=i+1;
		index_search_operator[field_count]=i+2;
		index_search_value[field_count]=i+3;
		index_search_logic[field_count]=i+4;
		field_count++;
	}
	
	var index_set_field = new Array();
	var index_set_operator = new Array();
	var index_set_value = new Array();
	var field_count=0;
	for (var j=0; j<(i-3); j+=3) {
		index_set_field[field_count]=j+3;
		index_set_operator[field_count]=j+4;
		index_set_value[field_count]=j+5;
		field_count++;
	}
		
	updateData(dbName, command_arr[index_table], index_search_field, index_search_operator, index_search_value, index_search_logic, 
				index_set_field, index_set_operator, index_set_value, field_count, command_arr);
}

function updateData(dbName, req_table, index_search_field, index_search_operator, index_search_value, index_search_logic, index_set_field, index_set_operator, index_set_value, field_count, command_arr) {
	var record = document.getElementById("record");
	var msg = document.getElementById("msg");
	
	if (record) { record.innerHTML = '';}
	var request=indexedDB.open(dbName);
	request.onsuccess = function (e) {
		db = this.result;
			
		var dTableNames = db.objectStoreNames;
		var match_table=false;
		for (var i = 0; i < dTableNames.length; i++) {
			if  (req_table == dTableNames[i]) {
				match_table=true;
			}
		}
		if (match_table == false) {
			if (msg) { msg.innerHTML += 'ERROR[10]: Object store (' + table + ') is not exist.<br/>'; }
			return;
		}
		
		var transaction=db.transaction([req_table], 'readwrite');
		var objectstore=transaction.objectStore(req_table)
		
		for (var i=0; i<index_search_field.length; i++) {
			
			var match_field = false;
			for (var j=0; j<objectstore.indexNames.length; j++){
				if (objectstore.indexNames[j] == command_arr[index_search_field[i]]) {
					match_field = true;
					break;
				}
			}
			if (match_field == false) {
				if (msg) { msg.innerHTML = "ERROR[18]: No such field (" + command_arr[index_search_field[i]] + ")<br/>"; }
				return;
			}
			
			if (command_arr[index_search_operator[i]] != '=' && command_arr[index_search_operator[i]] != '<=' && command_arr[index_search_operator[i]] != '<' && command_arr[index_search_operator[i]] != '>=' && command_arr[index_search_operator[i]] != '>' && command_arr[index_search_operator[i]] != '!=') {
				if (msg) { msg.innerHTML += 'ERROR[5]: No such operator' + ' (' + command_arr[index_search_operator[i]] + ')<br/>'; }
				return;
			}
			
			if (i<index_search_field.length-1) {
				if (command_arr[index_search_logic[i]].toLowerCase() != 'and') {
					if (msg) { msg.innerHTML += 'ERROR[5]: No such operator' + ' (' + command_arr[index_search_logic[i]] + ')<br/>'; }
					return;
				}
			} else if (command_arr[index_search_logic[i]]) {
				if (msg) { msg.innerHTML += 'ERROR[26]: Wrong command<br/>'; }
				return;
			}
		}
		
		if (command_arr[index_search_value[0]].search('"') != -1) {
			var searchValue = command_arr[index_search_value[0]].replace(/"/g,"");
		} else {
			var searchValue = parseInt(command_arr[index_search_value[0]]);
		}
		
		var index=objectstore.index(command_arr[index_search_field[0]]);
		var range;
		switch (command_arr[index_search_operator[0]]) {
			case '=':
				range=IDBKeyRange.only(searchValue);
				break;
				
			case '<=':
				range=IDBKeyRange.upperBound(searchValue);
				break;
				
			case '<':
				range=IDBKeyRange.upperBound(searchValue, true);
				break;
				
			case '>=':
				range=IDBKeyRange.lowerBound(searchValue);
				break;
				
			case '>':
				range=IDBKeyRange.lowerBound(searchValue, true);
				break;
				
			case '=':
				range=IDBKeyRange.only(searchValue);
				break;
				
			default:
				if (msg) { msg.innerHTML += 'ERROR[5]: No such operator' + ' (' + operator + ')<br/>'; }
				return;
		}
		
		var request = index.openCursor(range);
		var update_count = 0;
		request.onsuccess = function(e) {
			var cursor = e.result || e.target.result;
			
			if (cursor) {
				var matchAllValue = true;
				for (var i=1; i<index_search_field.length; i++) {
					if (command_arr[index_search_value[i]].search('"') != -1) {
						var searchValue = command_arr[index_search_value[i]].replace(/"/g,"");
					} else {
						var searchValue = parseInt(command_arr[index_search_value[i]]);
					}
					if (!compare(cursor.value[command_arr[index_search_field[i]]], searchValue, command_arr[index_search_operator[i]])) {
						matchAllValue = false;
					}
				}
				
				if (matchAllValue == true) {
					var data = '{';
					var i=0;
					for (var field in cursor.value) {
						data += field
						data += ": ";
						if (field == command_arr[index_set_field[i]]) {
							data += command_arr[index_set_value[i]];
							i++;
						} else {
						
							if (typeof cursor.value[field] == "string") {
								data += '"' + cursor.value[field] + '"';
							} else {
								data += cursor.value[field];
							}
						}
						data += ",";		
					}
					data = data.slice(0, -1);
					data += '}';
					
					eval('var obj_data=' +data);
					var request = cursor.delete();
					var request = objectstore.add(obj_data);
					update_count++;
				}
				cursor.continue();
			}
		};
		transaction.oncomplete = function(e) {
			if (update_count == 1) {
				if (msg) { msg.innerHTML = '1 object is updated in the object store (' + req_table + ')<br/>'; }
			} else {
				if (msg) { msg.innerHTML = update_count + ' objects are updated in the object store (' + req_table + ').<br/>'; }
			}
		}
		
		db.close();
	};
}			