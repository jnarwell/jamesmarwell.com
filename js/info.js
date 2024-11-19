import {getProjectDescriptionById} from "/js/projects.js"

import * as THREE from "https://cdn.skypack.dev/three@0.132.2"
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader"
import { OrbitControls } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls"
/*
import * as THREE from "three"

import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
*/  

window.onload = async () => {
    if (!window.location) {err(); return}

    const urlParams = new URLSearchParams(window.location.search)
    const projectName = urlParams.get("project")

    if (!projectName) {err(); return}
    
    const description = getProjectDescriptionById(projectName)

    if (!description) {err(); return}

    document.querySelector("#project-title").textContent = description.title

    console.log(description)

    {// load in right content panel
        await fetch(description.descriptionURL).then(response => response.text()).then(
            (text) => {
                document.querySelector("#right-body").innerHTML = text
            }
        )
    }

    let imagesElem = null

    await fetch(description.imagesURL).then(response => response.text()).then(
        (text) => {
            imagesElem = document.createElement("div")
            imagesElem.style.width = "100%"
            imagesElem.style.height = "100%"
            imagesElem.style.overflowY = "scroll"
            imagesElem.innerHTML = text
        }
    )

    // initialize the logo

    document.querySelector("#logo").onclick = () => {
        const a = document.createElement("a")
        a.href = "/"
        document.body.appendChild(a)
        a.click()
    }

    //initialize renderer
    const renderer = await createRenderer(description)

    renderer.elem.style.width = "100%"
    renderer.elem.style.height = "100%"
    renderer.elem.style.transition = "opacity .1s ease"

    document.querySelector("#left-body").appendChild(renderer.elem)

    function frame() {
        renderer.frame()
        window.requestAnimationFrame(frame)
    }

    frame()

    {// initialize the drag functionality
        const l = document.querySelector("#left")
        const r = document.querySelector("#right")

        const rBody = document.querySelector("#right-body")
        const rDrag = document.querySelector("#right-drag")

        const reOpenButton = document.querySelector("#re-open-description")

        rDrag.addEventListener("mousedown", (e) => {

            let currentWidth = 50
            function onMouseMove(e) {
                let relativeX = e.clientX / window.innerWidth

                let targetWidth = relativeX * 100

                if (targetWidth < 50) targetWidth = 50
                if (targetWidth > 90) targetWidth = 90

                rBody.style.opacity = `${1 - (targetWidth - 50) / 20}`

                if (targetWidth > 51) renderer.elem.style.opacity = "0"
                else renderer.elem.style.opacity = "1"

                l.style.width = `${targetWidth}%`
                r.style.width = `${100 - targetWidth}%`

                currentWidth = targetWidth
            }

            document.addEventListener("mousemove", onMouseMove)

            document.addEventListener("mouseup", (e) => {
                document.removeEventListener("mousemove", onMouseMove)

                if (currentWidth < 60) {
                    // if it was not dragged very far, snap back
                    l.style.width = `50%`
                    r.style.width = `50%`
                    rBody.style.opacity = "1"
                    renderer.elem.style.opacity = "1"
                } else {
                    // otherwise, transition to the other mode
                    l.style.width = `100%`
                    r.style.width = `0%`
                    r.style.display = "none"

                    reOpenButton.style.opacity = "1"
                    reOpenButton.style.display = "block"

                    renderer.elem.remove()

                    if (imagesElem) {
                        document.querySelector("#left-body").appendChild(imagesElem)
                    }
                }
            }, {once: true})
        })

        reOpenButton.onclick = () => {
            l.style.width = `50%`
            r.style.width = `50%`
            rBody.style.opacity = "1"
            r.style.display = "flex"

            reOpenButton.style.opacity = "0"
            reOpenButton.style.display = "none"

            renderer.elem.style.opacity = "1"

            if (imagesElem) imagesElem.remove()
            
            document.querySelector("#left-body").appendChild(renderer.elem)
        }
    }
}

async function createRenderer(description) {
    const returned = {three: {}}

    // create root element containing threeJS viewer
    returned.elem = document.createElement("div")
    new ResizeObserver(onResize).observe(returned.elem) 
    function onResize() {
        if (!returned.three) return

        const w = returned.elem.clientWidth
        const h = returned.elem.clientHeight

        returned.three.camera.aspect = w / h
        returned.three.camera.updateProjectionMatrix()
        returned.three.renderer.setSize(w, h)
    }

    // initiate threeJS
    returned.three = { }
    returned.three.scene = new THREE.Scene()
    returned.three.camera = new THREE.PerspectiveCamera(60, 1, .01, 1000.)
    returned.three.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true})
    returned.three.renderer.setClearColor(0xffffff, 0)
    returned.three.raycaster = new THREE.Raycaster()

    // initialize orbit controls
    const controls = new OrbitControls( returned.three.camera, returned.three.renderer.domElement )
    controls.update()

    // Temporary: add the object
    {
        const glbLoader = new GLTFLoader()

        const loadedScene = await glbLoader.loadAsync(description.modelURL)
        const loadedMesh  = loadedScene.scenes[0].children[0]

        returned.three.scene.add(loadedMesh)

        if ("scale" in description) {
            loadedMesh.scale.x = description.scale.x
            loadedMesh.scale.y = description.scale.y
            loadedMesh.scale.z = description.scale.z
        }
    }

    // initialize threeJS lights
    {
        const aLight = new THREE.AmbientLight(0xFFFFFF, .1)
        returned.three.scene.add(aLight)
        
        const dLight = new THREE.DirectionalLight(0xffffff, 1.)
        dLight.position.set(1, 1, 1)
        returned.three.scene.add(dLight)
    }
    //returned.three.scene.add(new THREE.DirectionalLight(0xffffff, .9).position.set(1, .25, 0))

    // add threeJS element to root element
    returned.elem.appendChild( returned.three.renderer.domElement )

    // TEMPORARY
    returned.three.camera.position.z = 5.

    returned.frame = (elapsedTime) => {
        controls.update()
        returned.three.renderer.render(returned.three.scene, returned.three.camera)
    }

    onResize()

    return returned
}

function err() {
    document.body.innerHTML = `<div style="font-family: monospace; width: 100%; text-align: center; margin-top: 100px;">ERROR: unknown project(s)</div>`
}