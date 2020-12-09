import { serverReady } from 'core/pending-tasks';
import { Config } from 'core/config.gen';
import { RoleList } from 'core/userRoles.gen';
import { createIndex } from 'helpers/parse-server/parse-helper';

// Config.mongodb.enable &&
// ((async () => {
//     /// default ////////////////
//     /// Create default roles
//     let role = await new Parse.Query(Parse.Role)
//         .first();
//     if (!role) {
//         for(var key in RoleList) {
//             var name = RoleList[key];
//             var roleACL = new Parse.ACL();
//             roleACL.setPublicReadAccess(true);
//             role = new Parse.Role(name, roleACL);
//             await role.save();
//         }
//         console.log("Default Role created.");
//     }

//     /// Create default users
//     let user = await new Parse.Query(Parse.User)
//         .first();
//     if (!user) {
//         user = new Parse.User();
//         await user.save({
//             username: "Admin",
//             password: "123456",
//         });
//         /// Add <Administrator> and <SystemAdministrator> as default
//         var roles = [];
//         for (name of [RoleList.Administrator, RoleList.SystemAdministrator]) {
//             role = await new Parse.Query(Parse.Role)
//                 .equalTo("name", name)
//                 .first();
//             role.getUsers().add(user);
//             await role.save(null, { useMasterKey: true });
//             roles.push(role);
//         }
//         user.set("roles", roles);
//         await user.save(null, { useMasterKey: true });
//         console.log("Default User created.");
//     }

//     /// Create default Person Groups
//     let personGroup = await new Parse.Query(PersonGroups).first();
//     if (!personGroup) {
//         let group1 = new PersonGroups({
//             name: "VIP",
//             color: "#5AA7FF",
//             default: true
//         });
//         let group2 = new PersonGroups({
//             name: "Blacklist",
//             color: "#FF4A4A",
//             default: true
//         });
//         await Parse.Object.saveAll([group1, group2]);
//         console.log("Default PersonGroup created.");
//     }

//     /// Create default Person Groups
//     let exceptionGroup = await new Parse.Query(ExceptionGroups).first();
//     if (!exceptionGroup) {
//         let group1 = new ExceptionGroups({
//             name: "High Security Area",
//             color: "#FF8324"
//         });
//         let group2 = new ExceptionGroups({
//             name: "Trespassing",
//             color: "#FFC456"
//         });
//         await Parse.Object.saveAll([group1, group2]);
//         console.log("Default ExceptionGroup created.");
//     }
//     ////////////////////////////

// })());
