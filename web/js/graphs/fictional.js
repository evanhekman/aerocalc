// Fictional example graph

function loadFictional() {
    const A = 'A', B = 'B', C = 'C', D = 'D', E = 'E', F = 'F';

    const nodes = new Map();
    [A, B, C, D, E, F].forEach(name => {
        nodes.set(name, new Node(name));
    });

    const edges = [
        new Edge(A, B, new Set(), new Set()),
        new Edge(A, C, new Set(), new Set()),
        new Edge(A, D, new Set(), new Set()),
        new Edge(A, E, new Set(), new Set()),
        new Edge(B, D, new Set(), new Set()),
        new Edge(B, E, new Set(), new Set()),
        new Edge(C, D, new Set(), new Set()),
        new Edge(C, E, new Set([B]), new Set()),
        new Edge(D, F, new Set(), new Set())
    ];

    const graph = new Graph(nodes, edges, new Set());

    return {
        name: 'Fictional',
        description: 'Simple pathfinding example',
        nodes: [A, B, C, D, E, F],
        edges: edges.map(e => ({ from: e.neighbor1, to: e.neighbor2 })),
        conditions: [],
        defaultKnown: [A],
        defaultConditions: [],
        graph: graph
    };
}
