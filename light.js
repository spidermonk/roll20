on('ready', function() {
    'use strict';
    log('Initializing Light module');
    on('chat:message', function(msg) {
        var msgParts = msg.content.split(/\s+/);
        var cmd = msgParts[0];
        var brightDistance = msgParts[1] || "";
        var dimDistance = msgParts[2] || "";
        var display = msgParts.slice(3).join(" ") || "Creates a light";

        if(isNaN(brightDistance)) 
            brightDistance = 0

        if(isNaN(dimDistance)) 
            dimDistance = 0

        if('api' === msg.type && msg.content.match(/^!light/)) {
            _.chain(msg.selected)
                .map(s => getObj('graphic', s._id))
                .reject(_.isUndefined)
                .each( o => {
                    sendChat(o.get('name'), display)
                    o.set( {
                        'emits_bright_light': true,
                        'bright_light_distance': brightDistance,
                        'emits_low_light': true,
                        'low_light_distance': dimDistance
                    })
                })
        } else if('api' === msg.type && msg.content.match(/^!snuff/)) {
            _.chain(msg.selected)
                .map(s => getObj('graphic', s._id))
                .reject(_.isUndefined)
                .each( o => {
                    sendChat(o.get('name'), "extinguishes their light")
                    o.set( {
                        'emits_bright_light': false,
                        'emits_low_light': false,
                    })
                })
        }
    });
});
