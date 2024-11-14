export function getProjectList() {
    return {
        projects: [
            {
                title: "wallE",
                id: "wallE",
                group: "personal",
                modelURL: "/projects/wallE/wallE.glb",
                descriptionURL: "/projects/cube_001/desc.html",
                imagesURL: "/projects/cube_001/images.html",
                scale: {
                    x: .005, y: .005, z: .005
                }
            },
            {
                title: "terminator_foot",
                id: "terminator_foot",
                group: "classwork",
                modelURL: "/projects/terminator_foot/terminator_foot.glb",
                descriptionURL: "/projects/cube_001/desc.html",
                imagesURL: "/projects/cube_001/images.html",
                scale: {
                    x: .005, y: .005, z: .005
                }
            },
            {
                title: "cereal_container",
                id: "cereal_container",
                group: "classwork",
                modelURL: "/projects/cereal_container/cereal_container.glb",
                descriptionURL: "/projects/cube_001/desc.html",
                imagesURL: "/projects/cube_001/images.html",
                scale: {
                    x: .005, y: .005, z: .005
                }
            },
            {
                title: "sardine_tin",
                id: "sardine_tin",
                group: "personal",
                modelURL: "/projects/sardine_tin/sardine_tin.glb",
                descriptionURL: "/projects/cube_001/desc.html",
                imagesURL: "/projects/cube_001/images.html",
                scale: {
                    x: .1, y: .1, z: .1
                }
            },
            {
                title: "abstract_pendant",
                id: "abstract_pendant",
                group: "personal",
                modelURL: "/projects/abstract_pendant/abstract_pendant.glb",
                descriptionURL: "/projects/cube_001/desc.html",
                imagesURL: "/projects/cube_001/images.html",
                scale: {
                    x: .005, y: .005, z: .005
                }
            },
            {
                title: "giraffe_guitar",
                id: "giraffe_guitar",
                group: "personal",
                modelURL: "/projects/giraffe_guitar/giraffe_guitar.glb",
                descriptionURL: "/projects/cube_001/desc.html",
                imagesURL: "/projects/cube_001/images.html",
                scale: {
                    x: .05, y: .05, z: .05
                }
            },
            {
                title: "nanofab_washer",
                id: "nanofab_washer",
                group: "personal",
                modelURL: "/projects/nanofab_washer/nanofab_washer.glb",
                descriptionURL: "/projects/cube_001/desc.html",
                imagesURL: "/projects/cube_001/images.html",
                scale: {
                    x: .05, y: .05, z: .05
                }
            },
            {
                title: "school_bench",
                id: "school_bench",
                group: "personal",
                modelURL: "/projects/school_bench/school_bench.glb",
                descriptionURL: "/projects/cube_001/desc.html",
                imagesURL: "/projects/cube_001/images.html",
                scale: {
                    x: .15, y: .15, z: .15
                }
            },
            {
                title: "flightclub_grip",
                id: "flightclub_grip",
                group: "personal",
                modelURL: "/projects/flightclub_grip/flightclub_grip.glb",
                descriptionURL: "/projects/cube_001/desc.html",
                imagesURL: "/projects/cube_001/images.html",
                scale: {
                    x: .15, y: .15, z: .15
                }
            }
        ],
        groups: [
            {
                name: "personal", id: "personal"
            },
            {
                name: "classwork", id: "classwork"
            },
            {
                name: "beta", id: "beta"
            },
            
        ]
    }
}

export function getProjectDescriptionById(id) {
    const projectList = getProjectList().projects 
    for (var x = 0; x < projectList.length; x++) {
        console.log(x)
        if (projectList[x].id === id) return projectList[x]
    }
    return null
}