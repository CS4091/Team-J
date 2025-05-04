import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import "vis-network/dist/dist/vis-network.css";

import { networkOptions } from "../GraphBuilder/networkConfig";
import SelectedItemInfo from "../GraphBuilder/components/SelectedItemInfo";

// TODO: GraphBuilder, GraphViewer, and GraphEditor need to be refactored

const GraphControls = ({
  newNodeName,
  setNewNodeName,
  addNode,
  connectNodes,
  isConnectModeActive,
  deleteSelected,
  undo,
  clearGraph,
  selectedItem,
  history,
  fitGraph }) => {
  const handleKeyPress = (e) => {
    if (e.key === "Enter") addNode();
  };

  return (
    <div className="border p-6 rounded-lg bg-white shadow-md flex flex-col gap-6">
      <span className="font-semibold text-xl">Build Your Own Graph</span>
      

      {/* Node Actions */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        <input
          type="text"
          placeholder="Node Name"
          value={newNodeName}
          onChange={(e) => setNewNodeName(e.target.value)}
          onKeyDown={handleKeyPress}
          className="border p-3 rounded-md w-full text-base"
        />
        <button
          onClick={addNode}
          className="px-5 py-3 bg-blue-500 text-white text-base rounded-md hover:bg-blue-600 transition"
        >
          Add Node
        </button>
        <button
          onClick={connectNodes}
          className={`px-5 py-3 text-base rounded-md transition ${
            isConnectModeActive
              ? "bg-green-700 text-white hover:bg-green-800"
              : "bg-green-500 text-white hover:bg-green-600"
          }`}
        >
          {isConnectModeActive ? "Connecting (Click to Stop)" : "Connect Nodes"}
        </button>
        <button
          onClick={deleteSelected}
          disabled={!selectedItem}
          className={`px-5 py-3 text-base rounded-md transition ${
            selectedItem 
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Delete
        </button>
        <button
          onClick={undo}
          disabled={history.length === 0}
          className={`px-5 py-3 text-base rounded-md transition ${
            history.length > 0
              ? "bg-yellow-500 text-white hover:bg-yellow-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Undo
        </button>
      </div>

      {/* Graph Management */}
      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={clearGraph}
          className="px-5 py-3 bg-orange-500 text-white text-base rounded-md hover:bg-orange-600 transition"
        >
          Clear
        </button>
        <button
          onClick={fitGraph}
          className="px-5 py-3 bg-purple-500 text-white text-base rounded-md hover:bg-purple-600 transition"
        >
          Fit Graph
        </button>
      </div>
    </div>
  );
};

const GraphEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [networkNodes] = useState(new DataSet([]));
  const [networkEdges] = useState(new DataSet([]));
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [graphTitle, setGraphTitle] = useState("");
  const [history, setHistory] = useState([]);
  const [newNodeName, setNewNodeName] = useState("");
  const [isConnectModeActive, setIsConnectModeActive] = useState(false);

  const networkContainer = useRef(null);
  const networkInstance = useRef(null);

  // Fetch graph data on component mount
  useEffect(() => {
    const fetchGraph = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/graphs/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setGraphTitle(data.name);

        networkNodes.clear();
        networkEdges.clear();

        // Add nodes with proper id field
        networkNodes.add(data.graph.nodes.map(node => ({
          id: node.label,  // Set id equal to label for nodes
          label: node.label
        })));

        // Add edges with proper id and label fields
        networkEdges.add(data.graph.edges.map(edge => ({
          id: `${edge.from}-${edge.to}`,
          from: edge.from,
          to: edge.to,
          label: String(edge.weight)  // Use weight as label for visualization
        })));
      } catch (error) {
        console.error("Failed to load graph:", error);
        alert("Failed to load graph.");
      }
    };

    fetchGraph();
  }, [id, networkNodes, networkEdges]);

  // Initialize the network visualization
  useEffect(() => {
    if (!networkContainer.current) return;

    try {
      const options = {
        ...networkOptions,
        manipulation: {
          ...networkOptions.manipulation,
          addEdge: (edgeData, callback) => handleAddEdge(edgeData, callback, networkEdges)
        }
      };

      networkInstance.current = new Network(
        networkContainer.current,
        { nodes: networkNodes, edges: networkEdges },
        options
      );

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

  const deleteSelected = () => {
    if (selectedItem) {
      try {
        if (selectedItemType === "node") {
          const nodeData = networkNodes.get(selectedItem);

          const connectedEdges = networkEdges.get({
            filter: (edge) =>
              edge.from === selectedItem || edge.to === selectedItem
          });

          setHistory((prev) => [
            ...prev,
            { type: "deleteNode", data: { node: nodeData, edges: connectedEdges } }
          ]);

          networkEdges.remove(connectedEdges);
          networkNodes.remove(selectedItem);
        } else if (selectedItemType === "edge") {
          const edgeData = networkEdges.get(selectedItem.id);

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

  const undo = () => {
    if (history.length === 0) {
      alert("No actions to undo!");
      return;
    }

    const lastAction = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

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
    if (!window.confirm("Are you sure you want to clear the entire graph?")) {
      return;
    }

    try {
      const currentNodes = networkNodes.get();
      const currentEdges = networkEdges.get();
    
      setHistory(prev => [...prev, {
        type: "clearGraph",
        data: {
          nodes: currentNodes,
          edges: currentEdges
        }
      }]);

      networkNodes.clear();
      networkEdges.clear();
    
      setSelectedItem(null);
      setSelectedItemType(null);
    } catch (error) {
      console.error("Error clearing graph:", error);
      alert("Failed to clear graph");
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.key === "Delete" || event.key === "Backspace") && selectedItem) {
        deleteSelected();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem]);

  const saveGraph = async () => {
    const token = localStorage.getItem("token");
    const nodes = networkNodes.get();
    const edges = networkEdges.get().map(e => ({
      from: e.from,
      to: e.to,
      weight: Number(e.label),
    }));
  
    try {
      await fetch(`http://127.0.0.1:5000/api/graphs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: {
            name: graphTitle,
            nodes,
            edges,
          }
        }),
      });
      alert("Graph saved successfully!");
      navigate("/my-graphs");
    } catch (error) {
      console.error("Failed to save graph:", error);
      alert("Failed to save graph.");
    }
  };
  

  const cancel = () => {
    if (window.confirm("Discard changes and go back?")) {
      navigate("/my-graphs");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex gap-2 items-center">
        <input
          type="text"
          className="border px-2 py-1 rounded w-full"
          placeholder="Graph title"
          value={graphTitle}
          onChange={e => setGraphTitle(e.target.value)}
        />
      </div>

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

      <div className="flex gap-2 justify-end mt-4">
        <button onClick={cancel} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">
          Cancel
        </button>
        <button onClick={saveGraph} className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800">
          Save
        </button>
      </div>
    </div>
  );
};

export default GraphEditor;
