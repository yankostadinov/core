## Overview

Your Glue42 Core application can run in [Glue42 Enterprise](https://glue42.com/desktop-enterprise/) without modification. This gives you the option to easily experiment with your app running in a functionally richer environment with more integration options.

## How to 

1. You need to have Glue42 Enterprise v3.9 or newer:
    * Download it from [here](https://glue42.com/free-trial/) if you're not running Glue42 in your organization

1. Make sure Glue42 runs with auto-injection on:
    * Open *system.json*, usually located at *%LocalAppData%\Tick42\GlueDesktop\config* folder
    * Make sure *autoInjectAPI* is has *enabled* set to *true*
    ```json
    "autoInjectAPI": {
        "enabled": true,
        "version": "5.*",
        "autoInit": false
    }
    ```
3. Create a definition file for your application:
    * Use the template attached bellow changing *name*, *title* and *url* as a minimum:
    ```json
    [
        {
            "title": "Glue42 Core app",
            "type": "window",
            "name": "glue42-core-app",
            "details": {
                "url": "http://localhost:4242/",
                "top": 100,
                "left": 200,
                "width": 600,
                "height": 300,
                "mode": "tab"      
            }   
        }
     ]

    ``` 
    * Save it in your app definitions folder - usually *%LocalAppData%\Tick42\UserData\T42-DEMO\apps* - as a json file
 
3. Start Glue42 Enterprise and run your app from the toolbar


## Use Enterprise specific features
If you to keep your app running in both environments (Core and Enterprise), and also use features that are specific to Enterprise when running in that environnement, you need to make checks in your code to determine in which env your app is running.

For example let's say you want to register a global shortcut and receive notifications when it is pressed by the user (irrespective of whether the application is on focus or not). You can achieve that by using [Hotkeys API](https://docs.glue42.com/glue42-concepts/glue42-platform-features/index.html#hotkeys) available in Glue42 Enterprise.

```typescript
if (typeof glue42gd !== "undefined") {
    // we're running in Glue42 Enterprise, lets use hotkeys API
   
    // define a hotkey object
    const hotkeyClientDetails = {
        hotkey: "shift+alt+c",
        description: "Open Client Details"
    };

    // register the hotkey
    glue.hotkeys.register(hotkeyClientDetails, (details) => {
        // this function will be invoked when the hotkey is pressed
        console.log(`shortcut pressed`);
    });
} else {
    // running in Glue42 Core, will fallback to in-page shortcuts
}
```

If you're developing in TypeScript you can cast your glue API (@glue42/web) to the enterprise API (@glue42/desktop) to get better typings:

```typescript
import { Glue42 } from "@glue42/desktop"; // to import types


if (typeof glue42gd !== "undefined") {
    // we're running in Glue42 Enterprise, lets use hotkeys API
    const glueE = glue as Glue42.Glue;
}
```