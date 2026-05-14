Page.onReady = function () {
    const DEFAULT_POSITION_VIEW_CONFIG = {
        screenShowDescription: true,
        screenHidePositions: true,
        screenShowDailyTotals: true,
        screenShowPositionTotals: true,
        screenNameFormat: 'First Last',
        screenFontSize: 'Medium'
    };

    const VALID_NAME_FORMATS = ['First Last', 'First, last', 'First L.', 'F. last', 'last, F.'];

    let storedConfig = {};
    try {
        const stored = localStorage.getItem('positionViewConfig');
        storedConfig = stored ? JSON.parse(stored) : {};
    } catch (e) {
        storedConfig = {};
    }

    const config = Object.assign({}, DEFAULT_POSITION_VIEW_CONFIG, storedConfig);

    if (!config.screenNameFormat || VALID_NAME_FORMATS.indexOf(config.screenNameFormat) === -1) {
        config.screenNameFormat = DEFAULT_POSITION_VIEW_CONFIG.screenNameFormat;
    }

    Page.Widgets.screenShowDescription.datavalue = config.screenShowDescription;
    Page.Widgets.screenHidePositions.datavalue = config.screenHidePositions;
    Page.Widgets.screenShowDailyTotals.datavalue = config.screenShowDailyTotals;
    Page.Widgets.screenShowPositionTotals.datavalue = config.screenShowPositionTotals;
    Page.Widgets.screenFontSelect.datavalue = config.screenFontSize;
    Page.Widgets.screenNameSelect.datavalue = config.screenNameFormat;
};

Page.saveBtnClick = function ($event, widget) {
    const DEFAULT_POSITION_VIEW_CONFIG = {
        screenShowDescription: true,
        screenHidePositions: true,
        screenShowDailyTotals: true,
        screenShowPositionTotals: true,
        screenNameFormat: 'First Last',
        screenFontSize: 'Medium'
    };

    let existingNameFormat = DEFAULT_POSITION_VIEW_CONFIG.screenNameFormat;
    try {
        const existing = localStorage.getItem('positionViewConfig');
        if (existing) {
            const parsed = JSON.parse(existing);
            if (parsed.screenNameFormat) {
                existingNameFormat = parsed.screenNameFormat;
            }
        }
    } catch (e) {}

    const config = {
        screenShowDescription: Page.Widgets.screenShowDescription.datavalue,
        screenHidePositions: Page.Widgets.screenHidePositions.datavalue,
        screenShowDailyTotals: Page.Widgets.screenShowDailyTotals.datavalue,
        screenShowPositionTotals: Page.Widgets.screenShowPositionTotals.datavalue,
        screenNameFormat: Page.Widgets.screenNameSelect.datavalue || existingNameFormat,
        screenFontSize: Page.Widgets.screenFontSelect.datavalue || DEFAULT_POSITION_VIEW_CONFIG.screenFontSize
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
