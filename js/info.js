import {getProjectDescriptionById} from "/js/projects.js"

import * as THREE from "https://cdn.skypack.dev/three@0.132.2"
import { GLTFLoader }  from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js"
import { OrbitControls } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls"
import { MeshoptDecoder } from "https://cdn.jsdelivr.net/npm/three@0.132.2/examples/jsm/libs/meshopt_decoder.module.js"
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

    if (description.ipProtected) {
        // Create IP tag if it doesn't exist yet
        let ipTag = document.getElementById('ip-protection-tag');
        if (!ipTag) {
            ipTag = document.createElement('div');
            ipTag.id = 'ip-protection-tag';
            ipTag.textContent = 'IP';
            document.querySelector('#left-body').appendChild(ipTag);
        }
        
        // Make sure the tag is visible
        ipTag.style.display = 'block';
        
        // Position it relative to the left-body
        ipTag.style.position = 'absolute';
        ipTag.style.top = '10px';
        ipTag.style.right = '10px';
        ipTag.style.zIndex = '100';
    }

    function navigateToHome() {
        const a = document.createElement("a");
        a.href = "/?skipBio=true";
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

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
        const a = document.createElement("a");
        // No need for the skipBio parameter anymore since we're using referrer checking
        a.href = "/";
        document.body.appendChild(a);
        a.click();
        a.remove();
    };


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
                    
                    // Change background when displaying images
                    document.body.style.backgroundImage = "url('./style/info_background_image.png')";
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
            
            // Revert background when reopening description
            document.body.style.backgroundImage = "url('./style/info_background.png')";
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
        glbLoader.setMeshoptDecoder( MeshoptDecoder );

        const loadedScene = await glbLoader.loadAsync(description.modelURL)
        const loadedMesh = loadedScene.scenes[0].children[0]

        // Add shadow and material handling
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

        returned.three.scene.add(loadedMesh)


        if ("scale" in description) {
            loadedMesh.scale.x = description.scale.x * 3
            loadedMesh.scale.y = description.scale.y * 3
            loadedMesh.scale.z = description.scale.z * 3
        }
    }

    // Enhanced lighting setup
    {
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
        returned.three.scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 2.8);
        dirLight.position.set(5, 5, 5);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        returned.three.scene.add(dirLight);

        const dirLight2 = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight2.position.set(-5, 5, -5);
        returned.three.scene.add(dirLight2);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
        returned.three.scene.add(ambientLight);

        // Initialize environment map support
        const pmremGenerator = new THREE.PMREMGenerator(returned.three.renderer);
        pmremGenerator.compileEquirectangularShader();

        // Configure renderer for proper lighting
        returned.three.renderer.outputEncoding = THREE.sRGBEncoding;
        returned.three.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        returned.three.renderer.toneMappingExposure = 1.2;
        returned.three.renderer.physicallyCorrectLights = true;
        returned.three.renderer.shadowMap.enabled = true;
        returned.three.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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