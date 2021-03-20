/**
 * ownCloud - ocDownloader
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Xavier Beurois <www.sgc-univ.net>
 * @copyright Xavier Beurois 2015
 */

function sendNotification(Message) {
    chrome.notifications.create('ocDownloader',
        {
            type: 'basic',
            title: 'ocDownloader',
            iconUrl: '../img/icon-64.png',
            message: Message,
        }, () => {
            setTimeout(() => {
                chrome.notifications.clear('ocDownloader', () => {});
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

function downloadLink(info) {
    if ('srcUrl' in info) {
        sendApiRequest(info.srcUrl);
    } else if ('linkUrl' in info) {
        sendApiRequest(info.linkUrl);
    }
}

chrome.contextMenus.create({
    title: chrome.i18n.getMessage('DownloadWithocDownloader'),
    contexts: ['link', 'image', 'video', 'audio'],
});

chrome.contextMenus.onClicked.addListener(downloadLink);
