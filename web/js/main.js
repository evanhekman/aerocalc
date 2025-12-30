// Main application initialization and state management

// Application state
const AppState = {
    // Graph data
    graph: null,
    layout: null,
    allConditions: [],

    // User selections
    knownNodes: new Set(),
    activeConditions: new Set(),

    // Computed state
    availableNodes: new Set(),
    currentPaths: [],

    // UI references
    visualizer: null,
    uiController: null,

    // Update methods
    updateAvailableNodes() {
        this.availableNodes = this.graph.calculateAvailable(this.knownNodes);
        this.visualizer.availableNodes = this.availableNodes;
        this.visualizer.updateColors();
    },

    toggleNode(nodeName) {
        if (this.knownNodes.has(nodeName)) {
            this.knownNodes.delete(nodeName);
        } else {
            this.knownNodes.add(nodeName);
        }
        this.visualizer.knownNodes = this.knownNodes;
        this.updateAvailableNodes();
        this.clearPaths();
    },

    solve(startNode, endNode) {
        const paths = this.graph.solveAll(this.knownNodes, startNode, endNode);
        this.currentPaths = paths;
        this.visualizer.highlightPaths(paths);
        return paths;
    },

    clearPaths() {
        this.currentPaths = [];
        this.visualizer.clearPathHighlights();
    },

    loadGraph(exampleKey) {
        const example = loadExample(exampleKey);

        this.graph = example.graph;
        this.allConditions = example.allConditions;
        this.activeConditions = new Set(this.graph.conditions);
        this.knownNodes = new Set(example.defaultKnown);
        this.availableNodes = new Set();
        this.currentPaths = [];

        // Create layout
        this.layout = new GraphLayout(this.graph);
        this.layout.initialize();
        console.log(`Computing layout for ${this.graph.allNodes.size} nodes...`);
        const startTime = performance.now();
        this.layout.stabilize(200);
        const endTime = performance.now();
        console.log(`Layout computed in ${(endTime - startTime).toFixed(2)}ms`);

        // Clear and rebuild visualization
        this.rebuildVisualization();

        // Update UI
        this.uiController.updateForNewGraph();

        // Calculate initial available nodes
        this.visualizer.knownNodes = this.knownNodes;
        this.updateAvailableNodes();

        console.log(`Loaded example: ${example.name}`);
        console.log(`Nodes: ${this.graph.allNodes.size}, Edges: ${this.graph.allEdges.length}`);
    },

    rebuildVisualization() {
        // Clear existing scene
        while (this.visualizer.scene.children.length > 0) {
            const object = this.visualizer.scene.children[0];
            this.visualizer.scene.remove(object);
            if (object.geometry) object.geometry.dispose();
            if (object.material) object.material.dispose();
        }

        // Re-add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.visualizer.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight.position.set(10, 10, 10);
        this.visualizer.scene.add(directionalLight);

        // Clear maps
        this.visualizer.nodeObjects.clear();
        this.visualizer.edgeObjects.clear();
        this.visualizer.labelSprites.clear();

        // Create nodes and edges in visualizer
        for (const [nodeName] of this.graph.allNodes) {
            const pos = this.layout.positions.get(nodeName);
            this.visualizer.createNode(nodeName, pos);
        }

        for (const edge of this.graph.allEdges) {
            const pos1 = this.layout.positions.get(edge.neighbor1);
            const pos2 = this.layout.positions.get(edge.neighbor2);
            this.visualizer.createEdge(edge, pos1, pos2);
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    console.log('Initializing AeroCalc Web Visualizer...');

    // Create visualizer
    const container = document.getElementById('graph-container');
    AppState.visualizer = new GraphVisualizer(container);

    // Load default example (chem)
    AppState.loadGraph('chem');

    // Create UI controller
    AppState.uiController = new UIController(AppState);

    // Listen for example changes
    window.addEventListener('loadExample', (e) => {
        AppState.loadGraph(e.detail.exampleKey);
    });

    console.log('Initialization complete!');
}
