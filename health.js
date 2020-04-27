var health = health || (function() {

    'use strict';

    var updateToken = function(obj) {

        if(state.health.enabled !== true || obj.get("layer") !== "objects")  {
            log("Health Module Disabled or not on Objects layer: Enabled? " + state.health.enabled + " - Layer: " + obj.get("layer"));
            return;
        }
        
        var hp = getTokenHitPoints(obj);

        if(isNaN(hp.max) || isNaN(hp.value)) {
            log("Token hit points are NaN " + hp.value + " / " + hp.max);
            return;
        }

        var hpPercentage = calculatePercentage(hp);
        var hpColor = calculateHpColor(hpPercentage);

        log("Calculated % " + hpPercentage + " for HP " + hp.value + "/" + hp.max + " w/ color " + hpColor);

        obj.set({
            'aura1_radius': calculateAuraSize(obj, 1.8),
            'aura2_radius': calculateAuraSize(obj, 0.1),
            'showplayers_aura1': true,
            'showplayers_aura2': true, 
            'aura1_color': hpColor,
            'aura2_color': '#000000',
            'tint_color': 'transparent'
        });

        updateDeathStatus(obj, hp);
    };

    var getTokenHitPoints = function(token) {
        var hpBar = state.health.hpBar;
        var hp = {
            max: getTokenBarValue(token, hpBar + "_max"),
            value: getTokenBarValue(token, hpBar + "_value")
        };

        return hp;
    };

    var getTokenBarValue = function(token, attrName) {
        if(token.get(attrName) !== "") 
            return parseInt(token.get(attrName, 10));
        return NaN;
    };

    var calculatePercentage = function(hp) {
        return hp.max === 0 ? 0 : Math.round((hp.value/ hp.max) * 100);
    };

    var calculateHpColor = function(hpPercentage) {
        var r = 0, g = 0, b = 0;

        if(hpPercentage > 0) {
            if(hpPercentage > 100) {
                b = 255; 
            } else if(hpPercentage < 50) {
                g = Math.floor(255 * (hpPercentage/ 50));
                r = 255;
            } else {
                g = 255;
                r = hpPercentage == 100 ? 0 : Math.floor(255 * ((50 - hpPercentage % 50) / 50));
            }
        }

        log("Calculating color r=" + r + ", g=" + g + ", b=" + b);
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    var calculateAuraSize = function(token, factor) {
        var auraSize = state.health.auraSize;
        var page = getObj('page', token.get('_pageid'));
        var scale = page.get('scale_number') / 10;

        log('Calculating aura size with base of ' + auraSize + ' with page scale of ' + scale);

        return auraSize * scale * factor;
    };

    var updateDeathStatus = function(token, hp) {

        if(hp.value < 1) {
            token.set("status_dead", true);
        } else {
            token.set("status_dead", false);
        }
    }

    var handleInput = function(msg) {

        var msgParts = msg.content.split(/\s+/);
        var cmd = msgParts[0].toUpperCase();
        var option = msgParts[1] || "";

        if(msg.type === "api" && cmd.startsWith("!HEALTH")) {
            if(!playerIsGM(msg.playerid)) {
                sendChat('Health Module', "/w " + msg.who + " only for the GM!");
                return;
            }

            switch(option.toUpperCase()) {
                case "RESET":
                    delete state.health;
                    initialize();
                    break;
                case "ON":
                    if(_.isUndefined(state.health.enabled)) 
                        state.health.enabled = true;
                    else
                        state.health.enabled = !state.health.enabled;
                    sendChat('Health Module', "/w GM Heath Module is now " + (state.health.enabled ? "On" : "Off"));
                    break;
                case "SIZE":
                    state.health.auraSize = parseFloat(msgParts[2]);
                    break;
                default:
                    help();
                    break;
            }
        }
    };

    var help = function() {
        sendChat('Health Module', "/w GM <b><br>" + '<div style="border-radius: 8px 8px 8px 8px; ' + 
                    'padding: 5px; font-size: 9pt; box-shadow: 3px 3px 1px #707070; color:#000; ' + 
                    'border:2px solid black; text-align:right; vertical-align:middle;">' + 
                    '<u><big>Health Module!</u></big><br>' + 
                    'Is On: <a href="!health on">' + (state.health.enabled === true ? "Yes" : "No") + '</a><br>' + 
                    '<a href="!health reset">Reset</a><br>' + 
                    '!health size &lt;aura size | 0.7&gt;<br>' + 
                    "</div>");
    }

    var initialize = function() {
        
        log('Initializing Health Module');
        
        if(_.isUndefined(state.health)) 
            state.health = {};

        if(_.isUndefined(state.health.enabled))
            state.health.enabled = true;
        
        if(_.isUndefined(state.health.hpBar)) 
            state.health.hpBar = "bar1";

        if(_.isUndefined(state.health.auraSize))
            state.health.auraSize = 0.7;

        log("Health Module Enabled " + state.health.enabled);
        log("Health Module HP Bar " + state.health.hpBar);
        log("Health Module Aura Size " + state.health.auraSize);
    };

    var registerEventHandlers = function() {
        on('change:token', updateToken);
        on('chat:message', handleInput);
    };

    return {
        initialize: initialize,
        registerEventHandlers: registerEventHandlers
    };
}());

on('ready', function() {
    'use strict';

    health.initialize(); 
    health.registerEventHandlers();
});