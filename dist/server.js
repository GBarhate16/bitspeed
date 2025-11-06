"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const app = (0, app_1.buildApp)();
app.listen({ port: Number(env_1.config.PORT), host: '0.0.0.0' })
    .then((address) => {
    app.log.info(`Server listening at ${address}`);
})
    .catch((err) => {
    app.log.error(err);
    process.exit(1);
});
