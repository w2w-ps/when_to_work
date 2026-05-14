/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
Page.applyPositionViewConfig = function () {
    const DEFAULT_CONFIG = {
        screenShowDescription: true,
        screenHidePositions: true,
        screenShowDailyTotals: true,
        screenShowPositionTotals: true,
        screenNameFormat: "First Last",
        screenFontSize: "Medium"
    };
    try {
        const stored = localStorage.getItem('positionViewConfig');
        if (!stored) {
            localStorage.setItem('positionViewConfig', JSON.stringify(DEFAULT_CONFIG));
            Page.Variables.positionViewConfig.dataSet = DEFAULT_CONFIG;
        } else {
            const parsed = JSON.parse(stored);
            const configToApply = Object.assign({}, DEFAULT_CONFIG, parsed);
            if (!configToApply.screenNameFormat) {
                configToApply.screenNameFormat = "First Last";
            }
            Page.Variables.positionViewConfig.dataSet = configToApply;
        }
    } catch (e) {
        Page.Variables.positionViewConfig.dataSet = DEFAULT_CONFIG;
    }
};

Page.formatEmployeeName = function (item, format) {
    if (!item) { return ''; }
    const first = item.firstName || '';
    const last = item.lastName || '';
    const firstInitial = first ? first.charAt(0) + '.' : '';
    const lastInitial = last ? last.charAt(0) + '.' : '';
    const fmt = format || 'First Last';

    switch (fmt) {
        case 'First Last':   return (first + ' ' + last).trim();
        case 'First, last':  return first && last ? first + ', ' + last : (first || last);
        case 'First L.':     return (first + ' ' + lastInitial).trim();
        case 'F. last':      return (firstInitial + ' ' + last).trim();
        case 'last, F.':     return last && firstInitial ? last + ', ' + firstInitial : (last || first);
        default:             return (first + ' ' + last).trim();
    }
};

Page.onReady = function () {
    // Always reset screenNameFormat to "First Last" unless the user just explicitly saved
    // a new format from ConfigureByPositionView (indicated by positionViewConfigActive flag).
    const postSaveNav = sessionStorage.getItem('positionViewConfigActive') === 'true';

    if (postSaveNav) {
        // User just saved a config — honour their saved choice, clear the flag
        sessionStorage.removeItem('positionViewConfigActive');
    } else {
        // Fresh load or any other navigation — always reset name format to "First Last"
        try {
            const stored = localStorage.getItem('positionViewConfig');
            if (stored) {
                const parsed = JSON.parse(stored);
                parsed.screenNameFormat = "First Last";
                localStorage.setItem('positionViewConfig', JSON.stringify(parsed));
            }
        } catch (e) { /* ignore */ }
    }

    Page.applyPositionViewConfig();

    window.addEventListener('message', function (event) {
        if (event.data && event.data.type === 'positionViewConfigUpdated') {
            Page.applyPositionViewConfig();
        }
    });
};

Page.formatDateDisplay = function (dateStr) {
    if (!dateStr) {
        return '';
    }
    const parsed = moment(dateStr, 'YYYY-MM-DD', true);
    if (!parsed.isValid()) {
        return dateStr;
    }
    return parsed.format('MMM-DD');
};

Page.changeLayoutAnchorClick = function ($event, widget) {
    App.redirectTo("ConfigureByPositionView");
};
