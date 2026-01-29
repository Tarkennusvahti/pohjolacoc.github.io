tiedot = []
klaani = []
kierros = 1

def muokkaa_index(tiedot, klaani):
    with open("index.html", "r", encoding="UTF-8") as file:
        index_sisalto = file.readlines()
    with open("index.html", "w", encoding="UTF-8") as file:
        for rivi in index_sisalto:
            if "flowchart TD" in rivi:
                file.write(rivi)
                continue
            elif rivi.strip().startswith(klaani[0].strip()):
                string = f"{klaani[0]}({klaani[0]}) --> {klaani[0]}22("
                for pelaaja in tiedot:
                    string += pelaaja.strip() + "<br>"
                string += ")\n"
                file.write(string)
            else:
                file.write(rivi) 
    return

with open("tiedot.txt", "r", encoding="UTF-8") as file:
    for player in file:
        print(f"kierros: {kierros}, pelaaja: {player}")
        if player.strip() == "":
            muokkaa_index(tiedot, klaani)
            tiedot = []
            klaani = []
            kierros = 1
            continue
        elif kierros == 1:
            klaani.append(player.strip())
            kierros += 1
            continue
        else:
            tiedot.append(player.strip())
            kierros += 1
            continue

