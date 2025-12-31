// Canvas rendering logic

// Color scheme - declared once for easy modification
// Ordered from darkest to lightest (darker = less obvious on black background)
const COLORS = {
  background: "#000",
  default: "#444",           // Empty nodes, non-calculation edges
  weakOutline: "#888",       // Known nodes outline, discovery arrows
  weakFill: "#444",          // Discovered nodes fill (half as bright)
  strongOutline: "#ddd",     // Discovered nodes outline
  strongFill: "#ddd"         // Reserved for future use (same as strongOutline)
};

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
    this.canvas.style.width = rect.width + "px";
    this.canvas.style.height = rect.height + "px";

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
    // Build a map of which nodes are computed and by which edge
    const computedNodeEdges = new Map();
    for (const [node, computation] of state.computedValues) {
      if (computation.edge) {
        // Skip null edges (e.g., R)
        computedNodeEdges.set(node, computation.edge);
      }
    }

    // Draw all edges as gray lines first
    for (const edge of state.graphData.edges) {
      const from = this.nodePositions.get(edge.from);
      const to = this.nodePositions.get(edge.to);

      if (from && to) {
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.strokeStyle = COLORS.default;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
    }

    // Draw arrows for active computation edges
    for (const [computedNode, edge] of computedNodeEdges) {
      const targetPos = this.nodePositions.get(computedNode);
      if (!targetPos) continue;

      // Get all nodes that contribute to this computation
      const sourceNodes = new Set();

      // Add all required nodes
      for (const req of edge.reqAllNodes) {
        sourceNodes.add(req);
      }

      // Add the other neighbor of the edge (from reqOneNode)
      const otherNeighbor =
        edge.neighbor1 === computedNode ? edge.neighbor2 : edge.neighbor1;
      if (edge.reqOneNode.has(otherNeighbor)) {
        sourceNodes.add(otherNeighbor);
      }

      // Draw arrows from each source node to the computed node
      for (const sourceNode of sourceNodes) {
        const sourcePos = this.nodePositions.get(sourceNode);
        if (!sourcePos) continue;

        this.drawArrow(sourcePos, targetPos, COLORS.weakOutline, 2);
      }
    }
  }

  drawArrow(from, to, color, lineWidth) {
    // Calculate angle
    const angle = Math.atan2(to.y - from.y, to.x - from.x);

    // Calculate start and end points (offset from node centers)
    const nodeRadius = 25;
    const arrowLength = 8;
    const arrowWidth = 4;
    const lineHalfWidth = lineWidth / 2;

    const startX = from.x + nodeRadius * Math.cos(angle);
    const startY = from.y + nodeRadius * Math.sin(angle);
    const endX = to.x - nodeRadius * Math.cos(angle);
    const endY = to.y - nodeRadius * Math.sin(angle);

    // Calculate the base of the arrowhead
    const baseX = endX - arrowLength * Math.cos(angle);
    const baseY = endY - arrowLength * Math.sin(angle);

    // Draw entire arrow as a single filled polygon
    this.ctx.beginPath();

    // Start at top edge of line
    this.ctx.moveTo(
      startX + lineHalfWidth * Math.cos(angle + Math.PI / 2),
      startY + lineHalfWidth * Math.sin(angle + Math.PI / 2)
    );

    // Line to top edge at arrowhead base
    this.ctx.lineTo(
      baseX + lineHalfWidth * Math.cos(angle + Math.PI / 2),
      baseY + lineHalfWidth * Math.sin(angle + Math.PI / 2)
    );

    // Line to top corner of arrowhead
    this.ctx.lineTo(
      baseX + arrowWidth * Math.cos(angle + Math.PI / 2),
      baseY + arrowWidth * Math.sin(angle + Math.PI / 2)
    );

    // Line to arrow tip
    this.ctx.lineTo(endX, endY);

    // Line to bottom corner of arrowhead
    this.ctx.lineTo(
      baseX - arrowWidth * Math.cos(angle + Math.PI / 2),
      baseY - arrowWidth * Math.sin(angle + Math.PI / 2)
    );

    // Line to bottom edge at arrowhead base
    this.ctx.lineTo(
      baseX - lineHalfWidth * Math.cos(angle + Math.PI / 2),
      baseY - lineHalfWidth * Math.sin(angle + Math.PI / 2)
    );

    // Line to bottom edge of line at start
    this.ctx.lineTo(
      startX - lineHalfWidth * Math.cos(angle + Math.PI / 2),
      startY - lineHalfWidth * Math.sin(angle + Math.PI / 2)
    );

    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  drawNodes(state) {
    state.graphData.nodes.forEach((node) => {
      const pos = this.nodePositions.get(node);
      if (!pos) return;

      const isKnown = state.knownValues.has(node);
      const isComputed = state.computedValues.has(node);

      // Draw circle
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, 25, 0, 2 * Math.PI);

      // Background fill (to hide edges)
      this.ctx.fillStyle = COLORS.background;
      this.ctx.fill();

      // Fill for computed (discovered) nodes only (excluding R)
      if (isComputed && !isKnown && node !== "R") {
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 25, 0, 2 * Math.PI);
        this.ctx.fillStyle = COLORS.weakFill;
        this.ctx.fill();
      }

      // Outline
      if (isKnown || node === "R") {
        this.ctx.strokeStyle = COLORS.weakOutline;
        this.ctx.lineWidth = 2;
      } else if (isComputed) {
        this.ctx.strokeStyle = COLORS.strongOutline;
        this.ctx.lineWidth = 2;
      } else {
        this.ctx.strokeStyle = COLORS.default;
        this.ctx.lineWidth = 2;
      }
      this.ctx.stroke();

      // Node label
      if (isKnown || node === "R") {
        this.ctx.fillStyle = COLORS.weakOutline;
      } else if (isComputed) {
        this.ctx.fillStyle = COLORS.strongOutline;
      } else {
        this.ctx.fillStyle = COLORS.default;
      }

      this.ctx.font = '16px "Courier New", "Courier", monospace';
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";

      // Enable font smoothing for crisp text
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = "high";

      this.ctx.fillText(node, pos.x, pos.y);
    });
  }

  updateInputBoxes(state) {
    // Save current focus state
    const focusedElement = document.activeElement;
    const focusedNode =
      focusedElement && focusedElement.classList.contains("node-value-input")
        ? focusedElement.dataset.node
        : null;
    const cursorPosition = focusedElement
      ? focusedElement.selectionStart
      : null;

    this.inputsContainer.innerHTML = "";

    state.graphData.nodes.forEach((node) => {
      const pos = this.nodePositions.get(node);
      if (!pos) return;

      const isKnown = state.knownValues.has(node);
      const computation = state.computedValues.get(node);

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

          const isActive =
            computation.alternatives[i].edge === computation.edge;
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
      if (node === "R") {
        // R is special: always show value, known styling with fill to show read-only
        input.value = computation ? computation.value.toFixed(4) : "";
        input.placeholder = "";
        input.style.color = COLORS.weakOutline;
        input.style.borderColor = COLORS.weakOutline;
        input.style.backgroundColor = COLORS.weakFill;
        input.readOnly = true;
        input.style.cursor = "default";
      } else if (isKnown) {
        input.value = state.knownValues.get(node);
        input.placeholder = "";
        input.style.color = COLORS.weakOutline;
        input.style.borderColor = COLORS.weakOutline;
      } else if (computation) {
        input.value = computation.value.toFixed(2);
        input.placeholder = "";
        input.style.color = COLORS.strongOutline;
        input.style.borderColor = COLORS.strongOutline;
      } else {
        input.value = "";
        input.placeholder = "-";
        input.style.color = COLORS.default;
        input.style.borderColor = COLORS.default;
      }

      // Make computed values editable (converts to known), except R
      if (node !== "R") {
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

        // Determine color based on node state (match input box outline)
        let activeColor, activeBorderColor;
        if (isKnown || node === "R") {
          activeColor = COLORS.weakOutline;
          activeBorderColor = COLORS.weakOutline;
        } else if (computation) {
          activeColor = COLORS.strongOutline;
          activeBorderColor = COLORS.strongOutline;
        } else {
          activeColor = COLORS.default;
          activeBorderColor = COLORS.default;
        }

        unitOptions.forEach((unit) => {
          const segment = document.createElement("div");
          segment.className = "unit-segment";
          segment.textContent = unit;

          const isActive = unit === currentUnit;
          if (isActive) {
            segment.classList.add("active");
            segment.style.borderColor = activeBorderColor;
            segment.style.color = activeColor;
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
      const inputToFocus = this.inputsContainer.querySelector(
        `input[data-node="${focusedNode}"]`,
      );
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
