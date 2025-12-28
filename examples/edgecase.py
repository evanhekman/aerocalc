from aerocalc import graph as g

"""
    A
   / \
  /   \
 B     C
 |    /|
 |   / |
 D  /  |
 | /   E
 |/   /
 F   /
 |  /
 | /
 |/
 G

SHORT routes to AG:
     - ACEG
     - ABDFG
     - ACFG
"""

A: g.NodeKey = "A"
B: g.NodeKey = "B"
C: g.NodeKey = "C"
D: g.NodeKey = "D"
E: g.NodeKey = "E"
F: g.NodeKey = "F"
G: g.NodeKey = "G"

NODES = {
    A: g.Node(A),
    B: g.Node(B),
    C: g.Node(C),
    D: g.Node(D),
    E: g.Node(E),
    F: g.Node(F),
    G: g.Node(G),
}


EDGES = [
    g.Edge(A, B, set(), set()),
    g.Edge(A, C, set(), set()),
    g.Edge(B, D, set(), set()),
    g.Edge(C, F, set(), set()),
    g.Edge(C, E, set(), set()),
    g.Edge(D, F, set(), set()),
    g.Edge(E, G, set(), set()),
    g.Edge(F, G, set(), set()),
]

GRAPH = g.build_graph(NODES, EDGES)

NODES = set(A)

s = GRAPH.solve_all(NODES, A, G)
print(s)
assert len(s) == 3
assert ["A", "C", "E", "G"] in s
assert ["A", "B", "D", "F", "G"] in s
assert ["A", "C", "F", "G"] in s
