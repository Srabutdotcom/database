const baseUrl = import.meta.url;
import { readBlob, writeBlob } from "../deps.js";
import { whatis } from "../deps.js";

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
      if (this.userDb.has(name)) return new Status(true,`data ${name} is already in the database`);
      console.log('addUser end')
      return await this.updateUser(name, data);
   }

   async updateUser(name, data) {
      if (Deno.lstatSync(this.userDbPath).mtime + '' !== '' + this.userDb.mtime) {
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
      return new Status(true, `Successfully update ${name}'s data`);
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
      return new Status(true, `successfully delete ${name}`);
   }
}

export const userData = new UserData();

function success(bool, message, data) {
   return {
      success: bool,
      message,
      ...(data && { data: data })
   }
}

class Status { 
   constructor(bool, msg, data) { 
      this.success = bool; 
      this.message = msg; 
      if (data) { this.data = data } 
   } 
}