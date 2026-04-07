/*
============================================================
WorkTimePreferences Prefab Script (FINAL STABLE VERSION)

Supports:
✔ compressed weekly input {startDate, prefs(672)}
✔ compressed single-day input {startDate, prefs(96)}
✔ expanded dataset array input
✔ router-safe rendering
✔ drag selection
✔ click selection
✔ readonly mode
✔ single-day mode
✔ compressed payload export
============================================================
*/

var EMPTY_PREFS = "N".repeat(96);


/* =========================================================
COLOR MAPS
========================================================= */

var PREF_COLOR_MAP = {
    prefer: "#4CAF50",
    dislike: "#FFCDD2",
    "no-preference": "#ffffff",
    "cannot-work": "#F44336"
};

var BORDER_COLOR_MAP = {
    prefer: "#388E3C",
    dislike: "#e57373",
    "no-preference": "#aaaaaa",
    "cannot-work": "#c62828"
};


/* =========================================================
DATA ACCESS
========================================================= */

Prefab._getWeekData = function () {

    if (!Prefab.Variables.weekPreferenceData)
        return null;

    return Prefab.Variables.weekPreferenceData.dataSet;
};


/* =========================================================
EXPAND COMPRESSED PREF STRING
========================================================= */

Prefab.expandCompressedPrefs = function (obj) {

    if (!obj || !obj.startDate || !obj.prefs)
        return null;

    var startDate = new Date(obj.startDate);

    if (isNaN(startDate.getTime()))
        return null;

    var DAY_SIZE = 96;

    var days = Math.ceil(obj.prefs.length / DAY_SIZE);

    var expanded = [];

    for (var i = 0; i < days; i++) {

        var d = new Date(startDate);

        d.setDate(startDate.getDate() + i);

        expanded.push({

            date: d.toISOString().slice(0, 10),

            prefs: obj.prefs.substring(
                i * DAY_SIZE,
                (i + 1) * DAY_SIZE
            ),

            employeeId: 1,
            companyId: 1,
            compression: 0,
            editedBy: 1
        });
    }

    return expanded;
};


/* =========================================================
PREF CHAR HELPERS
========================================================= */

function prefsCharToPref(ch) {

    if (ch === "P") return "prefer";
    if (ch === "D") return "dislike";
    if (ch === "C") return "cannot-work";

    return "no-preference";
}

function prefToChar(pref) {

    if (pref === "prefer") return "P";
    if (pref === "dislike") return "D";
    if (pref === "cannot-work") return "C";

    return "N";
}


/* =========================================================
UPDATE SLOT
========================================================= */

Prefab.updateSlot = function (dayIdx, hourIdx, slotIdx, pref) {

    if (Prefab.restrictedit)
        return;

    var ds = Prefab._getWeekData();

    if (!ds || !ds[dayIdx])
        return;

    var prefs = ds[dayIdx].prefs || EMPTY_PREFS;

    var index = hourIdx * 4 + slotIdx;

    ds[dayIdx].prefs =
        prefs.substring(0, index) +
        prefToChar(pref) +
        prefs.substring(index + 1);

    Prefab.paintSlot(dayIdx, hourIdx, slotIdx, pref);
};


/* =========================================================
PAINT SLOT
========================================================= */

Prefab.paintSlot = function (dayIdx, hourIdx, slotIdx, pref) {

    var widgetName = "d" + dayIdx + "h" + hourIdx + "s" + slotIdx;

    var widget = Prefab.Widgets[widgetName];

    if (!widget || !widget.$element)
        return;

    var el = widget.$element[0];

    el.style.backgroundColor = PREF_COLOR_MAP[pref];
    el.style.borderColor = BORDER_COLOR_MAP[pref];
};


/* =========================================================
PAINT GRID
========================================================= */

Prefab.applySlotColors = function () {

    var ds = Prefab._getWeekData();

    if (!ds)
        return;

    for (var d = 0; d < ds.length; d++) {

        if (!ds[d])
            continue;

        var prefs = ds[d].prefs || EMPTY_PREFS;

        for (var h = 0; h < 24; h++) {

            for (var s = 0; s < 4; s++) {

                Prefab.paintSlot(
                    d,
                    h,
                    s,
                    prefsCharToPref(prefs[h * 4 + s])
                );
            }
        }
    }
};


/* =========================================================
SAFE REFRESH PIPELINE
========================================================= */

Prefab.refreshWeekData = function () {

    requestAnimationFrame(function () {

        Prefab.applySlotColors();

    });
};


/* =========================================================
PROPERTY CHANGE HANDLER (ROUTER SAFE)
========================================================= */

Prefab.onPropertyChange = function (key, newVal) {

    if (key !== "weekpreferencedata" || !newVal)
        return;

    setTimeout(function () {

        var expanded = null;

        if (!Array.isArray(newVal)
            && newVal.startDate
            && newVal.prefs) {

            expanded =
                Prefab.expandCompressedPrefs(newVal);
        }

        else if (Array.isArray(newVal)) {

            expanded =
                JSON.parse(JSON.stringify(newVal));
        }

        if (!expanded)
            return;

        Prefab.Variables.weekPreferenceData.dataSet =
            expanded;

        Prefab.refreshWeekData();

    }, 0);
};


/* =========================================================
CLICK HANDLER
========================================================= */

Prefab.slotAreaClick = function ($event) {

    if (Prefab.restrictedit)
        return;

    var el = $event.target.closest("[data-day]");

    if (!el)
        return;

    Prefab.updateSlot(
        parseInt(el.dataset.day),
        parseInt(el.dataset.hour),
        parseInt(el.dataset.slot),
        Prefab._dragSelectedPreference
    );
};


/* =========================================================
DRAG SUPPORT
========================================================= */

Prefab._dragSelectedPreference = "prefer";
Prefab._mouseDown = false;

Prefab.initDrag = function () {

    var grid =
        document.querySelector(".time-grid-wrapper");

    if (!grid)
        return;

    grid.addEventListener("mousedown", function (e) {

        Prefab._mouseDown = true;

        Prefab.slotAreaClick(e);
    });

    grid.addEventListener("mousemove", function (e) {

        if (Prefab._mouseDown)
            Prefab.slotAreaClick(e);
    });

    document.addEventListener("mouseup", function () {

        Prefab._mouseDown = false;
    });
};


/* =========================================================
READONLY MODE
========================================================= */

Prefab.toggleReadOnly = function () {

    var grid =
        document.querySelector(".time-grid-wrapper");

    if (!grid)
        return;

    if (Prefab.restrictedit)
        grid.classList.add("read-only-grid");
    else
        grid.classList.remove("read-only-grid");
};


/* =========================================================
SINGLE DAY FILTER
========================================================= */

Prefab.showSingleDay = function () {

    var selected = Prefab._selectedDate;

    if (!selected)
        return;

    var ds = Prefab._getWeekData();

    if (!ds)
        return;

    for (var i = 0; i < ds.length; i++) {

        if (!Prefab.Widgets["dayRow" + i])
            continue;

        Prefab.Widgets["dayRow" + i].show =
            new Date(ds[i].date).toDateString() ===
            new Date(selected).toDateString();
    }
};


/* =========================================================
EXPORT COMPRESSED PAYLOAD
========================================================= */

Prefab.getPrefsPayload = function () {

    var ds = Prefab._getWeekData();

    if (!Array.isArray(ds) || ds.length === 0)
        return null;

    ds = ds.slice().sort(function (a, b) {

        return new Date(a.date) - new Date(b.date);

    });

    var combined = "";

    ds.forEach(function (day) {

        combined += (day.prefs || EMPTY_PREFS);

    });

    return {

        startDate: ds[0].date,

        prefs: combined
    };
};


/* =========================================================
INIT (ROUTER SAFE)
========================================================= */

Prefab.onReady = function () {

    Prefab.initDrag();

    setTimeout(function () {

        Prefab.refreshWeekData();

    }, 60);
};
