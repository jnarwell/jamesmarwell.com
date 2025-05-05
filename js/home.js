import * as THREE from "https://cdn.skypack.dev/three@0.132.2"
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader"

import { getProjectList, randomPlacementType } from "/js/projects.js"

let glbLoader = null;

async function createRenderer(objects, groups, globalPreferredOrder) {
    const returned = { state: { mouse: { }, cursor: { }, selection: { } }, }

    // for handling the display of particular groups of objects
    let currentGroup = null

    // create root element containing threeJS viewer
    returned.elem = document.createElement("div")
    new ResizeObserver(onResize).observe(returned.elem) 
    async function onResize() {
        if (!returned.three) return

        const w = returned.elem.clientWidth
        const h = returned.elem.clientHeight

        returned.three.camera.aspect = w / h
        returned.three.camera.updateProjectionMatrix()
        returned.three.renderer.setSize(w, h)

        if (currentGroup == null) {
            await putInViewObjectsRandom()
        } else {
            await putInViewObjectsLine()
        }
    }
    
    // initialize mouse
    returned.state.mouse = {
        bActive: false,
        bClicked: false,
        bReleased: false,
        bHeld: false,
        bMoved: false,
        bMovedSinceClicked: false,
        canvasCoordinates: {x: 0, y: 0},
        mouseDelta: {x: 0, y: 0},
        screenSpaceCoordinates: {x: -2, y: -2}
    }

    document.addEventListener("mousemove", (e) => {
        const newX = e.clientX - returned.elem.getBoundingClientRect().x
        const newY = e.clientY - returned.elem.getBoundingClientRect().y

        returned.state.mouse.mouseDelta.x += newX - returned.state.mouse.canvasCoordinates.x
        returned.state.mouse.mouseDelta.y += newY - returned.state.mouse.canvasCoordinates.y

        returned.state.mouse.canvasCoordinates.x = newX
        returned.state.mouse.canvasCoordinates.y = newY

        returned.state.mouse.screenSpaceCoordinates.x = returned.state.mouse.canvasCoordinates.x / returned.elem.getBoundingClientRect().width * 2. - 1.
        returned.state.mouse.screenSpaceCoordinates.y = returned.state.mouse.canvasCoordinates.y / returned.elem.getBoundingClientRect().height * -2. + 1.

        returned.state.mouse.bMoved = true
        returned.state.mouse.bMovedSinceClicked = true
    })

    returned.elem.addEventListener("mousedown", (e) => {
        returned.state.mouse.bClicked = true
        returned.state.mouse.bHeld = true
        returned.state.mouse.bMovedSinceClicked = false

        document.addEventListener("mouseup", (e) => {
            returned.state.mouse.bHeld = false
            returned.state.mouse.bReleased = true
        })
    })

    returned.elem.addEventListener("mouseenter", (e) => {
        returned.state.mouse.bActive = true
    })

    returned.elem.addEventListener("mouseleave", (e) => {
        returned.state.mouse.bActive = false
    })


    function resetMouseState() {
        returned.state.mouse.mouseDelta = {x: 0, y: 0}
        returned.state.mouse.bReleased = false
        returned.state.mouse.bClicked = false
        returned.state.mouse.bMoved = false
    }

    // initialize cursor functions
    returned.state.cursor = {
        hover: null
    }

    function updateCursor() {
        if (returned.state.mouse.bActive && returned.state.mouse.bMoved && !returned.state.mouse.bHeld) {
            const mousePointer = new THREE.Vector2(
                returned.state.mouse.screenSpaceCoordinates.x,
                returned.state.mouse.screenSpaceCoordinates.y
            )

            returned.three.raycaster.setFromCamera( mousePointer, returned.three.camera )
            const raycastResult = returned.three.raycaster.intersectObjects( returned.three.scene.children )

            if (raycastResult.length > 0) {
                const nearestHit = raycastResult[0]
                const nearestThreeObject = nearestHit.object
                const nearestObjectId = parseInt(nearestThreeObject.name)
                returned.state.cursor.hover = {
                    nearestHit, nearestThreeObject, nearestObjectId
                }
            } else {
                returned.state.cursor.hover = null
            }
        }
    }

    // initialize the logo

    document.querySelector("#logo").onclick = () => {
        const a = document.createElement("a");
        a.href = "/?skipBio=true";  // Add skipBio parameter to prevent bio from showing
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    // initiate threeJS
    returned.three = { }
    returned.three.scene = new THREE.Scene()
    returned.three.camera = new THREE.PerspectiveCamera(60, 1, .01, 1000.)
    returned.three.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true})
    returned.three.renderer.setClearColor(0xffffff, 0)
    returned.three.raycaster = new THREE.Raycaster()

    // TEMPORARY
    returned.three.camera.position.z = 5.

    // Enhanced lighting setup
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    returned.three.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(5, 5, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    returned.three.scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight2.position.set(-5, 5, -5);
    returned.three.scene.add(dirLight2);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    returned.three.scene.add(ambientLight);

    // Initialize environment map support
    const pmremGenerator = new THREE.PMREMGenerator(returned.three.renderer);
    pmremGenerator.compileEquirectangularShader();

    // Make sure renderer is set up for proper lighting
    returned.three.renderer.outputEncoding = THREE.sRGBEncoding;
    returned.three.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    returned.three.renderer.toneMappingExposure = 1.2;
    returned.three.renderer.physicallyCorrectLights = true;
    returned.three.renderer.shadowMap.enabled = true;
    returned.three.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // add threeJS element to root element
    returned.elem.appendChild( returned.three.renderer.domElement )    

    // the functionality for arranging the objects on the screen
    let objectsInView = []

    function shuffleObjectsInView() {
        for (var x = 0; x < 100; x++) {
            var i = Math.floor(Math.random() * objectsInView.length)
            var j = Math.floor(Math.random() * objectsInView.length)

            var t = objectsInView[i]
            objectsInView[i] = objectsInView[j]
            objectsInView[j] = t
        }
    }

    async function selectGroup(id) {
        currentGroup = id
        objectsInView = []


        let potentiallyAdded = []
        for (var x = 0; x < objects.length; x++) {
            if (objects[x].group === id) {
                potentiallyAdded.push(objects[x].project.id)
            }
        }

        let preferredOrder = null
        for (var x = 0; x < groups.length; x++) {
            if (groups[x].id === id) preferredOrder = groups[x].preferredOrder
        }

        let objectsToAdd = []

        if (preferredOrder != null) {
            for (var x = 0; x < preferredOrder.length; x++) {
                if (arrContains(potentiallyAdded, preferredOrder[x])) {
                    objectsToAdd.push(preferredOrder[x])
                }
            }
        }

        let remainingObjects = []
        for (var x = 0; x < potentiallyAdded.length; x++) {
            if (!arrContains(objectsToAdd, potentiallyAdded[x])) {
                remainingObjects.push(potentiallyAdded[x])
            }
        }

        // shuffle the array
        for (var x = 0; x < remainingObjects.length; x++) {
            let i0 = Math.floor(Math.random() * remainingObjects.length)
            let i1 = Math.floor(Math.random() * remainingObjects.length)

            let t = remainingObjects[i0]
            remainingObjects[i0] = remainingObjects[i1]
            remainingObjects[i1] = t
        }

        function arrContains(arr, id) {
            for (var x = 0; x < arr.length; x++) {
                if (arr[x] === id) return true
            }
            return false
        }

        for (var y = 0; y < remainingObjects.length; y++) {
            objectsToAdd.push(remainingObjects[y])
        }

        for (var x = 0; x < objectsToAdd.length; x++) {
            let id = objectsToAdd[x]

            let idx = null

            for (var y = 0; y < objects.length; y++) {
                if (objects[y].project.id === id) {
                    idx = y
                    break
                }
            }

            if (idx == null) {
                console.error("uh oh")
            }

            objectsInView.push(idx)
        }

        await putInViewObjectsLine()
    }

    let loaded = []

    for (var x = 0; x < objects.length; x++) {
        loaded[x] = false
    }

    async function ensureLoadObject(id) {
        if (loaded[id]) return;
        loaded[id] = true;
        
        try {
            const loadedScene = await glbLoader.loadAsync(objects[id].modelURL);
            const loadedMesh = loadedScene.scenes[0].children[0];
            objects[id].threeMesh = loadedMesh;

            loadedMesh.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    if (node.material) {
                        node.material.envMapIntensity = 1.0;
                        node.material.needsUpdate = true;
                    }
                }
            });

            if ("scale" in objects[id].project) {
                loadedMesh.scale.x = objects[id].project.scale.x;
                loadedMesh.scale.y = objects[id].project.scale.y;
                loadedMesh.scale.z = objects[id].project.scale.z;
                objects[id].targetScale = {...loadedMesh.scale};
            } else {
                objects[id].targetScale = {x: 1, y: 1, z: 1};
            }

            loadedMesh.position.z = 10

            objects[id].threeMesh.name = "" + id;
            returned.three.scene.add(objects[id].threeMesh);
        } catch (error) {
            console.error(`Failed to load model ${objects[id].modelURL}:`, error);
        }
    }

    window.THREE = returned.three

    function isLoaded(id) {
        return objects[id].threeMesh != null
    }

    async function deSelectGroup() {
        await putInViewObjectsRandom()
    }

    async function putInViewObjectsRandom() {

        objectsInView = []
        let potentiallyAdded = []
        for (var x = 0; x < objects.length; x++) {
            potentiallyAdded.push(objects[x].project.id)
        }

        let preferredOrder = globalPreferredOrder

        let objectsToAdd = []

        if (preferredOrder != null) {
            for (var x = 0; x < preferredOrder.length; x++) {
                if (arrContains(potentiallyAdded, preferredOrder[x])) {
                    objectsToAdd.push(preferredOrder[x])
                }
            }
        }

        let remainingObjects = []
        for (var x = 0; x < potentiallyAdded.length; x++) {
            if (!arrContains(objectsToAdd, potentiallyAdded[x])) {
                remainingObjects.push(potentiallyAdded[x])
            }
        }

        // shuffle the array
        for (var x = 0; x < remainingObjects.length; x++) {
            let i0 = Math.floor(Math.random() * remainingObjects.length)
            let i1 = Math.floor(Math.random() * remainingObjects.length)

            let t = remainingObjects[i0]
            remainingObjects[i0] = remainingObjects[i1]
            remainingObjects[i1] = t
        }

        function arrContains(arr, id) {
            for (var x = 0; x < arr.length; x++) {
                if (arr[x] === id) return true
            }
            return false
        }

        for (var y = 0; y < remainingObjects.length; y++) {
            objectsToAdd.push(remainingObjects[y])
        }

        for (var x = 0; x < objectsToAdd.length; x++) {
            let id = objectsToAdd[x]

            let idx = null

            for (var y = 0; y < objects.length; y++) {
                if (objects[y].project.id === id) {
                    idx = y
                    break
                }
            }

            if (idx == null) {
                console.error("uh oh")
            }

            objectsInView.push(idx)
        }

        switch (randomPlacementType()) {
            case "grid":
                await putInViewObjectsRandom_Grid()
                break
            case "random":
                await putInViewObjectsRandom_Random()
                break
            case "random_spaced":
                await putInViewObjectsRandom_Random_Spaced()
                break
        }
    }

    

    // new code
    /* async function putInViewObjectsRandom_Random_Spaced() {
        const MAX_Y_DIST = 2
        const MAX_X_DIST = .9 * MAX_Y_DIST * returned.elem.clientWidth / returned.elem.clientHeight
    
        // First ensure all objects are loaded
        for (let i = 0; i < objectsInView.length; i++) {
            await ensureLoadObject(objectsInView[i]);
        }
    
        let failureCount = 0
        let addedCount = 0
        while (failureCount < 100 && addedCount < objectsInView.length) {
            let posX = 0
            let posY = 0
            let maxMinDist = 0

            for (var x = 0; x < 10; x++) {
                let randomX = (Math.random() - .5) * 2. * MAX_X_DIST
                let randomY = (Math.random() - .5) * 2. * MAX_Y_DIST
                let minDist = 1e30
                for (var y = 0; y < addedCount; y++) {
                    if (!isLoaded(objectsInView[y])) continue;
                    let checkingPosition = objects[objectsInView[y]].threeMesh.position
                    let dist = Math.sqrt((checkingPosition.x - randomX) * (checkingPosition.x - randomX) + (checkingPosition.y - randomY) * (checkingPosition.y - randomY))
                    if (isNaN(dist) || !isFinite(dist)) {
                        continue;
                    }
                    minDist = Math.min(dist, minDist)
                }
                if (minDist < 1.7) continue
                if (minDist > maxMinDist) {
                    posX = randomX
                    posY = randomY  
                    maxMinDist = minDist
                }
            }
    
            if (maxMinDist == 0) {
                failureCount++
                continue
            }
    
            let idx = addedCount++
            
            if (!isLoaded(objectsInView[idx])) {
                continue
            }
    
            objects[objectsInView[idx]].threeMesh.position.x = posX 
            objects[objectsInView[idx]].threeMesh.position.y = posY
            objects[objectsInView[idx]].threeMesh.position.z = 0
        }
    
        hideAllNotInView(addedCount)
    
        return
    } */
        async function putInViewObjectsRandom_Random_Spaced() {
            const MAX_Y_DIST = 2;
            const MAX_X_DIST = .9 * MAX_Y_DIST * returned.elem.clientWidth / returned.elem.clientHeight;
        
            // Calculate positions for all models
            const positionsToUse = [];
            let failureCount = 0;
            let addedCount = 0;
            
            for (let i = 0; i < objectsInView.length; i++) {
                let posX = 0;
                let posY = 0;
                let maxMinDist = 0;
        
                for (let attempts = 0; attempts < 10; attempts++) {
                    let randomX = (Math.random() - .5) * 2 * MAX_X_DIST;
                    let randomY = (Math.random() - .5) * 2 * MAX_Y_DIST;
                    let minDist = 1e30;
                    
                    for (let j = 0; j < positionsToUse.length; j++) {
                        let checkingPosition = positionsToUse[j];
                        let dist = Math.sqrt(
                            (checkingPosition.x - randomX) * (checkingPosition.x - randomX) + 
                            (checkingPosition.y - randomY) * (checkingPosition.y - randomY)
                        );
                        
                        if (isNaN(dist) || !isFinite(dist)) continue;
                        minDist = Math.min(dist, minDist);
                    }
                    
                    if (minDist < 1.7) continue;
                    
                    if (minDist > maxMinDist) {
                        posX = randomX;
                        posY = randomY;
                        maxMinDist = minDist;
                    }
                }
        
                if (maxMinDist == 0) {
                    failureCount++;
                    if (failureCount > 100) break;
                    continue;
                }
        
                positionsToUse.push({ 
                    index: objectsInView[addedCount++],
                    x: posX,
                    y: posY
                });
            }
        
            // Load models in batches to improve performance
            const BATCH_SIZE = 3; // Load 3 models at a time
            
            for (let i = 0; i < positionsToUse.length; i += BATCH_SIZE) {
                const batch = positionsToUse.slice(i, i + BATCH_SIZE);
                
                // Load batch in parallel
                await Promise.all(batch.map(async (pos) => {
                    await ensureLoadObject(pos.index);
                    
                    if (objects[pos.index].threeMesh) {
                        objects[pos.index].threeMesh.position.x = pos.x;
                        objects[pos.index].threeMesh.position.y = pos.y;
                        objects[pos.index].threeMesh.position.z = 0;
                    }
                }));
            }
        
            // Hide models not in view
            hideAllNotInView(addedCount);
        }

    function hideAllNotInView(addedCount) {
        for (var x = 0; x < objects.length; x++) {
            if (!(((id) => {
                for (var j = 0; j < addedCount; j++) {
                    if (objectsInView[j] === id) return true
                }
                return false
            }))(x)) {
                if (isLoaded(x)) {
                    objects[x].threeMesh.position.z = 10
                }
            }
        }
    }
    
    async function putInViewObjectsRandom_Random() {
        const MAX_Y_DIST = 2
        const MAX_X_DIST = .9 * MAX_Y_DIST * returned.elem.clientWidth / returned.elem.clientHeight

        let failureCount = 0
        let addedCount = 0
        while (failureCount < 1000 && addedCount < objectsInView.length) {
            let randomX = (Math.random() - .5) * 2. * MAX_X_DIST
            let randomY = (Math.random() - .5) * 2. * MAX_Y_DIST

            let bCollides = false

            for (var x = 0; x < addedCount; x++) {
                let checkingPosition = objects[objectsInView[x]].threeMesh.position

                if (Math.abs(checkingPosition.x - randomX) < 1.5 && Math.abs(checkingPosition.y - randomY) < 1.5) {
                    bCollides = true 
                    break
                }
            }

            if (bCollides) {
                failureCount++
                continue
            }

            let idx = addedCount++

            await ensureLoadObject(objectsInView[idx])
            objects[objectsInView[idx]].threeMesh.position.x = randomX 
            objects[objectsInView[idx]].threeMesh.position.y = randomY
            objects[objectsInView[idx]].threeMesh.position.z = 0
        }

        hideAllNotInView(addedCount)

        /*for (var x = 0; x < objects.length; x++) {
            if (!(((id) => {
                for (var j = 0; j < addedCount; j++) {
                    if (objectsInView[j] === id) return true
                }
                return false
            }))(x)) {
                if (isLoaded(x)) objects[x].threeMesh.position.z = 0
            }
        }*/

        return
    }

    async function putInViewObjectsRandom_Grid() {

        const MAX_Y_DIST = 2
        const MAX_X_DIST = .65 * MAX_Y_DIST * returned.elem.clientWidth / returned.elem.clientHeight
        const NUM_COL = Math.min(
            Math.floor(MAX_X_DIST),
            Math.ceil((objectsInView.length - 3) / 6)
        )

        function randOff() {
            return (Math.random() - .5) * .3
        }

        function randomRotation(mesh) {
            mesh.rotation.x = (Math.random() - .5) * Math.PI
            mesh.rotation.y = Math.random() * 2. * Math.PI
        }

        function randomScaling(index) {
            let r = Math.random() * .2 + .8
            objects[index].threeMesh.scale.x = objects[index].targetScale.x * r
            objects[index].threeMesh.scale.y = objects[index].targetScale.y * r
            objects[index].threeMesh.scale.z = objects[index].targetScale.z * r
        }

        let count = 0

        for (var x = NUM_COL; x >= -NUM_COL; x--) {
            for (var y = 1; y >= -1; y--) {
                if (count < objectsInView.length) {
                    let idx = count++
                    await ensureLoadObject(objectsInView[idx])
                    objects[objectsInView[idx]].threeMesh.position.x = x * -2 + randOff()
                    objects[objectsInView[idx]].threeMesh.position.y = y * 1.75 + randOff()
                    objects[objectsInView[idx]].threeMesh.position.z = 0 + randOff()
                    randomRotation(objects[objectsInView[idx]].threeMesh)
                    randomScaling(objectsInView[idx])
                }
            }
        }

        // first, we should be able to fill the middle
        /*for (var y = -1; y <= 1; y++) {
            let idx = count++
            if (idx < objectsInView.length) {
                await ensureLoadObject(objectsInView[idx])
                objects[objectsInView[idx]].threeMesh.position.x = 0 + randOff()
                objects[objectsInView[idx]].threeMesh.position.y = y * 1.75 + randOff()
                objects[objectsInView[idx]].threeMesh.position.z = 0 + randOff()
                randomRotation(objects[objectsInView[idx]].threeMesh)
                randomScaling(objectsInView[idx])
            }
        }

        for (var x = 1; x <= NUM_COL; x++) {
            // do left
            for (var y = -1; y <= 1; y++) {
                let idx = count++
                if (idx < objectsInView.length) {
                    await ensureLoadObject(objectsInView[idx])
                    objects[objectsInView[idx]].threeMesh.position.x = x * -2 + randOff()
                    objects[objectsInView[idx]].threeMesh.position.y = y * 1.75 + randOff()
                    objects[objectsInView[idx]].threeMesh.position.z = 0 + randOff()
                    randomRotation(objects[objectsInView[idx]].threeMesh)
                    randomScaling(objectsInView[idx])
                }
            }
            // do right
            for (var y = -1; y <= 1; y++) {
                let idx = count++
                if (idx < objectsInView.length) {
                    await ensureLoadObject(objectsInView[idx])
                    objects[objectsInView[idx]].threeMesh.position.x = x * 2 + randOff()
                    objects[objectsInView[idx]].threeMesh.position.y = y * 1.75 + randOff()
                    objects[objectsInView[idx]].threeMesh.position.z = 0 + randOff()
                    randomRotation(objects[objectsInView[idx]].threeMesh)
                    randomScaling(objectsInView[idx])
                }
            }
        }*/

        hideAllNotInView(count)

        /*
        for (var x = 0; x < objects.length; x++) {
            if (!(((id) => {
                for (var j = 0; j < count; j++) {
                    if (objectsInView[j] === id) return true
                }
                return false
            }))(x)) {
                if (isLoaded(x)) objects[x].threeMesh.position.z = 0
            }
        }*/
    }

    async function putInViewObjectsLine() {
        const MAX_Y_DIST = 2
        const MAX_X_DIST = .65 * MAX_Y_DIST * returned.elem.clientWidth / returned.elem.clientHeight
        const NUM_COL = Math.floor(MAX_X_DIST)
        const NUM_TOTAL = Math.min(2 * NUM_COL + 1, objectsInView.length)

        const OFFSET = -NUM_TOTAL + 1

        let count = 0

        for (var x = 0; x < NUM_TOTAL; x++) {
            let idx = count++
            await ensureLoadObject(objectsInView[idx])
            objects[objectsInView[idx]].threeMesh.position.x = x * 2 + OFFSET
            objects[objectsInView[idx]].threeMesh.position.y = 0
            objects[objectsInView[idx]].threeMesh.position.z = 0
            objects[objectsInView[idx]].threeMesh.rotation.x = 0
            objects[objectsInView[idx]].threeMesh.rotation.y = 0
            objects[objectsInView[idx]].threeMesh.rotation.z = 0
            objects[objectsInView[idx]].threeMesh.scale.x = objects[objectsInView[idx]].targetScale.x
            objects[objectsInView[idx]].threeMesh.scale.y = objects[objectsInView[idx]].targetScale.y
            objects[objectsInView[idx]].threeMesh.scale.z = objects[objectsInView[idx]].targetScale.z
        }

        for (var x = 0; x < objects.length; x++) {
            if (!(((id) => {
                for (var j = 0; j < count; j++) {
                    if (objectsInView[j] === id) return true
                }
                return false
            }))(x)) {
                if (isLoaded(x)) objects[x].threeMesh.position.z = 10
            }
        }
    }

    
    returned.frame = (elapsedTime) => {
        updateCursor()

        if (returned.state.mouse.bClicked) {
            if (returned.state.cursor.hover) {
                returned.state.selection = { ...returned.state.cursor.hover }
            } else {
                returned.state.selection = null
            }
        }

        if (returned.state.selection) {
            if (returned.state.mouse.bHeld) {
                const currentObject = objects[returned.state.selection.nearestObjectId].threeMesh

                currentObject.rotation.x += returned.state.mouse.mouseDelta.y * elapsedTime * .75
                currentObject.rotation.y += returned.state.mouse.mouseDelta.x * elapsedTime * .75

                currentObject.rotation.x = Math.min(Math.max(currentObject.rotation.x, -.9 * Math.PI / 2.), .9 * Math.PI / 2.)
            }
        }

        if (returned.state.mouse.bReleased) {
            if (!returned.state.mouse.bMovedSinceClicked) {
                if (returned.state.selection) {
                    const currentObject = objects[returned.state.selection.nearestObjectId];
        
                    if (currentObject.url) {
                        const a = document.createElement("a");
                        a.href = currentObject.url;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                    }
                }
            }
        }

        if (returned.state.cursor.hover) {
            document.querySelector("#three-label").innerText = objects[returned.state.cursor.hover.nearestObjectId].name
            document.querySelector("#three-label").style.opacity = 1
        } else {
            document.querySelector("#three-label").style.opacity = 0
        }

        resetMouseState()

        returned.three.renderer.render(returned.three.scene, returned.three.camera)
    }

    returned.selectGroup = selectGroup
    returned.deSelectGroup = deSelectGroup

    return returned
}

function initTopBar(projects, selectCallBack) {
    const topBar = document.querySelector("#top-bar")
    const projectsHolder = document.querySelector("#projects-holder")

    const projectElems = []
    for (var x = 0; x < projects.length; x++) {
        const elem = document.createElement("div")
        elem.classList.add("project")
        elem.textContent = projects[x].name
        projectElems.push(elem)

        const id = projects[x].id

        elem.selected = false

        elem.onclick = () => {
            elem.selected = !elem.selected

            if (elem.selected) {
            } else {
            }

            selectCallBack(id)
        }

    }

    const dropDownSelector = document.createElement("div")
    dropDownSelector.classList.add("project")
    dropDownSelector.textContent = "..."

    const dropDownContainer = document.createElement("div")
    dropDownContainer.classList.add("dropdown")
    document.body.appendChild(dropDownContainer)

    { // bind the dropdown events
        let bShown = false
        let mousePosition = {x: -1, y: -1}

        document.body.addEventListener("mousemove", (e) => {
            mousePosition.x = e.clientX
            mousePosition.y = e.clientY
        })

        function update() {
            dropDownContainer.style.left = `${dropDownSelector.getBoundingClientRect().left}px`
            dropDownContainer.style.top  = `${document.querySelector("#top-bar").getBoundingClientRect().bottom}`

            let selectorBounds = dropDownSelector.getBoundingClientRect()
            let dropDownBounds = dropDownContainer.getBoundingClientRect()

            if (
                selectorBounds.left <= mousePosition.x && mousePosition.x <= selectorBounds.right &&
                selectorBounds.top  <= mousePosition.y && mousePosition.y <= selectorBounds.bottom
            ) {
                bShown = true
            } else if (
                bShown &&
                dropDownBounds.left <= mousePosition.x && mousePosition.x <= dropDownBounds.right && 
                selectorBounds.top  <= mousePosition.y && mousePosition.y <= dropDownBounds.bottom
            ) {
                bShown = true
            } else {
                bShown = false
            }

            if (bShown) {
                dropDownContainer.style.opacity = "1"
                dropDownContainer.style.display = ""
            } else {
                dropDownContainer.style.opacity = "0"
                dropDownContainer.style.display = "none"
            }
            
            window.requestAnimationFrame(update)
        }

        update()
    }

    new ResizeObserver(() => {
        const size = topBar.getBoundingClientRect().width 

        // formula for size to projects: total size - name - resume - contact - some slack
        const sizeToProjects = size - 240 - 240 - 50

        const numProjects = Math.floor(sizeToProjects / 160)

        // projectsHolder.style.width = `${numProjects * 120}px`

        for (const el of projectElems) {
            if (el.parentNode && el.parentNode !== projectsHolder) continue; // leave other parents alone
            el.remove();
          }
            const ro = new ResizeObserver((entries) => {
                for (const entry of entries) {
                  const root = entry.target;                 // element being observed
              
                  /* 1️⃣  Get or create the child you want to append */
                  let childNode = root.querySelector('.viewer-canvas');
                  if (!childNode) {
                    childNode = document.createElement('canvas');
                    childNode.className = 'viewer-canvas';
                    // ... any initialisation you normally do here ...
                  }
              
                  /* 2️⃣  Append only if it isn’t already attached */
                  if (childNode instanceof Node && childNode.parentNode !== root) {
                    root.appendChild(childNode);
                  }
                }
              });
        for (var x = 0; x < numProjects - 1; x++) projectsHolder.appendChild(projectElems[x])
        for (var x = Math.max(numProjects - 1, 0); x < projectElems.length; x++) dropDownContainer.appendChild(projectElems[x])

        projectsHolder.appendChild(dropDownSelector)
    }).observe(topBar)
    
}

// Function to decide whether to show bio page based on URL params and visitor status
function shouldShowBioPage() {
    // Check for URL parameter to skip bio
    const urlParams = new URLSearchParams(window.location.search);
    
    // If skipBio=true is in the URL, don't show bio
    if (urlParams.get('skipBio') === 'true') {
        return false;
    }
    
    // Check the document's referrer to see if the user is navigating within the site
    const referrer = document.referrer;
    
    // If the referrer contains your domain, they're navigating from another page on your site
    // This checks if they're coming from an info.html page or any internal page
    if (referrer && (
        referrer.includes('/info.html') || 
        referrer.includes(window.location.hostname)
    )) {
        return false;
    }
    
    // In all other cases (new tab, direct URL, external link), show the bio
    return true;
}

// Function to add the bio iframe if needed
function showBioPageIfNeeded() {
    if (!shouldShowBioPage()) return false;
    
    // Create iframe for bio page
    const bioFrame = document.createElement('iframe');
    bioFrame.id = 'bio-frame';
    bioFrame.src = '/bio.html';
    bioFrame.style.position = 'fixed';
    bioFrame.style.top = '0';
    bioFrame.style.left = '0';
    bioFrame.style.width = '100%';
    bioFrame.style.height = '100%';
    bioFrame.style.border = 'none';
    bioFrame.style.zIndex = '1000';
    
    document.body.appendChild(bioFrame);
    
    // Listen for messages from bio page
    window.addEventListener('message', (event) => {
        if (event.data.type === 'closeBio') {
            closeBioPage();
        }
    });
    
    return true;
}

// Function to close the bio page
function closeBioPage() {
    const bioFrame = document.getElementById('bio-frame');
    if (bioFrame) {
        bioFrame.style.opacity = '0';
        setTimeout(() => {
            bioFrame.remove();
            
            // Add a parameter to the URL to indicate bio has been seen this session
            const url = new URL(window.location.href);
            url.searchParams.set('skipBio', 'true');
            window.history.replaceState({}, '', url);
        }, 50);
    }
}
function openBioPage() {
    // Don't open if already open
    if (document.getElementById('bio-frame')) return;
    
    // Create iframe for bio page
    const bioFrame = document.createElement('iframe');
    bioFrame.id = 'bio-frame';
    bioFrame.src = '/bio.html';
    bioFrame.style.position = 'fixed';
    bioFrame.style.top = '0';
    bioFrame.style.left = '0';
    bioFrame.style.width = '100%';
    bioFrame.style.height = '100%';
    bioFrame.style.border = 'none';
    bioFrame.style.zIndex = '1000';
    bioFrame.style.transition = 'opacity 0.3s ease';
    
    document.body.appendChild(bioFrame);
    
    // Listen for messages from bio page
    window.addEventListener('message', (event) => {
        if (event.data.type === 'closeBio') {
            closeBioPage();
        }
    });
}

// Function to update loading progress and send to bio page if open
function updateLoadingProgress(percent) {
    const bioFrame = document.getElementById('bio-frame');
    if (bioFrame) {
        bioFrame.contentWindow.postMessage({
            type: 'loadingProgress',
            percent: percent
        }, '*');
    }
}

window.onload = async () => {
    
    // Show bio page if needed
    const bioPageShown = showBioPageIfNeeded();
    
    let objects = [];
    let groups = [];
    const projectInfo = getProjectList();
    groups = projectInfo.groups;
    
    initTopBar(groups, selectCallBack);
    
    // Initialize loading manager and GLB loader
    const loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = (url, loaded, total) => {
        const percent = (loaded / total) * 100;
        updateLoadingProgress(percent);
    };
    
    glbLoader = new GLTFLoader(loadingManager);
    
    // Prepare object data
    for (let x = 0; x < projectInfo.projects.length; x++) {
        const project = projectInfo.projects[x];
        objects.push({
            modelURL: project.modelURL,
            project: project,
            threeMesh: null,
            name: project.title,
            url: `/info.html?project=${project.id}&fromHome=true`,
            group: project.group
        });
    }
    
    // Create a modified ensureLoadObject function that handles loading progress
    /* async function ensureLoadObject(id) {
        if (objects[id].threeMesh !== null) return;
        
        try {
            const gltf = await new Promise((resolve, reject) => {
                glbLoader.load(
                    objects[id].modelURL,
                    resolve,
                    (xhr) => {
                        // Calculate overall progress
                        const totalModels = objects.length;
                        const loadedModels = objects.filter(obj => obj.threeMesh !== null).length;
                        const thisModelProgress = xhr.loaded / xhr.total;
                        
                        // Calculate weighted progress percentage
                        const overallPercent = ((loadedModels + thisModelProgress) / totalModels) * 100;
                        updateLoadingProgress(overallPercent);
                    },
                    reject
                );
            });
            
            const loadedMesh = gltf.scenes[0].children[0];
            objects[id].threeMesh = loadedMesh;
            
            loadedMesh.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    if (node.material) {
                        node.material.envMapIntensity = 1.0;
                        node.material.needsUpdate = true;
                    }
                }
            });
            
            if ("scale" in objects[id].project) {
                loadedMesh.scale.x = objects[id].project.scale.x;
                loadedMesh.scale.y = objects[id].project.scale.y;
                loadedMesh.scale.z = objects[id].project.scale.z;
                objects[id].targetScale = {...loadedMesh.scale};
            } else {
                objects[id].targetScale = {x: 1, y: 1, z: 1};
            }
            
            loadedMesh.position.z = 10;
            loadedMesh.name = "" + id;
            returned.three.scene.add(loadedMesh);
            
        } catch (error) {
            console.error(`Failed to load model ${objects[id].modelURL}:`, error);
        }
    } */
    
    const res = await createRenderer(objects, groups, projectInfo.preferredOrder);
    
    // Replace the original ensureLoadObject with our new version
    /* res.ensureLoadObject = ensureLoadObject; */
    
    // IMPORTANT: Fix the double-loading issue by directly calling deSelectGroup
    // Instead of using setTimeout
    await res.deSelectGroup();
    
    let selected = null;
    function selectCallBack(id) {
        if (id === selected) {
            res.deSelectGroup();
            selected = null;
        } else {
            selected = id;
            res.selectGroup(selected);
        }
    }
    
    res.elem.style.width = "100%";
    res.elem.style.height = "100%";
    
    document.querySelector("#three-canvas").appendChild(res.elem);
    
    let last = Date.now();
    
    function frame() {
        let now = Date.now();
        let elapsed = now - last;
        last = now;
        
        res.frame(elapsed / 1000);
        
        window.requestAnimationFrame(frame);
    }
    const bioLink = document.getElementById('bio-link');
    if (bioLink) {
        bioLink.addEventListener('click', (e) => {
            e.preventDefault();
            openBioPage();
        });
    }

    
    frame();
};