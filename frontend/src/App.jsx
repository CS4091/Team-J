import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import GraphBuilder from "./components/GraphBuilder/index.jsx";
import TSPResult from "./components/TSPResult/index.jsx";
import { Link } from "react-router-dom";

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-blue-600 text-white p-4 shadow-md">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">Graph Solver</h1>
            <div className="flex gap-4">
              <Link to="/" className="hover:underline py-1 px-2 rounded hover:bg-blue-700">
                Graph Builder
              </Link>
              <Link to="/tsp" className="hover:underline py-1 px-2 rounded hover:bg-blue-700">
                TSP Solver
              </Link>
            </div>
          </div>
        </nav>
        
        <div className="max-w-7xl mx-auto my-4">
          <Routes>
            <Route path="/" element={<GraphBuilder />} />
            <Route path="/tsp" element={<TSPResult />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
