/*
 * ============================================================
 * WorkTimePreferences Prefab
 * Refactored Version (Angular-free + crash-safe)
 * ============================================================
 */

var EMPTY_PREFS = "N".repeat(96);

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


/* ============================================================
   DATASET ACCESS
============================================================ */

Prefab._getWeekData = function () {
    return Prefab.Variables.weekPreferenceData
        ? Prefab.Variables.weekPreferenceData.dataSet
        : null;
};

Prefab._setWeekData = function (ds) {

    if (!Array.isArray(ds) || ds.length === 0) return;

    Prefab.Variables.weekPreferenceData.dataSet =
        JSON.parse(JSON.stringify(ds));

    // Only repaint when dataset meaningful
    if (ds.length >= 1) {
        Prefab.refreshWeekData();
    }
};


/* ============================================================
   PREF CONVERSION
============================================================ */

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


/* ============================================================
   SLOT UPDATE ENGINE
============================================================ */

Prefab.updateSlot = function (dayIdx, hourIdx, slotIdx, pref) {

    if (Prefab.restrictedit) return;

    var ds = Prefab._getWeekData();

    if (!ds || !ds[dayIdx]) return;

    var prefs = ds[dayIdx].prefs || EMPTY_PREFS;

    var index = hourIdx * 4 + slotIdx;

    ds[dayIdx].prefs =
        prefs.substring(0, index) +
        prefToChar(pref) +
        prefs.substring(index + 1);

    Prefab.paintSlot(dayIdx, hourIdx, slotIdx, pref);
};


/* ============================================================
   SLOT PAINTER
============================================================ */

Prefab.paintSlot = function (dayIdx, hourIdx, slotIdx, pref) {

    var widgetName = "d" + dayIdx + "h" + hourIdx + "s" + slotIdx;

    var widget = Prefab.Widgets[widgetName];

    if (!widget || !widget.$element) return;

    var el = widget.$element[0];

    el.style.backgroundColor = PREF_COLOR_MAP[pref];
    el.style.borderColor = BORDER_COLOR_MAP[pref];
};


/* ============================================================
   GRID PAINTER (SAFE VERSION)
============================================================ */

Prefab.applySlotColors = function () {

    var ds = Prefab._getWeekData();

    if (!ds || !Array.isArray(ds)) return;

    for (var d = 0; d < 7; d++) {

        if (!ds[d]) continue;   // prevents crash

        var prefs = ds[d].prefs || EMPTY_PREFS;

        for (var h = 0; h < 24; h++) {

            for (var s = 0; s < 4; s++) {

                var pref =
                    prefsCharToPref(prefs[h * 4 + s]);

                Prefab.paintSlot(d, h, s, pref);
            }
        }
    }
};


/* ============================================================
   REFRESH PIPELINE
============================================================ */

Prefab.refreshWeekData = function () {

    Prefab.applySlotColors();
};


/* ============================================================
   PROPERTY CHANGE HANDLER
============================================================ */

Prefab.onPropertyChange = function (key, newVal) {

    switch (key) {

        case "weekpreferencedata":

            Prefab._setWeekData(newVal);

            break;


        case "restrictedit":

            Prefab.toggleReadOnly();

            break;


        case "singleday":

            if (newVal && Prefab.choosedate) {

                Prefab.showSingleDay();
            }

            break;
    }
};


/* ============================================================
   SLOT CLICK HANDLER
============================================================ */

Prefab.slotAreaClick = function ($event) {

    if (Prefab.restrictedit) return;

    var el = $event.target.closest("[data-day]");

    if (!el) return;

    var d = parseInt(el.dataset.day);
    var h = parseInt(el.dataset.hour);
    var s = parseInt(el.dataset.slot);

    Prefab.updateSlot(
        d,
        h,
        s,
        Prefab._dragSelectedPreference
    );
};

Prefab.dayLabelClick = function (dayIndex) {
    var ds = Prefab._getWeekData();
    if (!ds) { return; }
    var dayData = ds[dayIndex];
    if (!dayData) { return; }
    var isoDate = dayData.date || '';

    /* ── READ-ONLY MODE: select the date, do NOT navigate ── */
    if (Prefab.restrictedit) {
        if (!isoDate) { return; }
        var selectedDate = new Date(isoDate + 'T00:00:00');
        if (isNaN(selectedDate.getTime())) { return; }
        // Update the startDatePicker widget to reflect the clicked row's date
        if (Prefab.Widgets && Prefab.Widgets.startDatePicker) {
            Prefab.Widgets.startDatePicker.datavalue = selectedDate;
        }
        // Sync the weekDay form field and weekDaySelect to match the selected date
        var jsDay = selectedDate.getDay();
        var wmDayIndex = jsDay === 0 ? 6 : jsDay - 1;
        var fullDayName = FULL_DAY_NAMES[wmDayIndex];
        var formDs = Prefab.Variables.worktimepreference && Prefab.Variables.worktimepreference.dataSet;
        if (formDs) { formDs.weekDay = fullDayName; }
        if (Prefab.Widgets && Prefab.Widgets.weekDaySelect) {
            Prefab.Widgets.weekDaySelect.datavalue = fullDayName;
        }
        // Store the selected date for use by showpreferenceTap and other handlers
        debugger
        Prefab._selectedDate = selectedDate;

        if (Prefab.onClick) {
            Prefab.onClick(null, Prefab._selectedDate);
        }
        return Prefab._selectedDate; // Do NOT navigate in read-only mode

    }
}

/* ============================================================
   DRAG SUPPORT
============================================================ */

Prefab._dragSelectedPreference = "prefer";
Prefab._mouseDown = false;

Prefab.initDrag = function () {

    var grid =
        document.querySelector(".time-grid-wrapper");

    if (!grid) return;

    grid.addEventListener("mousedown", function (e) {

        Prefab._mouseDown = true;

        Prefab.slotAreaClick(e);
    });

    grid.addEventListener("mousemove", function (e) {

        if (Prefab._mouseDown) {

            Prefab.slotAreaClick(e);
        }
    });

    document.addEventListener("mouseup", function () {

        Prefab._mouseDown = false;
    });
};


/* ============================================================
   READONLY MODE
============================================================ */

Prefab.toggleReadOnly = function () {

    var grid =
        document.querySelector(".time-grid-wrapper");

    if (!grid) return;

    if (Prefab.restrictedit)
        grid.classList.add("read-only-grid");
    else
        grid.classList.remove("read-only-grid");
};


/* ============================================================
   SINGLE DAY FILTER
============================================================ */

Prefab.showSingleDay = function () {

    var selected = Prefab._selectedDate;

    if (!selected) return;

    var ds = Prefab._getWeekData();

    if (!ds) return;

    for (var i = 0; i < ds.length; i++) {

        if (!Prefab.Widgets["dayRow" + i]) continue;

        Prefab.Widgets["dayRow" + i].show =
            new Date(ds[i].date).toDateString() ===
            new Date(selected).toDateString();
    }
};


/* ============================================================
   PREF STRING EXPANDER
============================================================ */

Prefab.buildHoursFromPrefs = function (prefs) {

    var hours = [];

    for (var h = 0; h < 24; h++) {

        var slots = [];

        for (var s = 0; s < 4; s++) {

            slots.push({
                preference:
                    prefsCharToPref(prefs[h * 4 + s])
            });
        }

        hours.push({ slots: slots });
    }

    return hours;
};


/* ============================================================
   API DATA LOADER
============================================================ */

Prefab.loadWeekPreferenceData = function (rawDays) {

    if (!Array.isArray(rawDays)) return;

    var ds = Prefab._getWeekData();

    if (!ds) return;

    rawDays.forEach(function (apiDay) {

        for (var i = 0; i < ds.length; i++) {

            if (ds[i] && ds[i].date === apiDay.date) {

                ds[i].companyId = apiDay.companyId;
                ds[i].employeeId = apiDay.employeeId;
                ds[i].prefs = apiDay.prefs || EMPTY_PREFS;
                ds[i].compression = apiDay.compression;
                ds[i].editedBy = apiDay.editedBy;

                ds[i].hours =
                    Prefab.buildHoursFromPrefs(
                        apiDay.prefs || EMPTY_PREFS
                    );

                break;
            }
        }
    });

    Prefab.refreshWeekData();
};


/* ============================================================
   INIT
============================================================ */

Prefab.onReady = function () {

    Prefab.initDrag();

    var ds = Prefab._getWeekData();

    if (ds && ds.length) {

        Prefab.refreshWeekData();
    }
};
