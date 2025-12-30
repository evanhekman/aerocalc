// Edge case: Multiple minimal paths

function loadEdgecase() {
    const A = 'A', B = 'B', C = 'C', D = 'D', E = 'E', F = 'F', G = 'G';

    const nodes = new Map();
    [A, B, C, D, E, F, G].forEach(name => {
        nodes.set(name, new Node(name));
    });

    const edges = [
        new Edge(A, B, new Set(), new Set()),
        new Edge(A, C, new Set(), new Set()),
        new Edge(B, D, new Set(), new Set()),
        new Edge(C, F, new Set(), new Set()),
        new Edge(C, E, new Set(), new Set()),
        new Edge(D, F, new Set(), new Set()),
        new Edge(E, G, new Set(), new Set()),
        new Edge(F, G, new Set(), new Set())
    ];

    const graph = new Graph(nodes, edges, new Set());

    return {
        name: 'Edge Case',
        description: 'Multiple minimal paths (A→G)',
        nodes: [A, B, C, D, E, F, G],
        edges: edges.map(e => ({ from: e.neighbor1, to: e.neighbor2 })),
        conditions: [],
        defaultKnown: [A],
        defaultConditions: [],
        graph: graph
    };
}
