import * as THREE from 'three';

class Scene {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.cube = null; // Reference to the cube
        this.floor = null; // Reference to the floor
        this.movement = { x: 0, y: 0 }; // Movement state
        this.isJumping = false; // Track if the cube is jumping
        this.jumpVelocity = 0; // Velocity for the jump
        this.gravity = -0.01; // Simulated gravity
    }

    init() {
        this.camera.position.z = 5;
        this.camera.position.y = 5; // Raise the camera to look down at the floor
        this.camera.lookAt(0, 0, 0); // Make the camera look at the center of the scene
        this.addObjects();
        this.addEventListeners();
        this.animate();
    }

    addObjects() {
        // Add the cube
        const cubeGeometry = new THREE.BoxGeometry();
        const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        this.cube.position.y = 0.5; // Raise the cube slightly above the floor
        this.scene.add(this.cube);

        // Add the floor
        const floorGeometry = new THREE.PlaneGeometry(10, 10);
        const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x808080, side: THREE.DoubleSide });
        this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.floor.rotation.x = -Math.PI / 2; // Rotate the floor to lie flat
        this.scene.add(this.floor);
    }

    addEventListeners() {
        window.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'ArrowUp':
                    this.movement.y = 0.1;
                    break;
                case 'ArrowDown':
                    this.movement.y = -0.1;
                    break;
                case 'ArrowLeft':
                    this.movement.x = -0.1;
                    break;
                case 'ArrowRight':
                    this.movement.x = 0.1;
                    break;
                case ' ': // Spacebar
                    if (!this.isJumping) {
                        this.isJumping = true;
                        this.jumpVelocity = 0.2; // Initial jump velocity
                    }
                    break;
            }
        });

        window.addEventListener('keyup', (event) => {
            switch (event.key) {
                case 'ArrowUp':
                case 'ArrowDown':
                    this.movement.y = 0;
                    break;
                case 'ArrowLeft':
                case 'ArrowRight':
                    this.movement.x = 0;
                    break;
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Update cube position based on movement
        if (this.cube) {
            this.cube.position.x += this.movement.x;
            this.cube.position.y += this.movement.y;

            // Handle jumping and gravity
            if (this.isJumping) {
                this.cube.position.z += this.jumpVelocity; // Move cube upward
                this.jumpVelocity += this.gravity; // Apply gravity

                // Stop jumping when the cube lands back on the floor
                if (this.cube.position.z <= 0.5) { // Floor level is 0.5 (cube's bottom)
                    this.cube.position.z = 0.5;
                    this.isJumping = false;
                    this.jumpVelocity = 0;
                }
            }

            // Prevent the cube from going below the floor
            if (this.cube.position.z < 0.5) {
                this.cube.position.z = 0.5;
                this.isJumping = false;
                this.jumpVelocity = 0;
            }
        }

        this.render();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
``
export default Scene;