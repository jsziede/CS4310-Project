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
};

//stores graph data
var network = null;

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

//if user wants to use Weksh-Powell algorithm
var welsh_powell = false;

//type of graph
//0 = random, 1 = bipartite, 2 = complete
var graphType = 0;

//simple color object that stores the value of the color as well
//as how often this color is used in the graph
function ColorNode(data) {
	this.color = data;
	this.freq = 0;
}

function EdgeData(nodeID) {
    this.node = nodeID;
    this.amount = 0;
}

//linked list node
function LLNode(data) {
	//which graph node it connects to
	this.connect = data;
	//the next list node
	this.next = null;
}
	
//basic linked list implementation
function LinkedList() {
	this.head = null;
	this.tail = null;

	this.add = function (data) {
		var llnode = new LLNode(data), current = this.head;
	
		if (current === null) {
			this.head = llnode;
			this.tail = llnode;
            return llnode;
		}
	
		while (current.next !== null) {
            current = current.next;
		}
	
		current.next = llnode;
		this.tail = llnode;
		return llnode;
	};
}

//creates the graph
function buildGraph(nodeCount) {
	//length of adjacency list matches the amount of nodes in the graph
	adjList = [maxNodes];
	//gets the value from the slider to determine how frequent an edge should appear
	var edgeFreq = document.getElementById("edgeRange").value;
    
    var toggle = document.getElementById("toggle-container");
    //determines the type of generated graph
    if (edgeFreq === "100") {
        //complete
        graphType = 2;
        toggle.style.display = "none";
    } else if (edgeFreq === "0") {
        //bipartite
        graphType = 1;
        toggle.style.display = "none";
    } else {
        //random
        graphType = 0;
        //welsh-powell is only necessary if graph is unknown
        toggle.style.display = "block";
    }
    
    var i;
	//creates a node for as many times as the user requested
	for (i = 0; i < nodeCount; i += 1) {
        connectionCount[i] = new EdgeData(i);
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
		connectionCount[i].amount = 0;

		//if second graph node to be created
		if (i === 1) {
			//assign the second node to connect to the first node
			var from = i;
			var to = 0;
			edges.push({
				from: from,
				to: to
			});
			connectionCount[from].amount += 1;
			connectionCount[to].amount += 1;
			adjList[from].add(to);
            adjList[to].add(from);
		} else if (i > 1) { //else if any graph node created after the second node
			var connected = false;
			//for each graph node that already exists in the graph
            var a;
			for (a = 0; a < i; a += 1) {
				//gets a random number between 0 and 100
				var random = Math.random() * 100;
				//if this random number is less than the slider value
				if (random < edgeFreq) {
					//assign the new graph node to connect to the currently looped graph node
					edges.push({
                        from: i,
                        to: a
					});
					connectionCount[i].amount += 1;
					connectionCount[a].amount += 1;
					adjList[i].add(a);
                    adjList[a].add(i);
					connected = true;
				}
			}
			//if the graph node that is being inserted failed to randomly connect to any other node
			if (connected === false) {
				//get a random number that matches with any one of the graph nodes' id
				var randomNode = Math.floor(Math.random() * i);
				//connect the graph node that is being inserted with the one existing random graph node
				edges.push({
					from: i,
					to: randomNode
				});
				connectionCount[i].amount += 1;
				connectionCount[randomNode].amount += 1;
				adjList[i].add(randomNode);
                adjList[randomNode].add(i);
				connected = true;
			}
		}
	}
    
    connectionCount.sort(function (a, b) {return b.amount - a.amount; });
    
	//return the set of nodes and edges
	return {nodes: nodes, edges: edges};
}

//resets the graph as well as html output elements
function destroy() {
	if (network !== null) {
		network.destroy();
        network = null;
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
    //check if user only entered numerical value
    var regex = /^[0-9]+$/;
	if (!maxNodes.match(regex)) {
        return false;
	}
    if (maxNodes <= 0) {
		return;
	}
	
	//updates the html to prompt the user to color the graph
    var container = document.getElementById('mynetwork');
    var data = buildGraph(nodeCount);
    network = new vis.Network(container, data, graphOptions);
    var button = document.getElementById("colorForm");
	button.style.display = "block";
	button = document.getElementById("head1");
	button.innerHTML = "Color the graph";
	var msg = document.getElementById("colorsUsed");
	msg.style.display = "none";
	msg.innerHTML = '';
}

/*given a random graph, colors all nodes so no adjacent nodes have the same color
while attempting to use the least amount of colors as possible.

this function runs in O(v^2 * e),
where v is the amount of nodes and e is the amount of edges */
function colorNodes() {
    //gets a random hexadecimal color
	var rand = Math.floor(Math.random() * 16777216);
	var hexString = rand.toString(16);
	if (hexString.length < 6) {
		while (hexString.length < 6) {
			hexString = "0" + hexString;
		}
	}
	hexString = "#" + hexString;
    
    //stores the random color into the color list
	colorList[0] = new ColorNode(hexString);
	colorList[0].freq = 1;
    
    //the current node to color
    var node;
    //if welsh-powell algorithm is enabled
    if (welsh_powell) {
        node = nodes.get(connectionCount[0].node.toString());
    } else {
        node = nodes.get("0");
    }
    
    //colors the first node
	node.color.background = colorList[0].color;
	nodes.update(node);
    
    //for each node in the graph excluding the first node that was colored
    var i;
	for (i = 1; i < maxNodes; i += 1) {
        //get the ith node
		if (welsh_powell) {
            node = nodes.get(connectionCount[i].node.toString());
        } else {
            node = nodes.get(i.toString());
        }
        
        //gets the list of nodes connected to the ith node
		var connectionList;
        
        //assume that the first color in the list is taken by a node adjacent to node i
		var colorFound = true;
        
        var b;
        //for all colors in the list
		for (b = 0; b < colorList.length; b += 1) {
            //gets the list of nodes connected to the ith node
            if (welsh_powell) {
                connectionList = adjList[connectionCount[i].node].head;
            } else {
                connectionList = adjList[i].head;
            }
            //exit loop if a color in the list was not adjacent to the ith node
			if (colorFound === false) {
				break;
			}
            
            //set color to false now so the above loop wasnt called
			colorFound = false;
            
            //base case
			var bc = false;
            //while there is a node connected to node i that hasnt been checked for its color
			while (!bc) {
                //gets the first node in the list that is connected to the ith node
				var connectNode = nodes.get(connectionList.connect);
                /* if the first node connected to the ith
                node has the current color in the color list */
				if (connectNode.color.background === colorList[b].color) {
                    //exit loop and move to next color in the list
					colorFound = true;
					bc = true;
				}
                //if there are no more nodes connected to the ith node, exit loop
				if (connectionList.next === null) {
					bc = true;
				} else { //else move to the next node connected to the ith node
					connectionList = connectionList.next;
				}
			}
		}
        //if there is a node adjacent to the ith node that has each color in the color list
		if (colorFound === true) {
            //the ith node must have a new and unused color
			rand = Math.floor(Math.random() * 16777216);
			hexString = rand.toString(16);
			if (hexString.length < 6) {
				while (hexString.length < 6) {
					hexString = "0" + hexString;
				}
			}
			hexString = "#" + hexString;
			var x = colorList.length;
			colorList[x] = new ColorNode(hexString);
			colorList[x].freq = 1;
			node.color.background = colorList[x].color;
			//need to add a check if the random color already exists in the array
		} else { /* else we have found a color in the color list that was not used by any
                 nodes adjacent to the ith node */
			node.color.background = colorList[b - 1].color;
			colorList[b - 1].freq += 1;
		}
		nodes.update(node);
	}
	return colorList.length;
}

/* O(n) function to color all nodes in the graph a different color.
If we know the graph is complete, then we know each node will need its own color. */
function colorCompleteNodes() {
    var i;
    for (i = 0; i < maxNodes; i += 1) {
        var rand = Math.floor(Math.random() * 16777216);
        var hexString = rand.toString(16);
        if (hexString.length < 6) {
            while (hexString.length < 6) {
                hexString = "0" + hexString;
            }
        }
        hexString = "#" + hexString;
        colorList[i] = new ColorNode(hexString);
        colorList[i].freq += 1;
        var node = nodes.get(i.toString());
        node.color.background = colorList[i].color;
        nodes.update(node);
    }
    return colorList.length;
}

/* O(n) function to color all nodes in the graph one of two colors.
If we know the graph is bipartite, we know it will only need two colors. */
function colorBipartiteNodes() {
    var rand1 = Math.floor(Math.random() * 16777216);
    var rand2 = Math.floor(Math.random() * 16777216);
    
    var hexString1 = rand1.toString(16);
    var hexString2 = rand2.toString(16);
                                    
    if (hexString1.length < 6) {
        while (hexString1.length < 6) {
            hexString1 = "0" + hexString1;
        }
    }
    
    if (hexString2.length < 6) {
        while (hexString2.length < 6) {
            hexString2 = "0" + hexString2;
        }
    }
    
    hexString1 = "#" + hexString1;
    hexString2 = "#" + hexString2;
    
    colorList[0] = new ColorNode(hexString1);
    colorList[0].freq = 0;
    
    colorList[1] = new ColorNode(hexString2);
    colorList[1].freq = 0;
    
    var node = nodes.get("0");
    node.color.background = colorList[0].color;
    colorList[0].freq += 1;
	nodes.update(node);
    
    var i;
    for (i = 1; i < maxNodes; i += 1) {
        node = nodes.get(i.toString());
        var connectedTo = nodes.get(adjList[i].head.connect.toString());
        if (connectedTo.color.background === colorList[0].color) {
            node.color.background = colorList[1].color;
            colorList[1].freq += 1;
            nodes.update(node);
        } else {
            node.color.background = colorList[0].color;
            colorList[0].freq += 1;
            nodes.update(node);
        }
    }
    return colorList.length;
}

//times the coloring function as well as outputting the data from the coloring algorithm
function timer() {
    if (maxNodes <= 0) {
		return;
	}
	//resets the color list in case user wants to recolor an existing graph
	colorList = [];
	var output = document.getElementById("colorOutput");
	output.style.display = "none";
	output.innerHTML = '';
	
    var length;
    
	//gets time at the beginning of the function
	var start = performance.now();
	//calls the graph coloring algorithm
    if (graphType === 2) {
        length = colorCompleteNodes();
    } else if (graphType === 1) {
        length = colorBipartiteNodes();
    } else {
        length = colorNodes();
    }
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
	var trimmedStop = stop.toFixed(4);
	
	timep.innerHTML = "Time elapsed: " + trimmedStop + "ms";
	output.style.display = "block";
	
	//prints the list of colors used
    var i;
	for (i = 0; i < colorList.length; i += 1) {
		output.innerHTML += "<div id='colorContainer'><div class='outputLeft' style='background: " + colorList[i].color + "'>" + colorList[i].freq + "</div><div class='outputRight' style='background: " + colorList[i].color + "'>" + colorList[i].color + "</div></div>";
	}
}

/* interactive toggle on the page that allows user to
enable the welsh-powell version of the coloring algorithm */
function toggle() {
    var toggleSlider = document.getElementById("toggle-slider");
    if(toggleSlider.style.left === "44px") {
        toggleSlider.style.left = "0px";
        toggleSlider.style.background = "#d07d62";
        welsh_powell = true;
    } else {
        toggleSlider.style.left = "44px";
        toggleSlider.style.background = "#aaaaaa";
        welsh_powell = false;
    }
}