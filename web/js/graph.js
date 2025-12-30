// AeroCalc Graph Logic - Ported from Python
// Maintains exact algorithm semantics from aerocalc/graph.py

class Edge {
    constructor(n1, n2, reqAllNodes = new Set(), reqOneNode = new Set(), conditions = new Set()) {
        this.neighbor1 = n1;
        this.neighbor2 = n2;
        this.reqAllNodes = reqAllNodes;
        this.reqOneNode = reqOneNode;
        this.conditions = conditions;
        this.validGraphs = new Set(); // Cache for performance
    }

    valid(graph, nodes) {
        // Create hash of current nodes for caching
        const sortedNodes = Array.from(graph.currentNodes).sort();
        const gHash = sortedNodes.join(',');

        if (this.validGraphs.has(gHash)) {
            return true;
        }

        // Check conditions
        for (const c of this.conditions) {
            if (!graph.conditions.has(c)) {
                return false;
            }
        }

        // Check req_all_nodes
        for (const n of this.reqAllNodes) {
            if (!nodes.has(n)) {
                return false;
            }
        }

        // Check req_one_node
        if (this.reqOneNode.size > 0) {
            for (const n of this.reqOneNode) {
                if (nodes.has(n)) {
                    this.validGraphs.add(gHash);
                    return true;
                }
            }
            return false;
        }

        this.validGraphs.add(gHash);
        return true;
    }

    toString() {
        return `${this.neighbor1}->${this.neighbor2}`;
    }
}

class Node {
    constructor(name) {
        this.name = name;
        this.neighbors = []; // Array of {node: string, edge: Edge}
    }

    toString() {
        const neighborNames = this.neighbors.map(n => n.node);
        return `${this.name} with neighbors ${neighborNames}`;
    }
}

class Graph {
    constructor(nodes, edges, conditions = new Set(), validate = true) {
        this.allNodes = nodes; // Map<string, Node>
        this.allEdges = edges; // Array<Edge>
        this.conditions = conditions; // Set<string>
        this.currentNodes = new Set();

        // Connect edges
        for (const edge of edges) {
            this.connect(edge);
        }

        // Validation: ensure bidirectional edges are counted correctly
        if (validate) {
            const totalEdges = Array.from(this.allNodes.values())
                .reduce((sum, node) => sum + node.neighbors.length, 0) / 2;
            if (totalEdges !== this.allEdges.length) {
                console.warn(`Edge count mismatch: ${totalEdges} vs ${this.allEdges.length}`);
            }
        }
    }

    connect(edge) {
        this.allNodes.get(edge.neighbor1).neighbors.push({
            node: edge.neighbor2,
            edge: edge
        });
        this.allNodes.get(edge.neighbor2).neighbors.push({
            node: edge.neighbor1,
            edge: edge
        });
    }

    _calculateAvailable(nodes) {
        const nextNodes = new Set(nodes);

        for (const [nodeName, node] of this.allNodes) {
            if (!nodes.has(nodeName)) {
                for (const {node: neighbor, edge} of node.neighbors) {
                    if (nodes.has(neighbor) && edge.valid(this, nodes)) {
                        nextNodes.add(nodeName);
                        break;
                    }
                }
            }
        }

        return nextNodes;
    }

    calculateAvailable(nodes) {
        this.currentNodes = new Set(nodes);
        let nextNodes = this._calculateAvailable(nodes);

        // Iterate until fixed point (no new nodes discovered)
        while (nextNodes.size > this.currentNodes.size) {
            this.currentNodes = nextNodes;
            nextNodes = this._calculateAvailable(this.currentNodes);
        }

        return nextNodes;
    }

    solveAll(nodes, node1, node2) {
        if (!nodes.has(node1)) {
            throw new Error(`Starting node ${node1} must be in known nodes`);
        }

        const currentRoutes = [];
        currentRoutes.push({
            route: [node1],
            discovered: new Set([node1])
        });

        const validRoutes = [];

        // BFS to find all paths
        while (currentRoutes.length > 0) {
            const {route, discovered} = currentRoutes.pop();
            const endNode = route[route.length - 1];
            const combinedNodes = new Set([...nodes, ...discovered]);
            const available = this._calculateAvailable(combinedNodes);

            for (const {node: nextNode, edge} of this.allNodes.get(endNode).neighbors) {
                if (!available.has(nextNode) || !edge.valid(this, discovered)) {
                    continue;
                }

                const newRoute = [...route, nextNode];

                if (nextNode === node2) {
                    validRoutes.push(newRoute);
                } else if (!discovered.has(nextNode)) {
                    const newDiscovered = new Set(discovered);
                    newDiscovered.add(nextNode);
                    currentRoutes.push({
                        route: newRoute,
                        discovered: newDiscovered
                    });
                }
            }
        }

        // Sort by length
        validRoutes.sort((a, b) => a.length - b.length);

        // Filter to only minimal paths (no path is subset of another)
        const shortRoutes = [];
        const shortRouteSets = [];

        for (const route of validRoutes) {
            const routeSet = new Set(route);
            let isShort = true;

            for (const existingSet of shortRouteSets) {
                if (this._isSubset(existingSet, routeSet)) {
                    isShort = false;
                    break;
                }
            }

            if (isShort) {
                shortRoutes.push(route);
                shortRouteSets.push(routeSet);
            }
        }

        return shortRoutes;
    }

    _isSubset(subset, superset) {
        for (const elem of subset) {
            if (!superset.has(elem)) {
                return false;
            }
        }
        return true;
    }
}

function buildGraph(nodes, edges, conditions = new Set()) {
    return new Graph(nodes, edges, conditions);
}
