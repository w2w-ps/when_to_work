/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* Holds the MutationObserver watching the positions list <ul> */
Page._positionsListObserver = null;

/* perform any action on widgets/variables within this block */
Page.onReady = function () {
    Page.deletedPosition = [];
    const appVar = App.Variables.svGetAllPositionsByCompanyId;
    const existing = appVar.dataSet && appVar.dataSet.positions;

    if (existing && existing.length) {
        Page.Variables.sortedPositionsList.dataSet = existing.slice();
    } else {
        appVar.invoke(
            {},
            function (data) {
                const positions = data && data.positions;
                if (positions && positions.length) {
                    Page.Variables.sortedPositionsList.dataSet = positions.slice();
                }
            }
        );
    }
};

/* Sort alphabetically by description (case-insensitive) */
Page.sortAlphabeticallyAnchorClick = function ($event, widget) {
    const sorted = Page.Variables.sortedPositionsList.dataSet.slice();
    sorted.sort(function (a, b) {
        return a.description.toLowerCase().localeCompare(b.description.toLowerCase());
    });
    Page.Variables.sortedPositionsList.dataSet = sorted;
};

/*
 * _resetListItemCursors
 * Removes any inline cursor style SortableJS injects on <li> rows so that
 * only the .drag-handle icon shows the grab cursor (enforced via CSS !important).
 */
Page._resetListItemCursors = function (listEl) {
    if (!listEl) { return; }
    const items = listEl.querySelectorAll('li');
    items.forEach(function (li) {
        li.style.removeProperty('cursor');
    });
};

/*
 * _patchSortableHandle
 * Attempts to set the SortableJS handle option so drag only starts from
 * the .drag-handle icon. WaveMaker may store the Sortable instance on the
 * element under different keys depending on version — we try all known ones.
 */
Page._patchSortableHandle = function (listEl) {
    if (!listEl) { return; }
    const sortable = listEl._sortable || listEl.__sortable || listEl.sortable;
    if (sortable && typeof sortable.option === 'function') {
        sortable.option('handle', '.drag-handle');
    }
};

/*
 * positionsListRender — called by WaveMaker after the list renders.
 *
 * Uses Page.Widgets.positionsList.$element to reliably locate the <ul>,
 * then attaches a MutationObserver to continuously strip the inline
 * cursor:grab that SortableJS re-applies on every render/reorder cycle.
 */
Page.positionsListRender = function ($event, widget) {
    const listEl = Page.Widgets.positionsList && Page.Widgets.positionsList.$element;
    if (!listEl) { return; }

    const ulEl = listEl.find('ul')[0];
    if (!ulEl) { return; }

    // Disconnect any previous observer
    if (Page._positionsListObserver) {
        Page._positionsListObserver.disconnect();
        Page._positionsListObserver = null;
    }

    function resetCursors() {
        ulEl.querySelectorAll('li').forEach(function (li) {
            li.style.removeProperty('cursor');
        });
    }

    // Run immediately
    resetCursors();

    // Also run after a short delay to catch SortableJS late initialization
    setTimeout(resetCursors, 100);
    setTimeout(resetCursors, 300);

    // Watch for SortableJS re-applying inline cursor styles
    const observer = new MutationObserver(function (mutations) {
        let needsReset = false;
        mutations.forEach(function (mutation) {
            if (
                mutation.type === 'attributes' &&
                mutation.attributeName === 'style' &&
                mutation.target.tagName === 'LI'
            ) {
                needsReset = true;
            }
            if (mutation.type === 'childList') {
                needsReset = true;
            }
        });
        if (needsReset) {
            resetCursors();
        }
    });

    observer.observe(ulEl, {
        attributes: true,
        attributeFilter: ['style'],
        childList: true,
        subtree: true
    });

    Page._positionsListObserver = observer;
};

/*
 * positionsListReorder — called by WaveMaker's native enablereorder after
 * the user drags a list item to a new position.
 */
Page.positionsListReorder = function ($event, $data, $changedItem) {
    Page.Variables.sortedPositionsList.dataSet = $data;

    /*
     * TODO: Wire a save-order API call here once a bulk position-order
     * endpoint is available on the backend.
     *
     * No bulk position-order REST service exists in this project at this time.
     * The only position-related write APIs are:
     *   - updatePosition  (PUT /positions/{positionId}) — single-item update
     *   - deletePosition  (DELETE)
     *   - createPosition  (POST)
     * None of these accept a bulk ordered list.
     *
     * When the backend exposes such an endpoint, create a ServiceVariable
     * (e.g. svSavePositionOrder) and invoke it here, e.g.:
     *
     *   Page.Variables.svSavePositionOrder.setInput({
     *       positions: $data.map(function (p, i) {
     *           return { positionId: p.positionId, sortOrder: i };
     *       })
     *   });
     *   Page.Variables.svSavePositionOrder.invoke();
     */
};

Page.deleteSelectedBtnTopClick = function ($event, widget) {
    if (Page.deletedPosition.length > 0) {
        Page.Widgets.dialog2.open();
    }
};

Page.checkbox1Change = function ($event, widget, item, currentItemWidgets, newVal, oldVal) {
    if (newVal) {
        Page.deletedPosition.push(item);
    } else {
        let index = Page.deletedPosition.findIndex(position => position.positionId === item.positionId);
        if (index !== -1) {
            Page.deletedPosition.splice(index, 1);
        }
    }
};
Page.button7Click = function ($event, widget) {
    Page.positionIds = "";
    Page.deletedPosition.forEach(function (position) {
        Page.positionIds = (Page.positionIds ? Page.positionIds + "," : "") + position.positionId;
    });
    Page.Variables.svDeletePosition.dataBinding.positionId = Page.positionIds;
    Page.Variables.svDeletePosition.invoke();

};
Page.editPositionOkBtnClick = function ($event, widget) {
    Page.Variables.svUpdatePosition.invoke();
};
