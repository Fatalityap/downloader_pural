var http = require('http');
var fs = require('fs');
var path = require('path');
var webdriver = require('/usr/local/lib/node_modules/selenium-webdriver');

var startTime;
var endTime;
var originalWindow;
var newWindow;
var videoPages;
var videoTitle;
var sectionTitle;
var i = 0;
var j = 1;
var link;

var TUTORIAL = 'The Evolution of XPath: What’s New in XPath 3.0';
var DOWNLOAD_PATH = path.normalize('/Users/Fatalityap/Selenium/Puralsight/XML/XPath/');
var LOGIN = '';
var PASSWORD = '';

if(!fs.existsSync(DOWNLOAD_PATH))
        {
            throw new Error("Download path is not exists! " + DOWNLOAD_PATH);
        }

var driver = new webdriver.Builder().
    withCapabilities(webdriver.Capabilities.chrome()).
    build();

openSite();

function authenticate() {
    driver.findElement(webdriver.By.id('userHandle')).sendKeys(LOGIN);
    driver.findElement(webdriver.By.id('password')).sendKeys(PASSWORD);
    driver.findElement(webdriver.By.id('submit')).click();

    getTutorialPage();
}

function openSite() {
    startTime = new Date;
    driver.get('http://pluralsight.com');
    driver.findElement(webdriver.By.id('signInLink')).click();

    authenticate();
}

function getLink() {
    if (i === videoPages.length) {
        endTime = new Date;
        var elapsed = +(((endTime - startTime) / 1000) / 60).toFixed(2) + ' mins';
        console.log('Downloads finished.');
        console.log('Elapsed time: %s', elapsed);
        driver.close();
        return;
    }

    console.log('opening video page');
    videoPages[i].click();
    i++;
    console.log('done');
}

function switchToMainWindow() {
    console.log('switching to main window...');
    driver.switchTo().window(originalWindow).then(function () {
        console.log('switched');
        getTitle();
        getSection();
        getLink();
        switchToPopup();
    });
}

function increaseFolderPrefix(title) {
    if (sectionTitle && title !== sectionTitle) {
        ++j;
    }
}

function downloadVideo() {
    driver.sleep(50000);
    driver.executeScript("return document.getElementById('video').getAttribute('src');").then(function (data) {
        driver.close();

        link = data;

        console.log('video link: ' + data);

        var extension = getExtension();
        var fullDownloadPath = DOWNLOAD_PATH + j + '.' + sectionTitle + '/';

        console.log('download path: %s', fullDownloadPath);

        

        try {

           if(!fs.existsSync(fullDownloadPath))
           {
              fs.mkdir(fullDownloadPath, function(err){

              if(err) throw err;
            
                  downloadHandler(data, fullDownloadPath, i, videoTitle, extension)
              });
           }
           else
           {
               downloadHandler(data, fullDownloadPath, i, videoTitle, extension)
           }

            
        } catch (e) {
            console.log(e.message);
        }

    });
}


function downloadHandler(data, fullDownloadPath, i, videoTitle, extension)
{
    var file = fs.createWriteStream(fullDownloadPath + i + '.' + videoTitle + extension);

    http.get(data, function (response) {

            console.log('downloading video...');

            response.pipe(file);

                response.on('end', function () {
                        console.log('download ' + i + '/%d' + ' finished', videoPages.length);
                        driver.sleep(300000);
                        switchToMainWindow();
                });

    });
}

function getExtension() {
    var dotPos = link.lastIndexOf('.');
    var extension = link.slice(dotPos, link.length);
    console.log('video extension: %s', extension);

    return extension;
}

function switchToPopup() {
    console.log('switching to popup');
    driver.getAllWindowHandles().then(function (handles) {
        originalWindow = handles[0];
        newWindow = handles[1];
        driver.switchTo().window(newWindow).then(downloadVideo);
        console.log('window handles: ' + handles);
    });
}

function getTitle() {
    driver.executeScript("return document.querySelectorAll('.tab-list li h5')[" + i + "].innerHTML;").then(function (data) {
        videoTitle = data.replace("/","_").replace("\\","_");
        console.log('video title: %s', videoTitle);
    });
}

function getSectionsCount() {
    driver.executeScript("return document.querySelectorAll('.title').length").then(function (data) {
        console.log('sections count: %s', data);
    });
}

function getSection() {
    driver.executeScript("var link = document.querySelectorAll('.content')[" + i + "];  var sibling = link.previousElementSibling; while(sibling) { if( sibling.classList.contains('title') ) { var title = sibling.querySelector('a').innerHTML; break; } var sibling = sibling.previousElementSibling;  } return title; ").then(function (data) {

        increaseFolderPrefix(data);

        sectionTitle = data.replace("/","_").replace("\\","_");
        console.log('section title: %s', sectionTitle);
    });
}

function getTutorialPage() {
    driver.sleep(1000);
    driver.findElement(webdriver.By.css('.search-home .search-input')).sendKeys(TUTORIAL);
    driver.sleep(1000);
    driver.findElement(webdriver.By.css('.search-home .search-button')).click();
    driver.sleep(1000);
    driver.findElement(webdriver.By.linkText(TUTORIAL)).click();
    driver.sleep(1000);
    driver.findElement(webdriver.By.id('expandAll')).click();
    driver.sleep(1000);

    driver.executeScript("return document.querySelectorAll('.tab-list a');").then(function (data) {
        videoPages = data;

        console.log('videos count: ' + videoPages.length);

        getSectionsCount();
        getTitle();
        getLink();
        getSection();
        switchToPopup();
    });
}


