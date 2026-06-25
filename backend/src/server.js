const app = require('./app');
const { port, nodeEnv } = require('./config/env');

app.listen(port, () => {
  console.log(`Order system API listening on port ${port}`);
  console.log(`Environment: ${nodeEnv}`);
});
