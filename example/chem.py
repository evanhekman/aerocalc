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

NODES = {
    "P": g.Node("P"),
    "V": g.Node("V"),
    "n": g.Node("n"),
    "R": g.Node("R"),
    "T": g.Node("T"),
    "U": g.Node("U"),
    "f": g.Node("f"),
}


def always_true(g: g.Graph):
    return


EDGES = [
    # PV=nRT
    g.Edge(always_true, NODES["P"], NODES["V"]),
    g.Edge(always_true, NODES["P"], NODES["n"]),
    g.Edge(always_true, NODES["P"], NODES["R"]),
    g.Edge(always_true, NODES["P"], NODES["T"]),
    g.Edge(always_true, NODES["V"], NODES["n"]),
    g.Edge(always_true, NODES["V"], NODES["R"]),
    g.Edge(always_true, NODES["V"], NODES["T"]),
    g.Edge(always_true, NODES["n"], NODES["R"]),
    g.Edge(always_true, NODES["n"], NODES["T"]),
    g.Edge(always_true, NODES["P"], NODES["T"]),
    # U=(f/2)nRT
    g.Edge(always_true, NODES["U"], NODES["f"]),
    g.Edge(always_true, NODES["U"], NODES["n"]),
    g.Edge(always_true, NODES["U"], NODES["R"]),
    g.Edge(always_true, NODES["U"], NODES["T"]),
    g.Edge(always_true, NODES["f"], NODES["n"]),
    g.Edge(always_true, NODES["f"], NODES["R"]),
    g.Edge(always_true, NODES["f"], NODES["T"]),
    g.Edge(always_true, NODES["n"], NODES["R"]),
    g.Edge(always_true, NODES["n"], NODES["T"]),
    g.Edge(always_true, NODES["R"], NODES["T"]),
]

GRAPH = g.build_graph(NODES, EDGES)

SOME_NODES = set(
    [
        NODES["P"],
        NODES["V"],
        NODES["n"],
        NODES["T"],
    ]
)
print(GRAPH.calculate_available(SOME_NODES))
