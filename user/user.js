//import { modules } from "../../lib.js";
const baseUrl = import.meta.url;
import { readBlob, writeBlob } from "../../blobify/src/mod.js";
import { whatis } from "../../aids/mod.js";

/* const readBlob = await modules.getModule("readBlob");
const writeBlob = await modules.getModule("writeBlob");
const whatis = await modules.getModule("whatis") */

class UserData {
   userDb
   idDb
   beingProcess
   userDbPath = new URL('./user.dat', baseUrl);
   idDbPath = new URL('./id.dat', baseUrl);
   constructor() {
      this.beingProcess = new Set([this.refill()])
   }

   async refill() {
      console.log('refill start')
      this.userDb = await readBlob(this.userDbPath) ?? new Map;
      this.idDb = await readBlob(this.idDbPath) ?? new Map; 
      this.userDb.mtime = Deno.lstatSync(this.userDbPath).mtime
      this.idDb.mtime = Deno.lstatSync(this.idDbPath).mtime;
      console.log('refill done')
   }

   async addUser(name, data) {
      console.log('addUser start')
      if (this.beingProcess.size) await Promise.all([...this.beingProcess]);
      this.beingProcess.clear();
      if (this.userDb.has(name)) return true
      const result = await this.updateUser(name, data);
      console.log('addUser end')
   }

   async updateUser(name, data) {
      if (Deno.lstatSync(this.userDbPath).mtime+'' !== ''+this.userDb.mtime) {
         console.log('userDb file mtime is different')
         const result = await this.refill()
         console.log('userDb file updated')
      } 
      console.log('user data set')
      this.userDb.set(name, data); 
      const { id } = data;
      this.idDb.set(id, name);
      this.beingProcess.add(writeBlob(this.userDbPath, this.userDb));
      this.beingProcess.add(writeBlob(this.idDbPath, this.idDb));
      const r = await Promise.all([...this.beingProcess]); 
      console.log('update user done')
      return true;
   }

   async getUser(name) {
      console.log('get user start')
      if (this.beingProcess.size) await Promise.all([...this.beingProcess])
      this.beingProcess.clear();
      if (!this.userDb.has(name)) return;
      console.log('get user is being done')
      return this.userDb.get(name)
   }

   async getNameBasedOnId(id) {
      console.log('getNameBasedOnId start')
      if (this.beingProcess.size) await Promise.all([...this.beingProcess])
      this.beingProcess.clear();
      if (!this.idDb.has(id)) return;
      console.log('getNameBasedOnId is being done')
      return this.idDb.get(id)
   }

   async deleteUser(name) {
      console.log('deleteUser start')
      if (this.beingProcess.size) await Promise.all([...this.beingProcess])
      this.beingProcess.clear();
      const ids = await this.userDb.getUser(name);
      if (whatis(ids) === 'Array') {
         for (const i of ids) {
            this.idDb.delete(i)
         }
      } else {
         this.idDb.delete(ids)
      }
      this.userDb.delete(name);
      console.log('deleteUser done')
      return true;
   }
}

export const userData = new UserData(); 