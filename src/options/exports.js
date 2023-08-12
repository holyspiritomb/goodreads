$(document).delegate('#exportBox', 'input', function () {
    $('#exportBox').html($(this).val());
});

$(document).ready(function () {
    $("#exportButton").click(function () {
        chrome.storage.sync.get("libraries", function (obj) {
            let libraries = JSON.stringify(obj);
            $("#exportBox").text(libraries);
        });
    });

    $("#importButton").click(function () {
        let libraries = $("#exportBox").text();
        libraries = JSON.parse(libraries);
        chrome.storage.sync.set(libraries);
    });
});
