# stardust-engine Modules

stardust-engine is a **modular** application engine, and as such, it supports modules. Modules are used to extend the functionality of the application, without having to modify the engine itself.

## Module structure

A module is a folder within the `modules` directory, and it should contain an `index` file in it. stardust-engine will automatically load it, expecting it to satisfy the Module type, with a respective configuration key, and eventEmitter class.

For reference you can check out the [Discord Module](../src/modules/discord/index.ts) as an example.

A module should have an object as default export that satisfies the `Module` type, with the following properties:
 - `name`: A unique string name, used to get the module using the `getModule` function.
 - `create`: An async function that receives the configuration, and should return the [Module Context](#module-context).
 - `initFunction`: An async function that receives the context, and should return nothing. you may use this function to finalize the module initialization.
 - `paths` (optional): An object with the following properties:
   - `hooks` (optional): A string that references the path to the hooks folder, relative to the module folder.
   - `routes` (optional): A string that references the path to the routes folder, relative to the module folder.
   - `commands` (optional): A string that references the path to the commands folder, relative to the module folder.
   - `tasks` (optional): A string that references the path to the tasks folder, relative to the module folder.

Apart from that you can make any folder or file in the module folder, and it will be used only if imported by your module.

## Module Context

As stardust-engine is mostly Event-Based, all module contexts should inherit the `EventEmitter` class, allowing for the relay of function calls and messages between them and the engine.

Many libraries and clients like discord.js, already do so, thus implementing this should be easy.