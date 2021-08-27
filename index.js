const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { log } = require("npm-colorlog");
puppeteer.use(StealthPlugin());
const axios = require('axios');
const serverColors = [];
const serverColorsId = [];

async function main() {
    require('dotenv').config()

    let account = ({
        email: process.env.USER,
        password: process.env.PASSWORD
    });

    const response = await axios.post('http://127.0.0.1:3000/api/login', account)
    const token = response.data.token

    axios.get('http://127.0.0.1:3000/api/ServerColor')
        .then(function(response) {
            const obj = response.data;
            obj.forEach(element => {
                serverColors.push(element.color);
                serverColorsId.push(element._id);
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

        //NOTE LOOP list servers color
        for (let j = 0; j < serverColors.length; j++) {


            let serverColor = serverColors[j];
            let serverColorId = serverColorsId[j];

            log(serverColor, "green")
            await page.goto('https://nationsglory.fr/server/' + serverColor + '/countries')
            await page
                .waitForSelector('.lead', { timeout: 10 * 60 * 1000 })
                .then(() => console.log('load '));
            await page.waitForTimeout(2000);

            //await page.screenshot({ path: 'botTester.png' });

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

                let relationsAlly = [];
                let relationsEnnemy = [];


                let memberType = []
                await page.screenshot({ path: 'botTester.png' });

                if (members.length == membersType.length) {
                    for (let i = 0; i < membersType.length; i++) {
                        if (membersType[i].includes("Líder")) {
                            memberType.push("Leader");
                        } else if (membersType[i].includes("Oficial")) {
                            memberType.push("Officer");
                        } else if (membersType[i].includes("Miembro")) {
                            memberType.push("Membre");
                        } else if (membersType[i].includes("Recluta")) {
                            memberType.push("Recrue");
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
                let level = claims[2];
                let mmr = claims[3];
                let power = powers[1];
                let claim = claims[4];

                console.log(serverColorId)
                    //log("n°" + i + pay + " → ♝ level: " + level + " → ♚ power: " + power + " → ♛ claim: " + claim + "\n" + "→ ♟Members: " + members + "\n" + "Allié: " + relationsAlly + "\n" + "Ennemie: " + relationsEnnemy, 'red', 'black')
                let country = ({
                    name: pay,
                    level: level,
                    mmr: mmr,
                    power: power,
                    claims: claim,
                    ally: "relationsAlly",
                    ennemies: "relationsEnnemy",
                    serverColor: serverColorId
                });

                //NOTE save country
                console.table(country)
                    //console.log(token)
                    //NOTE api not secure
                axios.post('http://127.0.0.1:3000/api/country', {
                        // headers: { "Authorization": `Bearer ${token}` },
                        country
                    })
                    .then(function(response) {
                        console.log(response.status);
                    }).catch(e => console.log(e));

                //NOTE save members
                /* axios.post('http://127.0.0.1:3000/api/country', {
                         headers: {
                             Authorization: 'Bearer ' + token
                         },
                         country
                     })
                     .then(function(response) {
                         console.log(response.status);
                     }).catch(e => console.log("failed"))*/
            }
        };

        await browser.close();
        console.log("✨All done, check the console✨");
    })
}

main().catch(console.log);