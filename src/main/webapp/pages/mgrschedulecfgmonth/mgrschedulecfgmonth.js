/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
Page.onReady = function () {
    // Try localStorage first; fall back to in-memory app variable defaults
    let config = App.Variables.appSelectedGrouping.dataSet;
    const stored = localStorage.getItem('mgrScheduleCfgMonth');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            // Sync the app variable so BroadcastChannel consumers stay consistent
            App.Variables.appSelectedGrouping.setData(parsed);
            config = parsed;
        } catch (e) {
            // Corrupted storage — silently fall back to app variable defaults
            localStorage.removeItem('mgrScheduleCfgMonth');
        }
    }

    const GROUPING_REVERSE_MAP = {
        'position_shift_timings': 'Position',
        'category_shift_timings': 'Category',
        'cat_shift_timings': 'Cat',
        '': 'None'
    };

    // --- Screen View ---
    Page.Widgets.selStartOn.datavalue = config.startOn || 'Sunday';
    Page.Widgets.rsScreenGroupBy.datavalue = GROUPING_REVERSE_MAP[config.grouping] || 'Position';
    Page.Widgets.cbScreenShowDesc.datavalue = config.showDescription === true ? 'true' : 'false';
    Page.Widgets.cbScreenHideGroups.datavalue = config.hideGroupsNoShifts !== false ? 'true' : 'false';
    Page.Widgets.cbScreenShowCatPos.datavalue = config.showCatPos === true ? 'true' : 'false';
    Page.Widgets.selScreenName.datavalue = config.nameFormat || 'First Last';
    Page.Widgets.selScreenFontSize.datavalue = config.screenFontSize || 'Medium';

    // --- Printout ---
    Page.Widgets.rsPrintGroupBy.datavalue = GROUPING_REVERSE_MAP[config.printGrouping] || 'Position';
    Page.Widgets.cbPrintShowDesc.datavalue = config.printShowDescription !== false ? 'true' : 'false';
    Page.Widgets.cbPrintHideGroups.datavalue = config.printHideGroupsNoShifts !== false ? 'true' : 'false';
    Page.Widgets.cbPrintShowCatPos.datavalue = config.printShowCatPos !== false ? 'true' : 'false';
    Page.Widgets.cbPrintHideUnassigned.datavalue = config.printHideUnassigned === true ? 'true' : 'false';
    Page.Widgets.selPrintName.datavalue = config.printNameFormat || 'First Last';
    Page.Widgets.selPrintFontSize.datavalue = config.printFontSize || 'Small';
};

Page.btnSaveClick = function ($event, widget) {
    const GROUPING_MAP = {
        'Position': 'position_shift_timings',
        'Category': 'category_shift_timings',
        'Cat': 'cat_shift_timings',
        'None': ''
    };

    const newConfig = {
        // Screen View
        grouping: GROUPING_MAP.hasOwnProperty(Page.Widgets.rsScreenGroupBy.datavalue)
            ? GROUPING_MAP[Page.Widgets.rsScreenGroupBy.datavalue]
            : '',
        showDescription: Page.Widgets.cbScreenShowDesc.datavalue === true || Page.Widgets.cbScreenShowDesc.datavalue === 'true',
        hideGroupsNoShifts: Page.Widgets.cbScreenHideGroups.datavalue === true || Page.Widgets.cbScreenHideGroups.datavalue === 'true',
        showCatPos: Page.Widgets.cbScreenShowCatPos.datavalue === true || Page.Widgets.cbScreenShowCatPos.datavalue === 'true',
        nameFormat: Page.Widgets.selScreenName.datavalue,
        startOn: Page.Widgets.selStartOn.datavalue,
        screenFontSize: Page.Widgets.selScreenFontSize.datavalue,

        // Printout
        printGrouping: GROUPING_MAP.hasOwnProperty(Page.Widgets.rsPrintGroupBy.datavalue)
            ? GROUPING_MAP[Page.Widgets.rsPrintGroupBy.datavalue]
            : '',
        printShowDescription: Page.Widgets.cbPrintShowDesc.datavalue === true || Page.Widgets.cbPrintShowDesc.datavalue === 'true',
        printHideGroupsNoShifts: Page.Widgets.cbPrintHideGroups.datavalue === true || Page.Widgets.cbPrintHideGroups.datavalue === 'true',
        printShowCatPos: Page.Widgets.cbPrintShowCatPos.datavalue === true || Page.Widgets.cbPrintShowCatPos.datavalue === 'true',
        printHideUnassigned: Page.Widgets.cbPrintHideUnassigned.datavalue === true || Page.Widgets.cbPrintHideUnassigned.datavalue === 'true',
        printNameFormat: Page.Widgets.selPrintName.datavalue,
        printFontSize: Page.Widgets.selPrintFontSize.datavalue
    };

    // Update app variable
    App.Variables.appSelectedGrouping.setData(newConfig);
    // Persist to localStorage so config survives navigation and browser refresh
    localStorage.setItem('mgrScheduleCfgMonth', JSON.stringify(newConfig));
    console.log('Sending:', newConfig);

    /* ---------- BroadcastChannel ---------- */
    if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('calendar_channel');
        bc.postMessage({
            type: 'GROUPING_UPDATED',
            data: newConfig
        });
        bc.close();
    }

    /* ---------- Close Popup ---------- */
    setTimeout(function () {
        window.close();
    }, 300);
};
