var options = {
		layout: {
  			hierarchical: {
    		enabled: true,
    		nodeSpacing: 425,
    		blockShifting: false,
    		edgeMinimization: false,
    		sortMethod: "directed"
  		}	
	}
}

var network = null;
var setSmooth = false;
var count = 0;
var maxNodes = 0;
var nodes = new vis.DataSet(options);
var edges = [];
var connectionCount = [];
var adjList = [];

function LLNode(data) {
	this.connect = data;
	this.next = null;
};
	
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


function getScaleFreeNetwork(nodeCount) {
	adjList = [maxNodes];
	for (var i = 0; i < nodeCount; i++) {
		var item = new LinkedList();
		adjList[i] = item;
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

		if (i == 1) {
			var from = i;
			var to = 0;
			edges.push({
				from: from,
				to: to
			});
			connectionCount[from]++;
			connectionCount[to]++;
			
			adjList[from].add(to);
		} else if (i > 1) {
			var connected = false;
			for(var a = 0; a < i; a++) {
				var rand1 = Math.random();
				var rand2 = Math.random() + 0.1;
				if(rand1 >= rand2) {
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
			if(connected == false) {
				var rand1 = Math.floor(Math.random() * i);
				edges.push({
					from: i,
					to: rand1
					});
				connectionCount[i]++;
				connectionCount[rand1]++;
				adjList[i].add(rand1);
				connected = true;
			}
		/*
			var conn = edges.length * 2;
			var rand = Math.floor(Math.random() * conn);
			var cum = 0;
			var j = 0;
			while (j < connectionCount.length && cum < rand) {
				cum += connectionCount[j];
				j++;
			}

			var from = i;
			var to = j;
			edges.push({
				from: from,
				to: to
			});
			connectionCount[from]++;
			connectionCount[to]++;
			adjList[from].add(to);
		for bipartite */
		}
	}
	return {nodes:nodes, edges:edges};
}

var randomSeed = Math.round(Math.random()*1000);
function seededRandom() {
	var x = Math.sin(randomSeed++) * 10000;
	return x - Math.floor(x);
}

function destroy() {
	if (network !== null) {
		network.destroy();
        network = null;
        count = 0;
        nodes = new vis.DataSet();
 		edges = [];
 		connectionCount = [];
 		adjList = null;
 		var button = document.getElementById("colorForm");
		button.style.display = "none";
		button = document.getElementById("head1");
		button.innerHTML = "Generate a graph";
		var msg = document.getElementById("colorsUsed");
		msg.style.display = "none";
		msg.innerHTML = '';
	}
}

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
    if (nodeCount > 100) {
	    document.getElementById("message").innerHTML = '<a onclick="disableSmoothCurves()">You may want to disable dynamic smooth curves for better performance with a large amount of nodes and edges. Click here to disable them.</a>';
    } else if (setSmooth === false) {
    	document.getElementById("message").innerHTML = '';
    }
    // create a network
    var container = document.getElementById('mynetwork');
    var data = getScaleFreeNetwork(nodeCount);
    var options = {
    	physics: { stabilization: false }
    };
    network = new vis.Network(container, data, options);
    network.setOptions({
    	physics: {enabled:false}
    });
    disableSmoothCurves();
    var button = document.getElementById("colorForm");
	button.style.display = "block";
	button = document.getElementById("head1");
	button.innerHTML = "Color the graph";
	var msg = document.getElementById("colorsUsed");
	msg.style.display = "none";
	msg.innerHTML = '';
}

function disableSmoothCurves() {
	setSmooth = true;
    network.setOptions({edges:{smooth:{type:'continuous'}}});
    document.getElementById("message").innerHTML = '<a onclick="enableSmoothCurves()">Click here to reenable the dynamic smooth curves.</a>';
}

function enableSmoothCurves() {
	setSmooth = false;
	document.getElementById("message").innerHTML = '<a onclick="disableSmoothCurves()">You may want to disable dynamic smooth curves for better performance with a large amount of nodes and edges. Click here to disable them.</a>';
    network.setOptions({edges:{smooth:{type:'dynamic'}}});
}

function nodeCycle() {
	if(count <= maxNodes) {
		var rand = Math.floor(Math.random() * 16777216);
		var hexString = rand.toString(16);
		var node = nodes.get(count.toString());
		console.log(node.color.background);
		node.color = {
			border: '#000000',
			background: '#' + hexString,
			highlight: {
				border: '#2B7CE9',
				background: '#D2E5FF'
			}
		}
		nodes.update(node);
		count++;
	}
}

function timer() {
	var start = performance.now();
	var length = colorNodes();
	var stop = performance.now();
	var msg = document.getElementById("colorsUsed");
	msg.style.display = "block";
	msg.innerHTML = "Colors used: " + length;
	msg = document.getElementById("head1");
	msg.innerHTML = "Graph complete!";
	var timep = document.getElementById("time");
	stop -= start;
	timep.style.display = "block";
	timep.innerHTML = "Time elapsed: " + (stop / 1000) + "s";
}

function colorNodes() {
	if(maxNodes <= 0) {
		return;
	}
	var colorList = [];
	var rand = Math.floor(Math.random() * 16777216);
	var hexString = rand.toString(16);
	colorList[0] = "#" + hexString;
	var node = nodes.get("0");
	node.color.background = colorList[0];
	nodes.update(node);
	for(var i = 1; i < maxNodes; i++) {
		node = nodes.get(i.toString());
		var current = adjList[i].head;
		var colorFound = true;
		//var a = 0;
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
				if(connectNode.color.background == colorList[b]) {
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
			colorList[colorList.length] = "#" + hexString;
			node.color.background = colorList[colorList.length - 1];
			//need to add a check if the random color already exists in the array
		} else {
			node.color.background = colorList[a];
		}
		nodes.update(node);
	}
	return colorList.length;
}
