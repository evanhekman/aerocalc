// UI Controller for sidebar controls

class UIController {
    constructor(appState) {
        this.appState = appState;

        // DOM elements
        this.exampleSelector = document.getElementById('example-selector');
        this.startNodeInput = document.getElementById('start-node');
        this.endNodeInput = document.getElementById('end-node');
        this.solveButton = document.getElementById('solve-button');
        this.conditionsContainer = document.getElementById('conditions-list');
        this.pathsContainer = document.getElementById('paths-display');
        this.selectedNodesList = document.getElementById('selected-nodes-list');

        this.init();
    }

    init() {
        // Event listeners
        this.exampleSelector.addEventListener('change', () => this.onExampleChange());
        this.solveButton.addEventListener('click', () => this.onSolve());

        // Listen for node toggles from visualizer
        window.addEventListener('nodeToggled', (e) => this.onNodeToggled(e.detail));

        // Initial render
        this.renderConditions();
        this.updateSelectedNodesList();
    }

    onExampleChange() {
        const exampleKey = this.exampleSelector.value;
        window.dispatchEvent(new CustomEvent('loadExample', {
            detail: { exampleKey }
        }));
    }

    renderConditions() {
        this.conditionsContainer.innerHTML = '';

        const allConditions = this.appState.allConditions || [];

        if (allConditions.length === 0) {
            this.conditionsContainer.innerHTML = '<p class="hint">No conditions for this graph</p>';
            return;
        }

        for (const condition of allConditions) {
            const div = document.createElement('div');
            div.className = 'condition-item';

            const toggle = document.createElement('input');
            toggle.type = 'checkbox';
            toggle.id = `condition-${condition}`;
            toggle.checked = this.appState.activeConditions.has(condition);
            toggle.addEventListener('change', () => this.onConditionToggle(condition));

            const label = document.createElement('label');
            label.htmlFor = `condition-${condition}`;
            label.textContent = condition;

            div.appendChild(toggle);
            div.appendChild(label);
            this.conditionsContainer.appendChild(div);
        }
    }

    onConditionToggle(condition) {
        if (this.appState.activeConditions.has(condition)) {
            this.appState.activeConditions.delete(condition);
        } else {
            this.appState.activeConditions.add(condition);
        }

        // Update graph conditions
        this.appState.graph.conditions = this.appState.activeConditions;

        // Clear edge caches
        for (const edge of this.appState.graph.allEdges) {
            edge.validGraphs.clear();
        }

        // Recalculate available nodes
        this.appState.updateAvailableNodes();

        // Clear any active paths
        this.appState.clearPaths();
        this.displayPaths([]);
    }

    onNodeToggled(detail) {
        this.appState.toggleNode(detail.nodeName);
        this.updateSelectedNodesList();
    }

    updateSelectedNodesList() {
        if (!this.selectedNodesList) return;

        if (this.appState.knownNodes.size === 0) {
            this.selectedNodesList.innerHTML = '<p class="hint">No nodes selected</p>';
            return;
        }

        const nodeNames = Array.from(this.appState.knownNodes).sort();
        this.selectedNodesList.innerHTML = `
            <p><strong>Selected nodes:</strong> ${nodeNames.join(', ')}</p>
        `;
    }

    onSolve() {
        const startNode = this.startNodeInput.value.trim();
        const endNode = this.endNodeInput.value.trim();

        if (!startNode || !endNode) {
            alert('Please enter both start and end nodes');
            return;
        }

        if (!this.appState.graph.allNodes.has(startNode)) {
            alert(`Node "${startNode}" not found in graph`);
            return;
        }

        if (!this.appState.graph.allNodes.has(endNode)) {
            alert(`Node "${endNode}" not found in graph`);
            return;
        }

        try {
            const startTime = performance.now();
            const paths = this.appState.solve(startNode, endNode);
            const endTime = performance.now();
            const duration = (endTime - startTime).toFixed(2);

            this.displayPaths(paths, duration);
        } catch (error) {
            alert(`Error: ${error.message}`);
            console.error(error);
        }
    }

    displayPaths(paths, duration = null) {
        this.pathsContainer.innerHTML = '';

        if (paths.length === 0) {
            this.pathsContainer.innerHTML = '<p class="hint">No paths found</p>';
            return;
        }

        const heading = document.createElement('h3');
        heading.textContent = `Found ${paths.length} minimal path(s)`;
        if (duration !== null) {
            heading.textContent += ` (${duration}ms)`;
        }
        this.pathsContainer.appendChild(heading);

        for (let i = 0; i < paths.length; i++) {
            const pathDiv = document.createElement('div');
            pathDiv.className = 'path-item';
            pathDiv.textContent = `${i + 1}. ${paths[i].join(' → ')}`;
            this.pathsContainer.appendChild(pathDiv);
        }
    }

    updateForNewGraph() {
        this.renderConditions();
        this.updateSelectedNodesList();
        this.displayPaths([]);
        this.startNodeInput.value = '';
        this.endNodeInput.value = '';
    }
}
