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
        this.movement = { x: 0, y: 0 };
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
                    this.movement.y = 0;
                    break;
                case 'ArrowLeft':
                case 'ArrowRight':
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
            this.cube.position.y += this.movement.y;

            // Handle jumping and gravity
            if (this.isJumping) {
                this.cube.position.z += this.jumpVelocity;
                this.jumpVelocity += this.gravity;
                if (this.cube.position.z <= 0.5) {
                    this.cube.position.z = 0.5;
                    this.isJumping = false;
                    this.jumpVelocity = 0;
                }
            }
            if (this.cube.position.z < 0.5) {
                this.cube.position.z = 0.5;
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