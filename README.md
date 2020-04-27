# roll20
Roll20 APIs

# Overview
Each javascript file is an independent API that can be installed on Roll20 (https://roll20.net/welcome)

To use APIs requires the Pro level paid subscription from Roll20. 

To install, open your campaign (not launching it) and go to the Settings dropdown and select API Scripts. Once on the API Scripts page click New Script. Name the script the same as the file from this repo you are uploading. Then copy the contents of the javascript file into the script body and save it. 

# Hit Dice Module (hitdice.js)
Module rolls hit points for NPC characters using their hit dice formula.

Pre-requisites:
* NPC journals (monsters) have the following attributes:
    * npc attribute with a value of 1
    * npc_hpformula attribute with a roll expression to calculate hit points with (e.g. 2d6+2)
* Token for the monster has been properly linked to the journal entry 
    * Token's Represents Character points at the journal entry
    * Journal's Default Token (Edit button) points at the same token
* Token's Bar 1 has not been linked to any of the NPC's attributes
    * TODO make this bar configurable
* Tokens for the NPC/monster have been dropped onto the page on either the objects and gm layers

*NOTE: if you are also using the Health Module the Hit Dice Module will default ot using the same token bar for hit points as the health module*

## Using the Hit Dice Module
The Hit Dice Module offers two modes of operation:
* Selected NPC tokens
* All NPC tokens on the current player page (unselect all tokens to use this mode)

Note calculating an NPC's hit points will set both its current max to the new value.

In the chat window you can type the following command to calculate hit points for your NPCs/monsters. 
*NOTE: Only tokens that represent a character that is marked as an NPC with a valid npc_hpformula attribute will be updated*
* `!hd` will calculate hit points using the npc_hpformula attribute for any NPC token (selected or all) if their current HP has not been set already (token's HP bar). If they are already set then they will be left untouched. 
* `!hd over` will do the same as `!hd` but will also calculate hit points for NPCs if their current hit points have already been effectively overriding any previous values.
* `!hd clear` will clear the current/max hit points for the NPCs (blanking them out)
