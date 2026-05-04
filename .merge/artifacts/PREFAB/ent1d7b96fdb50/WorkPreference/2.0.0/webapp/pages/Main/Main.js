/* =========================================================
CONSTANTS
========================================================= */

const EMPTY_PREFS = "N".repeat(96);

const PREF_COLOR_MAP = {
    P: "#90f68e",
    D: "#ffaeae",
    N: "#ffffff",
    C: "#ff0000"
};

const BORDER_COLOR_MAP = {
    P: "#388E3C",
    D: "#e57373",
    N: "#aaaaaa",
    C: "#c62828"
};

const RADIO_LABEL_TO_PREF = {
    Prefer: "P",
    Dislike: "D",
    "No Preference": "N",
    "Cannot Work": "C"
};

const PREF_TO_RADIO_LABEL = {
    P: "Prefer",
    D: "Dislike",
    N: "No Preference",
    C: "Cannot Work"
};

const WEEK_ORDER = [
    "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday", "Sunday"
];


/* =========================================================
STATE
========================================================= */

Prefab._dragSelectedPreference = "P";
Prefab.editedrows = [];


/* =========================================================
INIT
========================================================= */

Prefab.onReady = function () {

    Prefab.restrictedit = !!Prefab.restrictedit;

    Prefab.initDrag();

    Prefab.initLegendControls();

    Prefab.highlightEditedDayLabels();
};


/* =========================================================
UTILS
========================================================= */

Prefab.isReadOnly = function () {
    return Prefab.restrictedit;
};

Prefab._getWeekData = function () {
    return Prefab.Variables.weekPreferenceData?.dataSet || [];
};


/* =========================================================
DATA NORMALIZATION (CORE FIX)
========================================================= */

Prefab.normalizeWeekPreferenceData = function (data) {

    if (!data) return null;

    const DAY_SIZE = 96;

    /* repeatweekly */

    if (Prefab.usagecontext === "emppreferencesrepeat") {

        if (!data.startDate || !data.prefs) return null;

        return WEEK_ORDER.map((day, i) => ({
            date: null,
            day: day,
            dayKey: day,
            prefs:
                data.prefs.substring(
                    i * DAY_SIZE,
                    (i + 1) * DAY_SIZE
                ) || EMPTY_PREFS
        }));
    }

    /* daypref */

    if (Prefab.usagecontext === "emppreferencesday") {

        return [{
            ...data,
            dayKey: data.day,
            prefs: data.prefs || EMPTY_PREFS
        }];
    }

    /* datepref */

    if (Prefab.usagecontext === "emppreferences") {

        return data.map(row => ({

            ...row,   // preserve everything

            dayKey:
                row.day ||
                new Date(row.date)
                    .toLocaleDateString("en-US",
                        { weekday: "long" }),

            prefs: row.prefs || EMPTY_PREFS
        }));
    }

    return null;
};


/* =========================================================
PROPERTY CHANGE HANDLER
========================================================= */
Prefab.onPropertyChange = function (key, newVal) {

    if (key === "editedrows") {

        Prefab.highlightEditedDayLabels();
        return;
    }

    if (key !== "weekpreferencedata" || !newVal)
        return;

    /* IMPORTANT: skip normalization if update came internally */

    if (Prefab._internalUpdate) {
        return;
    }

    const normalized =
        Prefab.normalizeWeekPreferenceData(newVal);

    if (!normalized) return;

    Prefab.Variables.weekPreferenceData.dataSet =
        normalized;

    if (Prefab.usagecontext === "emppreferencesday") {

        Prefab._selectedDate =
            newVal.date || null;

    } else if (Prefab.usagecontext === "emppreferencesrepeat") {

        Prefab._selectedDate = null;

    } else if (Prefab.usagecontext === "emppreferences") {

        Prefab._selectedDate =
            Array.isArray(newVal) && newVal.length === 1
                ? newVal[0].date
                : null;
    }

    Prefab.refreshWeekData();
};


/* =========================================================
PAINT SLOT
========================================================= */

Prefab.paintSlot = function (d, h, s, pref) {

    const widget =
        Prefab.Widgets[`d${d}h${h}s${s}`];

    if (!widget?.$element) return;

    const el = widget.$element[0];

    el.style.backgroundColor =
        PREF_COLOR_MAP[pref];

    el.style.borderColor =
        BORDER_COLOR_MAP[pref];
};


/* =========================================================
APPLY GRID COLORS
========================================================= */

Prefab.applySlotColors = function () {

    const ds = Prefab._getWeekData();

    if (!ds.length) return;

    for (let d = 0; d < ds.length; d++) {

        const prefs =
            ds[d].prefs || EMPTY_PREFS;

        for (let i = 0; i < 96; i++) {

            const h = Math.floor(i / 4);

            const s = i % 4;

            Prefab.paintSlot(
                d,
                h,
                s,
                prefs[i]
            );
        }
    }
};


/* =========================================================
REFRESH UI
========================================================= */

Prefab.refreshWeekData = function () {

    const ds = Prefab._getWeekData();

    if (!ds || !ds.length) return;

    requestAnimationFrame(() => {

        Prefab.applySlotColors();

        /* =====================================
           CONTROL ROW VISIBILITY BY MODE
        ===================================== */

        if (Prefab.usagecontext === "emppreferencesrepeat") {

            Prefab.showAllDays();

        } else if (Prefab.usagecontext === "emppreferencesday") {

            Prefab.showOnlyFirstRow();

        } else if (Prefab.usagecontext === "emppreferences") {

            if (ds.length === 1) {

                Prefab.showOnlyFirstRow();

            } else {

                Prefab.showMatchingDateRows();
            }
        }
    });
};

Prefab.showOnlyFirstRow = function () {

    for (let i = 0; i < 7; i++) {

        const row =
            Prefab.Widgets["dayRow" + i];

        if (!row) continue;

        row.show = (i === 0);
    }
};


Prefab.showMatchingDateRows = function () {

    const ds = Prefab._getWeekData();

    if (!ds) return;

    for (let i = 0; i < 7; i++) {

        const row =
            Prefab.Widgets["dayRow" + i];

        if (!row) continue;

        row.show = !!ds[i];
    }
};
/* =========================================================
ROW VISIBILITY
========================================================= */

Prefab.showSingleDay = function () {

    const ds = Prefab._getWeekData();

    if (!ds || !ds.length) return;

    /* SINGLE-DAY MODE */

    if (ds.length === 1) {

        for (let i = 0; i < 7; i++) {

            const row =
                Prefab.Widgets["dayRow" + i];

            if (!row) continue;

            row.show = (i === 0);
        }

        return;
    }

    /* MULTI-DAY MODE */

    const selected = Prefab._selectedDate;

    if (!selected) return;

    for (let i = 0; i < 7; i++) {

        const row =
            Prefab.Widgets["dayRow" + i];

        if (!row) continue;

        row.show =
            ds[i] &&
            new Date(ds[i].date).toDateString() ===
            new Date(selected).toDateString();
    }
};

Prefab.showAllDays = function () {

    for (let i = 0; i < 7; i++) {

        const row =
            Prefab.Widgets[`dayRow${i}`];

        if (row) row.show = true;
    }
};


/* =========================================================
UPDATE SLOT
========================================================= */

Prefab.updateSlot = function (dayIdx, hourIdx, slotIdx, prefChar) {

    if (Prefab.isReadOnly()) return;

    const ds = Prefab.Variables.weekPreferenceData.dataSet;

    if (!ds || !ds[dayIdx]) return;

    let prefs = ds[dayIdx].prefs;

    if (!prefs || prefs.length !== 96) {
        prefs = EMPTY_PREFS;
    }

    const index = hourIdx * 4 + slotIdx;

    prefs =
        prefs.substring(0, index) +
        prefChar +
        prefs.substring(index + 1);

    ds[dayIdx].prefs = prefs;

    Prefab.paintSlot(dayIdx, hourIdx, slotIdx, prefChar);

    /* NEW: update outward binding immediately */

    Prefab._triggerOnChange();
};


/* =========================================================
CLICK HANDLER
========================================================= */

Prefab.slotAreaClick = function (e) {

    const el = e.target.closest("[data-day]");

    if (!el) return;

    const d = +el.dataset.day;
    const h = +el.dataset.hour;
    const s = +el.dataset.slot;

    const ds = Prefab._getWeekData();

    if (!ds?.[d]) return;

    /* =========================================
       READ-ONLY MODE → expose click event
    ========================================= */

    if (Prefab.isReadOnly()) {

        if (typeof Prefab.onClick === "function") {

            Prefab.onClick({

                dayIndex: d,

                hourIndex: h,

                slotIndex: s,

                startDate: ds[d].date || null,
                selectedDay: ds[d].day,
                selectedDate: ds[d].date || null,



                prefs: ds[d].prefs || EMPTY_PREFS,

                slotValue:
                    ds[d].prefs?.[h * 4 + s] || "N"
            });
        }

        return;
    }

    /* =========================================
       EDIT MODE → update slot normally
    ========================================= */

    Prefab.updateSlot(
        d,
        h,
        s,
        Prefab._dragSelectedPreference
    );
    if (!Prefab._mouseDown) {
        Prefab._triggerOnChange();
    }
};


/* =========================================================
DRAG SUPPORT
========================================================= */

Prefab._mouseDown = false;

Prefab.initDrag = function () {

    const grid =
        document.querySelector(
            ".time-grid-wrapper"
        );

    if (!grid) return;

    grid.addEventListener("mousedown",
        e => {

            Prefab._mouseDown = true;

            Prefab.slotAreaClick(e);
        });

    grid.addEventListener("mousemove",
        e => {

            if (Prefab._mouseDown)
                Prefab.slotAreaClick(e);
        });

    document.addEventListener("mouseup", () => {

        if (Prefab._mouseDown) {

            Prefab._mouseDown = false;

            Prefab._triggerOnChange();
        }
    });
};


/* =========================================================
LEGEND BUTTON SUPPORT
========================================================= */

Prefab.initLegendControls = function () {

    [
        { name: "legendPreferBtn", pref: "P" },
        { name: "legendDislikeBtn", pref: "D" },
        { name: "legendNoPrefBtn", pref: "N" },
        { name: "legendCannotWorkBtn", pref: "C" }
    ].forEach(cfg => {

        const btn =
            document.querySelector(
                `[name="${cfg.name}"]`
            );

        if (!btn) return;

        btn.addEventListener("click",
            () => {

                Prefab._dragSelectedPreference =
                    cfg.pref;

                Prefab.Widgets
                    .preferenceTypeRadio
                    .datavalue =
                    PREF_TO_RADIO_LABEL[
                    cfg.pref
                    ];
            });
    });
};


/* =========================================================
FORM ADD BUTTON
========================================================= */
function parseMinuteSlot(minStr) {

    const map = {
        "00": 0,
        "15": 1,
        "30": 2,
        "45": 3
    };

    return map.hasOwnProperty(String(minStr))
        ? map[String(minStr)]
        : 0;
}
function parsePrefLabel(label) {

    const map = {
        "Prefer": "P",
        "Dislike": "D",
        "No Preference": "N",
        "Cannot Work": "C"
    };

    return map[String(label).trim()] || "N";
}
Prefab.addPreferenceBtnClick = function () {

    if (Prefab._isReadOnly) return;

    const ds = Prefab._getWeekData();

    if (!ds || !ds.length) return;

    /* =====================================
       READ VALUES FROM WIDGETS
    ===================================== */

    const prefType =
        Prefab.Widgets.preferenceTypeRadio?.datavalue;

    const beginHour =
        Prefab.Widgets.beginHourSelect?.datavalue;

    const beginMinute =
        Prefab.Widgets.beginMinuteSelect?.datavalue || "00";

    const endHour =
        Prefab.Widgets.endHourSelect?.datavalue;

    const endMinute =
        Prefab.Widgets.endMinuteSelect?.datavalue || "00";

    let selectedWeekDay =
        Prefab.Widgets.weekDaySelect?.datavalue;

    if (!selectedWeekDay && Prefab._selectedDate) {

        selectedWeekDay =
            FULL_DAY_NAMES[
            (new Date(Prefab._selectedDate).getDay() + 6) % 7
            ];
    }

    if (!prefType || !beginHour || !endHour) {

        alert("Please fill all required fields.");
        return;
    }

    function parseHourLabel(label) {

        if (!label) return NaN;

        let str = String(label)
            .trim()
            .toUpperCase()
            .replace(/(\d)(AM|PM)/, "$1 $2");

        const match =
            str.match(/^(\d+)\s+(AM|PM)$/);

        if (!match) return NaN;

        let hour =
            parseInt(match[1], 10);

        if (match[2] === "AM") {

            if (hour === 12) hour = 0;

        } else {

            if (hour !== 12) hour += 12;
        }

        return hour;
    }

    /* =====================================
       RESOLVE ROW INDEX RELIABLY
    ===================================== */

    const normalize = v =>
        String(v || "")
            .trim()
            .toLowerCase()
            .slice(0, 3);

    let dayEntryIndex = -1;

    for (let i = 0; i < ds.length; i++) {

        const row = ds[i];

        if (!row) continue;

        /* match using date */

        if (row.date) {

            const rowDay =
                FULL_DAY_NAMES[
                (new Date(row.date).getDay() + 6) % 7
                ];

            if (normalize(rowDay) === normalize(selectedWeekDay)) {

                dayEntryIndex = i;
                break;
            }
        }

        /* fallback match using dayKey if exists */

        if (row.dayKey &&
            normalize(row.dayKey) === normalize(selectedWeekDay)) {

            dayEntryIndex = i;
            break;
        }
    }

    /* single-day dataset fallback */

    if (dayEntryIndex === -1 && ds.length === 1) {

        dayEntryIndex = 0;
    }

    if (dayEntryIndex === -1) {

        alert("Selected day not found in grid.");
        return;
    }

    /* =====================================
       TIME PARSERS
    ===================================== */

    const beginHourIdx =
        parseHourLabel(beginHour);

    const beginSlotIdx =
        parseMinuteSlot(beginMinute);

    const endHourIdx =
        parseHourLabel(endHour);

    const endSlotIdx =
        parseMinuteSlot(endMinute);

    const prefValue =
        parsePrefLabel(prefType);

    if (isNaN(beginHourIdx) ||
        isNaN(endHourIdx)) {

        alert("Invalid hour selection.");
        return;
    }

    if (!prefValue) {

        alert("Invalid preference type.");
        return;
    }

    const beginAbsolute =
        beginHourIdx * 4 + beginSlotIdx;

    let endAbsolute =
        endHourIdx * 4 + endSlotIdx;
    /* =====================================
HANDLE SAME START & END TIME
Example: 3:00AM → 3:00AM means till midnight
===================================== */

    if (beginAbsolute === endAbsolute) {
        endAbsolute = 96;
    }

    if (beginAbsolute > endAbsolute) {

        alert("Begin time must be before End time.");
        return;
    }

    /* =====================================
       APPLY SLOT RANGE
    ===================================== */

    for (let absSlot = beginAbsolute;
        absSlot < endAbsolute;
        absSlot++) {

        const h =
            Math.floor(absSlot / 4);

        const s =
            absSlot % 4;

        Prefab.updateSlot(
            dayEntryIndex,
            h,
            s,
            prefValue
        );
    }

    /* =====================================
       REFRESH GRID
    ===================================== */

    Prefab.applySlotColors();

    Prefab._triggerOnChange();


};


/* =========================================================
CHANGE EVENT EMITTER
========================================================= */

Prefab._internalUpdate = false;

Prefab._triggerOnChange = function () {

    const updatedData = Prefab._getWeekData();

    Prefab._internalUpdate = true;

    Prefab.weekpreferencedata =
        JSON.parse(JSON.stringify(updatedData));

    Prefab._internalUpdate = false;

    if (typeof Prefab.onChange !== "function") return;

    Prefab.onChange({
        weekpreferencedata: updatedData,
        editedrows: Prefab.editedrows
    });
};

/* =========================================================
HIGHLIGHT EDITED DAY LABELS
========================================================= */

Prefab.highlightEditedDayLabels = function () {

    const TOTAL_DAYS = 7;

    for (let i = 0; i < TOTAL_DAYS; i++) {

        const widget =
            Prefab.Widgets["dayLabel" + i];

        if (widget?.$element) {

            widget.$element[0].style.backgroundColor = "";
            widget.$element[0].style.color = "";
        }
    }

    (Prefab.editedrows || []).forEach(rowObj => {

        const dayIdx = rowObj.dataValue;

        const labelWidget =
            Prefab.Widgets["dayLabel" + dayIdx];

        if (labelWidget?.$element) {

            labelWidget.$element[0].style.backgroundColor = "#BFBFFF";
            labelWidget.$element[0].style.color = "white";
        }
    });
};
Prefab.preferenceTypeRadioChange = function ($event, widget, newVal, oldVal) {
    if (!newVal) return;

    const prefChar = RADIO_LABEL_TO_PREF[newVal];

    if (!prefChar) return;

    Prefab._dragSelectedPreference = prefChar;
};
