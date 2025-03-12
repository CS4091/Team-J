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

