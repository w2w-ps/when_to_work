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
    }

    // ✅ get dataset correctly
    var ds = Prefab._getWeekData();

    if (!ds || !ds[selectedDay]) return;

    // ✅ extract already-maintained 96-char string
    var prefs = ds[selectedDay].prefs || "N".repeat(96);

    // ✅ extract correct date
    var selectedDate = ds[selectedDay].date;

    // ✅ send correct payload
    if (Prefab.onClick) {

        Prefab.onClick({
            startDate: selectedDate,
            prefs: prefs
        });

    }
};

/* =========================================================
DRAG SUPPORT

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
