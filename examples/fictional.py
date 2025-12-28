from aerocalc import graph as g

A: g.NodeKey = "A"
B: g.NodeKey = "B"
C: g.NodeKey = "C"
D: g.NodeKey = "D"
E: g.NodeKey = "E"
F: g.NodeKey = "F"

NODES = {
    A: g.Node(A),
    B: g.Node(B),
    C: g.Node(C),
    D: g.Node(D),
    E: g.Node(E),
    F: g.Node(F),
}


EDGES = [
    g.Edge(A, B, set(), set()),
    g.Edge(A, C, set(), set()),
    g.Edge(A, D, set(), set()),
    g.Edge(A, E, set(), set()),
    g.Edge(B, D, set(), set()),
    g.Edge(B, E, set(), set()),
    g.Edge(C, D, set(), set()),
    g.Edge(C, E, set([B]), set()),
    g.Edge(D, F, set(), set()),
]

GRAPH = g.build_graph(NODES, EDGES)

NODES = set(A)

s = GRAPH.solve_all(NODES, A, F)
print(s)
assert s[0] == [A, D, F]
