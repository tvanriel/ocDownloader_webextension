function sendNotification(Message) {
    chrome.notifications.create('ocDownloader',
        {
            type: 'basic',
            title: 'ocDownloader',
            iconUrl: '../img/icon-64.png',
            message: Message,
        }, () => {
            setTimeout(() => {
                chrome.notifications.clear('ocDownloader', () => {

                });
            }, 4000);
        });
}

function ocUrl(u, method) {
    let url = u;
    if (!url.endsWith('/')) {
        url += '/';
    }
    url = `${url}index.php/apps/ocdownloader/api/${method}?format=json`;

    return `${url.substr(0, url.indexOf(':'))}://${url.substr(url.indexOf('/') + 2)}`;
}

function sendApiRequest(link) {
    chrome.storage.local.get(['OCUrl', 'Username', 'Passwd'], (items) => {
        fetch(ocUrl(items.OCUrl, 'add'), {
            method: 'post',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${btoa(`${items.Username}:${items.Password}`)}`,
                'OCS-APIREQUEST': 'true',
            },
            body: `URL=${link}`,
        }).then((r) => r.json()).then((r) => {
            if (!r.ok) {
                sendNotification(chrome.i18n.getMessage('Unabletoreachyourserver'));
                return;
            }
            if (!r.body.ERROR) sendNotification(`${chrome.i18n.getMessage('Downloadlaunchedonyourserver')}: ${r.body.FILENAME}`);
            else sendNotification(chrome.i18n.getMessage(r.body.MESSAGE));
        }).catch((e) => {
            sendNotification(chrome.i18n.getMessage('NoresponsefromocDownloaderonyourserverPleasecheckthesettings'));
            console.error(e); // eslint-disable-line no-console
        });
    });
}

function h(name, attributes = {}, children = []) {
    const el = document.createElement(name);
    Object.entries(attributes).forEach((i) => {
        el.setAttribute(i[0], i[1]);
    });
    children.forEach((child) => {
        if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
        } else el.appendChild(child);
    });
    return el;
}

function main() {
    const translatedSaveInOcDownloader = chrome.i18n.getMessage('DownloadWithocDownloader');
    let tries = 10;

    // Create the "Download with ocDownloader" button.

    const dlBtn = h(
        'paper-button',
        {
            id: 'ocDownloader_webextension_DownloadButton',
            style: 'margin-top: 13px; background-color: var(--yt-spec-brand-button-background); height: 100%; color: var(--yt-spec-static-brand-white); border: none; border-radius: 2px; cursor: pointer; font-size: var(--ytd-tab-system_-_font-size); font-family: var(--paper-font-common-base_-_font-family)',
        },
        [
            h(
                'ytd-formatted-string',
                { class: 'style-scope ytd-button-renderer style-destructive size-default' },
                [
                    translatedSaveInOcDownloader,
                ],
            ),
        ],
    );
    dlBtn.addEventListener('click', () => {
        // Send a new download request when the button has been pressed.
        sendApiRequest(location.href); // eslint-disable-line no-restricted-globals
    });

    // We need to wait for the document to be loaded and have the parent element.
    const waiter = setInterval(() => {
        console.log('try show button');
        tries -= 1;
        if (tries <= 0) {
            clearInterval(waiter);
        }

        const buttonBar = document.getElementById('info');
        console.log(buttonBar);
        if (buttonBar === null) return;
        clearInterval(waiter);

        buttonBar.appendChild(dlBtn);
    }, 500);
}

window.setInterval(() => {
    if (window.location.pathname !== "/watch") {
        return;
    }
    if (document.getElementById('ocDownloader_webextension_DownloadButton') !== null) {
        return;
    }
    main();
}, 3000)
