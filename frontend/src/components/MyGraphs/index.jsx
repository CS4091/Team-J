import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const MyGraphs = () => {
  const [graphs, setGraphs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchGraphs = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://127.0.0.1:5000/api/graphs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { graph_ids } = await res.json();

      const graphDetails = await Promise.all(
        graph_ids.map(async (id) => {
          const detailRes = await fetch(`http://127.0.0.1:5000/api/graphs/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await detailRes.json();
          return {
            id: data.id,
            name: data.name,
            num_nodes: data.graph.nodes.length,
            num_edges: data.graph.edges.length,
            created_at: data.created_at,
            updated_at: data.updated_at
          };
        })
      );

      setGraphs(graphDetails);
    } catch (err) {
      console.error("Failed to fetch graphs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphs();
  }, []);

  const handleView = (id) => {
    navigate(`/graphs/${id}`);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    if (!window.confirm("Are you sure you want to delete this graph?")) return;
    try {
      await fetch(`http://127.0.0.1:5000/api/graphs/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setGraphs(graphs.filter((g) => g.id !== id));
    } catch (err) {
      console.error("Failed to delete graph:", err);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <h2 className="text-2xl font-semibold mb-6">My Graphs</h2>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-pulse">Loading graphs...</div>
        </div>
      ) : graphs.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">No graphs found. Create your first graph to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {graphs.map((graph) => (
            <div key={graph.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-300 overflow-hidden">
              <div className="p-5 border-b">
                <h3 className="font-medium text-lg text-gray-800">{graph.name}</h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Nodes:</span> {graph.num_nodes}
                  </div>
                  <div>
                    <span className="font-medium">Edges:</span> {graph.num_edges}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {new Date(graph.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span> {new Date(graph.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="bg-white px-5 py-3 flex gap-2 justify-end">
                <button
                  onClick={() => handleView(graph.id)}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm font-medium"
                >
                  View
                </button>
                <button
                  onClick={() => navigate(`/graphs/${graph.id}/edit`)}
                  className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(graph.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyGraphs;
