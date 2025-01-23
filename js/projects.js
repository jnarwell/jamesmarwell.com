export function randomPlacementType() {
    // return "grid"
    // return "random"
    // return "random_spaced"
    return "grid"
}

export function getProjectList() {
    return {
        projects: [
            {
                title: "wallE",
                id: "wallE",
                group: "personal",
                modelURL: "/projects/wallE/wallE.glb",
                descriptionURL: "/projects/wallE/desc.html",
                imagesURL: "/projects/wallE/images.html",
                scale: {
                    x: .005, y: .005, z: .005
                }
            },
            {
                title: "terminator_foot",
                id: "terminator_foot",
                group: "classwork",
                modelURL: "/projects/terminator_foot/terminator_foot.glb",
                descriptionURL: "/projects/terminator_foot/desc.html",
                imagesURL: "/projects/terminator_foot/images.html",
                scale: {
                    x: .005, y: .005, z: .005
                }
            },
            {
                title: "cereal_container",
                id: "cereal_container",
                group: "classwork",
                modelURL: "/projects/cereal_container/cereal_container.glb",
                descriptionURL: "/projects/cereal_container/desc.html",
                imagesURL: "/projects/cereal_container/images.html",
                scale: {
                    x: .005, y: .005, z: .005
                }
            },
            {
                title: "sardine_tin",
                id: "sardine_tin",
                group: "personal",
                modelURL: "/projects/sardine_tin/sardine_tin.glb",
                descriptionURL: "/projects/sardine_tin/desc.html",
                imagesURL: "/projects/sardine_tin/images.html",
                scale: {
                    x: .1, y: .1, z: .1
                }
            },
            {
                title: "abstract_pendant",
                id: "abstract_pendant",
                group: "personal",
                modelURL: "/projects/abstract_pendant/abstract_pendant.glb",
                descriptionURL: "/projects/abstract_pendant/desc.html",
                imagesURL: "/projects/abstract_pendant/images.html",
                scale: {
                    x: .15, y: .15, z: .15
                }
            },
            {
                title: "giraffe_guitar",
                id: "giraffe_guitar",
                group: "personal",
                modelURL: "/projects/giraffe_guitar/giraffe_guitar.glb",
                descriptionURL: "/projects/giraffe_guitar/desc.html",
                imagesURL: "/projects/giraffe_guitar/images.html",
                scale: {
                    x: .05, y: .05, z: .05
                }
            },
            {
                title: "nanofab_washer",
                id: "nanofab_washer",
                group: "professional",
                modelURL: "/projects/nanofab_washer/nanofab_washer.glb",
                descriptionURL: "/projects/nanofab_washer/desc.html",
                imagesURL: "/projects/nanofab_washer/images.html",
                scale: {
                    x: .005, y: .005, z: .005
                }
            },
            {
                title: "school_bench",
                id: "school_bench",
                group: "classwork",
                modelURL: "/projects/school_bench/school_bench.glb",
                descriptionURL: "/projects/school_bench/desc.html",
                imagesURL: "/projects/school_bench/images.html",
                scale: {
                    x: .15, y: .15, z: .15
                }
            },
            {
                title: "flightclub_grip",
                id: "flightclub_grip",
                group: "personal",
                modelURL: "/projects/flightclub_grip/flightclub_grip.glb",
                descriptionURL: "/projects/flightclub_grip/desc.html",
                imagesURL: "/projects/flightclub_grip/images.html",
                scale: {
                    x: .15, y: .15, z: .15
                }
            },
            {
                title: "hvcb",
                id: "hvcb",
                group: "professional",
                modelURL: "/projects/hvcb/hvcb.glb",
                descriptionURL: "/projects/hvcb/desc.html",
                imagesURL: "/projects/hvcb/images.html",
                scale: {
                    x: .3, y: .3, z: .3
                }
            }
        ],
        groups: [
            {
                name: "personal", id: "personal",
                preferredOrder: ["wallE", "sardine_tin"]
            },
            {
                name: "classwork", id: "classwork",
                preferredOrder: []
            },
            {
                name: "professional", id: "professional",
                preferredOrder: []
            },
        ],
        preferredOrder: [
            "hvcb"
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