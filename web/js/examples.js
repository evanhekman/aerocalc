// Example Graphs - Ported from Python examples

const EXAMPLES = {
    chem: {
        name: "Chemistry: PV=nRT & U=(f/2)nRT",
        description: "Ideal gas law and internal energy equations",
        nodes: ["P", "V", "n", "R", "T", "U", "f"],
        edges: [
            // PV=nRT
            { n1: "P", n2: "V", reqAll: ["n", "R", "T"], reqOne: ["P", "V"] },
            { n1: "P", n2: "n", reqAll: ["V", "R", "T"], reqOne: ["P", "n"] },
            { n1: "P", n2: "R", reqAll: ["V", "n", "T"], reqOne: ["P", "R"] },
            { n1: "P", n2: "T", reqAll: ["V", "n", "R"], reqOne: ["P", "T"] },
            { n1: "V", n2: "n", reqAll: ["P", "R", "T"], reqOne: ["V", "n"] },
            { n1: "V", n2: "R", reqAll: ["P", "n", "T"], reqOne: ["V", "R"] },
            { n1: "V", n2: "T", reqAll: ["P", "n", "R"], reqOne: ["V", "T"] },
            { n1: "n", n2: "R", reqAll: ["P", "V", "T"], reqOne: ["n", "R"] },
            { n1: "n", n2: "T", reqAll: ["P", "V", "R"], reqOne: ["n", "T"] },
            { n1: "R", n2: "T", reqAll: ["P", "V", "n"], reqOne: ["R", "T"] },
            // U=(f/2)nRT
            { n1: "U", n2: "f", reqAll: ["n", "R", "T"], reqOne: ["U", "f"] },
            { n1: "U", n2: "n", reqAll: ["f", "R", "T"], reqOne: ["U", "n"] },
            { n1: "U", n2: "R", reqAll: ["f", "n", "T"], reqOne: ["U", "R"] },
            { n1: "U", n2: "T", reqAll: ["f", "n", "R"], reqOne: ["U", "T"] },
            { n1: "f", n2: "n", reqAll: ["U", "R", "T"], reqOne: ["f", "n"] },
            { n1: "f", n2: "R", reqAll: ["U", "n", "T"], reqOne: ["f", "R"] },
            { n1: "f", n2: "T", reqAll: ["U", "n", "R"], reqOne: ["f", "T"] },
            { n1: "n", n2: "R", reqAll: ["U", "f", "T"], reqOne: ["n", "R"] },
            { n1: "n", n2: "T", reqAll: ["U", "f", "R"], reqOne: ["n", "T"] },
            { n1: "R", n2: "T", reqAll: ["U", "f", "n"], reqOne: ["R", "T"] }
        ],
        conditions: [],
        defaultKnown: ["P", "V", "n", "T", "f"]
    },

    contrived: {
        name: "Contrived: Conditional Edges",
        description: "Demonstrates condition toggling",
        nodes: ["A", "B", "C", "D", "E"],
        edges: [
            { n1: "A", n2: "B", reqAll: [], reqOne: [] },
            { n1: "A", n2: "C", reqAll: [], reqOne: [] },
            { n1: "A", n2: "D", reqAll: [], reqOne: [], conditions: ["cond1"] },
            { n1: "B", n2: "C", reqAll: [], reqOne: ["A", "B"] },
            { n1: "B", n2: "D", reqAll: ["A", "B"], reqOne: [], conditions: ["cond1"] },
            { n1: "B", n2: "E", reqAll: [], reqOne: [], conditions: ["cond1"] },
            { n1: "C", n2: "E", reqAll: [], reqOne: [], conditions: ["cond2"] },
            { n1: "D", n2: "E", reqAll: [], reqOne: ["A", "B", "C"] }
        ],
        conditions: ["cond1", "cond2"],
        defaultKnown: ["A"]
    },

    fictional: {
        name: "Fictional: Simple Graph",
        description: "Basic pathfinding example",
        nodes: ["A", "B", "C", "D", "E", "F"],
        edges: [
            { n1: "A", n2: "B", reqAll: [], reqOne: [] },
            { n1: "A", n2: "C", reqAll: [], reqOne: [] },
            { n1: "A", n2: "D", reqAll: [], reqOne: [] },
            { n1: "A", n2: "E", reqAll: [], reqOne: [] },
            { n1: "B", n2: "D", reqAll: [], reqOne: [] },
            { n1: "B", n2: "E", reqAll: [], reqOne: [] },
            { n1: "C", n2: "D", reqAll: [], reqOne: [] },
            { n1: "C", n2: "E", reqAll: ["B"], reqOne: [] },
            { n1: "D", n2: "F", reqAll: [], reqOne: [] }
        ],
        conditions: [],
        defaultKnown: ["A"]
    },

    edgecase: {
        name: "Edge Case: Multiple Minimal Paths",
        description: "Complex graph with 3 equally minimal paths from A to G",
        nodes: ["A", "B", "C", "D", "E", "F", "G"],
        edges: [
            { n1: "A", n2: "B", reqAll: [], reqOne: [] },
            { n1: "A", n2: "C", reqAll: [], reqOne: [] },
            { n1: "B", n2: "D", reqAll: [], reqOne: [] },
            { n1: "C", n2: "F", reqAll: [], reqOne: [] },
            { n1: "C", n2: "E", reqAll: [], reqOne: [] },
            { n1: "D", n2: "F", reqAll: [], reqOne: [] },
            { n1: "E", n2: "G", reqAll: [], reqOne: [] },
            { n1: "F", n2: "G", reqAll: [], reqOne: [] }
        ],
        conditions: [],
        defaultKnown: ["A"]
    }
};

// Load an example graph and construct the Graph object
function loadExample(exampleKey) {
    const example = EXAMPLES[exampleKey];

    if (!example) {
        throw new Error(`Example '${exampleKey}' not found`);
    }

    // Create nodes map
    const nodes = new Map();
    for (const nodeName of example.nodes) {
        nodes.set(nodeName, new Node(nodeName));
    }

    // Create edges array
    const edges = example.edges.map(e =>
        new Edge(
            e.n1,
            e.n2,
            new Set(e.reqAll || []),
            new Set(e.reqOne || []),
            new Set(e.conditions || [])
        )
    );

    // Create graph
    const graph = new Graph(nodes, edges, new Set(example.conditions || []), true);

    return {
        graph,
        defaultKnown: new Set(example.defaultKnown || []),
        name: example.name,
        description: example.description,
        allConditions: example.conditions || []
    };
}
