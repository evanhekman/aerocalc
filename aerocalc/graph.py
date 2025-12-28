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

    def valid(self, graph: "Graph") -> bool:
        # TODO: hash the graph to prevent recomputation
        if not graph.valid_conditions(self.conditions):
            return False
        for n in self.req_all_nodes:
            if not graph.valid_node(n):
                return False
        if len(self.req_one_node) > 0:
            for n in self.req_one_node:
                if graph.valid_node(n):
                    return True
            return False
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
        next = self._calculate_available(nodes)
        while len(next) > len(self.current_nodes):
            self.current_nodes = next
            next = self._calculate_available(self.current_nodes)
        return next

    def valid_conditions(self, test_conditions: Set[ConditionKey]) -> bool:
        return all([c in self.conditions for c in test_conditions])

    def valid_node(self, node: NodeKey) -> bool:
        return node in self.current_nodes

    def solve(self, node1: NodeKey, node2: NodeKey): ...


def build_graph(nodes: dict[str, Node], edges: list[Edge]) -> "Graph":
    g = Graph(nodes, [])
    for edge in edges:
        g.connect(edge)
    return g
