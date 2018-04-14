//graph display properties
var graphOptions = {
	autoResize: true,
	height: '100%',
	width: '100%',
	locale: 'en',
	layout: {
		hierarchical: {
			enabled: false,
			levelSeparation: 150,
			nodeSpacing: 500,
			treeSpacing: 200,
			blockShifting: true,
			edgeMinimization: true,
			sortMethod: "directed",
			parentCentralization: false
		}
	},
	edges: {
		smooth: { //forces the edges to be straight lines
	  		enabled: false
		}
	},
	physics: { //disables the graph from moving independently
		enabled: false
	}
}

//stores graph data
var network = null;

//
var count = 0;

//the number of nodes requested by the user
var maxNodes = 0;

//the data set containing all the node properties
var nodes = new vis.DataSet(graphOptions);

//array containing edge properties
var edges = [];

//counts the amount of connections per node
var connectionCount = [];

//stores the connections for each node as an array of linked lists
var adjList = [];

//stores the colors used to color the graph
var colorList = [];

//simple color object that stores the value of the color as well
//as how often this color is used in the graph
function colorNode(data) {
	this.color = data;
	this.freq = 0;
};

//linked list node
function LLNode(data) {
	//which graph node it connects to
	this.connect = data;
	//the next list node
	this.next = null;
};
	
//basic linked list implementation
function LinkedList() {
	this.head = null;
	this.tail = null;

	this.add = function(data) {
		var llnode = new LLNode(data),
		current = this.head;
	
		if(current == null) {
			this.head = llnode;
			this.tail = llnode;
		  	return llnode;
		}
	
		while(current.next != null) {
		  	current = current.next;
		}
	
		current.next = llnode;
		this.tail = llnode;
		return llnode;
	}
}

function loadJSON(path, success, error) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				success(JSON.parse(xhr.responseText));
			} else {
		    	error(xhr);
			}
		}
	};
	xhr.open('GET', path, true);
	xhr.send();
}

//creates the graph
function getScaleFreeNetwork(nodeCount) {
	//length of adjacency list matches the amount of nodes in the graph
	adjList = [maxNodes];
	//gets the value from the slider to determine how frequent an edge should appear
	var edgeFreq = document.getElementById("edgeRange").value;
	//creates a node for as many times as the user requested
	for (var i = 0; i < nodeCount; i++) {
		//create a new linked list to store in the adjacency list
		var item = new LinkedList();
		//the position in the adjacency list matches the graph node's id
		adjList[i] = item;
		//creates a graph node with default properties
		nodes.add({
			id: i,
			label: String(i),
			color: {
				border: '#000000',
				background: '#FFFFFF',
				highlight: {
					border: '#2B7CE9'
				}
			}
		});
		connectionCount[i] = 0;

		//if second graph node to be created
		if (i == 1) {
			//assign the second node to connect to the first node
			var from = i;
			var to = 0;
			edges.push({
				from: from,
				to: to
			});
			connectionCount[from]++;
			connectionCount[to]++;
			adjList[from].add(to);
		} else if (i > 1) { //else if any graph node created after the second node
			var connected = false;
			//for each graph node that already exists in the graph
			for(var a = 0; a < i; a++) {
				//gets a random number between 0 and 100
				var rand1 = Math.random() * 100;
				//if this random number is less than the slider value
				if(rand1 < edgeFreq) {
					//assign the new graph node to connect to the currently looped graph node
					edges.push({
					from: i,
					to: a
					});
					connectionCount[i]++;
					connectionCount[a]++;
					adjList[i].add(a);
					connected = true;
				}
			}
			//if the graph node that is being inserted failed to randomly connect to any other node
			if(connected == false) {
				//get a random number that matches with any one of the graph nodes' id
				var rand1 = Math.floor(Math.random() * i);
				//connect the graph node that is being inserted with the one existing random graph node
				edges.push({
					from: i,
					to: rand1
					});
				connectionCount[i]++;
				connectionCount[rand1]++;
				adjList[i].add(rand1);
				connected = true;
			}
		}
	}
	//return the set of nodes and edges
	return {nodes:nodes, edges:edges};
}

//resets the graph as well as html output elements
function destroy() {
	if (network !== null) {
		network.destroy();
        network = null;
        count = 0;
        nodes = new vis.DataSet(graphOptions);
 		edges = [];
 		connectionCount = [];
 		colorList = [];
 		adjList = null;
 		var button = document.getElementById("colorForm");
		button.style.display = "none";
		button = document.getElementById("head1");
		button.innerHTML = "Generate a graph";
		var msg = document.getElementById("colorsUsed");
		msg.style.display = "none";
		msg.innerHTML = '';
		var timediv = document.getElementById("time");
		timediv.innerHTML = '';
		timediv.style.display = "none";
		var output = document.getElementById("colorOutput");
		output.style.display = "none";
		output.innerHTML = '';
	}
}

//draws the graph based on the generated set of nodes and edges using the vis.js library
function draw() {
	destroy();
    var nodeCount = document.getElementById('nodeCount').value;
    maxNodes = nodeCount;
    var regex=/^[0-9]+$/;
	if (!maxNodes.match(regex))
	{
	    return false;
	}
    if(maxNodes <= 0) {
		return;
	}
	
	//updates the html to prompt the user to color the graph
    var container = document.getElementById('mynetwork');
    var data = getScaleFreeNetwork(nodeCount);
    network = new vis.Network(container, data, graphOptions);
    var button = document.getElementById("colorForm");
	button.style.display = "block";
	button = document.getElementById("head1");
	button.innerHTML = "Color the graph";
	var msg = document.getElementById("colorsUsed");
	msg.style.display = "none";
	msg.innerHTML = '';
}

//times the coloring function as well as outputting the data from the coloring algorithm
function timer() {
	//resets the color list in case user wants to recolor an existing graph
	colorList = [];
	var output = document.getElementById("colorOutput");
	output.style.display = "none";
	output.innerHTML = '';
	
	//gets time at the beginning of the function
	var start = performance.now();
	//calls the graph coloring algorithm
	var length = colorNodes();
	//gets the time after the algorithm has finished
	var stop = performance.now();
	
	var msg = document.getElementById("colorsUsed");
	msg.style.display = "block";
	msg.innerHTML = "Colors used: " + length;
	msg = document.getElementById("head1");
	msg.innerHTML = "Graph complete!";
	var timep = document.getElementById("time");
	//calculates the time it took the run the coloring algorithm
	stop -= start;
	
	timep.style.display = "block";
	
	//trims the calculated time to four decimal places
	var trimmedStop = (stop / 1000).toFixed(4);
	
	timep.innerHTML = "Time elapsed: " + trimmedStop + "s";
	output.style.display = "block";
	
	//prints the list of colors used
	for(var i = 0; i < colorList.length; i++) {
		output.innerHTML += "<div id='colorContainer'><div class='outputLeft' style='background: " + colorList[i].color + "'>" + colorList[i].freq + "</div><div class='outputRight' style='background: " + colorList[i].color + "'>" + colorList[i].color + "</div></div>";
	}
}

//still a work in progress
function colorNodes() {
	if(maxNodes <= 0) {
		return;
	}
	var rand = Math.floor(Math.random() * 16777216);
	var hexString = rand.toString(16);
	if(hexString.length < 6) {
		while(hexString.length < 6) {
			hexString = "0" + hexString;
		}
	}
	hexString = "#" + hexString;
	colorList[0] = new colorNode(hexString);
	colorList[0].freq = 1;
	var node = nodes.get("0");
	node.color.background = colorList[0].color;
	nodes.update(node);
	for(var i = 1; i < maxNodes; i++) {
		node = nodes.get(i.toString());
		var current = adjList[i].head;
		var colorFound = true;
		for(var b = 0; b < colorList.length; b++) {
			current = adjList[i].head;
			if(colorFound == false) {
				break;
			}
			a = b;
			colorFound = false;
			var bc = false;
			while(!bc) {
				var connectNode = nodes.get(current.connect);
				if(connectNode.color.background == colorList[b].color) {
					colorFound = true;
					bc = true;
				}
				if(current.next == null) {
					bc = true;
				} else {
					current = current.next;
				}
			}
		}
		if(colorFound == true) {
			rand = Math.floor(Math.random() * 16777216);
			hexString = rand.toString(16);
			if(hexString.length < 6) {
				while(hexString.length < 6) {
					hexString = "0" + hexString;
				}
			}
			hexString = "#" + hexString;
			var x = colorList.length;
			colorList[x] = new colorNode(hexString);
			colorList[x].freq = 1;
			node.color.background = colorList[x].color;
			//need to add a check if the random color already exists in the array
		} else {
			node.color.background = colorList[a].color;
			colorList[a].freq++;
		}
		nodes.update(node);
	}
	return colorList.length;
}
