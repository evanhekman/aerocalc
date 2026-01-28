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
    knownValues: new Map(), // User-entered values (in selected units)
    computedValues: new Map(), // {node -> {value, edge, alternatives}} (in selected units)
    activeEdges: new Map(), // node -> edge currently used for computation
    activeConditions: new Set(),
    selectedUnits: new Map(), // node -> selected unit
    currentTheme: 'gray', // Current color theme

    init(graphName) {
        this.graphData = loadGraphData(graphName);
        this.graph = this.graphData.graph;
        this.activeConditions = new Set(this.graphData.defaultConditions || []);

        // Initialize selected units (default to first unit in list)
        this.selectedUnits.clear();
        if (this.graphData.units) {
            for (const [node, unitOptions] of Object.entries(this.graphData.units)) {
                this.selectedUnits.set(node, unitOptions[0]);
            }
        }

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
    },

    setActiveEdge(node, edge) {
        this.activeEdges.set(node, edge);
        this.computeAll();
    },

    setSelectedUnit(node, unit) {
        // Convert known value to new unit if it exists
        if (this.knownValues.has(node)) {
            const oldUnit = this.selectedUnits.get(node);
            const valueInStandard = toStandardUnit(this.knownValues.get(node), node, oldUnit);
            const valueInNewUnit = fromStandardUnit(valueInStandard, node, unit);
            this.knownValues.set(node, valueInNewUnit);
        }

        this.selectedUnits.set(node, unit);
        this.computeAll();
    },

    computeAll() {
        // Clear computed values
        this.computedValues.clear();

        // Build values object from known values (convert to standard units for computation)
        const values = {};
        for (const [node, value] of this.knownValues) {
            const unit = this.selectedUnits.get(node);
            values[node] = toStandardUnit(value, node, unit);
        }

        // Auto-calculate R (gas constant) - always use standard units for computation
        values['R'] = getStandardR();

        // Iteratively compute values until no new ones are found
        let changed = true;
        let iterations = 0;
        const maxIterations = 100; // Prevent infinite loops

        while (changed && iterations < maxIterations) {
            changed = false;
            iterations++;

            // For each node, try to compute it
            for (const nodeName of this.graphData.nodes) {
                // Skip R - it's auto-calculated
                if (nodeName === 'R') continue;

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
                    // Include R in the known set since it's always available
                    const knownSet = new Set([...this.knownValues.keys(), ...this.computedValues.keys(), 'R']);
                    if (!edge.valid(this.graph, knownSet)) continue;

                    // Check if all required values are available
                    const reqAll = edge.reqAllNodes;
                    const reqOne = edge.reqOneNode;

                    let canCompute = true;
                    for (const req of reqAll) {
                        if (values[req] === undefined || values[req] === null) {
                            canCompute = false;
                            break;
                        }
                    }

                    if (reqOne.size > 0) {
                        let hasOne = false;
                        for (const req of reqOne) {
                            if (values[req] !== undefined && values[req] !== null) {
                                hasOne = true;
                                break;
                            }
                        }
                        if (!hasOne) canCompute = false;
                    }

                    if (canCompute) {
                        try {
                            // Compute in standard units
                            const computedValueStandard = edge.solveFunctions[nodeName](values);

                            // Convert to selected unit for display
                            const selectedUnit = this.selectedUnits.get(nodeName);
                            const computedValue = selectedUnit
                                ? fromStandardUnit(computedValueStandard, nodeName, selectedUnit)
                                : computedValueStandard;

                            computationOptions.push({ edge, value: computedValue, valueStandard: computedValueStandard });
                        } catch (e) {
                            // Skip if computation fails
                        }
                    }
                }

                // If we found ways to compute this node
                if (computationOptions.length > 0) {
                    // Filter to unique values (within tolerance, using standard units)
                    const uniqueOptions = [];
                    const tolerance = 1e-6;

                    for (const opt of computationOptions) {
                        const isDuplicate = uniqueOptions.some(
                            existing => Math.abs(existing.valueStandard - opt.valueStandard) < tolerance
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
                        value: activeOption.value, // Display value (in selected units)
                        edge: activeOption.edge,
                        alternatives: uniqueOptions
                    });

                    // Store standard value for further computation
                    values[nodeName] = activeOption.valueStandard;
                    changed = true;
                }
            }
        }

        // Add R as a computed value (display in selected units)
        const selectedRUnit = this.selectedUnits.get('R');
        const rDisplayValue = calculateR(selectedRUnit);
        this.computedValues.set('R', {
            value: rDisplayValue,
            edge: null,
            alternatives: []
        });
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
    },

    setTheme(themeName) {
        this.currentTheme = themeName;
        setTheme(themeName);
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

    // Setup re-render on zoom/pan
    renderer.onTransformChange = () => {
        renderer.render(AppState);
    };

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

    // Setup theme selector
    const themeSelector = document.getElementById('theme-selector');
    const themes = ['gray', 'green', 'cyan', 'orange', 'magenta'];

    themes.forEach(theme => {
        const themeBtn = document.createElement('div');
        themeBtn.className = 'theme-option';
        themeBtn.textContent = theme;
        themeBtn.dataset.theme = theme;

        if (theme === AppState.currentTheme) {
            themeBtn.classList.add('active');
        }

        // Preview theme on hover
        themeBtn.addEventListener('mouseenter', () => {
            setTheme(theme);
            renderer.render(AppState);
        });

        // Restore original theme on mouse leave (if not committed)
        themeBtn.addEventListener('mouseleave', () => {
            if (AppState.currentTheme !== theme) {
                setTheme(AppState.currentTheme);
                renderer.render(AppState);
            }
        });

        // Commit theme on click
        themeBtn.addEventListener('click', () => {
            // Update active state
            themeSelector.querySelectorAll('.theme-option').forEach(btn => {
                btn.classList.remove('active');
            });
            themeBtn.classList.add('active');

            // Set theme (commits the selection)
            AppState.setTheme(theme);
            renderer.render(AppState);
        });

        themeSelector.appendChild(themeBtn);
    });

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

    // Condition toggles are dynamically created above

    // Get all focusable elements in sidebar
    function getFocusableElements() {
        const sidebar = document.getElementById('sidebar');
        return Array.from(sidebar.querySelectorAll('input, button'))
            .filter(el => !el.disabled && el.offsetParent !== null);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        const isMeta = e.metaKey || e.ctrlKey;

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
    console.log('  Meta-C: Focus conditions');
    console.log('  Space: Toggle condition (when focused)');
    console.log('  Up/Down Arrows: Navigate sidebar elements');
});
