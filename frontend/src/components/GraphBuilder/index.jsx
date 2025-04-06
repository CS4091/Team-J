import { useState, useEffect, useRef } from "react";
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import "vis-network/dist/dist/vis-network.css";

import { networkOptions } from "./networkConfig";
import { processCSVData } from "./csvUtils";
import { sendGraphToBackend } from "./apiUtils";
import InstructionsPanel from "./components/InstructionsPanel";
import ControlPanel from "./components/ControlPanel";
import SelectedItemInfo from "./components/SelectedItemInfo";

const GraphBuilder = () => {
  // State management
  const [newNodeName, setNewNodeName] = useState("");
  const [networkNodes] = useState(new DataSet([]));
  const [networkEdges] = useState(new DataSet([]));
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [graphId, setGraphId] = useState(null); // New state for storing the graph ID

  // Refs
  const networkContainer = useRef(null);
  const networkInstance = useRef(null);

  // Initialize the network visualization
  useEffect(() => {
    if (!networkContainer.current) return;

    try {
      // Create customized network options with the addEdge handler
      const options = {
        ...networkOptions,
        manipulation: {
          ...networkOptions.manipulation,
          addEdge: (edgeData, callback) => handleAddEdge(edgeData, callback, networkEdges)
        }
      };

      // Create network with the datasets
      networkInstance.current = new Network(
        networkContainer.current,
        { nodes: networkNodes, edges: networkEdges },
        options
      );

      // Set up event listeners
      networkInstance.current.on("click", params => {
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

      // Cleanup function
      return () => {
        if (networkInstance.current) {
          networkInstance.current.destroy();
        }
      };
    } catch (error) {
      console.error("Error initializing network:", error);
    }
  }, [networkNodes, networkEdges]);

  // Handle adding an edge with validation and weight prompt
  const handleAddEdge = (edgeData, callback, edges) => {
    const { from, to } = edgeData;

    // Check for duplicate edges
    const existingEdges = edges.get().filter(edge => 
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
      edgeData.label = weight;
      callback(edgeData);
    } else {
      callback(null);
    }
  };

  // Add a new node to the graph
  const addNode = () => {
    const trimmedName = newNodeName.trim();
    
    if (trimmedName === "") {
      alert("Node name cannot be empty!");
      return;
    }

    if (networkNodes.get(trimmedName)) {
      alert("Node with this name already exists!");
      return;
    }

    try {
      networkNodes.add({
        id: trimmedName,
        label: trimmedName
      });
      setNewNodeName("");
    } catch (error) {
      console.error("Error adding node:", error);
      alert(`Failed to add node: ${error.message}`);
    }
  };

  // Enter edge creation mode
  const connectNodes = () => {
    if (!networkInstance.current) return;
    networkInstance.current.addEdgeMode();
  };

  // Delete the currently selected node or edge
  const deleteSelected = () => {
    if (!selectedItem) return;
    
    try {
      if (selectedItemType === "node") {
        // Find and remove all connected edges first
        const connectedEdges = networkEdges.get({
          filter: edge => edge.from === selectedItem || edge.to === selectedItem
        });
        networkEdges.remove(connectedEdges);
        
        // Then remove the node
        networkNodes.remove(selectedItem);
      } else if (selectedItemType === "edge") {
        networkEdges.remove(selectedItem.id);
      }
      
      setSelectedItem(null);
      setSelectedItemType(null);
    } catch (error) {
      console.error("Error deleting item:", error);
      alert(`Failed to delete item: ${error.message}`);
    }
  };

  // Import graph data from a CSV file
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    processCSVData(
      file, 
      networkNodes, 
      networkEdges, 
      networkInstance
    );
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
  const processGraph = async () => {
    if (networkNodes.length === 0) {
      alert("Please create a graph first!");
      return;
    }

    const nodes = networkNodes.get();
    const edges = networkEdges.get();

    try {
      // Updated to await the response from the backend
      const response = await sendGraphToBackend(nodes, edges);
      
      if (response && response.graph_id) {
        setGraphId(response.graph_id);
      } else {
        console.error("No graph ID received from backend");
      }
    } catch (error) {
      console.error("Error processing graph:", error);
      alert(`Failed to process graph: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <InstructionsPanel />

      {/* Graph visualization container */}
      <div
        ref={networkContainer}
        style={{ width: "100%", height: "75vh", border: "1px solid #ddd" }}
        className="bg-white"
      />

      <ControlPanel 
        newNodeName={newNodeName}
        setNewNodeName={setNewNodeName}
        addNode={addNode}
        connectNodes={connectNodes}
        deleteSelected={deleteSelected}
        handleFileUpload={handleFileUpload}
        processGraph={processGraph}
        selectedItem={selectedItem}
      />

      {/* Display Graph ID if available */}
      {graphId && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 rounded-md">
          <div className="flex items-center justify-between">
            <p className="font-medium">Graph ID: <span className="text-blue-600">{graphId}</span></p>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(graphId);
                alert("Graph ID copied to clipboard!");
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Copy ID
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">Save this ID for future reference.</p>
        </div>
      )}

      <SelectedItemInfo 
        selectedItem={selectedItem}
        selectedItemType={selectedItemType}
      />
    </div>
  );
};

export default GraphBuilder;