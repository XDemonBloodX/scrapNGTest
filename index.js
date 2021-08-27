const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { log } = require("npm-colorlog");
puppeteer.use(StealthPlugin());
const axios = require('axios');

const serverColors = [];
const serverColorsId = [];

axios.get('http://127.0.0.1:3000/api/ServerColor')
    .then(function(response) {
        // handle success
        const obj = response.data;
        console.log(response.data)
        obj.forEach(element => {
            serverColors.push(element.color);
            serverColorsId.push(element.color);
        });
    })

//true for hidden Chromium
puppeteer.launch({
    headless: true,
    timeout: 10 * 60 * 1000,
    args: [
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36",
        "--no-sandbox",
        "--disabe-infobars",
        "--disable-setuid-sandbox",
        "--window-position=0,0",
        "--ignore-certificate-errors",
        "--ignore-certificate-errors-spki-list"
    ],

}).then(async browser => {
    console.log('✷ Running browser..')
    const page = await browser.newPage();

    const fs = require('fs').promises;

    //NOTE LOOP list servers color
    for (let j = 0; j < serverColors.length; j++) {


        let countryInfos = "";
        let serverColor = serverColors[j];
        log(serverColor, "green")
        await page.goto('https://nationsglory.fr/server/' + serverColor + '/countries')
        await page
            .waitForSelector('.lead', { timeout: 10 * 60 * 1000 })
            .then(() => console.log('load '));
        await page.waitForTimeout(2000);
        /* const cookies = await page.cookies();
         await fs.writeFile('./cookies.json', JSON.stringify(cookies, null, 2));*/
        //await page.waitForTimeout(21000)

        await page.screenshot({ path: 'botTester.png' });

        await page
            .waitForSelector('#tablepays>tbody>tr > td > a', { timeout: 10 * 60 * 1000 })
            .then(() => console.log('load countries list'));


        await page.waitForTimeout(2000);
        let hrefs = await page.$$eval(".table-responsive > .table >tbody>tr > td > a", (list) => list.map((elm) => elm.href));
        let links = [];
        hrefs.forEach(hf => {
            if (hf.startsWith('https://nationsglory.fr/country/' + serverColor + '/') == true) {
                links.push(hf)
            }
        });
        let linkLength = (links.length) / 2;
        console.log(linkLength)
        for (let i = 0; i < linkLength; i++) {
            let pay = links[i].substring(37, links[i].length)

            await page.goto(links[i])

            await page
                .waitForSelector('.section-title', { timeout: 5 * 60 * 1000 })
                .then(() => console.log('load country'));
            await page.waitForTimeout(700);
            page.waitForSelector('#bodymembers>tr>.pl-4 > a > div');


            let creation = await page.$eval(".d-flex > p", el => el.textContent);
            let claims = await page.evaluate(() => Array.from(document.querySelectorAll(".mb-2"), element => element.textContent));
            let powers = await page.evaluate(() => Array.from(document.querySelectorAll(".col-md-3 > .mb-2"), element => element.textContent));
            //NOTE members a refaire comme pour relations
            let membersType = await page.evaluate(() => Array.from(document.querySelectorAll("#bodymembers>tr"), element => element.textContent));
            let members = await page.evaluate(() => Array.from(document.querySelectorAll("#bodymembers>tr>.pl-4 > a > div"), element => element.textContent));
            let relationsType = await page.evaluate(() => Array.from(document.querySelectorAll('#bodyrelations>tr'), element => element.textContent));
            let relations = await page.evaluate(() => Array.from(document.querySelectorAll("#bodyrelations>tr>.pl-4>a>div>span"), element => element.textContent));
            console.log(creation)
            let relationsAlly = [];
            let relationsEnnemy = [];

            let membersLeader = [];
            let membersOfficier = [];
            let membersMembre = [];
            let membersRecrue = [];
            await page.screenshot({ path: 'botTester.png' });

            if (members.length == membersType.length) {
                for (let i = 0; i < membersType.length; i++) {
                    if (membersType[i].includes("Líder")) {
                        membersLeader.push(members[i]);
                    } else if (membersType[i].includes("Oficial")) {
                        membersOfficier.push(members[i]);
                    } else if (membersType[i].includes("Miembro")) {
                        membersOfficier.push(members[i]);
                    } else if (membersType[i].includes("Recluta")) {
                        membersOfficier.push(members[i]);
                    }
                }
            }

            if (relations.length == relationsType.length) {
                for (let i = 0; i < relationsType.length; i++) {
                    if (relationsType[i].includes("Allié")) {
                        relationsAlly.push(relations[i]);
                    } else if (relationsType[i].includes("Ennemie")) {
                        relationsEnnemy.push(relationsEnnemy);
                    }
                }
            }
            let grade = "";
            let level = claims[2];
            let power = powers[1];
            let claim = claims[4];
            //console.log(membersLeader + membersOfficier + membersMembre + membersRecrue)
            let countryObj = { server: serverColorsId, name: pay, level: level, power: power, claim: claim, ally: relationsAlly, ennemy: relationsEnnemy, create: creation };

            let memberObj = { players: members, role: grade, server: serverColor, country: pay };



            log("n°" + i + pay + " → ♝ level: " + level + " → ♚ power: " + power + " → ♛ claim: " + claim + "\n" + "→ ♟Members: " + members + "\n" + "Allié: " + relationsAlly + "\n" + "Ennemie: " + relationsEnnemy, 'red', 'black')
            countryInfos += "n°" + i + pay + " → ♝ level: " + level + " → ♚ power: " + power + " → ♛ claim: " + claim + "\n" + "→ Leader: " + membersLeader + " Officier: " + membersOfficier + " Membre: " + membersMembre + " Recrue " + membersRecrue + "\n" + "Allié: " + relationsAlly + "\n" + "Ennemie: " + relationsEnnemy + "\n\n\n";
            fs.writeFile('countryInfos.txt', countryInfos, function(err) {
                if (err) throw err;
                console.log('Fichier créé !');
            });
        }
    };

    await browser.close();
    console.log("✨All done, check the console✨");
})