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
    knownValues: new Map(), // User-entered values
    computedValues: new Map(), // {node -> {value, edge, alternatives}}
    activeEdges: new Map(), // node -> edge currently used for computation
    activeConditions: new Set(),
    startNode: null,
    endNode: null,
    paths: [],

    init(graphName) {
        this.graphData = loadGraphData(graphName);
        this.graph = this.graphData.graph;
        this.activeConditions = new Set(this.graphData.defaultConditions || []);

        // Initialize with default known values if provided
        if (this.graphData.defaultKnown) {
            // Set some default values for demo (can be cleared by user)
            // This is just for initial display, not actual values
        }

        this.computeAll();
    },

    setKnownValue(node, valueStr) {
        const value = parseFloat(valueStr);
        if (valueStr === '' || isNaN(value)) {
            this.knownValues.delete(node);
        } else {
            this.knownValues.set(node, value);
        }
        this.computeAll();
        this.solvePaths();
    },

    setActiveEdge(node, edge) {
        this.activeEdges.set(node, edge);
        this.computeAll();
        this.solvePaths();
    },

    computeAll() {
        // Clear computed values
        this.computedValues.clear();

        // Build values object from known values
        const values = {};
        for (const [node, value] of this.knownValues) {
            values[node] = value;
        }

        // Iteratively compute values until no new ones are found
        let changed = true;
        let iterations = 0;
        const maxIterations = 100; // Prevent infinite loops

        while (changed && iterations < maxIterations) {
            changed = false;
            iterations++;

            // For each node, try to compute it
            for (const nodeName of this.graphData.nodes) {
                // Skip if already known by user
                if (this.knownValues.has(nodeName)) continue;

                // Skip if already computed this iteration
                if (this.computedValues.has(nodeName)) continue;

                // Find all edges that can compute this node
                const computationOptions = [];

                for (const edge of this.graph.allEdges) {
                    // Check if this edge has a solve function for this node
                    if (!edge.solveFunctions[nodeName]) continue;

                    // Check if edge is valid (conditions met, etc.)
                    const knownSet = new Set([...this.knownValues.keys(), ...this.computedValues.keys()]);
                    if (!edge.valid(this.graph, knownSet)) continue;

                    // Check if all required values are available
                    const reqAll = edge.reqAllNodes;
                    const reqOne = edge.reqOneNode;

                    let canCompute = true;
                    for (const req of reqAll) {
                        if (!values[req]) {
                            canCompute = false;
                            break;
                        }
                    }

                    if (reqOne.size > 0) {
                        let hasOne = false;
                        for (const req of reqOne) {
                            if (values[req]) {
                                hasOne = true;
                                break;
                            }
                        }
                        if (!hasOne) canCompute = false;
                    }

                    if (canCompute) {
                        try {
                            const computedValue = edge.solveFunctions[nodeName](values);
                            computationOptions.push({ edge, value: computedValue });
                        } catch (e) {
                            // Skip if computation fails
                        }
                    }
                }

                // If we found ways to compute this node
                if (computationOptions.length > 0) {
                    // Filter to unique values (within tolerance)
                    const uniqueOptions = [];
                    const tolerance = 1e-6;

                    for (const opt of computationOptions) {
                        const isDuplicate = uniqueOptions.some(
                            existing => Math.abs(existing.value - opt.value) < tolerance
                        );
                        if (!isDuplicate) {
                            uniqueOptions.push(opt);
                        }
                    }

                    // Use active edge if set, otherwise use first
                    let activeOption = uniqueOptions[0];
                    if (this.activeEdges.has(nodeName)) {
                        const activeEdge = this.activeEdges.get(nodeName);
                        const found = uniqueOptions.find(opt => opt.edge === activeEdge);
                        if (found) activeOption = found;
                    }

                    this.computedValues.set(nodeName, {
                        value: activeOption.value,
                        edge: activeOption.edge,
                        alternatives: uniqueOptions
                    });

                    values[nodeName] = activeOption.value;
                    changed = true;
                }
            }
        }
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

        this.computeAll();
        this.solvePaths();
    },

    solvePaths() {
        this.paths = [];

        if (!this.startNode || !this.endNode) {
            return;
        }

        // Get all known nodes (user-entered + computed)
        const knownNodes = new Set([...this.knownValues.keys(), ...this.computedValues.keys()]);

        if (!knownNodes.has(this.startNode)) {
            return;
        }

        try {
            this.paths = this.graph.solveAll(knownNodes, this.startNode, this.endNode);
        } catch (error) {
            // Path not found or error
            this.paths = [];
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
        renderer.resizeCanvas();
        renderer.initializePositions(AppState.graphData.nodes);
        renderer.render(AppState);
    });

    // Handle start/end node inputs
    const startInput = document.getElementById('start-node');
    const endInput = document.getElementById('end-node');

    startInput.addEventListener('input', (e) => {
        AppState.startNode = e.target.value.toUpperCase() || null;
        AppState.solvePaths();
        renderer.render(AppState);
    });

    endInput.addEventListener('input', (e) => {
        AppState.endNode = e.target.value.toUpperCase() || null;
        AppState.solvePaths();
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
    console.log('  Space: Toggle condition (when focused)');
    console.log('  Up/Down Arrows: Navigate sidebar elements');
});
