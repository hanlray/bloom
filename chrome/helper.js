/**
 * Created by ray on 8/14/2015.
 */

function scriptFromFile(file) {
    var script = document.createElement("script");
    script.src = chrome.extension.getURL(file);
    return script;
}

function inject(scripts) {
    if (scripts.length === 0)
        return;
    var otherScripts = scripts.slice(1);
    var script = scripts[0];
    var onload = function() {
        script.parentNode.removeChild(script);
        inject(otherScripts);
    };
    if (script.src != "") {
        script.onload = onload;
        document.head.appendChild(script);
    } else {
        document.head.appendChild(script);
        onload();
    }
}
