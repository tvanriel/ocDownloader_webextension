function sendNotification(Message) {
    console.log("notification: " + Message);
    chrome.notifications.create('ocDownloader',
        {
            type: 'basic',
            title: 'ocDownloader',
            iconUrl: '../img/icon-64.png',
            message: Message
        }, function (iD) {
            setTimeout(function () {
                chrome.notifications.clear('ocDownloader', function () {
                    return;
                });
            }, 4000);
        });
}

function sendApiRequest(link) {
    function ocUrl(url, method) {
        if (!url.endsWith('/')) {
            url += '/';
        }
        url = url + 'index.php/apps/ocdownloader/api/' + method + '?format=json';

        return url.substr(0, url.indexOf(':')) + '://' + url.substr(url.indexOf('/') + 2);
    }

    chrome.storage.local.get(['OCUrl', 'Username', 'Passwd'], function (items) {
        let XHR = new XMLHttpRequest();
        XHR.open('POST', ocUrl(items.OCUrl, 'add'), true);
        XHR.setRequestHeader('OCS-APIREQUEST', 'true');
        XHR.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        XHR.setRequestHeader('Authorization', 'Basic ' + btoa(items.Username + ':' + items.Passwd));
        XHR.onreadystatechange = function () {
            if (XHR.readyState === 4) {
                try {
                    let OCS = JSON.parse(XHR.responseText);

                    if (XHR.status == 200) {
                        if (!OCS.ERROR) {
                            sendNotification(chrome.i18n.getMessage('Downloadlaunchedonyourserver') + ': ' + OCS.FILENAME);
                        } else {
                            sendNotification(chrome.i18n.getMessage(OCS.MESSAGE));
                        }
                    } else {
                        sendNotification(chrome.i18n.getMessage('Unabletoreachyourserver'));
                    }
                } catch (E) {
                    sendNotification(chrome.i18n.getMessage('NoresponsefromocDownloaderonyourserverPleasecheckthesettings'));
                    console.log(E);
                }
            }
        }
        XHR.send('URL=' + encodeURIComponent(link));
    });
}

function h(name, attributes = {}, children = []) {
    let el = document.createElement(name);
    for (const i in attributes) {
        if (!Object.hasOwnProperty.call(attributes, i)) continue;
        el.setAttribute(i, attributes[i]);
    }
    children.forEach(child => {
        if (typeof child === "string") {
            el.appendChild(document.createTextNode(child));
        } else el.appendChild(child);
    });
    return el;
}

function main() {
    const translatedSaveInOcDownloader = chrome.i18n.getMessage('DownloadWithocDownloader');
    let tries = 10;

    // Create the "Download with ocDownloader" button.

    const backgroundUrl = "";
    let dlBtn = h(
        'paper-button',
        {
            'id': 'ocDownloader_webextension_DownloadButton',
            'style': 'background-color: var(--yt-spec-brand-button-background); height: 100%; color: var(--yt-spec-static-brand-white); border: none; border-radius: 2px; cursor: pointer; font-size: var(--ytd-tab-system_-_font-size); font-family: var(--paper-font-common-base_-_font-family)'},
        [
            h(
                'ytd-formatted-string',
                {'class': 'style-scope ytd-button-renderer style-destructive size-default'},
                [
                    translatedSaveInOcDownloader
                ]
            )
        ]
    );
    dlBtn.addEventListener('click', ev => {

        // Send a new download request when the button has been pressed.
        chrome.storage.local.get(['OCUrl', 'Username', 'Passwd'], items => {
            sendApiRequest(location.href);
        });
    });

    // We need to wait for the document to be loaded and have the parent element.
    let waiter = setInterval(() => {
        if (--tries === 0) {
            clearInterval(waiter);
        }

        let buttonBar = document.getElementById('top-level-buttons');
        if (buttonBar === null) return;
        clearInterval(waiter);

        buttonBar.appendChild(dlBtn);
        // When navigating to a new video, the page gets destroyed but we need to re-run the script.
        // So here we wait for the button to be gone from the page so we can re-add it.
        const waitForRemove = window.setInterval(() => {
            let el = document.getElementById('ocDownloader_webextension_DownloadButton');
            if (el === null) {
                clearInterval(waitForRemove);
                main();
            }

        }, 3000);
    }, 500);
}

main();

// Wait for the document to be interactive.
//document.addEventListener('readystatechange' () => {
//    if (document.readyState === "complete") main();
//});