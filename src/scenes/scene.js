import * as THREE from 'three';
import { getSmileyTexture } from './smileyTexture';

class Scene {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.cube = null;
        this.floor = null;
        this.movement = { x: 0, y: 0, z: 0 };
        this.isJumping = false;
        this.canDoubleJump = false; // Add this line
        this.jumpVelocity = 0;
        this.gravity = -0.01;

        // Add for jump movement
        this.jumpHorizontal = { x: 0, z: 0 };

        // Camera orbit controls state
        this.isDragging = false;
        this.prevMouse = { x: 0, y: 0 };
        this.orbit = { azimuth: 0, polar: Math.PI / 4, radius: 8 }; // Camera spherical coords
        this.targetAzimuth = this.orbit.azimuth; // Add this line

        // For smooth rotation
        this.targetRotationY = 0;
        this.rotationLerpSpeed = 0.15;
    }

    init() {
        this.addObjects();
        this.addEventListeners();
        this.animate();
    }

    addObjects() {
        // Add the cube
        const cubeGeometry = new THREE.BoxGeometry();
        // Create materials for each face
        const materials = [];

        // Get the smiley texture from the helper function
        const smileyTexture = getSmileyTexture();

        // Assign materials: [right, left, top, bottom, front, back]
        for (let i = 0; i < 6; i++) {
            if (i === 5) {
                // Back face (smiley)
                materials.push(new THREE.MeshBasicMaterial({ map: smileyTexture }));
            } else {
                // Other faces (green)
                materials.push(new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
            }
        }

        this.cube = new THREE.Mesh(cubeGeometry, materials);

        // Add a black border using EdgesGeometry and LineSegments
        const edges = new THREE.EdgesGeometry(cubeGeometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        const line = new THREE.LineSegments(edges, lineMaterial);
        this.cube.add(line);

        this.cube.position.y = 0.5;
        this.scene.add(this.cube);

        // Set initial target rotation to match cube's rotation
        this.targetRotationY = this.cube.rotation.y;

        // Add the floor
        const floorGeometry = new THREE.PlaneGeometry(10, 10);
        const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x808080, side: THREE.DoubleSide });
        this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.floor.rotation.x = -Math.PI / 2;
        this.scene.add(this.floor);

        // Set initial camera position using spherical coordinates
        this.updateCameraPosition();
    }

    addEventListeners() {
        window.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.movement.z = -0.1;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.movement.z = 0.1;
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.movement.y = 0.045; // Start rotating left (slower)
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.movement.y = -0.045; // Start rotating right (slower)
                    break;
                case ' ':
                    if (!this.isJumping) {
                        // First jump
                        this.isJumping = true;
                        this.canDoubleJump = true; // Allow double jump after first jump
                        this.jumpVelocity = 0.2;
                        const angle = this.cube.rotation.y;
                        this.jumpHorizontal.x = Math.sin(angle) * this.movement.z + Math.sin(angle - Math.PI / 2) * this.movement.x;
                        this.jumpHorizontal.z = Math.cos(angle) * this.movement.z + Math.cos(angle - Math.PI / 2) * this.movement.x;
                    } else if (this.canDoubleJump) {
                        // Double jump
                        this.jumpVelocity = 0.2;
                        const angle = this.cube.rotation.y;
                        this.jumpHorizontal.x = Math.sin(angle) * this.movement.z + Math.sin(angle - Math.PI / 2) * this.movement.x;
                        this.jumpHorizontal.z = Math.cos(angle) * this.movement.z + Math.cos(angle - Math.PI / 2) * this.movement.x;
                        this.canDoubleJump = false; // Only allow one double jump
                    }
                    break;
                case 'q':
                case 'Q':
                    this.movement.x = 0.1;
                    break;
                case 'e':
                case 'E':
                    this.movement.x = -0.1;
                    break;
            }
        });

        window.addEventListener('keyup', (event) => {
            switch (event.key) {
                case 'ArrowUp':
                case 'ArrowDown':
                case 'w':
                case 'W':
                case 's':
                case 'S':
                    this.movement.z = 0;
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.movement.y = 0; // Stop rotating
                    break;
                case 'q':
                case 'Q':
                case 'e':
                case 'E':
                    this.movement.x = 0;
                    break;
            }
        });

        // Mouse controls for camera orbit
        this.renderer.domElement.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.prevMouse.x = e.clientX;
            this.prevMouse.y = e.clientY;
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const deltaX = e.clientX - this.prevMouse.x;
            const deltaY = e.clientY - this.prevMouse.y;
            this.prevMouse.x = e.clientX;
            this.prevMouse.y = e.clientY;

            // Adjust azimuth and polar angles for camera only (do NOT update targetRotationY or targetAzimuth for cube)
            this.orbit.azimuth -= deltaX * 0.01;
            this.targetAzimuth = this.orbit.azimuth; // Keep targetAzimuth in sync with manual camera movement
            this.orbit.polar -= deltaY * 0.01;
            // Clamp polar angle to avoid flipping
            this.orbit.polar = Math.max(0.1, Math.min(Math.PI - 0.1, this.orbit.polar));
            this.updateCameraPosition();
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        // Add scroll wheel zoom for camera
        this.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            // Zoom in/out by changing the orbit radius
            const zoomSpeed = 0.5;
            this.orbit.radius += e.deltaY * 0.01 * zoomSpeed;
            this.orbit.radius = Math.max(2, Math.min(50, this.orbit.radius)); // Clamp zoom
            this.updateCameraPosition();
        }, { passive: false });
    }

    updateCameraPosition() {
        if (!this.cube) return;
        // Spherical to Cartesian conversion
        const { azimuth, polar, radius } = this.orbit;
        const x = this.cube.position.x + radius * Math.sin(polar) * Math.sin(azimuth);
        const y = this.cube.position.y + radius * Math.cos(polar);
        const z = this.cube.position.z + radius * Math.sin(polar) * Math.cos(azimuth);
        this.camera.position.set(x, y, z);
        this.camera.lookAt(this.cube.position);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.cube) {
            // Continuous rotation if movement.y is set
            if (this.movement.y !== 0) {
                this.targetRotationY += this.movement.y;
                this.targetAzimuth += this.movement.y;
            }

            // Smoothly interpolate rotation
            this.cube.rotation.y += (this.targetRotationY - this.cube.rotation.y) * this.rotationLerpSpeed;

            // Smoothly interpolate camera azimuth
            this.orbit.azimuth += (this.targetAzimuth - this.orbit.azimuth) * this.rotationLerpSpeed;

            // Move forward/backward based on cube's facing direction
            if (this.movement.z !== 0) {
                const angle = this.cube.rotation.y;
                this.cube.position.x += Math.sin(angle) * this.movement.z;
                this.cube.position.z += Math.cos(angle) * this.movement.z;
            }

            // Strafe left/right relative to cube's facing direction
            if (this.movement.x !== 0) {
                const angle = this.cube.rotation.y - Math.PI / 2;
                this.cube.position.x += Math.sin(angle) * this.movement.x;
                this.cube.position.z += Math.cos(angle) * this.movement.x;
            }

            // Handle jumping and gravity
            if (this.isJumping) {
                this.cube.position.y += this.jumpVelocity;
                this.cube.position.x += this.jumpHorizontal.x;
                this.cube.position.z += this.jumpHorizontal.z;
                this.jumpVelocity += this.gravity;
                if (this.cube.position.y <= 0.5) {
                    this.cube.position.y = 0.5;
                    this.isJumping = false;
                    this.canDoubleJump = false; // Reset double jump on landing
                    this.jumpVelocity = 0;
                    this.jumpHorizontal.x = 0;
                    this.jumpHorizontal.z = 0;
                }
            }
            if (this.cube.position.y < 0.5) {
                this.cube.position.y = 0.5;
                this.isJumping = false;
                this.canDoubleJump = false; // Reset double jump on landing
                this.jumpVelocity = 0;
                this.jumpHorizontal.x = 0;
                this.jumpHorizontal.z = 0;
            }

            // Always update camera to follow the cube
            this.updateCameraPosition();
        }

        this.render();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}

export default Scene;