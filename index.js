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
        await page.setViewport({ width: 1280, height: 800 })

        //NOTE LOOP list servers color
        for (let j = 0; j < serverColors.length; j++) {
            // for (let j = 0; j < 1; j++) {


            let serverColor = serverColors[j];
            let serverColorId = serverColorsId[j];

            log(serverColor, "green")
            await page.goto('https://nationsglory.fr/server/' + serverColor + '/countries')
            await page
                .waitForSelector('.lead', { timeout: 10 * 60 * 1000 })
                .then(() => console.log('load '));
            await page.waitForTimeout(2000);

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
            for (let i = 0; i < linkLength; i++) {

                //NOTE substring link for get country begin index color + color lenth + 1 because / and finish by max
                let pay = links[i].substring(links[i].indexOf(serverColor) + serverColor.length + 1, links[i].length)
                await page.goto(links[i])
                log(serverColor + "\t" + pay, "white", "red")
                await page
                    .waitForSelector('.section-title', { timeout: 50 * 60 * 1000 })
                    .then(() => log('load country', "grey", "white"));
                page.waitForSelector('#bodymembers>tr>.pl-4 > a > div');


                let creation = await page.evaluate(() => Array.from(document.querySelectorAll(".section>div>div>div>p"), element => element.textContent.replace("\n", " ")));
                //creation = creation.replace("\n", " ");

                let claims = await page.evaluate(() => Array.from(document.querySelectorAll(".mb-2"), element => element.textContent));
                let powers = await page.evaluate(() => Array.from(document.querySelectorAll(".col-md-3 > .mb-2"), element => element.textContent));
                //NOTE members a refaire comme pour relations
                let membersType = await page.evaluate(() => Array.from(document.querySelectorAll("#bodymembers>tr"), element => element.textContent.replace("\n", " ")));
                let members = await page.evaluate(() => Array.from(document.querySelectorAll("#bodymembers>tr>.pl-4 > a > div"), element => element.textContent.replace("\n", " ")));
                let relationsType = await page.evaluate(() => Array.from(document.querySelectorAll('#bodyrelations>tr'), element => element.textContent));
                let relations = await page.evaluate(() => Array.from(document.querySelectorAll("#bodyrelations>tr>.pl-4>a>div>span"), element => element.textContent));

                let relationsAlly = "";
                let relationsEnnemy = "";

                let memberType = []

                try {
                    await page.screenshot({
                        path: './countryImg/' + serverColor + pay + '-tester.png',
                        clip: { x: 380, y: 650, width: 800, height: 360 }
                    });
                } catch (error) {
                    console.log(error)
                }


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
                            relationsAlly += relations[i] + ", ";
                        } else if (relationsType[i].includes("Ennemie")) {
                            relationsEnnemy += relationsEnnemy[i] + ", ";
                        }
                    }
                }
                let level = claims[2];
                let mmr = claims[3];
                let power = powers[1];
                let claim = claims[4];
                pillage = parseInt(power.substring(0, power.indexOf("/"))) - parseInt(claim);
                log("pillage: " + pillage, "red", "green");
                let country = ({
                    name: pay,
                    createBy: creation[0],
                    level: level,
                    mmr: mmr,
                    power: power,
                    pillage: pillage,
                    claims: claim,
                    ally: relationsAlly,
                    ennemies: relationsEnnemy,
                    serverColor: serverColorId
                });

                console.log(country)
                const lo = await axios.get('http://127.0.0.1:3000/api/jwt', {
                    headers: {
                        Authorization: 'Bearer ' + token
                    }
                })
                log("Token " + lo.data.tokenValid, "red", "white")

                async function asynchApi() {
                    //NOTE api not secure
                    const headers = {
                        withCredentials: true,
                        headers: { 'Authorization': 'Bearer ' + token }
                    }

                    let lol = await axios.post('http://127.0.0.1:3000/api/country', country, headers)
                        .then(function(response) {
                            log("api receive country: " + response.data.name, "green", "white")
                        })
                        .catch(function(error) {
                            console.log(error)
                        });
                    console.log(lol)

                    //NOTE save all data members in country
                    for (let k = 0; k < members.length; k++) {
                        //set member
                        console.log(response.data)
                        let memberData = ({
                            pseudo: members[k],
                            role: memberType[k],
                            country: response.data._id,
                            serverColor: serverColorId
                        });

                        //NOTE save players
                        axios.post('http://127.0.0.1:3000/api/player', memberData, headers)
                            .then(function(response) {
                                log("api receive member: " + response.data, "green", "white")
                            })
                            .catch(function(error) {
                                console.log(error)
                            })
                    }
                    asynchApi();
                }
            }
        };

        await browser.close();
        console.log("✨All done, check the console✨");
    })
}

main().catch(console.log);