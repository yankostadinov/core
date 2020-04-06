## Glue42 Core v1.0.0 (2020-04-06)

#### :rocket: New Feature
* `react-hooks`
  * [#10](https://github.com/Glue42/core/pull/10) Created the **@glue42/react-hooks** library. This package provides custom React hooks for the Glue42 JavaScript libraries ([@3lmo](https://github.com/3lmo))
* `web`
  * [#31](https://github.com/Glue42/core/pull/31) Created the **@glue42/web** package, which exposes an API for all Glue42 Clients to utilize the interop, window and contexts capabilities.  ([@kirilpopov](https://github.com/kirilpopov))
* `core`
  * [#27](https://github.com/Glue42/core/pull/27) Transferred the existing code-base for the **@glue42/core** package from the internal stash system to github. This package processes the Glue42 Client connection to the gateway and exposes interop functionality. It is the foundation of **@glue42/web**. ([@kirilpopov](https://github.com/kirilpopov))
* `cli-core`
  * [#25](https://github.com/Glue42/core/pull/25) Completed the **@glue42/cli-core** package. This development tool makes setting up and working on Glue42 Core project easy and painless. ([@flashd2n](https://github.com/flashd2n))
* `worker-web`
  * [#17](https://github.com/Glue42/core/pull/17) Created the **@glue42/worker-web** package, which exposes a central connection point, which acts as a bridge between Glue42 Clients and the gateway. ([@flashd2n](https://github.com/flashd2n))

#### :memo: Documentation
* [#28](https://github.com/Glue42/core/pull/28) Created the Vanilla JS tutorial - text guide, project start code and full solution. ([@flashd2n](https://github.com/flashd2n))
* [#16](https://github.com/Glue42/core/pull/16) Created a React tutorial for Glue42 Core, which showcases the use of the **@glue42/react-hooks** library. ([@3lmo](https://github.com/3lmo))
* [#36](https://github.com/Glue42/core/pull/36) Added guide for running a Glue42 Core application in Glue42 Enterprise ([@kirilpopov](https://github.com/kirilpopov))
* [#32](https://github.com/Glue42/core/pull/32) Created the API reference documentation for **@glue42/web** ([@flashd2n](https://github.com/flashd2n))
* [#34](https://github.com/Glue42/core/pull/34)[#37](https://github.com/Glue42/core/pull/37)[#43](https://github.com/Glue42/core/pull/43) Created the texts for the initial version of the Glue42 Core documentation ([@flashd2n](https://github.com/flashd2n), [@ValkaHonda](https://github.com/ValkaHonda))

#### :hammer: Underlying Tools
* [#14](https://github.com/Glue42/core/pull/14) Created a rest server, which serves mock data to all Glue42 Core tutorials ([@3lmo](https://github.com/3lmo))

#### Committers: 4
- Kiril Popov ([@kirilpopov](https://github.com/kirilpopov))
- Kalin Kostov ([@flashd2n](https://github.com/flashd2n))
- Emil Petkov ([@3lmo](https://github.com/3lmo))
- Valentin Aleksandrov ([@ValkaHonda](https://github.com/ValkaHonda))