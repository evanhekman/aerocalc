// Canvas rendering logic

// Theme definitions - multiple color schemes
// Colors maintain consistent saturation across brightness levels
const THEMES = {
  gray: {
    default: "#333",
    weakOutline: "#666",
    strongOutline: "#888",
    weakFill: "#333"
  },
  green: {
    default: "#0d330d",
    weakOutline: "#2a8a2a",
    strongOutline: "#47cc47",
    weakFill: "#0d330d"
  },
  cyan: {
    default: "#0d3333",
    weakOutline: "#2a8a8a",
    strongOutline: "#47cccc",
    weakFill: "#0d3333"
  },
  orange: {
    default: "#3d2610",
    weakOutline: "#8a5a1f",
    strongOutline: "#d98a33",
    weakFill: "#3d2610"
  },
  magenta: {
    default: "#330d33",
    weakOutline: "#8a2a8a",
    strongOutline: "#cc47cc",
    weakFill: "#330d33"
  }
};

// Active color scheme - can be swapped at runtime
let COLORS = {
  background: "#000",
  ...THEMES.gray
};

// Function to switch themes
function setTheme(themeName) {
  if (THEMES[themeName]) {
    Object.assign(COLORS, THEMES[themeName]);

    // Update CSS variables
    document.documentElement.style.setProperty('--color-default', THEMES[themeName].default);
    document.documentElement.style.setProperty('--color-weak-outline', THEMES[themeName].weakOutline);
    document.documentElement.style.setProperty('--color-strong-outline', THEMES[themeName].strongOutline);
    document.documentElement.style.setProperty('--color-weak-fill', THEMES[themeName].weakFill);
  }
}

class GraphRenderer {
  constructor(canvas, inputsContainer) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.inputsContainer = inputsContainer;
    this.nodePositions = new Map();

    // Zoom/pan state
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragStartPanX = 0;
    this.dragStartPanY = 0;

    // Setup mouse event handlers
    this.setupEventHandlers();
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

    // Scale context to match DPI (transformations will be reapplied in render)
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
    // Save the context state
    this.ctx.save();

    // Clear using CSS pixel dimensions (before transform)
    this.ctx.clearRect(0, 0, this.canvas.offsetWidth, this.canvas.offsetHeight);

    // Apply zoom and pan transformation
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.zoom, this.zoom);

    // Draw graph elements
    this.drawEdges(state);
    this.drawNodes(state);

    // Restore context state
    this.ctx.restore();

    // Update input boxes (uses screen coordinates, not graph coordinates)
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

      // Node label - always use strong outline for visibility
      this.ctx.fillStyle = COLORS.strongOutline;

      this.ctx.font = 'bold 16px "Courier New", "Courier", monospace';
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
    const cursorStart = focusedElement
      ? focusedElement.selectionStart
      : null;
    const cursorEnd = focusedElement
      ? focusedElement.selectionEnd
      : null;

    this.inputsContainer.innerHTML = "";

    state.graphData.nodes.forEach((node) => {
      const pos = this.nodePositions.get(node);
      if (!pos) return;

      const isKnown = state.knownValues.has(node);
      const computation = state.computedValues.get(node);

      // Convert graph coordinates to screen coordinates
      const screenX = pos.x * this.zoom + this.panX;
      const screenY = pos.y * this.zoom + this.panY;

      const inputDiv = document.createElement("div");
      inputDiv.className = "node-input";
      inputDiv.style.left = screenX + 35 * this.zoom + "px";
      inputDiv.style.top = screenY - 22 * this.zoom + "px";
      inputDiv.style.flexDirection = "column";
      inputDiv.style.width = "150px";
      inputDiv.style.transform = `scale(${this.zoom})`;
      inputDiv.style.transformOrigin = "left top";

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
        input.style.color = COLORS.strongOutline;
        input.style.borderColor = COLORS.weakOutline;
        input.style.backgroundColor = COLORS.weakFill;
        input.readOnly = true;
        input.style.cursor = "default";
      } else if (isKnown) {
        input.value = state.knownValues.get(node);
        input.placeholder = "";
        input.style.color = COLORS.strongOutline;
        input.style.borderColor = COLORS.weakOutline;
      } else if (computation) {
        input.value = computation.value.toFixed(2);
        input.placeholder = "";
        input.style.color = COLORS.strongOutline;
        input.style.borderColor = COLORS.strongOutline;
      } else {
        input.value = "";
        input.placeholder = "-";
        input.style.color = COLORS.strongOutline;
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
        // Only restore cursor/selection if we have valid saved positions
        if (cursorStart !== null && cursorEnd !== null) {
          inputToFocus.setSelectionRange(cursorStart, cursorEnd);
        }
      }
    }
  }

  getNodeAtPosition(x, y) {
    // Convert screen coordinates to graph coordinates
    const graphX = (x - this.panX) / this.zoom;
    const graphY = (y - this.panY) / this.zoom;

    for (const [node, pos] of this.nodePositions) {
      const dist = Math.sqrt((graphX - pos.x) ** 2 + (graphY - pos.y) ** 2);
      if (dist <= 25) {
        return node;
      }
    }
    return null;
  }

  setupEventHandlers() {
    // Mouse wheel zoom
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();

      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Zoom towards mouse position
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(10, this.zoom * zoomFactor));

      // Adjust pan to zoom towards mouse
      const graphX = (mouseX - this.panX) / this.zoom;
      const graphY = (mouseY - this.panY) / this.zoom;

      this.zoom = newZoom;
      this.panX = mouseX - graphX * this.zoom;
      this.panY = mouseY - graphY * this.zoom;

      // Trigger re-render
      if (this.onTransformChange) {
        this.onTransformChange();
      }
    }, { passive: false });

    // Pan with mouse drag
    this.canvas.addEventListener('mousedown', (e) => {
      // Only start dragging on left click
      if (e.button !== 0) return;

      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Check if clicking on a node - if so, don't start pan
      if (this.getNodeAtPosition(mouseX, mouseY)) {
        return;
      }

      this.isDragging = true;
      this.dragStartX = mouseX;
      this.dragStartY = mouseY;
      this.dragStartPanX = this.panX;
      this.dragStartPanY = this.panY;

      this.canvas.style.cursor = 'grabbing';
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      this.panX = this.dragStartPanX + (mouseX - this.dragStartX);
      this.panY = this.dragStartPanY + (mouseY - this.dragStartY);

      // Trigger re-render
      if (this.onTransformChange) {
        this.onTransformChange();
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.canvas.style.cursor = 'default';
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.canvas.style.cursor = 'default';
      }
    });
  }
}
