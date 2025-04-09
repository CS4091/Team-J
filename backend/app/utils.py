import networkx as nx

def find_shortest_path(graph, source, target, algorithm='dijkstra'):
  
    if algorithm == 'dijkstra':
        return nx.shortest_path(graph, source=source, target=target, weight='weight')
    elif algorithm == 'astar':
        return nx.astar_path(graph, source=source, target=target, weight='weight')
    elif algorithm == 'bidirectional':
        return nx.bidirectional_dijkstra(graph, source, target, weight='weight')[1]
    else:
        raise ValueError("Invalid algorithm. Choose 'dijkstra', 'astar', or 'bidirectional'.")

#Link for traveling_salesman_problem function in NetworkX: https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.approximation.traveling_salesman.traveling_salesman_problem.html#networkx.algorithms.approximation.traveling_salesman.traveling_salesman_problem
def traveling_salesman_path(graph, method='greedy'):
   
    c_graph = complete_graph(graph)
    #DON'T use greedy when the graph was orgnially in-complete
    if method == 'greedy':
        tsp_path = nx.approximation.greedy_tsp(c_graph, weight="weight")
    elif method == 'simulated_annealing':
        tsp_path = nx.approximation.simulated_annealing_tsp(c_graph, init_cycle="greedy",  weight="weight", max_iterations=500)
    elif method == 'threshold_accepting':
        tsp_path = nx.approximation.threshold_accepting_tsp(c_graph, init_cycle="greedy",weight="weight",max_iterations=500)
    elif method == 'asadpour':
        tsp_path = nx.approximation.traveling_salesman_problem(c_graph, weight='weight', cycle=True)
    else:
        raise ValueError("Invalid TSP method. Choose 'greedy', 'simulated_annealing', 'threshold_accepting', or 'asadpour'.")

    real_path = reconstruct_path(graph,tsp_path)
    return real_path


def complete_graph(graph):
    nodes = list(graph.nodes)
    complete_graph = graph.copy()
    
    shortest_paths = dict(nx.all_pairs_dijkstra_path_length(graph, weight='weight'))

    for j in nodes:
        for k in nodes:
            if j != k:
                weight = shortest_paths[j][k]
                complete_graph.add_edge(j, k, weight=weight)

    return complete_graph

def reconstruct_path(graph, tsp_path):

    real_path = [tsp_path[0]]

    for i in range(len(tsp_path) - 1):
        u = tsp_path[i]
        v = tsp_path[i + 1]

        if graph.has_edge(u, v):
            real_path.append(v)
        else:
            
            temp_path = nx.shortest_path(graph, u, v, weight='weight')
            # Skip the first node since it's already in real_path
            real_path.extend(temp_path[1:])
        
    return real_path
