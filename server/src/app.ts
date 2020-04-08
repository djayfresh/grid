import * as express from 'express';
import { RouteConfig } from './routes/config';
import bodyParser = require('body-parser');

class App {
  public express: express.Express;

  constructor () {
    this.express = express();
    this.mountRoutes();
  }

  private mountRoutes (): void {
    this.express.use(bodyParser.json());
    this.express.use('/api/', RouteConfig.routes());
  }
}

export default new App().express;