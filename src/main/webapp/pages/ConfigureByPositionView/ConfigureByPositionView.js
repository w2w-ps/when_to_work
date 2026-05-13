/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
Page.onReady = function () {
    const DEFAULT_POSITION_VIEW_CONFIG = {
        screenShowDescription: true,
        screenHidePositions: true,
        screenShowDailyTotals: true,
        screenShowPositionTotals: true,
        screenNameFormat: "First Last",
        screenFontSize: "Medium"
    };

    let storedConfig = {};
    try {
        const stored = localStorage.getItem('positionViewConfig');
        storedConfig = stored ? JSON.parse(stored) : {};
    } catch (e) {
        storedConfig = {};
    }

    const config = Object.assign({}, DEFAULT_POSITION_VIEW_CONFIG, storedConfig);

    Page.Widgets.screenShowDescription.datavalue = config.screenShowDescription;
    Page.Widgets.screenHidePositions.datavalue = config.screenHidePositions;
    Page.Widgets.screenShowDailyTotals.datavalue = config.screenShowDailyTotals;
    Page.Widgets.screenShowPositionTotals.datavalue = config.screenShowPositionTotals;
    Page.Widgets.screenFontSelect.datavalue = config.screenFontSize;

    // screenNameSelect uses a bound variable dataset (bind:Variables.stvNameList.dataSet)
    // which resolves asynchronously. Defer the assignment until after the dataset is ready.
    const $timeout = App.getDependency('$timeout');
    $timeout(function () {
        Page.Widgets.screenNameSelect.datavalue = config.screenNameFormat;
    }, 0);
};

Page.saveBtnClick = function ($event, widget) {
    const config = {
        screenShowDescription: Page.Widgets.screenShowDescription.datavalue,
        screenHidePositions: Page.Widgets.screenHidePositions.datavalue,
        screenShowDailyTotals: Page.Widgets.screenShowDailyTotals.datavalue,
        screenShowPositionTotals: Page.Widgets.screenShowPositionTotals.datavalue,
        screenNameFormat: Page.Widgets.screenNameSelect.datavalue,
        screenFontSize: Page.Widgets.screenFontSelect.datavalue
    };
    localStorage.setItem('positionViewConfig', JSON.stringify(config));
    sessionStorage.setItem('positionViewConfigActive', 'true');

    if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'positionViewConfigUpdated' }, '*');
    }
    window.close();
};
Page.anchor1Click = function ($event, widget) {
    window.close();
};
