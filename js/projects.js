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
                group: "classwork",
                modelURL: "/projects/sardine_tin/sardine_tin_new.glb",
                descriptionURL: "/projects/cube_001/desc.html",
                imagesURL: "/projects/cube_001/images.html",
                scale: {
                    x: .2, y: .2, z: .2
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