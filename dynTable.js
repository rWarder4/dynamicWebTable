/*	Author: Jiří Richter
	Date: 19.3.2017
	Project: WAP - Dynamic table
*/

// global variables
var dynTable_tableId;
// array in which the data of table are stored, they are used for filtering and sorting
var dynTable_tableData = [];
// working array, it is used as temporary array to contain part of table data
var dynTable_tableDataUpdated = [];
// variable which holds the number of columns the table has
var dynTable_numOfColumns = 0;
// sequence in which the filtering is performed if there is more than one input from user
var dynTable_filterSeq = [];

// default values
var dynTable_defaultControlColumnWidth = "40"; //px


// function to find pointer to TBODY part of the table
function findTBodyPointer() {
	var pointer = null;
	try{
		pointer = document.getElementById(dynTable_tableId).getElementsByTagName('tbody')[0];
	} catch(e){}
	return pointer;
}

// function to find pointer to THEAD part of the table
function findTHeadPointer() {
	var pointer = null;
	try{
		pointer = document.getElementById(dynTable_tableId).getElementsByTagName('thead')[0];
	} catch(e){}
	return pointer;
}

// function load the data from part tbody in table 
function loadTable(tableId) {
	// iterate over all data in tbody
	var tableData = [];
	var i, j;
	//var tablePointer = document.getElementById(tableId).children;
	
	// find the TBODY pointer
	var tbodyPointer = findTBodyPointer();
	if (!tbodyPointer){ return false; }

	// load the data - go through rows
	for (i = 0; i < tbodyPointer.children.length; i++) {
		var row = [];
		// go through columns
		//document.write("<br>");
		var numOfCols = tbodyPointer.rows[i].childElementCount;
		if (numOfCols > dynTable_numOfColumns){
			dynTable_numOfColumns = numOfCols;
		}
		for (j = 0; j < numOfCols; j++) {
			//document.write("sloupec: " + j + "\t");
			//document.write("(" + tbodyPointer.rows[i].children[j].innerHTML + ")" + "  |  ")
			row[j] = tbodyPointer.rows[i].children[j].innerHTML;
		}
		// add row to array
		tableData.push(row);
	}
	// return the loaded table data
	return tableData;
}

// create structure for inserted table
function structureNewTable(tableData){
	var tbodyPointer = findTBodyPointer();
	for(var i = 0; i < tableData.length; i++){
		// create row element
		var newRow = tbodyPointer.insertRow(i+1);
		for (var j = 0; j < tableData[i].length; j++) {
			var newCell = newRow.insertCell(j);
			newCell.appendChild(document.createTextNode(tableData[i][j]));
		}
	}
}

// write edited table back to HTML
function writeTableToHtml() {
	var rowIndex, colIndex;
	var tableData = dynTable_tableDataUpdated;

	// detele all rows in tbody except for the first one
	var tbodyPointer = findTBodyPointer();
	while(tbodyPointer.rows.length > 1) {
		tbodyPointer.deleteRow(1);
	}
	// write updated tbody of table to HTML
	structureNewTable(dynTable_tableDataUpdated);
}

// initialization of script, the table is processed to be able to use it in other functions
function dynamicTableInit(tableId){
	// add css to html
	var link = document.createElement('link')
	link.setAttribute('rel', 'stylesheet')
	link.setAttribute('type', 'text/css')
	link.setAttribute('href', 'dynTable.css')
	document.getElementsByTagName('head')[0].appendChild(link)
	// save id of table
	dynTable_tableId = tableId;
	// load the table to array
	dynTable_tableData = loadTable(dynTable_tableId);
	if(dynTable_tableData.length == 0){
		console.log("dynTableError: Cannot load the table! ID:"
			+ dynTable_tableId);
		return -1;
	}

	// load the table to future processing
	dynTable_tableData = loadTable(tableId);
	//console.log("tableLoaded: " + dynTable_tableData.length);

	// insert control row to table
	if (!insertControlRowToTable()) {
		console.log("dynTableError: Couldn't find the tbody part in table! ID:" 
			+ dynTable_tableId);
		return (-1);
	}
}

// return the type of column, the type has to be define inside thead otherwise
// the default type text is choosed 
function getTypeOfColumn(colIndex) {
	var theadPointer = findTHeadPointer();
	if (theadPointer == null || typeof theadPointer.children[0].children[colIndex] == "undefined") {
		return ("text");
	}
	// table contain thead, find the right column
	return (theadPointer.children[0].children[colIndex].getAttribute("data-sortSet"));
}

// return the maximum width of 
function getMaxWidthOfColumn(colIndex) {
	var theadPointer = findTHeadPointer();
	if (theadPointer == null || typeof theadPointer.children[0].children[colIndex] == "undefined") {
		return (dynTable_defaultControlColumnWidth);
	}
	return (theadPointer.children[0].children[colIndex].clientWidth-25);
}

// function create the DOM of control row table, it's added to tbody part of table as first row
function createCellOfControlRow(cellPointer, colIndex) {
	var whole = document.createElement("span");
	// input array for filtering
	var inputElem = document.createElement("input");
	inputElem.setAttribute("type", /*getTypeOfColumn(colIndex));*/"text");
	inputElem.setAttribute("oninput", "updateDynamicTable('filter',"+colIndex+",this.value)");
	inputElem.setAttribute("style", "width: " + getMaxWidthOfColumn(colIndex) + "px");
	inputElem.setAttribute("class", "dynTable_inputCell");
	// sorting controls
	var sortElemUp = document.createElement("span");
	sortElemUp.innerHTML = "&#8593;";
	sortElemUp.setAttribute("onclick", "updateDynamicTable('sortUp',"+colIndex+",'')");
	sortElemUp.setAttribute("style", "cursor:pointer");
	sortElemUp.setAttribute("class", "dynTable_sortElemUp");

	var sortElemDown = document.createElement("span");
	sortElemDown.innerHTML = "&#8595;";
	sortElemDown.setAttribute("onclick", "updateDynamicTable('sortDown',"+colIndex+",'')");
	sortElemDown.setAttribute("style", "cursor:pointer");
	sortElemUp.setAttribute("class", "dynTable_sortElemDown");

	cellPointer.appendChild(inputElem);
	cellPointer.appendChild(sortElemUp);
	cellPointer.appendChild(sortElemDown);

	return;
}

// function which insert the control row to table
function insertControlRowToTable() {
	// find the TBODY pointer
	var tbodyPointer = findTBodyPointer();
	if (tbodyPointer == null){ return false; }

	// add control Row as first in tbody
	var newRow = tbodyPointer.insertRow(0);
	newRow.setAttribute("class", "dynTable_ControlRow");
	
	// insert new row for all columns
	for (var i=0; i <dynTable_numOfColumns; i++) {
		var newCell = newRow.insertCell(i);
		newCell.setAttribute("class", "dynTable_ControlCells");
		createCellOfControlRow(newCell, i);
		//newCell.appendChild(cellNode);
	}


	return true;
}


/************************* UPDATE TABLE FUNCTIONS *************************/
/*	update of table on user input
	parameters:
		type - sort|filter (two options how to update the table)
		columnId - id of column according to which the update will be performed
*/
function updateDynamicTable(type, colIndex, userInput) {
	//console.log("UPDATING");
	if (type == "sortUp") {
		sortTableUp(colIndex);
	} else if (type == "sortDown") {
		sortTableDown(colIndex);
	} else {
		filterTable(colIndex, userInput);
	}

	// write edited table to HTML
	writeTableToHtml();
}

// sort function for UP as string
function sortArrayUp(first, second, colIndex) {
	if (first[colIndex] < second[colIndex]) {
		return -1;
	}
	return 1;
}

// sort function for Down as string
function sortArrayDown(first, second, colIndex) {
	if (first[colIndex] < second[colIndex]) {
		return 1;
	}
	return -1;
}

// sort function for UP
function sortTableUp(colIndex) {
	// backup original array
	if (dynTable_tableDataUpdated.length == 0) {
		dynTable_tableDataUpdated = dynTable_tableData.slice();
	}
	// sort array according to type
	if (getTypeOfColumn(colIndex) == "number") {
		//console.log("Sort UP as number column: " + colIndex);
		dynTable_tableDataUpdated.sort(
			function(a, b) {return a[colIndex] - b[colIndex];} );
	} else {
		//console.log("Sort UP as text column: " + colIndex);
		dynTable_tableDataUpdated.sort(
			function(a, b) {return sortArrayUp(a,b,colIndex);} );
	}
	
}

// sort function for DOWN
function sortTableDown(colIndex) {
	// backup original array
	if (dynTable_tableDataUpdated.length == 0) {
		dynTable_tableDataUpdated = dynTable_tableData.slice();
	}
	// sort array according to type
	if (getTypeOfColumn(colIndex) == "number") {
		//console.log("Sort DOWN as number column: " + colIndex);
		dynTable_tableDataUpdated.sort(
			function(a, b) {return b[colIndex] - a[colIndex];} );
	} else {
		//console.log("Sort DOWN as text column: " + colIndex);
		dynTable_tableDataUpdated.sort(
			function(a, b) {return sortArrayDown(a,b,colIndex);} );
	}
}

//
function filterValues(colIndex, userInput){
	return function(element) {
		//console.log("TADY: "+element+"|"+colIndex+"|"+userInput);
		if (element[colIndex].toLowerCase().match(userInput.toLowerCase())) {
			return element;
		}
	}
}

// function return the value according which the filtering is performed by give column index
function getInputValue(colIndex) {
	var tbodyPointer = findTBodyPointer();
	var dynRow = tbodyPointer.children[0];
	return dynRow.children[colIndex].getElementsByTagName("input")[0].value;
}

// main filter table function
function filterTable(colIndex, userInput) {
	/* if userInput is empty, remove the column for dynTable_filterSeq, otherwise add colIndex
	to dynTable_filterSeq and perform the filtering */
	if (userInput.length == 0){
		var index = dynTable_filterSeq.indexOf(colIndex);
		dynTable_filterSeq.splice(index,1);
	} else {
		if (dynTable_filterSeq.indexOf(colIndex) < 0) {
			dynTable_filterSeq.push(colIndex);
		}		
	}
	// perform filtering
	dynTable_tableDataUpdated = dynTable_tableData.slice();
	for (var i = 0; i < dynTable_filterSeq.length; i++) {
		var tempData = dynTable_tableDataUpdated.slice();
		dynTable_tableDataUpdated = tempData.filter(filterValues(dynTable_filterSeq[i], getInputValue(dynTable_filterSeq[i])));
	}
}