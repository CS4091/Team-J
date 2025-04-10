const ControlPanel = ({
  newNodeName,
  setNewNodeName,
  addNode,
  connectNodes,
  deleteSelected,
  handleFileUpload,
  processGraph,
  selectedItem,
  undo,
  history,
  clearGraph
}) => {
  // Handle enter key in the node name input
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      addNode();
    }
  };

  return (
    <div className="flex flex-col gap-3 border p-3 rounded bg-gray-50 mt-2">
      {/* Use flex-wrap to allow wrapping on smaller screens */}
      <div className="flex flex-wrap gap-2">
        {/* Node manipulation controls */}
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Node Name"
            value={newNodeName}
            onChange={(e) => setNewNodeName(e.target.value)}
            onKeyDown={handleKeyPress}
            className="border p-2 rounded min-w-[120px] flex-grow md:flex-grow-0"
          />
          <button
            onClick={addNode}
            className="p-2 bg-blue-500 text-white rounded whitespace-nowrap cursor-pointer hover:bg-blue-600 transition"
          >
            Add Node
          </button>
          <button
            onClick={connectNodes}
            className="p-2 bg-green-500 text-white rounded whitespace-nowrap cursor-pointer hover:bg-green-600 transition"
          >
            Connect Nodes
          </button>
          <button
            onClick={deleteSelected}
            disabled={!selectedItem}
            className={`p-2 rounded whitespace-nowrap ${
              selectedItem ? "bg-red-500 text-white cursor-pointer hover:bg-red-600 transition" : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Delete Selected
          </button>
	  <button
	    onClick={undo}
	    disabled={history.length === 0}
	    className={`p-2 rounded whitespace-nowrap ${
	      history.length > 0 
	        ? "bg-yellow-500 text-white cursor-pointer hover:bg-yellow-600 transition" 
	        : "bg-gray-300 text-gray-500 cursor-not-allowed"
	    }`}
	  >
	    Undo
	</button>
	<button
          onClick={clearGraph}
          className="p-2 bg-orange-500 text-white rounded whitespace-nowrap cursor-pointer hover:bg-orange-600 transition"
        >
          Clear Graph
        </button>
        </div>

        {/* File and processing controls - will wrap to next line on small screens */}
        <div className="flex flex-wrap items-center gap-2 ml-0 mt-2 md:mt-0 md:ml-auto">
          <div className="flex items-center">
            <span className="mr-2 whitespace-nowrap">Import:</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="p-1 border rounded w-full cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
            />
          </div>
          <button
            onClick={processGraph}
            className="p-2 bg-purple-600 text-white rounded whitespace-nowrap cursor-pointer hover:bg-purple-700 transition"
          >
            Process Graph
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
