var initiative = initiative || (function() {

    'use strict';

    var rollInitiative = function(msg) {

        var tokens = [];
        
        if(!_.isUndefined(msg.selected) && msg.selected.length > 0) {
            log("Rolling initiative using selected tokens only");
            _.each(msg.selected, function(t) {
                var token = getTokenForSelected(t);
                if(!_.isUndefined(token)) {
                    tokens.push(token);
                }
            });
        } else {
            log("Rolling initiative for all tokens on players page");
            tokens = findObjs({                              
              _pageid: Campaign().get("playerpageid"),                              
              _type: "graphic",
              _subtype: "token"
            });                
        }
        
        log("Rolling initiative for " + tokens.length + " potential tokens");

        var monsters = tokens.filter(function(t) {
            var characterId = t.get("represents");
            var monster = !_.isUndefined(characterId) && characterId !== "" &&
                        isCharacterNpc(characterId);
            if(!monster) 
                log("Excluding token " + t.get("_id") + " for character " + characterId);
            else 
                log("Including token " + t.get("_id") + " for character " + characterId);
                
            return monster;
        });

        var rolls = {};
        _.each(monsters, function(t) {
            var characterId = t.get("represents");
            if(characterId in rolls === false) {
                var roll = rollInitiativeForCharacter(characterId);
                log('Rolled init of ' + roll);
                rolls[characterId] = roll;
            }
        });

        for(var key in rolls) {
            updateInitiative(key, rolls[key]);
        }
    }

    var isCharacterNpc = function(characterId) {
        var character = getObj('character', characterId);
        var controlledBy = character.get('controlledby');

        if(_.isUndefined(controlledBy) || controlledBy === '') {
            log('Character has no controlled by setting so is an NPC');
            return true;
        }
        var controlledByArr = controlledBy.split(',');
        if(controlledByArr.length === 1) {
            if(controlledByArr[0] !== 'all' && playerIsGM(controlledByArr[0])) {
                log('Controlling character is the GM so character is an NPC');
                return true;
            }
        }
        
        log('Controlling character is set and is not GM so character is not an NPC');
        return false;
    }

    var getTokenForSelected = function(selected) {
        log('token type ' + selected._type);
        log('graphic ' + getObj(selected._type, selected._id));
        if(selected._type === 'graphic') {
            var graphic = getObj(selected._type, selected._id);
            log('sub type ' + graphic.get("_subtype"));
            log("represents " + graphic.get("represents"));
            if(graphic.get("_subtype") === 'token' && !_.isUndefined(graphic.get("represents"))) {
                return graphic;
            }
        }
        return undefined;
    }

    var rollInitiativeForCharacter = function(characterId) {
        var dexMod = getAttributeValue(characterId, 'dexterity_mod');
        var roll = randomInteger(20);
        log('Rolled ' + roll + ' with dex mod of ' + dexMod);
        return roll + (isNaN(dexMod) ? 0 : parseInt(dexMod));
    }

    var getAttributeValue = function(characterId, attrName) {
        var attr = findObjs({
            _type: "attribute",
            _characterid: characterId,
            name: attrName
        });
        if(!_.isUndefined(attr) && attr.length > 0) {
            return attr[0].get("current");
        }
        return undefined;
    }

    var updateInitiative = function(characterId, roll) {
        var character = getObj('character', characterId);
        var name = character.get("name");
        sendChat('Initiative Module', '/w gm ' + name + " rolled initiative " + roll);
        log(Campaign().get("turnorder"));
        var turns = JSON.parse(Campaign().get("turnorder"));
        var updated = false;
        if(turns !== "") {
            for(var i=0; i<turns.length; i++) {
                var turn = turns[i];
                if(turn.id === characterId || turn.custom === name) {
                    turn.pr = roll;
                    updated = true;
                }
            }
        }

        if(!updated) {
            turns.push({
                id: '-1',
                pr: roll,
                custom: name
            });
        }

        Campaign().set('turnorder', JSON.stringify(turns));
    }

    var handleInput = function(msg) {

        var msgParts = msg.content.split(/\s+/);
        var cmd = msgParts[0].toUpperCase();
        
        if(msg.type === "api" && cmd.startsWith("!INIT")) {
            if(!playerIsGM(msg.playerid)) {
                sendChat('Initiative Module', "/w " + msg.who + " only for the GM!");
                return;
            }

            rollInitiative(msg);
        }
    };

    var registerEventHandlers = function() {
        on('chat:message', handleInput);
    };

    var initialize = function() {
        log("Initializing Initiative Module");
    }

    return {
        initialize: initialize,
        registerEventHandlers: registerEventHandlers
    };

}());


on("ready", function() {
    'use strict';
    initiative.initialize();
    initiative.registerEventHandlers();
});
