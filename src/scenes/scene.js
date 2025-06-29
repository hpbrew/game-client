import * as THREE from 'three';

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
        this.jumpVelocity = 0;
        this.gravity = -0.01;

        // Camera orbit controls state
        this.isDragging = false;
        this.prevMouse = { x: 0, y: 0 };
        this.orbit = { azimuth: 0, polar: Math.PI / 4, radius: 8 }; // Camera spherical coords
    }

    init() {
        this.addObjects();
        this.addEventListeners();
        this.animate();
    }

    addObjects() {
        // Add the cube
        const cubeGeometry = new THREE.BoxGeometry();
        const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        this.cube.position.y = 0.5;
        this.scene.add(this.cube);

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
                    this.movement.z = -0.1; // Move forward on z axis
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.movement.z = 0.1; // Move backward on z axis
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.movement.x = -0.1;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.movement.x = 0.1;
                    break;
                case ' ':
                    if (!this.isJumping) {
                        this.isJumping = true;
                        this.jumpVelocity = 0.2;
                    }
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
                case 'ArrowRight':
                case 'a':
                case 'A':
                case 'd':
                case 'D':
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

            // Adjust azimuth and polar angles
            this.orbit.azimuth -= deltaX * 0.01;
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

        // Update cube position based on movement
        if (this.cube) {
            this.cube.position.x += this.movement.x;
            this.cube.position.z += this.movement.z; // Move on z axis

            // Handle jumping and gravity (on y axis)
            if (this.isJumping) {
                this.cube.position.y += this.jumpVelocity;
                this.jumpVelocity += this.gravity;
                if (this.cube.position.y <= 0.5) {
                    this.cube.position.y = 0.5;
                    this.isJumping = false;
                    this.jumpVelocity = 0;
                }
            }
            if (this.cube.position.y < 0.5) {
                this.cube.position.y = 0.5;
                this.isJumping = false;
                this.jumpVelocity = 0;
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