const EMPTY_PREFS = "N".repeat(96);


/* =========================================================
COLOR MAPS
========================================================= */

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


/* =========================================================
PREFERENCE SELECTION STATE
========================================================= */

Prefab._dragSelectedPreference = "P";
Prefab.editedrows = Prefab.editedrows || [];

const RADIO_LABEL_TO_PREF = {
    "Prefer": "P",
    "Dislike": "D",
    "No Preference": "N",
    "Cannot Work": "C"
};

const PREF_TO_RADIO_LABEL = {
    P: "Prefer",
    D: "Dislike",
    N: "No Preference",
    C: "Cannot Work"
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

    if (isNaN(startDate.getTime())) {
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
TRIGGER PREFAB CHANGE EVENT
========================================================= */

Prefab._triggerOnChange = function () {

    if (typeof Prefab.onChange !== "function") return;

    Prefab.onChange({
        weekpreferencedata: Prefab._getWeekData(),
        editedrows: Prefab.editedrows
    });
};


/* =========================================================
TRACK EDITED DAYS
========================================================= */

Prefab._markDayAsEdited = function (dayIdx) {

    const ds = Prefab._getWeekData();

    if (!ds?.[dayIdx]?.date) return;

    const exists = Prefab.editedrows.some(
        r => r.dataValue === dayIdx
    );

    if (!exists) {

        Prefab.editedrows.push({
            dataValue: dayIdx
        });

        Prefab.highlightEditedDayLabels();
    }
};


/* =========================================================
UPDATE SLOT
========================================================= */

Prefab.updateSlot = function (dayIdx, hourIdx, slotIdx, prefChar) {

    if (Prefab.isReadOnly()) return;

    const ds = Prefab._getWeekData();

    if (!ds?.[dayIdx]) return;

    const prefs = ds[dayIdx].prefs || EMPTY_PREFS;

    const index = hourIdx * 4 + slotIdx;

    if (index < 0 || index >= 96) return;

    if (prefs[index] === prefChar) return;

    ds[dayIdx].prefs =
        prefs.substring(0, index) +
        prefChar +
        prefs.substring(index + 1);

    Prefab.paintSlot(dayIdx, hourIdx, slotIdx, prefChar);

    Prefab._markDayAsEdited(dayIdx);

    Prefab._triggerOnChange();
};


/* =========================================================
PAINT SLOT
========================================================= */

Prefab.paintSlot = function (dayIdx, hourIdx, slotIdx, prefChar) {

    const widget =
        Prefab.Widgets["d" + dayIdx + "h" + hourIdx + "s" + slotIdx];

    if (!widget?.$element) return;

    const el = widget.$element[0];

    el.style.backgroundColor = PREF_COLOR_MAP[prefChar];
    el.style.borderColor = BORDER_COLOR_MAP[prefChar];
};


/* =========================================================
PAINT GRID
========================================================= */

Prefab.applySlotColors = function () {

    const ds = Prefab._getWeekData();

    if (!ds) return;

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
REFRESH DATA
========================================================= */
Prefab.refreshWeekData = function () {

    requestAnimationFrame(() => {

        Prefab.applySlotColors();

        requestAnimationFrame(() => {

            if (Prefab._selectedDate) {

                Prefab.showSingleDay();

            } else {

                Prefab.showAllDays();
            }

        });

    });
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
PROPERTY CHANGE HANDLER
========================================================= */

Prefab.onPropertyChange = function (key, newVal) {

    /* ── Highlight edited rows if updated ── */

    if (key === "editedrows") {

        Prefab.highlightEditedDayLabels();

        return;
    }


    /* ── Handle preference dataset updates ── */

    if (key !== "weekpreferencedata" || !newVal) {

        return;
    }


    let expanded;


    /* ── Case 1: compressed payload format
       Example:
       {
         startDate: "2026-04-12",
         prefs: "96 or 672 chars"
       }
    */

    if (!Array.isArray(newVal)) {

        expanded = Prefab.expandCompressedPrefs(newVal);

        if (!expanded) return;

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


    /* ── Apply dataset to Prefab variable ── */

    Prefab.Variables.weekPreferenceData.dataSet = expanded;


    /* ── Refresh UI (colors + row visibility) ── */

    Prefab.refreshWeekData();
};


/* =========================================================
CLICK HANDLER
========================================================= */

Prefab.slotAreaClick = function ($event) {

    const el = $event.target.closest("[data-day]");

    if (!el) return;

    const d = +el.dataset.day;
    const h = +el.dataset.hour;
    const s = +el.dataset.slot;

    const ds = Prefab._getWeekData();

    if (!ds?.[d]) return;

    /* ── READ-ONLY MODE: expose event only ── */

    if (Prefab.isReadOnly()) {

        if (typeof Prefab.onClick === "function") {

            Prefab.onClick({
                startDate: ds[d].date,
                prefs: ds[d].prefs || EMPTY_PREFS
            });
        }

        return;
    }

    /* ── EDIT MODE: allow drag updates only ── */

    Prefab.updateSlot(
        d,
        h,
        s,
        Prefab._dragSelectedPreference
    );
};


/* =========================================================
DRAG SUPPORT
========================================================= */

Prefab._mouseDown = false;

Prefab.initDrag = function () {

    const grid =
        document.querySelector(".time-grid-wrapper");

    if (!grid) return;

    grid.addEventListener("mousedown", e => {

        if (Prefab.isReadOnly()) return;

        Prefab._mouseDown = true;

        Prefab.slotAreaClick(e);
    });

    grid.addEventListener("mousemove", e => {

        if (Prefab._mouseDown) {

            Prefab.slotAreaClick(e);
        }
    });

    document.addEventListener("mouseup", () => {

        Prefab._mouseDown = false;
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


/* =========================================================
INIT
========================================================= */

Prefab.onReady = function () {

    Prefab.initDefaults();
    Prefab.initDrag();
    Prefab.highlightEditedDayLabels();
    Prefab.initLegendControls();
};


/* =========================================================
RADIO CHANGE HANDLER
========================================================= */

Prefab.preferenceTypeRadioChange = function ($event, widget, newVal) {

    if (!newVal) return;

    const mapped =
        RADIO_LABEL_TO_PREF[newVal.trim()];

    if (mapped) {
        Prefab._dragSelectedPreference = mapped;
    }
};


/* =========================================================
LEGEND CONTROLS
========================================================= */

Prefab.initLegendControls = function () {

    const legendButtons = [
        { name: "legendPreferBtn", pref: "P" },
        { name: "legendDislikeBtn", pref: "D" },
        { name: "legendNoPrefBtn", pref: "N" },
        { name: "legendCannotWorkBtn", pref: "C" }
    ];

    legendButtons.forEach(cfg => {

        const btn =
            document.querySelector(`[name="${cfg.name}"]`);

        if (!btn) return;

        btn.addEventListener("click", () => {

            Prefab._dragSelectedPreference = cfg.pref;

            if (Prefab.Widgets?.preferenceTypeRadio) {

                Prefab.Widgets.preferenceTypeRadio.datavalue =
                    PREF_TO_RADIO_LABEL[cfg.pref];
            }
        });
    });
};


/* =========================================================
LEGEND CLICK HANDLERS
========================================================= */

Prefab.legendPreferBtnClick = () =>
    Prefab._dragSelectedPreference = "P";

Prefab.legendDislikeBtnClick = () =>
    Prefab._dragSelectedPreference = "D";

Prefab.legendNoPrefBtnClick = () =>
    Prefab._dragSelectedPreference = "N";

Prefab.legendCannotWorkBtnClick = () =>
    Prefab._dragSelectedPreference = "C";
