import * as THREE from "https://cdn.skypack.dev/three@0.132.2"
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader"

import { getProjectList } from "/js/projects.js"

let glbLoader = null

async function createRenderer(objects) {
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

    // initiate threeJS
    returned.three = { }
    returned.three.scene = new THREE.Scene()
    returned.three.camera = new THREE.PerspectiveCamera(60, 1, .01, 1000.)
    returned.three.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true})
    returned.three.renderer.setClearColor(0xffffff, 0)
    returned.three.raycaster = new THREE.Raycaster()

    // TEMPORARY
    returned.three.camera.position.z = 5.

    // initialize threeJS lights
    {
        const aLight = new THREE.AmbientLight(0xFFFFFF, .1)
        returned.three.scene.add(aLight)
        
        const dLight = new THREE.DirectionalLight(0xffffff, 1.)
        dLight.position.set(1, 1, 1)
        returned.three.scene.add(dLight)
    }

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
        for (var x = 0; x < objects.length; x++) {
            if (objects[x].group === id) {
                objectsInView.push(x)
            }
        }

        await putInViewObjectsLine()
        shuffleObjectsInView()
    }

    async function ensureLoadObject(id) {
        if (objects[id].threeMesh != null) {
            console.log("skipping", id)
            return
        }
        const loadedScene = await glbLoader.loadAsync(objects[id].modelURL)
        const loadedMesh = loadedScene.scenes[0].children[0]
        objects[id].threeMesh = loadedMesh

        

        console.log("loading ", id)

        if ("scale" in objects[id].project) {
            loadedMesh.scale.x = objects[id].project.scale.x
            loadedMesh.scale.y = objects[id].project.scale.y
            loadedMesh.scale.z = objects[id].project.scale.z

            objects[id].targetScale = {...loadedMesh.scale}
        } else {
            objects[id].targetScale = {x: 1, y: 1, z: 1}
        }

        objects[id].threeMesh.name = "" + id
        returned.three.scene.add(objects[id].threeMesh)
    }

    window.THREE = returned.three

    function isLoaded(id) {
        return objects[id].threeMesh != null
    }

    async function deSelectGroup() {
        currentGroup = null
        objectsInView = []
        for (var x = 0; x < objects.length; x++) {
            objectsInView.push(x)
        }

        shuffleObjectsInView()
        await putInViewObjectsRandom()
    }

    async function putInViewObjectsRandom() {

        const MAX_Y_DIST = 2
        const MAX_X_DIST = .65 * MAX_Y_DIST * returned.elem.clientWidth / returned.elem.clientHeight
        const NUM_COL = Math.floor(MAX_X_DIST)

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
        // first, we should be able to fill the middle
        for (var y = -1; y <= 1; y++) {
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
                    const currentObject = objects[returned.state.selection.nearestObjectId]

                    if (currentObject.url) {
                        console.log("going to", currentObject.url)
                        const a = document.createElement("a")
                        a.href = currentObject.url
                        document.body.appendChild(a)
                        a.click()
                        a.remove()
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

    onResize()

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

        const numProjects = Math.floor(sizeToProjects / 120)

        projectsHolder.style.width = `${numProjects * 120}px`

        for (var x = 0; x < projectElems.length; x++) projectElems[x].remove()

        for (var x = 0; x < numProjects - 1; x++) projectsHolder.appendChild(projectElems[x])
        for (var x = Math.max(numProjects - 1, 0); x < projectElems.length; x++) dropDownContainer.appendChild(projectElems[x])

        projectsHolder.appendChild(dropDownSelector)
    }).observe(topBar)
}

window.onload = async () => {

    let objects = []
    let groups = []

    const projectInfo = getProjectList()

    groups = projectInfo.groups

    initTopBar(groups, selectCallBack)

    glbLoader = new GLTFLoader()

    for (var x = 0; x < projectInfo.projects.length; x++) {
        const project = projectInfo.projects[x]
        objects.push({
            modelURL: project.modelURL,
            project: project,
            threeMesh: null,
            name: project.title,
            url: `/info.html?project=${project.id}`,
            group: project.group
        })
    }

    const res = await createRenderer(objects)

    // I don't know why this is necessary but it is
    setTimeout(async () => {
        await res.deSelectGroup()
    }, 10)

    let selected = null
    function selectCallBack(id) {
        if (id === selected) {
            res.deSelectGroup()
            selected = null
        } else {
            selected = id
            res.selectGroup(selected)
        }
    }

    res.elem.style.width = "100%"
    res.elem.style.height = "100%"

    document.querySelector("#three-canvas").appendChild(res.elem)

    let last = Date.now()

    function frame() {
        let now = Date.now()
        let elapsed = now - last 
        last = now

        res.frame(elapsed / 1000)

        window.requestAnimationFrame(frame)
    }

    frame()
}