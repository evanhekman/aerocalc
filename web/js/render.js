// Canvas rendering logic

class GraphRenderer {
  constructor(canvas, inputsContainer) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.inputsContainer = inputsContainer;
    this.nodePositions = new Map();
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set actual canvas size (scaled for high DPI)
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    // Set display size (CSS pixels)
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';

    // Scale context to match DPI
    this.ctx.scale(dpr, dpr);
  }

  initializePositions(nodes) {
    // Use CSS pixel dimensions (not physical pixels)
    const width = this.canvas.offsetWidth;
    const height = this.canvas.offsetHeight;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2.5;
    const angleStep = (2 * Math.PI) / nodes.length;

    nodes.forEach((node, i) => {
      const angle = i * angleStep - Math.PI / 2;
      this.nodePositions.set(node, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    });
  }

  render(state) {
    // Clear using CSS pixel dimensions
    this.ctx.clearRect(0, 0, this.canvas.offsetWidth, this.canvas.offsetHeight);
    this.drawEdges(state);
    this.drawNodes(state);
    this.updateInputBoxes(state);
  }

  drawEdges(state) {
    // Collect edges that are actively used for computation
    const activeEdges = new Set();

    for (const [node, computation] of state.computedValues) {
      if (computation.edge) {  // Skip null edges (e.g., R)
        activeEdges.add(computation.edge);
      }
    }

    // Collect edges that are part of solution paths
    const pathEdgeKeys = new Set();
    if (state.paths && state.paths.length > 0) {
      for (const path of state.paths) {
        for (let i = 0; i < path.length - 1; i++) {
          const key1 = `${path[i]}-${path[i + 1]}`;
          const key2 = `${path[i + 1]}-${path[i]}`;
          pathEdgeKeys.add(key1);
          pathEdgeKeys.add(key2);
        }
      }
    }

    // Draw all edges
    for (const edge of state.graphData.edges) {
      const from = this.nodePositions.get(edge.from);
      const to = this.nodePositions.get(edge.to);

      if (from && to) {
        // Find the actual edge object
        const edgeObj = state.graph.allEdges.find(
          e => (e.neighbor1 === edge.from && e.neighbor2 === edge.to) ||
               (e.neighbor1 === edge.to && e.neighbor2 === edge.from)
        );

        const edgeKey1 = `${edge.from}-${edge.to}`;
        const edgeKey2 = `${edge.to}-${edge.from}`;
        const isPathEdge = pathEdgeKeys.has(edgeKey1) || pathEdgeKeys.has(edgeKey2);
        const isActive = activeEdges.has(edgeObj);

        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);

        if (isPathEdge) {
          // Solution path (start->end): bright green
          this.ctx.strokeStyle = "#0f0";
          this.ctx.lineWidth = 4;
          this.ctx.setLineDash([]);
        } else if (isActive) {
          // Computation edge (known->discovered): very light green
          this.ctx.strokeStyle = "rgba(0, 255, 0, 0.2)";
          this.ctx.lineWidth = 3;
          this.ctx.setLineDash([]);
        } else {
          // Unused edge: gray
          this.ctx.strokeStyle = "#1a1a1a";
          this.ctx.lineWidth = 2;
          this.ctx.setLineDash([]);
        }

        this.ctx.stroke();
        this.ctx.setLineDash([]); // Reset
      }
    }
  }

  drawNodes(state) {
    state.graphData.nodes.forEach((node) => {
      const pos = this.nodePositions.get(node);
      if (!pos) return;

      const isKnown = state.knownValues.has(node);
      const isComputed = state.computedValues.has(node);
      const isStart = state.startNode === node;
      const isEnd = state.endNode === node;

      // Draw circle
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, 25, 0, 2 * Math.PI);

      // Background fill (to hide edges)
      this.ctx.fillStyle = "#000";
      this.ctx.fill();

      // Faint inner fill for known nodes
      if (isKnown) {
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 25, 0, 2 * Math.PI);
        if (isStart) {
          this.ctx.fillStyle = "rgba(0, 191, 255, 0.15)"; // Faint cyan
        } else if (isEnd) {
          this.ctx.fillStyle = "rgba(255, 127, 80, 0.15)"; // Faint coral
        } else {
          this.ctx.fillStyle = "rgba(0, 255, 0, 0.15)";
        }
        this.ctx.fill();
      }

      // Outline
      if (isStart) {
        this.ctx.strokeStyle = "#00bfff"; // Cyan
        this.ctx.lineWidth = 3;
      } else if (isEnd) {
        this.ctx.strokeStyle = "#ff7f50"; // Coral
        this.ctx.lineWidth = 3;
      } else if (isKnown) {
        this.ctx.strokeStyle = "#0f0"; // Bright green
        this.ctx.lineWidth = 2;
      } else if (isComputed) {
        this.ctx.strokeStyle = "#0a0"; // Medium green
        this.ctx.lineWidth = 2;
      } else {
        this.ctx.strokeStyle = "#333"; // Gray
        this.ctx.lineWidth = 2;
      }
      this.ctx.stroke();

      // Node label
      if (isStart) {
        this.ctx.fillStyle = "#00bfff";
      } else if (isEnd) {
        this.ctx.fillStyle = "#ff7f50";
      } else if (isKnown) {
        this.ctx.fillStyle = "#0f0";
      } else if (isComputed) {
        this.ctx.fillStyle = "#0a0";
      } else {
        this.ctx.fillStyle = "#666";
      }

      this.ctx.font = '16px "Courier New", "Courier", monospace';
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";

      // Enable font smoothing for crisp text
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';

      this.ctx.fillText(node, pos.x, pos.y);
    });
  }

  updateInputBoxes(state) {
    // Save current focus state
    const focusedElement = document.activeElement;
    const focusedNode = focusedElement && focusedElement.classList.contains('node-value-input')
      ? focusedElement.dataset.node
      : null;
    const cursorPosition = focusedElement ? focusedElement.selectionStart : null;

    this.inputsContainer.innerHTML = "";

    state.graphData.nodes.forEach((node) => {
      const pos = this.nodePositions.get(node);
      if (!pos) return;

      const isKnown = state.knownValues.has(node);
      const computation = state.computedValues.get(node);
      const isStart = state.startNode === node;
      const isEnd = state.endNode === node;

      const inputDiv = document.createElement("div");
      inputDiv.className = "node-input";
      inputDiv.style.left = pos.x + 35 + "px";
      inputDiv.style.top = pos.y - 22 + "px";
      inputDiv.style.flexDirection = "column";
      inputDiv.style.width = "150px";

      // Create segmented bar (only for computed nodes with alternatives)
      if (computation && computation.alternatives.length > 1) {
        const bar = document.createElement("div");
        bar.className = "segment-bar";
        bar.style.position = "absolute";
        bar.style.left = "-8px";
        bar.style.top = "0";
        bar.style.width = "4px";
        bar.style.height = "100%";
        bar.style.display = "flex";
        bar.style.flexDirection = "column";
        bar.style.gap = "1px";

        for (let i = 0; i < computation.alternatives.length; i++) {
          const segment = document.createElement("div");
          segment.style.flex = "1";
          segment.style.cursor = "pointer";

          const isActive = computation.alternatives[i].edge === computation.edge;
          if (isActive) {
            segment.style.backgroundColor = "#0a0";
          } else {
            segment.style.backgroundColor = "#000";
            segment.style.border = "1px solid #333";
          }

          segment.addEventListener("click", () => {
            state.setActiveEdge(node, computation.alternatives[i].edge);
            this.render(state);
          });

          bar.appendChild(segment);
        }

        inputDiv.appendChild(bar);
      }

      // Create input
      const input = document.createElement("input");
      input.type = "text";
      input.className = "node-value-input";
      input.dataset.node = node;

      // Set value and colors
      if (node === 'R') {
        // R is special: always show value, green styling, read-only
        input.value = computation ? computation.value.toFixed(4) : "";
        input.placeholder = "";
        input.style.color = "#0f0";
        input.style.borderColor = "#0f0";
        input.readOnly = true;
        input.style.cursor = "default";
      } else if (isKnown) {
        input.value = state.knownValues.get(node);
        input.placeholder = "";
        if (isStart) {
          input.style.color = "#00bfff";
          input.style.borderColor = "#00bfff";
        } else if (isEnd) {
          input.style.color = "#ff7f50";
          input.style.borderColor = "#ff7f50";
        } else {
          input.style.color = "#0f0";
          input.style.borderColor = "#0f0";
        }
      } else if (computation) {
        input.value = computation.value.toFixed(2);
        input.placeholder = "";
        input.style.color = "#666";
        if (isStart) {
          input.style.borderColor = "#00bfff";
        } else if (isEnd) {
          input.style.borderColor = "#ff7f50";
        } else {
          input.style.borderColor = "#0a0";
        }
      } else {
        input.value = "";
        input.placeholder = "-";
        input.style.color = "#666";
        input.style.borderColor = "#333";
      }

      // Make computed values editable (converts to known), except R
      if (node !== 'R') {
        input.addEventListener("input", (e) => {
          state.setKnownValue(node, e.target.value);
          this.render(state);
        });
      }

      inputDiv.appendChild(input);

      // Create horizontal unit selector segments (if units are defined for this node)
      if (state.graphData.units && state.graphData.units[node]) {
        const unitBar = document.createElement("div");
        unitBar.className = "unit-segment-bar";

        const unitOptions = state.graphData.units[node];
        const currentUnit = state.selectedUnits.get(node);

        unitOptions.forEach((unit) => {
          const segment = document.createElement("div");
          segment.className = "unit-segment";
          segment.textContent = unit;

          const isActive = unit === currentUnit;
          if (isActive) {
            segment.classList.add("active");
            // Color based on start/end node
            if (isStart) {
              segment.style.backgroundColor = "#00bfff";
              segment.style.borderColor = "#00bfff";
            } else if (isEnd) {
              segment.style.backgroundColor = "#ff7f50";
              segment.style.borderColor = "#ff7f50";
            }
          }

          segment.addEventListener("click", () => {
            state.setSelectedUnit(node, unit);
            this.render(state);
          });

          unitBar.appendChild(segment);
        });

        inputDiv.appendChild(unitBar);
      }

      this.inputsContainer.appendChild(inputDiv);
    });

    // Restore focus if needed
    if (focusedNode) {
      const inputToFocus = this.inputsContainer.querySelector(`input[data-node="${focusedNode}"]`);
      if (inputToFocus) {
        inputToFocus.focus();
        if (cursorPosition !== null) {
          inputToFocus.setSelectionRange(cursorPosition, cursorPosition);
        }
      }
    }
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
