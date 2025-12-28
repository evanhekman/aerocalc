from aerocalc import graph as g

A: g.NodeKey = "A"
B: g.NodeKey = "B"
C: g.NodeKey = "C"
D: g.NodeKey = "D"
E: g.NodeKey = "E"

c1: g.ConditionKey = "cond1"
c2: g.ConditionKey = "cond2"

NODES = {
    A: g.Node(A),
    B: g.Node(B),
    C: g.Node(C),
    D: g.Node(D),
    E: g.Node(E),
}


EDGES = [
    g.Edge(A, B, set(), set()),
    g.Edge(A, C, set(), set()),
    g.Edge(A, D, set(), set(), set([c1])),
    g.Edge(B, C, set(), set([A, B])),
    g.Edge(B, D, set([A, B]), set(), set([c1])),
    g.Edge(B, E, set(), set(), set([c1])),
    g.Edge(C, E, set(), set(), set([c2])),
    g.Edge(D, E, set(), set([A, B, C])),
]

GRAPH = g.build_graph(NODES, EDGES, set([c1, c2]))

NODE = set(A)

s = GRAPH.solve_all(NODE, A, E)
print(s)
