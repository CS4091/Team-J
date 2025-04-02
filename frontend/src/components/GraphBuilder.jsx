import { useState, useEffect, useRef } from "react";
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import { parse } from "papaparse";
import "vis-network/dist/dist/vis-network.css";

const GraphBuilder = () => {
  // State variables
  const [newNodeName, setNewNodeName] = useState("");
  const [networkNodes] = useState(new DataSet([]));
  const [networkEdges] = useState(new DataSet([]));
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [history, setHistory] = useState([]);

  // References
  const networkContainer = useRef(null);
  const networkInstance = useRef(null);

  // Initialize the network visualization
  useEffect(() => {
    if (networkContainer.current) {
      try {
        const options = {
          nodes: {
            shape: "circle",
            size: 30,
            font: {
              size: 14,
              color: "#000000"
            },
            borderWidth: 2,
            shadow: true
          },
          edges: {
            width: 2,
            shadow: true,
            font: {
              size: 14,
              align: "middle"
            },
            arrows: {
              to: {
                enabled: true,
                scaleFactor: 1.5,
                type: 'arrow'
              }
            },
            color: "#333",
            smooth: {
              type: "curvedCW",
              roundness: 0.2
            }
          },
          physics: {
            enabled: true,
            barnesHut: {
              gravitationalConstant: -3000,
              centralGravity: 0.3,
              springLength: 150,
              springConstant: 0.04,
              damping: 0.09
            }
          },
          manipulation: {
            enabled: false,
            addEdge: function(edgeData, callback) {
              handleAddEdge(edgeData, callback);
            }
          },
          interaction: {
            hover: true,
            multiselect: false,
            dragNodes: true
          }
        };

        // Create network with empty datasets first
        networkInstance.current = new Network(
            networkContainer.current,
            {nodes: networkNodes, edges: networkEdges},
            options
        );

        // Handle click events for node/edge selection
        networkInstance.current.on("click", function (params) {
          if (params.nodes.length > 0) {
            setSelectedItem(params.nodes[0]);
            setSelectedItemType("node");
          } else if (params.edges.length > 0) {
            const edge = networkEdges.get(params.edges[0]);
            setSelectedItem(edge);
            setSelectedItemType("edge");
          } else {
            setSelectedItem(null);
            setSelectedItemType(null);
          }
        });

        return () => {
          if (networkInstance.current) {
            networkInstance.current.destroy();
          }
        };
      } catch (error) {
        console.error("Error initializing network:", error);
      }
    }
  }, [networkEdges, networkNodes]);

  // Add a new node to the graph
  const addNode = () => {
    if (newNodeName.trim() === "") {
      alert("Node name cannot be empty!");
      return;
    }

    if (networkNodes.get(newNodeName)) {
      alert("Node with this name already exists!");
      return;
    }

    try {
      const newNode = { id: newNodeName, label: newNodeName };
    
      // Save action to history before adding the node
      setHistory((prev) => [...prev, { type: "addNode", data: newNode }]);
    
      networkNodes.add(newNode);
    } catch (error) {
      console.error("Error adding node:", error);
    }

    setNewNodeName("");
  };

  // Enter edge creation mode
  const connectNodes = () => {
    if (!networkInstance.current) return;
    networkInstance.current.addEdgeMode();
  };
  // Modify edge addition logic to save history
  const handleAddEdge = (edgeData, callback) => {
    const { from, to } = edgeData;

    // Check for duplicate edges
    const existingEdges = networkEdges.get().filter(edge =>
      edge.from === from && edge.to === to
    );

    if (existingEdges.length > 0) {
      alert("This edge already exists!");
      callback(null);
      return;
    }

    // Prompt for edge weight
    const weight = prompt("Enter edge weight (non-negative number):", "1");

    if (weight !== null && !isNaN(Number(weight)) && Number(weight) >= 0) {
      const completeEdgeData = {
        ...edgeData,
        label: weight,
        id: `${from}-${to}` // Ensure consistent ID format
      };

      // Store the complete edge data in history
      setHistory((prev) => [...prev, { 
        type: "addEdge", 
        data: completeEdgeData 
      }]);

      callback(completeEdgeData);
    } else {
      callback(null);
    }
  };
  // Delete the currently selected node or edge
  const deleteSelected = () => {
    if (selectedItem) {
      try {
        if (selectedItemType === "node") {
          const nodeData = networkNodes.get(selectedItem);

          // Find and save all edges connected to this node
          const connectedEdges = networkEdges.get({
            filter: (edge) =>
              edge.from === selectedItem || edge.to === selectedItem
          });

          // Save deletion to history before removing
          setHistory((prev) => [
            ...prev,
            { type: "deleteNode", data: { node: nodeData, edges: connectedEdges } }
          ]);

          networkEdges.remove(connectedEdges);
          networkNodes.remove(selectedItem);
        } else if (selectedItemType === "edge") {
          const edgeData = networkEdges.get(selectedItem.id);

          // Save deletion to history before removing
          setHistory((prev) => [...prev, { type: "deleteEdge", data: edgeData }]);

          networkEdges.remove(selectedItem.id);
        }
        setSelectedItem(null);
        setSelectedItemType(null);
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };
  // Undo function
  const undoLastAction = () => {
    if (history.length === 0) {
      alert("No actions to undo!");
      return;
    }

    const lastAction = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1)); // Remove last action from history

    switch (lastAction.type) {
      case "addNode":
        networkNodes.remove(lastAction.data.id);
        break;
      case "addEdge":
        networkEdges.remove(lastAction.data.id);
        break;
      case "deleteNode":
        networkNodes.add(lastAction.data.node);
        networkEdges.add(lastAction.data.edges);
        break;
      case "deleteEdge":
        networkEdges.add(lastAction.data);
        break;
      default:
        console.warn("Unknown action:", lastAction);
    }
  };

  // Import graph data from a CSV file
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    parse(file, {
      header: true,
      complete: (results) => {
        const { data } = results;

        try {
          console.log("First row of CSV:", data[0]);

          // Clear existing nodes and edges
          networkNodes.clear();
          networkEdges.clear();

          // Track unique nodes and edges
          const nodeSet = new Set();
          const edgesToAdd = [];
          const edgeMap = new Map();

          // Process each row in the CSV
          data.forEach((row, index) => {
            const source = row["From"];
            const target = row["To"];
            const weight = row["Cost"];

            if (source && target) {
              // Add source and target to node set
              nodeSet.add(source);
              nodeSet.add(target);

              // Create unique edge key to avoid duplicates
              const edgeKey = `${source}-${target}`;

              // Only add if edge doesn't already exist
              if (!edgeMap.has(edgeKey)) {
                const edgeData = {
                  from: source,
                  to: target,
                  label: weight !== undefined ? String(weight) : "1",
                  id: edgeKey
                };

                edgesToAdd.push(edgeData);
                edgeMap.set(edgeKey, true);
              }
            } else {
              console.warn(`Row ${index} missing From or To:`, row);
            }
          });

          // Convert node set to array of node objects
          const nodesToAdd = Array.from(nodeSet).map(nodeId => ({
            id: nodeId,
            label: nodeId
          }));

          // Add nodes and edges to the network
          networkNodes.add(nodesToAdd);
          networkEdges.add(edgesToAdd);

          // Adjust view to fit all nodes
          if (networkInstance.current) {
            networkInstance.current.fit({ animation: true });
          }
        } catch (error) {
          console.error("Error processing CSV data:", error);
        }
      },
      skipEmptyLines: true,
      error: (error) => {
        console.error("Error parsing CSV:", error);
        alert("Error parsing CSV file. Please check the format.");
      }
    });
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.key === "Delete" || event.key === "Backspace") && selectedItem) {
        deleteSelected();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem]);

  // Process the graph and send to backend
  const processGraph = () => {
    if (networkNodes.length === 0) {
      alert("Please create a graph first!");
      return;
    }

    const nodes = networkNodes.get();
    const edges = networkEdges.get();

    // Prepare data for backend
    const graphData = {
      nodes: nodes.map(node => ({
        label: node.label
      })),
      edges: edges.map(edge => ({
        from: edge.from,
        to: edge.to,
        weight: parseFloat(edge.label) || 1
      }))
    };

    // Send data to backend
    console.log("Sending graph data to backend:", graphData);

    try {
      fetch('http://127.0.0.1:5000/api/graph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(graphData),
      })
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            console.log('Success:', data);
            alert("Graph processing complete!");
          })
          .catch((error) => {
            console.error('Error:', error);
            alert(`Error processing graph: ${error.message}. Make sure the backend server is running at http://127.0.0.1:5000.`);
          });
    } catch (error) {
      console.error('Fetch error:', error);
      alert(`Failed to connect to backend server: ${error.message}`);
    }
  };

  return (
      <div className="flex flex-col gap-4 p-4">
        {/* Instructions at the top */}
        <div className="p-3 bg-gray-100 rounded border">
          <h2 className="text-lg font-semibold mb-2">Graph Builder Instructions</h2>
          <ul className="list-disc pl-5">
            <li>Add nodes using the input field below</li>
            <li>Click &quot;Connect Nodes&quot; to create an edge, then <strong>drag from one node to another</strong></li>
            <li>Enter a weight when prompted for each edge</li>
            <li>Select a node or edge and press Delete or click &quot;Delete Selected&quot; to remove it</li>
            <li>Import a graph from CSV file or build manually</li>
            <li>Click &quot;Process Graph&quot; when you&apos;re done</li>
          </ul>
        </div>

        {/* Graph visualization container*/}
        <div
            ref={networkContainer}
            style={{width: "100%", height: "75vh", border: "1px solid #ddd"}}
            className="bg-white"
        />

        {/* Controls below the graph */}
        <div className="flex flex-col gap-3 border p-3 rounded bg-gray-50 mt-2">
          <div className="flex gap-2 items-center">
            <input
                type="text"
                placeholder="Node Name"
                value={newNodeName}
                onChange={(e) => setNewNodeName(e.target.value)}
                className="border p-2 rounded"
                onKeyPress={(e) => e.key === "Enter" && addNode()}
            />
            <button
                onClick={addNode}
                className="p-2 bg-blue-500 text-white rounded"
            >
              Add Node
            </button>
            <button
                onClick={connectNodes}
                className="p-2 bg-green-500 text-white rounded"
            >
              Connect Nodes
            </button>
            <button
                onClick={deleteSelected}
                disabled={!selectedItem}
                className={`p-2 rounded ${
                    selectedItem ? "bg-red-500 text-white" : "bg-gray-300"
                }`}
            >
              Delete Selected
            </button>
            <button
                onClick={undoLastAction}
                disabled={history.length === 0}
                className={`p-2 rounded ${history.length > 0 ? "bg-yellow-500 text-white" : "bg-gray-300"}`}
               >
               Undo
            </button>
            <div className="flex items-center ml-auto">
              <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="p-1 border rounded"
              />
              <button
                  onClick={processGraph}
                  className="p-2 bg-purple-600 text-white rounded ml-2"
              >
                Process Graph
              </button>
            </div>
          </div>

          {/* Selected item information */}
          <div className="text-sm">
            <strong>Selected: </strong>
            {selectedItem
                ? selectedItemType === "node"
                    ? `Node: ${selectedItem}`
                    : `Edge: (${selectedItem.from}, ${selectedItem.to})`
                : "Nothing selected"}
          </div>
        </div>
      </div>
  );
}

export default GraphBuilder;
