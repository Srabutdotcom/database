import { userData } from "../user.js";

const user1 = {name: "John", age:'25', id:123456}

userData.addUserSync("John", user1);debugger;

const user2 = await userData.getUser("John");
const user3 = await userData.getNameBasedOnId(user2.id);

debugger;
