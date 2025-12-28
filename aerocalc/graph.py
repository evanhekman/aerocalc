import copy
from collections import deque
from dis import disco
from typing import Set

type NodeKey = str
type ConditionKey = str


class Edge:
    def __init__(
        self,
        n1: NodeKey,
        n2: NodeKey,
        req_all_nodes: Set[NodeKey],
        req_one_node: Set[NodeKey],
        conditions: Set[ConditionKey] = set([]),
    ):
        self.neighbor1 = n1
        self.neighbor2 = n2
        self.req_all_nodes = req_all_nodes
        self.req_one_node = req_one_node
        self.conditions = conditions
        self.valid_graphs = set()

    def valid(self, graph: "Graph") -> bool:
        # TODO: hash the graph to prevent recomputation
        g_hash = hash(frozenset(graph.current_nodes))
        if g_hash in self.valid_graphs:
            return True

        if not graph.valid_conditions(self.conditions):
            return False
        for n in self.req_all_nodes:
            if not graph.valid_node(n):
                return False
        if len(self.req_one_node) > 0:
            for n in self.req_one_node:
                if graph.valid_node(n):
                    self.valid_graphs.add(g_hash)
                    return True
            return False
        self.valid_graphs.add(g_hash)
        return True

    def __str__(self):
        return f"{self.neighbor1}->{self.neighbor2}"


class Node:
    def __init__(self, name: NodeKey):
        self.name = name
        self.neighbors = []

    def __str__(self):
        return f"{self.name} with neighbors {[n[0] for n in self.neighbors]}"


class Graph:
    def __init__(
        self,
        nodes: dict[NodeKey, Node],
        edges: list[Edge],
        conditions: Set[ConditionKey] = set([]),
        validate: bool = True,
    ):
        self.all_nodes = nodes
        self.all_edges = edges
        self.conditions = conditions
        self.current_nodes = []
        for edge in edges:
            self.connect(edge)

        if validate:
            total_edges = sum([len(n.neighbors) for n in self.all_nodes.values()]) / 2
            assert total_edges == len(self.all_edges)

    def set_active(self, nodes: Set[NodeKey]):
        self.current_nodes = nodes

    def connect(self, edge: Edge):
        self.all_nodes[edge.neighbor1].neighbors.append((edge.neighbor2, edge))
        self.all_nodes[edge.neighbor2].neighbors.append((edge.neighbor1, edge))

    def _calculate_available(self, nodes: Set[NodeKey]) -> Set[NodeKey]:
        next_nodes = nodes.copy()
        for node in self.all_nodes.keys():
            if node not in nodes:
                for neighbor, edge in self.all_nodes[node].neighbors:
                    if neighbor in nodes and edge.valid(self):
                        next_nodes.add(node)
        return next_nodes

    def calculate_available(self, nodes: Set[NodeKey]) -> Set[NodeKey]:
        self.current_nodes = nodes
        next_nodes = self._calculate_available(nodes)
        while len(next_nodes) > len(self.current_nodes):
            self.current_nodes = next_nodes
            next_nodes = self._calculate_available(self.current_nodes)
        return next_nodes

    def valid_conditions(self, test_conditions: Set[ConditionKey]) -> bool:
        return all([c in self.conditions for c in test_conditions])

    def valid_node(self, node: NodeKey) -> bool:
        return node in self.current_nodes

    def solve_all(self, nodes: Set[NodeKey], node1: NodeKey, node2: NodeKey):
        before = nodes
        assert node1 in before
        after = self.calculate_available(nodes)
        assert node2 in after

        # start with node1
        # iteratively add routes for each node1.neighbor
        # if it reaches node2, consider it a valid route
        # no cycles

        current_routes = deque()
        current_routes.append([list([node1]), set([node1])])
        valid_routes = []

        while len(current_routes) > 0:
            route, discovered = current_routes.pop()
            end_node = route[-1]
            for next_node, _ in self.all_nodes[end_node].neighbors:
                r = copy.deepcopy(route)
                r.append(next_node)
                if next_node == node2:
                    valid_routes.append(r)
                elif next_node not in discovered:
                    d = copy.deepcopy(discovered)
                    d.add(next_node)
                    current_routes.append([r, d])

        return valid_routes


def build_graph(nodes: dict[str, Node], edges: list[Edge]) -> "Graph":
    g = Graph(nodes, [])
    for edge in edges:
        g.connect(edge)
    return g
