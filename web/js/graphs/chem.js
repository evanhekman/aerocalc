// Chemistry graph: PV=nRT and U=(f/2)nRT

function loadChem() {
    const P = 'P', V = 'V', n = 'n', R = 'R', T = 'T', U = 'U', f = 'f';

    const nodes = new Map();
    [P, V, n, R, T, U, f].forEach(name => {
        nodes.set(name, new Node(name));
    });

    const edges = [
        // PV=nRT
        new Edge(P, V, new Set([n, R, T]), new Set([P, V])),
        new Edge(P, n, new Set([V, R, T]), new Set([P, n])),
        new Edge(P, R, new Set([V, n, T]), new Set([P, R])),
        new Edge(P, T, new Set([V, n, R]), new Set([P, T])),
        new Edge(V, n, new Set([P, R, T]), new Set([V, n])),
        new Edge(V, R, new Set([P, n, T]), new Set([V, R])),
        new Edge(V, T, new Set([P, n, R]), new Set([V, T])),
        new Edge(n, R, new Set([P, V, T]), new Set([n, R])),
        new Edge(n, T, new Set([P, V, R]), new Set([n, T])),
        new Edge(R, T, new Set([P, V, n]), new Set([R, T])),
        // U=(f/2)nRT
        new Edge(U, f, new Set([n, R, T]), new Set([U, f])),
        new Edge(U, n, new Set([f, R, T]), new Set([U, n])),
        new Edge(U, R, new Set([f, n, T]), new Set([U, R])),
        new Edge(U, T, new Set([f, n, R]), new Set([U, T])),
        new Edge(f, n, new Set([U, R, T]), new Set([f, n])),
        new Edge(f, R, new Set([U, n, T]), new Set([f, R])),
        new Edge(f, T, new Set([U, n, R]), new Set([f, T])),
        new Edge(n, R, new Set([U, f, T]), new Set([n, R])),
        new Edge(n, T, new Set([U, f, R]), new Set([n, T])),
        new Edge(R, T, new Set([U, f, n]), new Set([R, T]))
    ];

    const graph = new Graph(nodes, edges, new Set());

    return {
        name: 'Chemistry',
        description: 'PV=nRT & U=(f/2)nRT',
        nodes: [P, V, n, R, T, U, f],
        edges: edges.map(e => ({ from: e.neighbor1, to: e.neighbor2 })),
        conditions: [],
        defaultKnown: [P, V, n, T, f],
        defaultConditions: [],
        graph: graph
    };
}
