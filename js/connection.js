/**
 * ownCloud - ocDownloader
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Xavier Beurois <www.sgc-univ.net>
 * @copyright Xavier Beurois 2015
 */

const manifest = chrome.runtime.getManifest();
const neededApiVersion = manifest.version;

function startsWith(string, lookingFor, position = 0) {
    return string.indexOf(lookingFor, position) === position;
}

function notifyMe(message) {
    chrome.notifications.create('ocDownloader',
        {
            type: 'basic',
            title: 'ocDownloader',
            iconUrl: '../img/icon-64.png',
            message,
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

function validURL(URLString) {
    return /^([a-z]([a-z]|\d|\+|-|\.)*):(\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:)*@)?((\[(|(v[\da-f]{1,}\.(([a-z]|\d|-|\.|_|~)|[!$&'()*+,;=]|:)+))\])|((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=])*)(:\d*)?)(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)*)*|(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)*)*)?)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)*)*)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)){0})(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!$&'()*+,;=]|:|@)|\/|\?)*)?$/i.test(URLString);
}

function saveConnectionData(url, username, password) {
    if (url.length > 0 && username.length > 0 && password.length > 0) {
        document.getElementById('messagep').textContent = '';
        document.getElementById('messagep').style.display = 'none';

        if (!validURL(document.getElementById('ocurltf').value) || !(startsWith(document.getElementById('ocurltf').value, 'http') || startsWith(document.getElementById('ocurltf').value, 'https'))) {
            document.getElementById('messagep').textContent = chrome.i18n.getMessage('InvalidURL');
            document.getElementById('messagep').style.display = 'block';
        } else {
            document.getElementById('messagep').textContent = chrome.i18n.getMessage('Datasaved');
            document.getElementById('messagep').style.display = 'block';

            chrome.storage.local.set({
                OCUrl: url,
                Username: username,
                Passwd: password,
            }, () => {
                const XHR = new XMLHttpRequest();
                XHR.open('POST', ocUrl(url, 'version'), true);
                XHR.setRequestHeader('OCS-APIREQUEST', 'true');
                XHR.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                XHR.setRequestHeader('Authorization', `Basic ${btoa(`${username}:${password}`)}`);
                XHR.onreadystatechange = () => {
                    if (XHR.readyState === 4) {
                        try {
                            const OCS = JSON.parse(XHR.responseText);

                            if (XHR.status === 200) {
                                if (OCS.RESULT) {
                                    notifyMe(chrome.i18n.getMessage('VersionOK'));
                                } else {
                                    notifyMe(chrome.i18n.getMessage('VersionNOK'));
                                }
                            } else {
                                notifyMe(chrome.i18n.getMessage('Unabletoreachyourserver'));
                            }
                        } catch (E) {
                            notifyMe(chrome.i18n.getMessage('NoresponsefromocDownloaderonyourserverPleasecheckthesettings'));
                            console.log(E.message); // eslint-disable-line no-console
                        }
                    }
                };
                XHR.send(`AddonVersion=${neededApiVersion}`);
            });
        }
    }
}

// Execute when loading extension html page
document.addEventListener('readystatechange', () => {
    // Wait for the page to be ready
    if (document.readyState !== 'complete') return;

    const labels = {
        url: document.getElementById('ocurltflbl'),
        username: document.getElementById('usernametflbl'),
        password: document.getElementById('passwdtflbl'),
    };

    const inputs = {
        url: document.getElementById('ocurltf'),
        username: document.getElementById('usernametf'),
        password: document.getElementById('passwdtf'),
    };
    inputs.url.placeholder = chrome.i18n.getMessage('ownCloudURL');
    labels.url.textContent = chrome.i18n.getMessage('ownCloudURL');

    inputs.username.placeholder = chrome.i18n.getMessage('Username');
    labels.username.textContent = chrome.i18n.getMessage('Username');

    inputs.password.placeholder = chrome.i18n.getMessage('Password');
    labels.password.textContent = chrome.i18n.getMessage('Password');

    // Load the credentials from local storage.
    chrome.storage.local.get(['OCUrl', 'Username', 'Passwd'], (items) => {
        if (items.OCUrl !== undefined) {
            inputs.url.value = items.OCUrl;
        }

        if (items.Username !== undefined) {
            inputs.username.value = items.Username;
        }

        if (items.Passwd !== undefined) {
            inputs.password.value = items.Passwd;
        }

        // Save the username and password, So they will persist when
        // you tab away to a password manager.
        const quickSave = () => {
            chrome.storage.local.set({
                OCUrl: inputs.url.value,
                Username: inputs.username.value,
                Passwd: inputs.password.value,
            });
        };

        inputs.url.addEventListener('input', quickSave);
        inputs.username.addEventListener('input', quickSave);
        inputs.password.addEventListener('input', quickSave);
    });

    document.getElementById('savebtn').value = chrome.i18n.getMessage('Save');
    document.getElementById('savebtn').addEventListener('click', () => saveConnectionData(inputs.url.value, inputs.username.value, inputs.password.value));
});
