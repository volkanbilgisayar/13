(function () {
    var timerId = null;
    var cacheWaitActive = false;
    var jailbreakRunning = false;
    var label = document.getElementById('autoJbLabel');
    var checkbox = document.getElementById('autoJbInput');
    var jailbreakButton = document.getElementById('jeilbrek');
    var reloadButton = document.getElementById('reloadBtn');
    var uaElement = document.getElementById('UA');
    var output = document.getElementById('console');
    var netctrlRadio = document.getElementById('netctrl-exploit');
    var lapseRadio = document.getElementById('lapse-exploit');
    var form = document.getElementById('kernel-options');
    var autoStarted = false;

    function storageGet(name, fallback) {
        try {
            var value = localStorage.getItem(name);
            return value === null ? fallback : value;
        } catch (error) {
            return fallback;
        }
    }

    function storageSet(name, value) {
        try {
            localStorage.setItem(name, String(value));
        } catch (error) {}
    }

    var storedChain = storageGet('exploitChain', 'lapse');
    window.exploitChain =
        storedChain === 'netctrl' ? 'netctrl' : 'lapse';
    var autoJbValue = storageGet('autoJb', 'true') === 'true';

    function detectSupportedPS4() {
        var ua = navigator.userAgent;
        if (!/PlayStation 4/i.test(ua) ||
            /PlayStation 5/i.test(ua)) {
            return false;
        }

        var match = ua.match(
            /PlayStation\s+4[\/ ](\d+)\.(\d+)/
        );
        if (!match) return false;

        var major = parseInt(match[1], 10);
        var minor = parseInt(match[2], 10);
        return major >= 6 &&
            (major < 11 || (major === 11 && minor <= 2));
    }

    function appendOutput(message) {
        if (!output) return;
        output.textContent += '\n' + message;
        output.scrollTop = output.scrollHeight;
    }

    function stopCountdown() {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
        if (!jailbreakRunning) {
            label.textContent = 'Otomatik Kırma';
        }
    }

    function runJailbreak() {
        if (jailbreakRunning) return;
        jailbreakRunning = true;
        stopCountdown();
        jailbreakButton.disabled = true;
        label.textContent = 'Kırma Başlatılıyor...';

        Promise.resolve()
            .then(function () {
                return doJb();
            })
            .then(function () {
                label.textContent = 'Kırma Tamamlandı!';
            })
            .catch(function (error) {
                var message = error && error.message ?
                    error.message : String(error);
                appendOutput('[-] ' + message);
                appendOutput('[-] Tekrar denemeden önce tarayıcıyı tamamen kapatın. Tekrarlarsa konsolu yeniden başlatın.');
                label.textContent =
                    'Başarısız — Tarayıcıyı kapatıp tekrar açın';
            });
    }

    function jailbreakCountdown() {
        stopCountdown();
        var countdown = 5;
        label.textContent =
            'Otomatik Kırma Başlıyor: ' + countdown + ' sn';

        timerId = setInterval(function () {
            countdown -= 1;
            label.textContent =
                'Otomatik Kırma Başlıyor: ' + countdown + ' sn';

            if (countdown <= 0) {
                clearInterval(timerId);
                timerId = null;
                runJailbreak();
            }
        }, 1000);
    }

    function beginAutoJailbreak() {
        if (autoStarted || jailbreakRunning ||
            jailbreakButton.disabled || !checkbox.checked) {
            return;
        }

        autoStarted = true;
        jailbreakCountdown();
    }

    function startAutoJb() {
        if (cacheWaitActive || jailbreakRunning ||
            jailbreakButton.disabled || !checkbox.checked) {
            return;
        }

        var cache = window.applicationCache;
        var hasManifest =
            document.documentElement.hasAttribute('manifest');
        if (!cache || !hasManifest) {
            beginAutoJailbreak();
            return;
        }

        cacheWaitActive = true;
        var finished = false;
        var watchdog = null;
        var reloadScheduled = false;

        function clearWatchdog() {
            if (watchdog !== null) {
                clearTimeout(watchdog);
                watchdog = null;
            }
        }

        function detach() {
            clearWatchdog();
            cache.removeEventListener(
                'downloading', onDownloading, false
            );
            cache.removeEventListener(
                'progress', onProgress, false
            );
            cache.removeEventListener(
                'cached', onCached, false
            );
            cache.removeEventListener(
                'noupdate', onReady, false
            );
            cache.removeEventListener(
                'updateready', onUpdate, false
            );
            cache.removeEventListener(
                'error', onError, false
            );
            cache.removeEventListener(
                'obsolete', onObsolete, false
            );
        }

        function finish() {
            if (finished) return;
            finished = true;
            cacheWaitActive = false;
            detach();
        }

        function onDownloading() {
            if (jailbreakRunning) return;
            clearWatchdog();
            autoStarted = false;
            stopCountdown();
            label.textContent =
                'Çevrimdışı hafızaya yükleniyor...';
        }

        function onProgress(event) {
            if (jailbreakRunning) return;
            clearWatchdog();
            if (event && event.total > 0) {
                label.textContent =
                    'Çevrimdışı hafızaya yükleniyor: %' +
                    Math.round(event.loaded / event.total * 100);
            }
        }

        function onReady() {
            if (jailbreakRunning) return;
            finish();
            beginAutoJailbreak();
        }

        function onCached() {
            if (jailbreakRunning) return;
            reloadForCleanStart(
                'Hafızaya alındı — Sayfa yenileniyor...',
                false
            );
        }

        function onUpdate() {
            if (jailbreakRunning) return;
            reloadForCleanStart(
                'Önbellek güncellendi — Sayfa yenileniyor...',
                true
            );
        }

        function onError() {
            if (jailbreakRunning) return;

            if (cache.status === cache.IDLE ||
                cache.status === cache.UPDATEREADY) {
                finish();
                beginAutoJailbreak();
                return;
            }

            finish();
            stopCountdown();
            label.textContent =
                'Önbellek hatası — Tekrar deneyin';
        }

        function onObsolete() {
            if (jailbreakRunning) return;
            finish();
            stopCountdown();
            label.textContent =
                'Önbellek eski — Tarayıcı geçmişini temizleyin';
        }

        function reloadForCleanStart(message, swapCache) {
            if (jailbreakRunning || reloadScheduled) return;
            reloadScheduled = true;
            finish();
            if (swapCache) {
                try {
                    cache.swapCache();
                } catch (error) {}
            }

            label.textContent = message;
            setTimeout(function () {
                window.location.reload();
            }, 750);
        }

        function armWatchdog() {
            clearWatchdog();
            watchdog = setTimeout(function () {
                if (cache.status === cache.IDLE ||
                    cache.status === cache.UPDATEREADY) {
                    finish();
                    beginAutoJailbreak();
                } else if (cache.status === cache.DOWNLOADING) {
                    armWatchdog();
                } else {
                    onError();
                }
            }, 60000);
        }

        cache.addEventListener(
            'downloading', onDownloading, false
        );
        cache.addEventListener('progress', onProgress, false);
        cache.addEventListener('cached', onCached, false);
        cache.addEventListener('noupdate', onReady, false);
        cache.addEventListener(
            'updateready', onUpdate, false
        );
        cache.addEventListener('error', onError, false);
        cache.addEventListener(
            'obsolete', onObsolete, false
        );

        if (cache.status === cache.UPDATEREADY) {
            onUpdate();
        } else if (cache.status === cache.IDLE) {
            finish();
            beginAutoJailbreak();
        } else if (cache.status === cache.CHECKING &&
                   !navigator.onLine) {
            finish();
            beginAutoJailbreak();
        } else if (cache.status === cache.CHECKING ||
                   cache.status === cache.DOWNLOADING ||
                   cache.status === cache.UNCACHED) {
            label.textContent =
                'Çevrimdışı hafıza bekleniyor...';
            armWatchdog();
        } else {
            finish();
            beginAutoJailbreak();
        }
    }

    if (uaElement) {
        uaElement.textContent =
            'Cihaz / Tarayıcı: ' + navigator.userAgent;
    }

    if (!detectSupportedPS4()) {
        checkbox.checked = false;
        checkbox.disabled = true;
        jailbreakButton.disabled = true;
        label.textContent =
            'Desteklenmeyen cihaz veya sürüm';
        appendOutput(
            '[-] Bu menü sadece PS4 6.00-11.02 sürümlerini destekler.'
        );
        return;
    }

    if (window.exploitChain === 'netctrl') {
        netctrlRadio.checked = true;
    } else {
        lapseRadio.checked = true;
    }
    checkbox.checked = autoJbValue;

    form.addEventListener('change', function (event) {
        if (event.target &&
            (event.target.value === 'lapse' ||
             event.target.value === 'netctrl')) {
            window.exploitChain = event.target.value;
            storageSet('exploitChain', window.exploitChain);
        }
    });

    jailbreakButton.addEventListener('click', function () {
        runJailbreak();
    });

    reloadButton.addEventListener('click', function () {
        stopCountdown();
        window.location.reload();
    });

    checkbox.addEventListener('change', function () {
        storageSet('autoJb', checkbox.checked);
        if (checkbox.checked) {
            autoStarted = false;
            startAutoJb();
        } else {
            autoStarted = false;
            stopCountdown();
        }
    });

    if (autoJbValue) startAutoJb();
}());
