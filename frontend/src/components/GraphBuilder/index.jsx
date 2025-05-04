import { useState, useEffect, useRef } from "react";
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import "vis-network/dist/dist/vis-network.css";

import { networkOptions } from "./networkConfig";
import { processCSVData } from "./csvUtils";
import { sendGraphToBackend } from "./apiUtils";
import SelectedItemInfo from "./components/SelectedItemInfo";
import GraphControls from "./components/GraphControls";
import FileImport from "./components/FileImport";
import GraphSubmit from "./components/GraphSubmit";

// TODO: GraphBuilder, GraphViewer, and GraphEditor need to be refactored

const GraphBuilder = () => {
  const [newNodeName, setNewNodeName] = useState("");
  const [networkNodes] = useState(new DataSet([]));
  const [networkEdges] = useState(new DataSet([]));
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [graphTitle, setGraphTitle] = useState("");
  const [history, setHistory] = useState([]);
  const [isConnectModeActive, setIsConnectModeActive] = useState(false);
  
  const networkContainer = useRef(null);
  const networkInstance = useRef(null);

  // Initialize the network visualization
  useEffect(() => {
    if (!networkContainer.current) return;

    try {
      // Custom network options
      const options = {
        ...networkOptions,
        manipulation: {
          ...networkOptions.manipulation,
          // Custom function to handle adding edges
          addEdge: (edgeData, callback) => {
            handleAddEdge(edgeData, callback, networkEdges);
          }
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

  const handleAddEdge = (edgeData, callback) => {
    const { from, to } = edgeData;

    if (from === to) {
      alert("Cannot connect a node to itself!");
      callback(null);
      return;
    }

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
        id: `${from}-${to}`
      };

      // Store the complete edge data in history
      setHistory((prev) => [...prev, { 
        type: "addEdge", 
        data: completeEdgeData 
      }]);

      callback(completeEdgeData);
      
      if (isConnectModeActive && networkInstance.current) {
        setTimeout(() => {
          networkInstance.current.addEdgeMode();
        }, 0);
      }
    } else {
      callback(null);
    }

    // Keep connect mode active
    networkInstance.current.addEdgeMode();
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

  // Toggle edge creation mode
  const connectNodes = () => {
    if (!networkInstance.current) return;
    
    // Update isConnectModeActive state
    setIsConnectModeActive(prevState => {
      const newState = !prevState;
      
      // Apply the appropriate network mode based on the new state
      if (newState) {
        networkInstance.current.unselectAll();
        // Turn on connect mode
        networkInstance.current.addEdgeMode();
      } else {
        // Turn off connect mode
        networkInstance.current.disableEditMode();
      }
      
      return newState;
    });
  };

  // Undo the last action
  const undo = () => {
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
      case "clearGraph":
        networkNodes.add(lastAction.data.nodes);
        networkEdges.add(lastAction.data.edges);
        break;
      default:
        console.warn("Unknown action:", lastAction);
    }
  };

  const fitGraph = () => {
    if (networkInstance.current) {
      networkInstance.current.fit({
        animation: {
          duration: 500,
          easingFunction: "easeInOutQuad"
        }
      });
    }
  };
  

  const clearGraph = () => {
    if (networkNodes.length === 0) {
      alert("No graph to clear!");
      return;
    }

    // Confirm with user before clearing
    if (!window.confirm("Are you sure you want to clear the entire graph?")) {
      return;
    }

    try {
      // Save current state to history before clearing
      const currentNodes = networkNodes.get();
      const currentEdges = networkEdges.get();
    
      setHistory(prev => [...prev, {
        type: "clearGraph",
        data: {
          nodes: currentNodes,
          edges: currentEdges
        }
      }]);

      // Clear all nodes and edges
      networkNodes.clear();
      networkEdges.clear();
    
      // Reset selection
      setSelectedItem(null);
      setSelectedItemType(null);
    } catch (error) {
      console.error("Error clearing graph:", error);
      alert("Failed to clear graph");
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

  // Handle keyboard shortcuts and connect mode changes
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.key === "Delete" || event.key === "Backspace") && selectedItem) {
        deleteSelected();
      }
      
      // Allow escaping from connect mode with Escape key
      if (event.key === "Escape" && isConnectModeActive) {
        networkInstance.current.disableEditMode();
        setIsConnectModeActive(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem, isConnectModeActive]);

  // Process the graph and send to backend
  const processGraph = async () => {
    if (networkNodes.length === 0) {
      alert("Please create a graph first!");
      return;
    }

    const nodes = networkNodes.get();
    const edges = networkEdges.get();

    try {
      const response = await sendGraphToBackend(nodes, edges, graphTitle);
      
      if (response.graph_id) {
        alert('Graph saved successfully!');
      }
    }
    catch (error) {
      console.error("Error sending graph to backend:", error);
      alert("Failed to save graph");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-2">
      <FileImport handleFileUpload={handleFileUpload} />

      {/* Main content area with side-by-side layout */}
      <div className="flex gap-3 h-[95vh]">
        {/* Left side - Graph Controls + Selected Item Info */}
        {/* Left side - Graph Controls + Selected Item Info */}
        <div className="w-64 flex-shrink-0 h-full flex flex-col">
          {/* GraphControls - No flex-grow */}
          <div className="overflow-y-auto">
            <GraphControls
              newNodeName={newNodeName}
              setNewNodeName={setNewNodeName}
              addNode={addNode}
              connectNodes={connectNodes}
              isConnectModeActive={isConnectModeActive}
              deleteSelected={deleteSelected}
              undo={undo}
              clearGraph={clearGraph}
              selectedItem={selectedItem}
              history={history}
              fitGraph={fitGraph}
            />
          </div>
          {/* Selected Item Info - Added mt-2 for a small gap */}
          <div className="flex-shrink-0 mt-2">
            <SelectedItemInfo
              selectedItem={selectedItem}
              selectedItemType={selectedItemType}
            />
          </div>
        </div>
        {/* Right side - Network Container */}
        <div className="flex-grow flex flex-col">
          <div
            ref={networkContainer}
            style={{ width: "100%", height: "100%" }}
            className="bg-white shadow-md rounded w-full border border-gray-300"
          />
        </div>
      </div>

      {/* Graph Submit section */}
      <GraphSubmit
        graphTitle={graphTitle}
        setGraphTitle={setGraphTitle}
        processGraph={processGraph}
      />
    </div>
  );
};

export default GraphBuilder;