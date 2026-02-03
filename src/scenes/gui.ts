import { GUI } from "dat.gui"

export const useGui = () => {


    const guiParams = {
        general: {
            EditMode: false,
        },
    }
    const gui = new GUI()
    const general = gui.addFolder("General")

    general.add(guiParams.general, "EditMode")

    gui.close()

    const links = gui.addFolder("Links")

    const location = `${window.location}images`

    const allImages = [
        "map.jpeg",
        "map2.jpeg",
        "map3.jpeg",
        "map4.jpeg",
        "monsters.jpeg",
        "monsters2.jpeg",
        "monsters3.jpeg",
        "races.jpeg",
        "races2.jpeg",
    ]

    allImages.forEach((img) => {
        const link = {
            [img]: () => {
                window.open(`${location}/${img}`, "_blank")
            },
        }
        links.add(link, img)
    })

    // .onChange(onNoiseChanged)

    gui.close()

    return { gui, guiParams }
}