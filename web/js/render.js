// Canvas rendering logic

class GraphRenderer {
    constructor(canvas, inputsContainer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.inputsContainer = inputsContainer;
        this.nodePositions = new Map();
    }

    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    initializePositions(nodes) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(this.canvas.width, this.canvas.height) / 3;
        const angleStep = (2 * Math.PI) / nodes.length;

        nodes.forEach((node, i) => {
            const angle = i * angleStep - Math.PI / 2;
            this.nodePositions.set(node, {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            });
        });
    }

    render(state) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawEdges(state);
        this.drawNodes(state);
        this.updateInputBoxes(state);
    }

    drawEdges(state) {
        this.ctx.strokeStyle = '#1a1a1a';
        this.ctx.lineWidth = 2;

        for (const edge of state.graphData.edges) {
            const from = this.nodePositions.get(edge.from);
            const to = this.nodePositions.get(edge.to);

            if (from && to) {
                this.ctx.beginPath();
                this.ctx.moveTo(from.x, from.y);
                this.ctx.lineTo(to.x, to.y);
                this.ctx.stroke();
            }
        }
    }

    drawNodes(state) {
        state.graphData.nodes.forEach(node => {
            const pos = this.nodePositions.get(node);
            if (!pos) return;

            const isKnown = state.knownNodes.has(node);
            const isStart = state.startNode === node;
            const isEnd = state.endNode === node;
            const isAvailable = state.availableNodes.has(node);

            // Draw circle
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 25, 0, 2 * Math.PI);

            // Background fill (to hide edges)
            this.ctx.fillStyle = '#000';
            this.ctx.fill();

            // Outline
            if (isStart) {
                this.ctx.strokeStyle = '#00bfff'; // Cyan
                this.ctx.lineWidth = 3;
            } else if (isEnd) {
                this.ctx.strokeStyle = '#ff7f50'; // Coral
                this.ctx.lineWidth = 3;
            } else if (isKnown) {
                this.ctx.strokeStyle = '#0f0'; // Bright green
                this.ctx.lineWidth = 2;
            } else if (isAvailable) {
                this.ctx.strokeStyle = '#0a0'; // Medium green
                this.ctx.lineWidth = 2;
            } else {
                this.ctx.strokeStyle = '#333'; // Gray
                this.ctx.lineWidth = 2;
            }
            this.ctx.stroke();

            // Node label
            if (isStart) {
                this.ctx.fillStyle = '#00bfff';
            } else if (isEnd) {
                this.ctx.fillStyle = '#ff7f50';
            } else if (isKnown) {
                this.ctx.fillStyle = '#0f0';
            } else if (isAvailable) {
                this.ctx.fillStyle = '#0a0';
            } else {
                this.ctx.fillStyle = '#666';
            }

            this.ctx.font = '16px "Courier New", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(node, pos.x, pos.y);
        });
    }

    updateInputBoxes(state) {
        this.inputsContainer.innerHTML = '';

        state.knownNodes.forEach(node => {
            const pos = this.nodePositions.get(node);
            if (!pos) return;

            const isStart = state.startNode === node;
            const isEnd = state.endNode === node;

            const inputDiv = document.createElement('div');
            inputDiv.className = 'node-input';
            inputDiv.style.left = (pos.x + 35) + 'px';
            inputDiv.style.top = (pos.y - 22) + 'px';

            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = '0';
            input.value = state.nodeValues.get(node) || '';

            // Color-code based on start/end node
            if (isStart) {
                input.style.color = '#00bfff';
                input.style.borderColor = '#00bfff';
            } else if (isEnd) {
                input.style.color = '#ff7f50';
                input.style.borderColor = '#ff7f50';
            }

            input.addEventListener('input', (e) => {
                state.nodeValues.set(node, e.target.value);
            });

            inputDiv.appendChild(input);
            this.inputsContainer.appendChild(inputDiv);
        });
    }

    getNodeAtPosition(x, y) {
        for (const [node, pos] of this.nodePositions) {
            const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
            if (dist <= 25) {
                return node;
            }
        }
        return null;
    }
}
