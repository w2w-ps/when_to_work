const EMPTY_PREFS = "N".repeat(96);


/* =========================================================
COLOR MAPS
========================================================= */

const PREF_COLOR_MAP = {
    P: "#4CAF50",
    D: "#FFCDD2",
    N: "#ffffff",
    C: "#F44336"
};

const BORDER_COLOR_MAP = {
    P: "#388E3C",
    D: "#e57373",
    N: "#aaaaaa",
    C: "#c62828"
};


/* =========================================================
DEFAULT PROPERTY INITIALIZATION
========================================================= */

Prefab.initDefaults = function () {
    Prefab.restrictedit = !!Prefab.restrictedit;
};

Prefab.isReadOnly = function () {
    return Prefab.restrictedit;
};


/* =========================================================
DATA ACCESS
========================================================= */

Prefab._getWeekData = function () {
    return Prefab.Variables.weekPreferenceData
        ? Prefab.Variables.weekPreferenceData.dataSet
        : null;
};


/* =========================================================
EXPAND COMPRESSED PREF STRING
========================================================= */

Prefab.expandCompressedPrefs = function (obj) {

    if (!obj?.startDate || !obj?.prefs) {
        return null;
    }

    const startDate = new Date(obj.startDate);

    if (Number.isNaN(startDate)) {
        return null;
    }

    const DAY_SIZE = 96;
    const days = Math.ceil(obj.prefs.length / DAY_SIZE);
    const expanded = [];

    for (let i = 0; i < days; i++) {

        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);

        expanded.push({
            date: d.toISOString().slice(0, 10),
            prefs: obj.prefs.substring(i * DAY_SIZE, (i + 1) * DAY_SIZE)
        });
    }

    return expanded;
};


/* =========================================================
UPDATE SLOT
========================================================= */

Prefab.updateSlot = function (dayIdx, hourIdx, slotIdx, prefChar) {

    if (Prefab.isReadOnly()) {
        return;
    }

    const ds = Prefab._getWeekData();

    if (!ds?.[dayIdx]) {
        return;
    }

    const prefs = ds[dayIdx].prefs || EMPTY_PREFS;
    const index = hourIdx * 4 + slotIdx;

    ds[dayIdx].prefs =
        prefs.substring(0, index) +
        prefChar +
        prefs.substring(index + 1);

    Prefab.paintSlot(dayIdx, hourIdx, slotIdx, prefChar);
};


/* =========================================================
PAINT SLOT
========================================================= */

Prefab.paintSlot = function (dayIdx, hourIdx, slotIdx, prefChar) {

    const widget =
        Prefab.Widgets["d" + dayIdx + "h" + hourIdx + "s" + slotIdx];

    if (!widget?.$element) {
        return;
    }

    const el = widget.$element[0];

    el.style.backgroundColor = PREF_COLOR_MAP[prefChar];
    el.style.borderColor = BORDER_COLOR_MAP[prefChar];
};


/* =========================================================
PAINT GRID
========================================================= */

Prefab.applySlotColors = function () {

    const ds = Prefab._getWeekData();

    if (!ds) {
        return;
    }

    for (let d = 0; d < ds.length; d++) {

        const prefs = ds[d].prefs || EMPTY_PREFS;

        for (let h = 0; h < 24; h++) {

            for (let s = 0; s < 4; s++) {

                Prefab.paintSlot(
                    d,
                    h,
                    s,
                    prefs[h * 4 + s]
                );
            }
        }
    }
};


/* =========================================================
DAY VISIBILITY CONTROL
========================================================= */

Prefab.showSingleDay = function () {

    const selected = Prefab._selectedDate;
    const ds = Prefab._getWeekData();

    if (!selected || !ds) {
        return;
    }

    for (let i = 0; i < 7; i++) {

        const row = Prefab.Widgets["dayRow" + i];

        if (row) {

            row.show =
                ds[i] &&
                new Date(ds[i].date).toDateString() ===
                new Date(selected).toDateString();
        }
    }
};


Prefab.showAllDays = function () {

    for (let i = 0; i < 7; i++) {

        const row = Prefab.Widgets["dayRow" + i];

        if (row) {
            row.show = true;
        }
    }
};


/* =========================================================
SAFE REFRESH PIPELINE
========================================================= */

Prefab.refreshWeekData = function () {

    requestAnimationFrame(() => {

        Prefab.applySlotColors();

        Prefab._selectedDate
            ? Prefab.showSingleDay()
            : Prefab.showAllDays();

    });
};


/* =========================================================
PROPERTY CHANGE HANDLER
========================================================= */

Prefab.onPropertyChange = function (key, newVal) {

    if (key === "editedrowsindex") {
        Prefab.highlightEditedDayLabels();
        return;
    }

    if (key !== "weekpreferencedata" || !newVal) {
        return;
    }

    let expanded;

    if (!Array.isArray(newVal)) {

        expanded = Prefab.expandCompressedPrefs(newVal);

        Prefab._selectedDate =
            newVal.prefs.length === 96
                ? newVal.startDate
                : null;

    } else {

        expanded = JSON.parse(JSON.stringify(newVal));

        Prefab._selectedDate =
            expanded.length === 1
                ? expanded[0].date
                : null;
    }

    if (!expanded) {
        return;
    }

    Prefab.Variables.weekPreferenceData.dataSet = expanded;

    Prefab.refreshWeekData();
};


/* =========================================================
CLICK HANDLER
========================================================= */

Prefab.slotAreaClick = function ($event) {

    const el = $event.target.closest("[data-day]");

    if (!el) {
        return;
    }

    const d = +el.dataset.day;
    const h = +el.dataset.hour;
    const s = +el.dataset.slot;

    if (!Prefab.isReadOnly()) {
        Prefab.updateSlot(d, h, s, "P");
    }

    const ds = Prefab._getWeekData();

    if (!ds?.[d]) {
        return;
    }

    if (Prefab.onClick) {

        Prefab.onClick({
            startDate: ds[d].date,
            prefs: ds[d].prefs || EMPTY_PREFS
        });
    }
};


/* =========================================================
DRAG SUPPORT
========================================================= */

Prefab._mouseDown = false;

Prefab.initDrag = function () {

    const grid =
        document.querySelector(".time-grid-wrapper");

    if (!grid) {
        return;
    }

    grid.addEventListener("mousedown", (e) => {

        if (Prefab.isReadOnly()) {
            return;
        }

        Prefab._mouseDown = true;
        Prefab.slotAreaClick(e);

    });

    grid.addEventListener("mousemove", (e) => {

        if (Prefab._mouseDown) {
            Prefab.slotAreaClick(e);
        }

    });

    document.addEventListener("mouseup", () => {

        Prefab._mouseDown = false;

    });
};


/* =========================================================
EXPORT COMPRESSED PAYLOAD
========================================================= */

Prefab.getPrefsPayload = function () {

    const ds = Prefab._getWeekData();

    if (!ds?.length) {
        return null;
    }

    ds.sort((a, b) =>
        new Date(a.date) - new Date(b.date)
    );

    return {
        startDate: ds[0].date,
        prefs: ds
            .map(d => d.prefs || EMPTY_PREFS)
            .join("")
    };
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

    (Prefab.editedrowsindex || [])
        .forEach(rowObj => {

            const dayIdx = rowObj.dataValue;

            const labelWidget =
                Prefab.Widgets["dayLabel" + dayIdx];

            if (labelWidget?.$element) {

                labelWidget.$element[0].style.backgroundColor = "purple";
                labelWidget.$element[0].style.color = "white";

            }
        });
};


/* =========================================================
INIT
========================================================= */

Prefab.onReady = function () {

    Prefab.initDefaults();
    Prefab.initDrag();
    Prefab.highlightEditedDayLabels();

};
