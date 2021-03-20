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
            message: Message
        }, function (iD) {
            setTimeout(function () {
                chrome.notifications.clear('ocDownloader', function () {
                    return;
                });
            }, 4000);
        });
}

function ocUrl(url, method) {
    if (!url.endsWith('/')) {
        url += '/';
    }
    url = url + 'index.php/apps/ocdownloader/api/' + method + '?format=json';

    return url.substr(0, url.indexOf(':')) + '://' + url.substr(url.indexOf('/') + 2);
}

function downloadLink(info) {
	if ('srcUrl' in info) {
		sendApiRequest(info.srcUrl);
	} else if ('linkUrl' in info) {
		sendApiRequest(info.linkUrl);
	}
}

function sendApiRequest(link) {
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
                    console.log(XHR.responseText);

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
                    console.log(E.message);
                }
            }
        }
        XHR.send('URL=' + encodeURIComponent(link));
    });
}

chrome.contextMenus.create({
    'title': chrome.i18n.getMessage('DownloadWithocDownloader'),
    'contexts': ['link','image']
});

chrome.contextMenus.onClicked.addListener(downloadLink);