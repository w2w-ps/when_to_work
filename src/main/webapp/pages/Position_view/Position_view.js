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
        screenNameFormat: "First Last"
    };
    try {
        const stored = localStorage.getItem('positionViewConfig');
        const parsed = stored ? JSON.parse(stored) : null;
        const configToApply = parsed ? Object.assign({}, DEFAULT_CONFIG, parsed) : DEFAULT_CONFIG;
        Page.Variables.positionViewConfig.dataSet = configToApply;
    } catch (e) {
        Page.Variables.positionViewConfig.dataSet = {
            screenShowDescription: true,
            screenHidePositions: true,
            screenShowDailyTotals: true,
            screenShowPositionTotals: true,
            screenNameFormat: "First Last"
        };
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
    const isNavigation = sessionStorage.getItem('positionViewConfigActive') === 'true';
    if (isNavigation) {
        sessionStorage.removeItem('positionViewConfigActive');
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
