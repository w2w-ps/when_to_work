/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
Page.onReady = function () {
    /*
     * svGetAllPositionsByCompanyId is App-scoped with startUpdate:true, so it fires
     * at app load before any page opens. By the time Page.onReady runs, its dataSet
     * should already be populated. We read it directly and fall back to a fresh invoke
     * only if it is genuinely empty (e.g. first load race condition or API error).
     */
    const appVar = App.Variables.svGetAllPositionsByCompanyId;
    const existing = appVar.dataSet && appVar.dataSet.positions;

    if (existing && existing.length) {
        Page.Variables.sortedPositionsList.dataSet = existing.slice();
    } else {
        // Data not yet available — re-invoke with success callback to seed the list
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

/* Attach HTML5 drag-and-drop reordering to the rendered list items */
Page.positionsListRender = function ($data) {
    const listWidget = Page.Widgets.positionsList;
    if (!listWidget || !listWidget.$element) {
        return;
    }

    const $listItems = listWidget.$element.find('.app-list-item');
    let dragSrcIndex = null;

    $listItems.each(function (index, item) {
        const $item = $(item);

        // Remove previous listeners to avoid duplicates on re-render
        $item.off('dragstart dragover dragleave drop dragend');
        $item.attr('draggable', 'true');

        $item.on('dragstart', function (e) {
            dragSrcIndex = index;
            e.originalEvent.dataTransfer.effectAllowed = 'move';
            $item.addClass('dragging');
        });

        $item.on('dragover', function (e) {
            e.preventDefault();
            e.originalEvent.dataTransfer.dropEffect = 'move';
            $item.addClass('drag-over');
        });

        $item.on('dragleave', function () {
            $item.removeClass('drag-over');
        });

        $item.on('drop', function (e) {
            e.preventDefault();
            $item.removeClass('drag-over');
            const dropIndex = index;
            if (dragSrcIndex === null || dragSrcIndex === dropIndex) {
                dragSrcIndex = null;
                return;
            }
            const currentData = Page.Variables.sortedPositionsList.dataSet.slice();
            const moved = currentData.splice(dragSrcIndex, 1)[0];
            currentData.splice(dropIndex, 0, moved);
            Page.Variables.sortedPositionsList.dataSet = currentData;
            dragSrcIndex = null;
        });

        $item.on('dragend', function () {
            $item.removeClass('dragging');
            $listItems.removeClass('drag-over');
            dragSrcIndex = null;
        });
    });
};
