// Payload delivery helpers for the PSPulse 9.xx host.
// Keep this file ES5-compatible for the PS4 browser.

var LoadedMSG = "Payload Loaded!";
var payloadRequestInFlight = false;

function xhrSucceeded(req) {
    return req.status === 200 || req.status === 304 || (req.status === 0 && req.response);
}

function getPayload(payload, onLoadEndCallback) {
    var req = new XMLHttpRequest();
    req.open('GET', payload, true);
    req.responseType = 'arraybuffer';
    req.timeout = 15000;
    req.onload = function (event) {
        if (onLoadEndCallback) onLoadEndCallback(req, event);
    };
    req.onerror = function (event) {
        if (onLoadEndCallback) onLoadEndCallback(req, event);
    };
    req.ontimeout = req.onerror;
    req.send();
}

function sendPayload(url, data, onLoadEndCallback) {
    var req = new XMLHttpRequest();
    req.open('POST', url, true);
    req.timeout = 15000;
    req.onload = function (event) {
        if (onLoadEndCallback) onLoadEndCallback(req, event);
    };
    req.onerror = function (event) {
        if (onLoadEndCallback) onLoadEndCallback(req, event);
    };
    req.ontimeout = req.onerror;
    req.send(data);
}

function setPayloadStatus(message) {
    var status = document.getElementById('msgs2');
    if (status) status.innerHTML = message;
}

function finishPayloadRequest() {
    payloadRequestInFlight = false;
}

function Loadpayloadonline(PLfile) {
    window.payload_path = PLfile;
    if (typeof window.toogle_payload === 'function') {
        window.toogle_payload(PLfile);
    } else {
        setPayloadStatus('Önce kırma işlemini yapın, ardından bu aracı tekrar seçin.');
    }
}

function fallbackToExploitLoader(PLfile) {
    finishPayloadRequest();
    Loadpayloadonline(PLfile);
}

function Loadpayloadlocal(PLfile) {
    if (payloadRequestInFlight) {
        alert('Şu anda başka bir araç yükleme işlemi devam ediyor.');
        return;
    }

    payloadRequestInFlight = true;
    setPayloadStatus('GoldHEN BinLoader kontrol ediliyor...');

    var statusReq = new XMLHttpRequest();
    statusReq.open('GET', 'http://127.0.0.1:9090/status', true);
    statusReq.timeout = 1800;
    statusReq.onload = function () {
        var responseJson;
        try {
            responseJson = JSON.parse(statusReq.responseText || '{}');
        } catch (e) {
            fallbackToExploitLoader(PLfile);
            return;
        }

        if (!xhrSucceeded(statusReq) || responseJson.status !== 'ready') {
            if (responseJson.status === 'busy') {
                finishPayloadRequest();
                alert('BinLoader sunucusu meşgul olduğu için araç yüklenemedi.');
            } else {
                fallbackToExploitLoader(PLfile);
            }
            return;
        }

        setPayloadStatus('Araç dosyası yükleniyor...');
        getPayload(PLfile, function (payloadReq) {
            if (!xhrSucceeded(payloadReq) || !payloadReq.response) {
                fallbackToExploitLoader(PLfile);
                return;
            }

            setPayloadStatus('Araç GoldHEN\'e aktarılıyor...');
            sendPayload('http://127.0.0.1:9090', payloadReq.response, function (sendReq) {
                finishPayloadRequest();
                if (xhrSucceeded(sendReq)) {
                    if (typeof window.awaitpl === 'function') window.awaitpl();
                } else {
                    setPayloadStatus('Araç gönderimi başarısız oldu. Lütfen tekrar deneyin.');
                }
            });
        });
    };
    statusReq.onerror = function () { fallbackToExploitLoader(PLfile); };
    statusReq.ontimeout = statusReq.onerror;
    statusReq.send();
}

function loadPayloadWithConfirmation(file, label, question) {
    if (!confirm(question)) return;
    LoadedMSG = label + ' Başarıyla Yüklendi ✔';
    Loadpayloadlocal(file);
}

function load_PSFreeFix() {
    loadPayloadWithConfirmation('./payloads/ps4-psfree-fix.bin', 'PSFree Fix', 'PSFree Fix aracı yüklensin mi? (Kırma takılmalarını giderir)');
}
function load_app2usb() {
    loadPayloadWithConfirmation('./payloads/app2usb.bin', 'App2USB', 'App2USB yüklensin mi? Oyun ve uygulamaları harici USB diske taşımanızı sağlar.');
}
function load_appcache_install() {
    loadPayloadWithConfirmation('./payloads/appcache-install.bin', 'AppCache Install', 'Çevrimdışı önbellek (AppCache) aracı yüklensin mi?');
}
function load_backup() {
    loadPayloadWithConfirmation('./payloads/backup.bin', 'Yedekleme (Backup)', 'Sistem Yedeği (Backup) yüklensin mi? Konsol verilerini ve kayıtları USB belleğe yedekler.');
}
function load_disable_updates() {
    loadPayloadWithConfirmation('./payloads/disable-updates.bin', 'Güncellemeleri Kapat', 'Güncellemeleri Kapat (Disable Updates) yüklensin mi? Konsolun otomatik yazılım güncellemesi yapmasını engeller.');
}
function load_enable_updates() {
    loadPayloadWithConfirmation('./payloads/enable-updates.bin', 'Güncellemeleri Aç', 'Güncellemeleri Aç (Enable Updates) yüklensin mi? Sistem güncellemelerine tekrar izin verir.');
}
function load_ftp() {
    loadPayloadWithConfirmation('./payloads/ftp.bin', 'FTP Sunucusu', 'FTP Sunucusu yüklensin mi? Bilgisayardan PS4\'e dosya aktarımı için FTP bağlantısını başlatır.');
}
function load_history_blocker() {
    loadPayloadWithConfirmation('./payloads/history-blocker.bin', 'Geçmişi Engelle', 'Geçmiş Engelleyici (History Blocker) yüklensin mi? Tarayıcı geçmişinin kaydedilmesini önler.');
}
function load_ps4debug() {
    loadPayloadWithConfirmation('./payloads/ps4debug.bin', 'PS4Debug', 'PS4Debug aracı yüklensin mi? Hata ayıklama modunu açar.');
}
function load_pup_decrypt() {
    loadPayloadWithConfirmation('./payloads/pup-decrypt.bin', 'PUP Çözücü', 'PUP Decrypt aracı yüklensin mi? Güncelleme dosyalarını çözümler.');
}
function load_restore() {
    loadPayloadWithConfirmation('./payloads/restore.bin', 'Geri Yükleme (Restore)', 'Yedek Geri Yükleme (Restore) yapılsın mı? USB bellekteki verileri konsola geri yükler.');
}
function load_rif_renamer() {
    loadPayloadWithConfirmation('./payloads/rif-renamer.bin', 'RIF Lisans Düzenle', 'RIF Lisans Düzenleyici yüklensin mi? Oyun lisans dosyalarını yönetir.');
}
function load_webrte() {
    loadPayloadWithConfirmation('./payloads/WebRTE_900.bin', 'WebRTE (Hile)', 'WebRTE yüklensin mi? Oyun hileleri ve gerçek zamanlı düzenleme modunu açar.');
}

window.getPayload = getPayload;
window.sendPayload = sendPayload;
window.Loadpayloadlocal = Loadpayloadlocal;
window.Loadpayloadonline = Loadpayloadonline;
window.load_PSFreeFix = load_PSFreeFix;
window.load_app2usb = load_app2usb;
window.load_appcache_install = load_appcache_install;
window.load_backup = load_backup;
window.load_disable_updates = load_disable_updates;
window.load_enable_updates = load_enable_updates;
window.load_ftp = load_ftp;
window.load_history_blocker = load_history_blocker;
window.load_ps4debug = load_ps4debug;
window.load_pup_decrypt = load_pup_decrypt;
window.load_restore = load_restore;
window.load_rif_renamer = load_rif_renamer;
window.load_webrte = load_webrte;
