NodeKey = str
ConditionKey = str


class Edge:
    def __init__(
        self,
        n1: NodeKey,
        n2: NodeKey,
        req_all_nodes: set[NodeKey],
        req_one_node: set[NodeKey],
        conditions: set[ConditionKey],
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
        for n in self.req_one_node:
            if graph.valid_node(n):
                return True
        return True


class Node:
    def __init__(self, name: str, neighbors: list[tuple[Node, Edge]] = []):
        self.name = name
        self.neighbors = neighbors


class Graph:
    def __init__(
        self,
        nodes: dict[NodeKey, Node],
        edges: list[Edge],
        conditions: set[ConditionKey] = set([]),
        validate: bool = True,
    ):
        self.all_nodes = nodes
        self.all_edges = edges
        self.conditions = conditions
        self.active_nodes = []
        if validate:
            total_edges = sum([len(n.neighbors) for n in self.all_nodes.values()]) / 2
            assert total_edges == len(self.all_edges)

    def set_active(self, nodes: set[Node]):
        self.active_nodes = nodes

    def connect(self, node1: Node, node2: Node, edge: Edge):
        node1.neighbors.append((node2, edge))
        node2.neighbors.append((node1, edge))

    def _calculate_available(self, nodes: set[NodeKey]) -> set[NodeKey]:
        next_nodes = nodes.copy()
        for node in self.all_nodes:
            if node not in nodes:
                for neighbor, edge in self.all_nodes.[node].neighbors:
                    if neighbor in nodes and edge.valid(self):
                        next_nodes.add(node.name)
        return next_nodes

    def calculate_available(self, nodes: set[NodeKey]) -> set[NodeKey]:
        current = nodes
        next = self._calculate_available(nodes)
        while len(next) > len(current):
            current = next
            next = self._calculate_available(current)
        return next

    def valid_conditions(self, test_conditions: set[ConditionKey]) -> bool:
        return all([c in self.conditions for c in test_conditions])

    def valid_node(self, node: NodeKey) -> bool:
        return node in self.active_nodes

    def solve(self, node1: NodeKey, node2: NodeKey): ...


def build_graph(nodes: dict[str, Node], edges: list[Edge]) -> "Graph":
    g = Graph(list(nodes.values()), [])
    for edge in edges:
        n1 = nodes[edge.neighbor1]
        n2 = nodes[edge.neighbor2]
        g.connect(n1, n2, edge)
    return g
