import { buildApp } from './app';
import { config } from './config/env';

const app = buildApp();

app.listen({ port: Number(config.PORT), host: '0.0.0.0' })
  .then((address) => {
    app.log.info(`Server listening at ${address}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });


