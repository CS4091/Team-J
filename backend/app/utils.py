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
def traveling_salesman_path(graph, method='asadpour'):
   
    #DON'T use greedy when the graph was orgnially in-complete
    if method == 'greedy':
        tsp_path = nx.approximation.greedy_tsp(graph, weight="weight")
    elif method == 'simulated_annealing':
        tsp_path = nx.approximation.simulated_annealing_tsp(graph, init_cycle="greedy",  weight="weight", max_iterations=500)
    elif method == 'threshold_accepting':
        tsp_path = nx.approximation.threshold_accepting_tsp(graph, init_cycle="greedy",weight="weight",max_iterations=500)
    elif method == 'asadpour':
        tsp_path = nx.approximation.traveling_salesman_problem(graph, weight='weight', cycle=True)
    else:
        raise ValueError("Invalid TSP method. Choose 'greedy', 'simulated_annealing', 'threshold_accepting', or 'asadpour'.")

    return tsp_path

def complete_graph(graph):
    penalty=1e9
    nodes = list(graph.nodes)
    complete_graph = nx.complete_graph(len(nodes), create_using=nx.DiGraph())
    
    for j in nodes:
        for k in nodes:
            if  j != k:
                if graph.has_edge(j, k):
                    weight = graph[j][k]['weight']
                else:
                    weight = penalty
                complete_graph.add_edge(j,k, weight=weight)
    
    return complete_graph
