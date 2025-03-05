import networkx as nx
import pandas as pd
import matplotlib.pyplot as plt

def find_shortest_path(graph, source, target, algorithm='dijkstra'):
  
    if algorithm == 'dijkstra':
        return nx.shortest_path(graph, source=source, target=target, weight='weight')
    elif algorithm == 'astar':
        return nx.astar_path(graph, source=source, target=target, weight='weight')
    elif algorithm == 'bidirectional':
        return nx.bidirectional_dijkstra(graph, source, target, weight='weight')[1]
    else:
        raise ValueError("Invalid algorithm. Choose 'dijkstra', 'astar', or 'bidirectional'.")

def visualize_graph(graph, shortest_path=None):

    plt.figure(figsize=(10, 6))

    # Node positions
    pos = nx.spring_layout(graph)  # Positioning algorithm

    # Draw nodes
    nx.draw_networkx_nodes(graph, pos, node_color='lightblue', node_size=700)

    # Draw edges with weights
    edge_labels = nx.get_edge_attributes(graph, 'weight')
    nx.draw_networkx_edges(graph, pos, edge_color='gray')
    nx.draw_networkx_edge_labels(graph, pos, edge_labels=edge_labels, font_size=8)

    # Highlight shortest path if provided
    if shortest_path:
        path_edges = list(zip(shortest_path, shortest_path[1:]))  # Create edge pairs
        nx.draw_networkx_edges(graph, pos, edgelist=path_edges, edge_color='red', width=2)
        nx.draw_networkx_nodes(graph, pos, nodelist=shortest_path, node_color='orange', node_size=800)

    # Draw labels
    nx.draw_networkx_labels(graph, pos, font_size=10, font_weight='bold')

    plt.title("Graph Visualization with Shortest Path" if shortest_path else "Graph Visualization")
    plt.show()
