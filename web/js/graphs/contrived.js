// Contrived example graph with conditions

function loadContrived() {
    const A = 'A', B = 'B', C = 'C', D = 'D', E = 'E';
    const c1 = 'cond1', c2 = 'cond2';

    const nodes = new Map();
    [A, B, C, D, E].forEach(name => {
        nodes.set(name, new Node(name));
    });

    const edges = [
        new Edge(A, B, new Set(), new Set()),
        new Edge(A, C, new Set(), new Set()),
        new Edge(A, D, new Set(), new Set(), new Set([c1])),
        new Edge(B, C, new Set(), new Set([A, B])),
        new Edge(B, D, new Set([A, B]), new Set(), new Set([c1])),
        new Edge(B, E, new Set(), new Set(), new Set([c1])),
        new Edge(C, E, new Set(), new Set(), new Set([c2])),
        new Edge(D, E, new Set(), new Set([A, B, C]))
    ];

    const conditions = new Set([c1, c2]);
    const graph = new Graph(nodes, edges, conditions);

    return {
        name: 'Contrived',
        description: 'Example with conditional edges',
        nodes: [A, B, C, D, E],
        edges: edges.map(e => ({ from: e.neighbor1, to: e.neighbor2 })),
        conditions: [c1, c2],
        defaultKnown: [],
        defaultConditions: [c1, c2],
        graph: graph
    };
}
