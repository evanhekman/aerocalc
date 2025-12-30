// Chemistry graph: PV=nRT and U=(f/2)nRT

function loadChem() {
    const P = 'P', V = 'V', n = 'n', R = 'R', T = 'T', U = 'U', f = 'f';

    const nodes = new Map();
    [P, V, n, R, T, U, f].forEach(name => {
        nodes.set(name, new Node(name));
    });

    const edges = [
        // PV=nRT
        new Edge(P, V, new Set([n, R, T]), new Set([P, V]), new Set(), {
            [P]: (v) => v.n * v.R * v.T / v.V,
            [V]: (v) => v.n * v.R * v.T / v.P
        }),
        new Edge(P, n, new Set([V, R, T]), new Set([P, n]), new Set(), {
            [P]: (v) => v.n * v.R * v.T / v.V,
            [n]: (v) => v.P * v.V / (v.R * v.T)
        }),
        new Edge(P, R, new Set([V, n, T]), new Set([P, R]), new Set(), {
            [P]: (v) => v.n * v.R * v.T / v.V,
            [R]: (v) => v.P * v.V / (v.n * v.T)
        }),
        new Edge(P, T, new Set([V, n, R]), new Set([P, T]), new Set(), {
            [P]: (v) => v.n * v.R * v.T / v.V,
            [T]: (v) => v.P * v.V / (v.n * v.R)
        }),
        new Edge(V, n, new Set([P, R, T]), new Set([V, n]), new Set(), {
            [V]: (v) => v.n * v.R * v.T / v.P,
            [n]: (v) => v.P * v.V / (v.R * v.T)
        }),
        new Edge(V, R, new Set([P, n, T]), new Set([V, R]), new Set(), {
            [V]: (v) => v.n * v.R * v.T / v.P,
            [R]: (v) => v.P * v.V / (v.n * v.T)
        }),
        new Edge(V, T, new Set([P, n, R]), new Set([V, T]), new Set(), {
            [V]: (v) => v.n * v.R * v.T / v.P,
            [T]: (v) => v.P * v.V / (v.n * v.R)
        }),
        new Edge(n, R, new Set([P, V, T]), new Set([n, R]), new Set(), {
            [n]: (v) => v.P * v.V / (v.R * v.T),
            [R]: (v) => v.P * v.V / (v.n * v.T)
        }),
        new Edge(n, T, new Set([P, V, R]), new Set([n, T]), new Set(), {
            [n]: (v) => v.P * v.V / (v.R * v.T),
            [T]: (v) => v.P * v.V / (v.n * v.R)
        }),
        new Edge(R, T, new Set([P, V, n]), new Set([R, T]), new Set(), {
            [R]: (v) => v.P * v.V / (v.n * v.T),
            [T]: (v) => v.P * v.V / (v.n * v.R)
        }),
        // U=(f/2)nRT
        new Edge(U, f, new Set([n, R, T]), new Set([U, f]), new Set(), {
            [U]: (v) => 0.5 * v.f * v.n * v.R * v.T,
            [f]: (v) => 2 * v.U / (v.n * v.R * v.T)
        }),
        new Edge(U, n, new Set([f, R, T]), new Set([U, n]), new Set(), {
            [U]: (v) => 0.5 * v.f * v.n * v.R * v.T,
            [n]: (v) => 2 * v.U / (v.f * v.R * v.T)
        }),
        new Edge(U, R, new Set([f, n, T]), new Set([U, R]), new Set(), {
            [U]: (v) => 0.5 * v.f * v.n * v.R * v.T,
            [R]: (v) => 2 * v.U / (v.f * v.n * v.T)
        }),
        new Edge(U, T, new Set([f, n, R]), new Set([U, T]), new Set(), {
            [U]: (v) => 0.5 * v.f * v.n * v.R * v.T,
            [T]: (v) => 2 * v.U / (v.f * v.n * v.R)
        }),
        new Edge(f, n, new Set([U, R, T]), new Set([f, n]), new Set(), {
            [f]: (v) => 2 * v.U / (v.n * v.R * v.T),
            [n]: (v) => 2 * v.U / (v.f * v.R * v.T)
        }),
        new Edge(f, R, new Set([U, n, T]), new Set([f, R]), new Set(), {
            [f]: (v) => 2 * v.U / (v.n * v.R * v.T),
            [R]: (v) => 2 * v.U / (v.f * v.n * v.T)
        }),
        new Edge(f, T, new Set([U, n, R]), new Set([f, T]), new Set(), {
            [f]: (v) => 2 * v.U / (v.n * v.R * v.T),
            [T]: (v) => 2 * v.U / (v.f * v.n * v.R)
        }),
        new Edge(n, R, new Set([U, f, T]), new Set([n, R]), new Set(), {
            [n]: (v) => 2 * v.U / (v.f * v.R * v.T),
            [R]: (v) => 2 * v.U / (v.f * v.n * v.T)
        }),
        new Edge(n, T, new Set([U, f, R]), new Set([n, T]), new Set(), {
            [n]: (v) => 2 * v.U / (v.f * v.R * v.T),
            [T]: (v) => 2 * v.U / (v.f * v.n * v.R)
        }),
        new Edge(R, T, new Set([U, f, n]), new Set([R, T]), new Set(), {
            [R]: (v) => 2 * v.U / (v.f * v.n * v.T),
            [T]: (v) => 2 * v.U / (v.f * v.n * v.R)
        })
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
