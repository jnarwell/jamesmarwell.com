export function getProjectList() {
    return {
        projects: [
            {
                title: "Cube.001",
                id: "cube_001",
                group: "project 1",
                modelURL: "/projects/cube_001/cube.glb",
                descriptionURL: "/projects/cube_001/desc.html",
                imagesURL: "/projects/cube_001/images.html",
                scale: {
                    x: .5, y: .5, z: .5
                }
            }
        ],
        groups: [
            {
                name: "project 1", id: "project 1"
            },
            {
                name: "project 2", id: "project 2"
            },
            {
                name: "project 3", id: "project 3"
            },
            {
                name: "project 4", id: "project 4"
            },
            {
                name: "project 5", id: "project 5"
            },
            {
                name: "project 6", id: "project 6"
            },
            {
                name: "project 7", id: "project 7"
            },
            {
                name: "project 8", id: "project 8"
            },
            {
                name: "project 9", id: "project 9"
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