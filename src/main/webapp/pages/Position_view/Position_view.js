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
        screenShowPositionTotals: true
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
            screenShowPositionTotals: true
        };
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
