'use strict';
// Contract for connecting NOVERA baseline to the project's existing MySQL layer.
// Implement these methods using the already configured pool/connection rather than opening a second DB stack.
module.exports={
 async loadCharacter(accountId,slot){throw new Error('DB adapter not connected');},
 async saveCharacter(character){throw new Error('DB adapter not connected');},
 async loadInventory(characterId){throw new Error('DB adapter not connected');},
 async saveInventory(characterId,items){throw new Error('DB adapter not connected');},
 async loadVehicles(characterId){throw new Error('DB adapter not connected');},
 async saveVehicle(vehicle){throw new Error('DB adapter not connected');},
 async loadProperty(characterId){throw new Error('DB adapter not connected');}
};
