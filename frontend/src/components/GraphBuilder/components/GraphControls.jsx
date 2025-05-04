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
  fitGraph
}) => {
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

export default GraphControls;
