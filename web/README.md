# AeroCalc Web Visualizer

A fully client-side 3D web application for visualizing and interacting with graph-based equation solving systems.

## Features

- **3D Graph Visualization**: Interactive 3D visualization using Three.js with force-directed layout
- **Node Selection**: Click nodes to mark them as "known" and see what becomes discoverable
- **Path Finding**: Find all minimal paths between two nodes
- **Conditional Logic**: Toggle conditions to enable/disable specific edges
- **Real-time Updates**: All operations complete in <0.1 seconds
- **Multiple Examples**: Pre-loaded with chemistry, fictional, and edge-case graphs

## Usage

### Running Locally

Simply open `index.html` in a modern web browser (Chrome, Firefox, Safari, or Edge).

No build step or server required - it's fully client-side!

### Deploying

Host the `/web` directory on any static file host:
- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any web server (Apache, Nginx, etc.)

## How to Use

### Loading Examples

Use the dropdown at the top to select different example graphs:
- **Chemistry**: PV=nRT and U=(f/2)nRT equations
- **Contrived**: Demonstrates conditional edges
- **Fictional**: Simple pathfinding example
- **Edge Case**: Multiple minimal paths example

### Selecting Nodes

Click on any node in the 3D view to toggle its "known" status:
- **Bright green**: Manually selected nodes
- **Medium green**: Nodes that can be discovered from selected nodes
- **Gray**: Unreachable nodes

### Finding Paths

1. Enter a start node and end node in the sidebar
2. Click "Solve" to find all minimal paths
3. Paths will be highlighted in bright green
4. All paths are listed in the sidebar with timing information

### Toggling Conditions

For graphs with conditions (like the "Contrived" example):
- Check/uncheck condition toggles in the sidebar
- Graph automatically recalculates available nodes
- Some edges only activate when their conditions are met

### Camera Controls

- **Rotate**: Left-click and drag
- **Pan**: Right-click and drag
- **Zoom**: Scroll wheel

## Technical Details

### Performance

- Handles up to 100 nodes, 500 edges, 100 conditions
- Node selection + recalculation: <0.1s
- Path solving: ~0.1s
- Rendering: 60fps

### Architecture

- **graph.js**: Core graph logic (ported from Python)
- **examples.js**: Example graph definitions
- **visualization.js**: Three.js rendering and force-directed layout
- **ui.js**: Sidebar controls and event handling
- **main.js**: Application state and orchestration
- **styles.css**: Dark theme styling

### Dependencies

- Three.js v0.150.0 (loaded from CDN)
- OrbitControls (loaded from CDN)

### Graph Logic

The application uses the same algorithms as the Python reference implementation:

- **Edge Validation**: Checks if an edge can be traversed based on required nodes and active conditions
- **Available Calculation**: Iteratively expands the set of reachable nodes until a fixed point
- **Path Solving**: BFS-based algorithm to find all minimal paths between two nodes

## Adding Custom Graphs

To add your own graph, edit `js/examples.js`:

```javascript
EXAMPLES.myGraph = {
    name: "My Custom Graph",
    description: "Description here",
    nodes: ["A", "B", "C"],
    edges: [
        { n1: "A", n2: "B", reqAll: [], reqOne: [] },
        { n1: "B", n2: "C", reqAll: ["A"], reqOne: [] }
    ],
    conditions: [],
    defaultKnown: ["A"]
};
```

Then add it to the dropdown in `index.html`:

```html
<option value="myGraph">My Custom Graph</option>
```

## Testing

To verify the JavaScript implementation matches the Python reference:

1. Run Python examples: `python examples/chem.py`
2. Load the same graph in the web app
3. Compare path-finding results

Example expected outputs:
- **Chemistry (P to U)**: `[['P', 'R', 'U']]`
- **Fictional (A to F)**: `[['A', 'D', 'F']]`
- **Edge Case (A to G)**: 3 minimal paths

## Browser Compatibility

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires:
- WebGL support
- ES6+ JavaScript

## License

Same as the parent aerocalc project.
