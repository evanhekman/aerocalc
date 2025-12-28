from types import FunctionType


class Edge:
    def __init__(self, name: str, valid_func: FunctionType):
        self.name = name
        self.valid_func = valid_func

    def valid(self, graph: "Graph") -> bool:
        return self.valid_func(graph)


class Node:
    def __init__(self, name: str, neighbors: list[tuple["Node", "Edge"]] = []):
        self.name = name
        self.neighbors = neighbors


class Graph:
    def __init__(self, nodes: list[Node], edges: list[Edge]):
        self.all_nodes = nodes
        self.all_edges = edges

    def connect(self, node1: Node, node2: Node, edge: Edge):
        node1.neighbors.append((node2, edge))
        node2.neighbors.append((node1, edge))

    def _calculate_available(self, nodes: set[Node]) -> set["Node"]:
        next_nodes = nodes.copy()
        for node in self.all_nodes:
            if node not in nodes:
                for neighbor, edge in node.neighbors:
                    if neighbor in nodes and edge.valid(self):
                        next_nodes.add(node)
        return next_nodes

    def calculate_available(self, nodes: set[Node]) -> set[Node]:
        current = nodes
        next = self._calculate_available(nodes)
        while len(next) > len(current):
            current = next
            next = self._calculate_available(current)
        return next

    def solve(self, node1: Node, node2: Node): ...
