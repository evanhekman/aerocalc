// Main application state and orchestration

// Get graph name from URL parameter, default to contrived
function getGraphFromURL() {
    const params = new URLSearchParams(window.location.search);
    const graphName = params.get('graph') || 'contrived';
    return graphName;
}

// Load the appropriate graph
function loadGraphData(graphName) {
    const loaders = {
        'contrived': loadContrived,
        'chem': loadChem,
        'fictional': loadFictional,
        'edgecase': loadEdgecase
    };

    const loader = loaders[graphName];
    if (!loader) {
        console.warn(`Unknown graph: ${graphName}, falling back to contrived`);
        return loaders['contrived']();
    }

    return loader();
}

// Application state
const AppState = {
    graphData: null,
    graph: null,
    knownNodes: new Set(),
    nodeValues: new Map(),
    availableNodes: new Set(),
    activeConditions: new Set(['cond1', 'cond2']),
    startNode: null,
    endNode: null,
    paths: [],

    init(graphName) {
        this.graphData = loadGraphData(graphName);
        this.graph = this.graphData.graph;

        // Set default known nodes
        this.knownNodes = new Set(this.graphData.defaultKnown || []);

        // Set default active conditions
        this.activeConditions = new Set(this.graphData.defaultConditions || []);

        this.updateAvailable();
    },

    toggleNode(node) {
        if (this.knownNodes.has(node)) {
            this.knownNodes.delete(node);
            this.nodeValues.delete(node);
        } else {
            this.knownNodes.add(node);
        }
        this.paths = []; // Clear paths when state changes
        this.updateAvailable();
    },

    toggleCondition(condition) {
        if (this.activeConditions.has(condition)) {
            this.activeConditions.delete(condition);
            this.graph.conditions.delete(condition);
        } else {
            this.activeConditions.add(condition);
            this.graph.conditions.add(condition);
        }

        // Clear edge validation caches
        for (const edge of this.graph.allEdges) {
            edge.validGraphs.clear();
        }

        this.paths = []; // Clear paths when state changes
        this.updateAvailable();
    },

    updateAvailable() {
        this.availableNodes = this.graph.calculateAvailable(this.knownNodes);
    },

    solve() {
        if (!this.startNode || !this.endNode) {
            console.warn('Start and end nodes must be specified');
            return [];
        }

        if (!this.knownNodes.has(this.startNode)) {
            console.warn('Start node must be in known nodes');
            return [];
        }

        try {
            this.paths = this.graph.solveAll(this.knownNodes, this.startNode, this.endNode);
            return this.paths;
        } catch (error) {
            console.error('Solve error:', error);
            return [];
        }
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing AeroCalc...');

    // Get graph from URL
    const graphName = getGraphFromURL();
    console.log(`Loading graph: ${graphName}`);

    // Initialize state
    AppState.init(graphName);

    // Setup renderer
    const canvas = document.getElementById('graph-canvas');
    const inputsContainer = document.getElementById('node-inputs');
    const renderer = new GraphRenderer(canvas, inputsContainer);

    // Update conditions UI dynamically
    const conditionsList = document.getElementById('conditions-list');
    const conditionsLabel = conditionsList.parentElement.querySelector('label');
    conditionsList.innerHTML = '';

    if (AppState.graphData.conditions.length > 0) {
        conditionsLabel.classList.add('green-label');

        AppState.graphData.conditions.forEach(condition => {
            const btn = document.createElement('button');
            btn.className = 'condition-btn';
            btn.textContent = condition;
            btn.setAttribute('tabindex', '0');

            if (AppState.activeConditions.has(condition)) {
                btn.classList.add('active');
            }

            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
                AppState.toggleCondition(condition);
                renderer.render(AppState);
            });

            conditionsList.appendChild(btn);
        });
    } else {
        conditionsLabel.classList.remove('green-label');
        conditionsList.innerHTML = '<p class="hint">No conditions for this graph</p>';
    }

    // Initial render
    renderer.resizeCanvas();
    renderer.initializePositions(AppState.graphData.nodes);
    renderer.render(AppState);

    // Handle window resize
    window.addEventListener('resize', () => {
        renderer.stopAnimation(); // Stop animation before resizing
        renderer.resizeCanvas();
        renderer.initializePositions(AppState.graphData.nodes);
        renderer.render(AppState);
    });

    // Handle canvas clicks (toggle nodes)
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const node = renderer.getNodeAtPosition(x, y);
        if (node) {
            AppState.toggleNode(node);
            renderer.render(AppState);
        }
    });

    // Handle start node input
    const startInput = document.getElementById('start-node');
    startInput.addEventListener('input', (e) => {
        AppState.startNode = e.target.value.toUpperCase() || null;
        AppState.paths = []; // Clear paths when start/end changes
        renderer.render(AppState);
    });

    // Handle end node input
    const endInput = document.getElementById('end-node');
    endInput.addEventListener('input', (e) => {
        AppState.endNode = e.target.value.toUpperCase() || null;
        AppState.paths = []; // Clear paths when start/end changes
        renderer.render(AppState);
    });

    // Handle solve button
    const solveButton = document.getElementById('solve-button');
    solveButton.addEventListener('click', () => {
        const paths = AppState.solve();
        console.log('Found paths:', paths);
        renderer.render(AppState);
    });

    // Condition toggles are now dynamically created above

    // Get all focusable elements in sidebar
    function getFocusableElements() {
        const sidebar = document.getElementById('sidebar');
        return Array.from(sidebar.querySelectorAll('input, button'))
            .filter(el => !el.disabled && el.offsetParent !== null);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        const isMeta = e.metaKey || e.ctrlKey;

        // Meta-Z: Focus starting node
        if (isMeta && e.key === 'z') {
            e.preventDefault();
            startInput.focus();
            startInput.select();
        }

        // Meta-X: Focus ending node
        if (isMeta && e.key === 'x') {
            e.preventDefault();
            endInput.focus();
            endInput.select();
        }

        // Meta-C: Focus first condition button
        if (isMeta && e.key === 'c') {
            e.preventDefault();
            const firstCondition = document.querySelector('.condition-btn');
            if (firstCondition) {
                firstCondition.focus();
            }
        }

        // Meta-Enter: Trigger solve
        if (isMeta && e.key === 'Enter') {
            e.preventDefault();
            solveButton.click();
        }

        // Spacebar: Toggle focused condition button
        if (e.key === ' ' && document.activeElement.classList.contains('condition-btn')) {
            e.preventDefault();
            document.activeElement.click();
        }

        // Arrow up/down navigation in sidebar
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            const focusableElements = getFocusableElements();
            const currentIndex = focusableElements.indexOf(document.activeElement);

            if (currentIndex !== -1) {
                e.preventDefault();
                let nextIndex;

                if (e.key === 'ArrowDown') {
                    nextIndex = (currentIndex + 1) % focusableElements.length;
                } else {
                    nextIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
                }

                focusableElements[nextIndex].focus();
                if (focusableElements[nextIndex].select) {
                    focusableElements[nextIndex].select();
                }
            }
        }
    });

    // Condition buttons are made focusable when dynamically created

    console.log('AeroCalc initialized!');
    console.log(`Graph: ${AppState.graphData.name} - ${AppState.graphData.description}`);
    console.log(`Nodes: ${AppState.graphData.nodes.length}, Edges: ${AppState.graph.allEdges.length}, Conditions: ${AppState.graphData.conditions.length}`);
    console.log('');
    console.log('Available graphs:');
    console.log('  ?graph=contrived - Conditional edges example');
    console.log('  ?graph=chem - Chemistry: PV=nRT & U=(f/2)nRT');
    console.log('  ?graph=fictional - Simple pathfinding');
    console.log('  ?graph=edgecase - Multiple minimal paths');
    console.log('');
    console.log('Keyboard shortcuts:');
    console.log('  Meta-Z: Focus starting node');
    console.log('  Meta-X: Focus ending node');
    console.log('  Meta-C: Focus conditions');
    console.log('  Meta-Enter: Solve');
    console.log('  Space: Toggle condition (when focused)');
    console.log('  Up/Down Arrows: Navigate sidebar elements');
});
