const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { log } = require("npm-colorlog");
puppeteer.use(StealthPlugin());


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
    //    await page.setViewport({ width: 800, height: 600 })



    const fs = require('fs').promises;
    const cookiesString = await fs.readFile('./cookies.json');
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);

    let countryInfos = "";
    await page.goto('https://nationsglory.fr/server/yellow/countries')
    await page
        .waitForSelector('.lead', { timeout: 10 * 60 * 1000 })
        .then(() => console.log('load '));
    await page.waitForTimeout(2000);
    /* const cookies = await page.cookies();
     await fs.writeFile('./cookies.json', JSON.stringify(cookies, null, 2));*/
    //await page.waitForTimeout(21000)

    await page.screenshot({ path: 'botTester.png' });

    await page
        .waitForSelector('tr > td > a', { timeout: 10 * 60 * 1000 })
        .then(() => console.log('load countries list'));
    const hrefs = await page.$$eval("tr > td > a", (list) => list.map((elm) => elm.href));
    const links = [];

    hrefs.forEach(hf => {
        if (hf.startsWith('https://nationsglory.fr/country/yellow/') == true) {
            links.push(hf)
        }
    });
    const linkLength = links.length / 2;
    for (let i = 0; i < linkLength; i++) {
        let pay = links[i].substring(37, links[i].length)

        await page.goto(links[i])
        await page
            .waitForSelector('.section-title', { timeout: 5 * 60 * 1000 })
            .then(() => console.log('load country'));
        await page.waitForTimeout(1000);
        page.waitForSelector('#bodymembers>tr>.pl-4 > a > div');


        const claims = await page.evaluate(() => Array.from(document.querySelectorAll(".mb-2"), element => element.textContent));
        const powers = await page.evaluate(() => Array.from(document.querySelectorAll(".col-md-3 > .mb-2"), element => element.textContent));
        const members = await page.evaluate(() => Array.from(document.querySelectorAll("#bodymembers>tr>.pl-4 > a > div"), element => element.textContent));
        const relations = await page.evaluate(() => Array.from(document.querySelectorAll("#bodyrelations>tr"), element => list.map((element) => element.replace("\n", ""))));
        //document.querySelectorAll("#bodyrelations>tr")[0].textContent
        //"\n\n\nGambie\n\n\nAllié\n"


        console.log(relations)
        let level = claims[2];
        let power = powers[1].split("/");
        let claim = claims[4];
        power = parseInt(power[0], 10)
        claim = parseInt(claim, 10)

        log("n°" + i + pay + " → ♝ level: " + level + " → ♚ power: " + power + " → ♛ claim: " + claim + "\n" + "→ ♟Members: " + members + "\n" + "Relations:" + relations, 'red', 'black')
        countryInfos += "n°" + i + pay + " → ♝ level: " + level + " → ♚ power: " + power + " → ♛ claim: " + claim + "\n" + "→ ♟Members: " + members + "\n" + "Relations:" + relations;

    }
    fs.writeFile('countryInfos.txt', countryInfos, function(err) {
        if (err) throw err;
        console.log('Fichier créé !');
    });
    await browser.close();
    console.log("✨All done, check the console✨");
})