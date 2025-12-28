"""
## equations
PV=nRT
U=(f/2)nRT

## nodes
- P (pressure)
- V (volume)
- T (temperature)
- n (number of moles)
- R (gas constant)
- U (internal energy)
- f (degrees of freedom)

## edges
### edges from PV=NRT
- PV (given n, R, T, one of PV)
- Pn (given V, R, T, one of Pn)
- PR (...)
- PT (...)
- Vn (...)
- VR (...)
- VT (...)
- nR (...)
- nT (...)
- RT (...)

### edges from U=(f/2)nRT
- Uf (given n, R, T, one of Uf)
- Un (given f, R, T, one of Un)
- UR (...)
- UT (...)
- fn (...)
- fR (...)
- fT (...)
- nR (...)
- nT (...)
- RT (...)
"""

from aerocalc import graph as g

P: g.NodeKey = "P"
V: g.NodeKey = "V"
n: g.NodeKey = "n"
R: g.NodeKey = "R"
T: g.NodeKey = "T"
U: g.NodeKey = "U"
f: g.NodeKey = "f"

NODES = {
    P: g.Node(P),
    V: g.Node(V),
    n: g.Node(n),
    R: g.Node(R),
    T: g.Node(T),
    U: g.Node(U),
    f: g.Node(f),
}


def always_true(g: g.Graph):
    return


EDGES = [
    # PV=nRT
    g.Edge(P, V, set([n, R, T]), set([P, V])),
    g.Edge(P, n, set([V, R, T]), set([P, n])),
    g.Edge(P, R, set([V, n, T]), set([P, R])),
    g.Edge(P, T, set([V, n, R]), set([P, T])),
    g.Edge(V, n, set([P, R, T]), set([V, n])),
    g.Edge(V, R, set([P, n, T]), set([V, R])),
    g.Edge(V, T, set([P, n, R]), set([V, T])),
    g.Edge(n, R, set([P, V, T]), set([n, R])),
    g.Edge(n, T, set([P, V, R]), set([n, T])),
    g.Edge(R, T, set([P, V, n]), set([R, T])),
    # U=(f/2)nRT
    g.Edge(U, f, set([n, R, T]), set([U, f])),
    g.Edge(U, n, set([f, R, T]), set([U, n])),
    g.Edge(U, R, set([f, n, T]), set([U, R])),
    g.Edge(U, T, set([f, n, R]), set([U, T])),
    g.Edge(f, n, set([U, R, T]), set([f, n])),
    g.Edge(f, R, set([U, n, T]), set([f, R])),
    g.Edge(f, T, set([U, n, R]), set([f, T])),
    g.Edge(n, R, set([U, f, T]), set([n, R])),
    g.Edge(n, T, set([U, f, R]), set([n, T])),
    g.Edge(R, T, set([U, f, n]), set([R, T])),
]

GRAPH = g.build_graph(NODES, EDGES)

NODES_1 = set([P, V, n, T, f])
NODES_2 = set([P, V, n, T])
NODES_3 = set([P, V, T])
for NODES in [NODES_1, NODES_2, NODES_3]:
    print("starting with", NODES)
    print("can reach", GRAPH.calculate_available(NODES))
