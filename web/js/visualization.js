// 3D Visualization using Three.js

// Force-directed layout algorithm for positioning nodes in 3D space
class GraphLayout {
    constructor(graph) {
        this.graph = graph;
        this.positions = new Map(); // node -> {x, y, z}
        this.velocities = new Map(); // node -> {x, y, z}

        // Layout parameters
        this.repulsionStrength = 150;
        this.attractionStrength = 0.015;
        this.damping = 0.85;
        this.centeringForce = 0.002;
    }

    initialize() {
        // Random initial positions in a sphere
        for (const [nodeName] of this.graph.allNodes) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = 60;

            this.positions.set(nodeName, {
                x: r * Math.sin(phi) * Math.cos(theta),
                y: r * Math.sin(phi) * Math.sin(theta),
                z: r * Math.cos(phi)
            });

            this.velocities.set(nodeName, { x: 0, y: 0, z: 0 });
        }
    }

    step() {
        const forces = new Map();

        // Initialize forces
        for (const [nodeName] of this.graph.allNodes) {
            forces.set(nodeName, { x: 0, y: 0, z: 0 });
        }

        // Repulsion between all nodes
        const nodeNames = Array.from(this.graph.allNodes.keys());
        for (let i = 0; i < nodeNames.length; i++) {
            for (let j = i + 1; j < nodeNames.length; j++) {
                const n1 = nodeNames[i];
                const n2 = nodeNames[j];

                const p1 = this.positions.get(n1);
                const p2 = this.positions.get(n2);

                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dz = p1.z - p2.z;

                const distSq = dx * dx + dy * dy + dz * dz + 0.1;
                const dist = Math.sqrt(distSq);

                const force = this.repulsionStrength / distSq;

                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                const fz = (dz / dist) * force;

                const f1 = forces.get(n1);
                const f2 = forces.get(n2);

                f1.x += fx; f1.y += fy; f1.z += fz;
                f2.x -= fx; f2.y -= fy; f2.z -= fz;
            }
        }

        // Attraction along edges
        for (const edge of this.graph.allEdges) {
            const p1 = this.positions.get(edge.neighbor1);
            const p2 = this.positions.get(edge.neighbor2);

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dz = p2.z - p1.z;

            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz + 0.01);

            const force = this.attractionStrength * dist;

            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            const fz = (dz / dist) * force;

            const f1 = forces.get(edge.neighbor1);
            const f2 = forces.get(edge.neighbor2);

            f1.x += fx; f1.y += fy; f1.z += fz;
            f2.x -= fx; f2.y -= fy; f2.z -= fz;
        }

        // Centering force
        for (const [nodeName, pos] of this.positions) {
            const f = forces.get(nodeName);
            f.x -= pos.x * this.centeringForce;
            f.y -= pos.y * this.centeringForce;
            f.z -= pos.z * this.centeringForce;
        }

        // Update positions
        for (const [nodeName, pos] of this.positions) {
            const vel = this.velocities.get(nodeName);
            const force = forces.get(nodeName);

            vel.x = (vel.x + force.x) * this.damping;
            vel.y = (vel.y + force.y) * this.damping;
            vel.z = (vel.z + force.z) * this.damping;

            pos.x += vel.x;
            pos.y += vel.y;
            pos.z += vel.z;
        }
    }

    stabilize(iterations = 150) {
        for (let i = 0; i < iterations; i++) {
            this.step();
        }
    }
}

// Three.js visualizer for the graph
class GraphVisualizer {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // Graph elements
        this.nodeObjects = new Map(); // nodeName -> THREE.Mesh
        this.edgeObjects = new Map(); // edge -> THREE.Line
        this.labelSprites = new Map(); // nodeName -> THREE.Sprite

        // State
        this.knownNodes = new Set();
        this.availableNodes = new Set();
        this.highlightedPaths = [];

        this.init();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.z = 120;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        // Controls (OrbitControls)
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);

        // Raycaster for picking
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Event listeners
        this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));
        window.addEventListener('resize', () => this.onResize());

        // Start render loop
        this.animate();
    }

    createNode(nodeName, position) {
        const geometry = new THREE.SphereGeometry(3, 24, 24);
        const material = new THREE.MeshPhongMaterial({
            color: 0x666666, // Default gray
            emissive: 0x000000,
            shininess: 30
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.userData = { nodeName };

        this.scene.add(mesh);
        this.nodeObjects.set(nodeName, mesh);

        // Create label sprite
        this.createLabel(nodeName, position);
    }

    createLabel(nodeName, position) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 64;

        context.fillStyle = 'rgba(0, 0, 0, 0)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.font = 'Bold 32px Arial';
        context.fillStyle = '#ffffff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(nodeName, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);

        sprite.position.set(position.x, position.y + 6, position.z);
        sprite.scale.set(10, 5, 1);

        this.scene.add(sprite);
        this.labelSprites.set(nodeName, sprite);
    }

    createEdge(edge, pos1, pos2) {
        const points = [
            new THREE.Vector3(pos1.x, pos1.y, pos1.z),
            new THREE.Vector3(pos2.x, pos2.y, pos2.z)
        ];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x333333,
            opacity: 0.3,
            transparent: true
        });

        const line = new THREE.Line(geometry, material);
        line.userData = { edge };
        this.scene.add(line);
        this.edgeObjects.set(edge, line);
    }

    updateColors() {
        for (const [nodeName, mesh] of this.nodeObjects) {
            if (this.knownNodes.has(nodeName)) {
                // Brightest green for manually selected
                mesh.material.color.setHex(0x00ff00);
                mesh.material.emissive.setHex(0x00aa00);
            } else if (this.availableNodes.has(nodeName)) {
                // Medium green for discoverable
                mesh.material.color.setHex(0x00aa00);
                mesh.material.emissive.setHex(0x005500);
            } else {
                // Gray for unreachable
                mesh.material.color.setHex(0x666666);
                mesh.material.emissive.setHex(0x000000);
            }
        }
    }

    highlightPaths(paths) {
        // Collect all edges in all paths
        const pathEdges = new Set();

        for (const path of paths) {
            for (let i = 0; i < path.length - 1; i++) {
                const key = [path[i], path[i + 1]].sort().join('-');
                pathEdges.add(key);
            }
        }

        // Update edge colors
        for (const [edge, line] of this.edgeObjects) {
            const key = [edge.neighbor1, edge.neighbor2].sort().join('-');

            if (pathEdges.has(key)) {
                line.material.color.setHex(0x00ff00); // Bright green
                line.material.opacity = 1.0;
                line.material.linewidth = 3;
            } else {
                line.material.color.setHex(0x333333); // Gray
                line.material.opacity = 0.3;
                line.material.linewidth = 1;
            }
        }
    }

    clearPathHighlights() {
        for (const [edge, line] of this.edgeObjects) {
            line.material.color.setHex(0x333333);
            line.material.opacity = 0.3;
            line.material.linewidth = 1;
        }
    }

    onClick(event) {
        // Calculate mouse position in normalized device coordinates
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Raycast
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(
            Array.from(this.nodeObjects.values())
        );

        if (intersects.length > 0) {
            const nodeName = intersects[0].object.userData.nodeName;
            this.onNodeClick(nodeName);
        }
    }

    onNodeClick(nodeName) {
        // Toggle node selection
        if (this.knownNodes.has(nodeName)) {
            this.knownNodes.delete(nodeName);
        } else {
            this.knownNodes.add(nodeName);
        }

        // Trigger state update (handled by main.js)
        window.dispatchEvent(new CustomEvent('nodeToggled', {
            detail: { nodeName, isKnown: this.knownNodes.has(nodeName) }
        }));
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    updateNodePositions(layout) {
        for (const [nodeName, mesh] of this.nodeObjects) {
            const pos = layout.positions.get(nodeName);
            mesh.position.set(pos.x, pos.y, pos.z);

            // Update label position
            const label = this.labelSprites.get(nodeName);
            if (label) {
                label.position.set(pos.x, pos.y + 6, pos.z);
            }
        }

        // Update edge positions
        for (const [edge, line] of this.edgeObjects) {
            const pos1 = layout.positions.get(edge.neighbor1);
            const pos2 = layout.positions.get(edge.neighbor2);

            const positions = line.geometry.attributes.position.array;
            positions[0] = pos1.x; positions[1] = pos1.y; positions[2] = pos1.z;
            positions[3] = pos2.x; positions[4] = pos2.y; positions[5] = pos2.z;
            line.geometry.attributes.position.needsUpdate = true;
        }
    }
}
