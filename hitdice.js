var hitdice = hitdice || (function() {

    'use strict';

    var rollHitDice = function(msg, override, clear) {

        var tokens = [];
        
        if(!_.isUndefined(msg.selected) && msg.selected.length > 0) {
            log("Using selected tokens only");
            _.each(msg.selected, function(t) {
                tokens.push(getTokenForSelected(t));
            });
        } else {
            log("Using all tokens on players page");
            tokens = findObjs({                              
              _pageid: Campaign().get("playerpageid"),                              
              _type: "graphic",
              _subtype: "token"
            });                
        }
        
        var monsters = tokens.filter(function(t) {
            var characterId = t.get("represents");
            return !_.isUndefined(t) && 
                        !_.isUndefined(characterId) && characterId !== "" &&
                        isCharacterNpc(t);
        });
        
        if(clear) {
            log("Clearing hit points for " + monsters.length + " monsters");
        } else {
            if(override) {
                log("Overriding hit dice for " + monsters.length + " monsters");
            } else {
                log("Rolling hit dice for " + monsters.length + " monsters");
            }
        }
        
        _.each(monsters, function(t) {
            updateTokenHitpoints(t, override, clear);
        });
    }

    var getTokenForSelected = function(selected) {
        if(selected._type === 'graphic') {
            var graphic = getObj(selected._type, selected._id);
            if(graphic.get("_subtype") === 'token' && !_.isUndefined(graphic.get("represents"))) {
                return graphic;
            }
        }
        return undefined;
    }

    var isCharacterNpc = function(token) {
        var isNpc = getAttrByName(token.get("represents"), "npc", "current");
        return isNpc === "1";
    }
    
    var updateTokenHitpoints = function(token, override, clear) {
        var hpBar = state.hitdice.hpBar;
                    
        if(clear) {
            var hp = {};
            hp[hpBar + "_value"] = "";
            hp[hpBar + "_max"]  = "";
            token.set(hp);
        } else if(!isTokenHpSet(token) || override) {
            var hpFormula = getAttrByName(token.get("represents"), "npc_hpformula", "current");
            if(!_.isUndefined(hpFormula)) {
                sendChat('Hit Dice Module', '/gmroll ' + hpFormula, function(ops) {
                    var results = JSON.parse(ops[0].content);
                    var roll = parseInt(results.total, 10);
                    var hp = {};
                    hp[hpBar + "_value"] = roll;
                    hp[hpBar + "_max"]  = roll;
                    token.set(hp);
                });
            }
        }
    }

    var isTokenHpSet = function(token) {
        var hp = getTokenHitPoints(token);
        return !_.isUndefined(hp.value) && !isNaN(hp.value);
    }

    var getTokenHitPoints = function(token) {
        var hpBar = state.hitdice.hpBar;
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

    var handleInput = function(msg) {
        var msgParts = msg.content.split(/\s+/);
        var cmd = msgParts[0].toUpperCase();
        var option = (msgParts[1] || "").toUpperCase();
        
        if(msg.type === "api" && cmd.startsWith("!HD")) {
            if(!playerIsGM(msg.playerid)) {
                sendChat('Hit Dice Module', "/w " + msg.who + " only for the GM!");
                return;
            }
            
            rollHitDice(msg, option === "OVER", option === "CLEAR");
        }
    };

    var registerEventHandlers = function() {
        on('chat:message', handleInput);
    };

    var initialize = function() {

        log("Initializing Hit Dice Module");

        if(_.isUndefined(state.hitdice)) 
            state.hitdice = {};

        var hpBar = 'bar1';
        if(!_.isUndefined(state.health))
            if(!_.isUndefined(state.health.hpBar))
                hpBar = state.health.hpBar;

        if(_.isUndefined(state.hitdice.hpBar))
            state.hitdice.hpBar = hpBar;
    }

    return {
        initialize: initialize,
        registerEventHandlers: registerEventHandlers
    };

}());

on("ready", function() {
    'use strict';

    hitdice.initialize();
    hitdice.registerEventHandlers();
});