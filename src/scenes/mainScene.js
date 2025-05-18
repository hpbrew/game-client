class MainScene {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.light = new THREE.DirectionalLight(0xffffff, 1);
        this.light.position.set(5, 5, 5).normalize();
        this.scene.add(this.light);
    }

    createObjects() {
        // Method to create objects in the scene
    }

    setupLighting() {
        // Method to set up additional lighting if needed
    }

    update() {
        // Method to update the scene on each frame
    }

    getScene() {
        return this.scene;
    }

    getCamera() {
        return this.camera;
    }
}

export default MainScene;