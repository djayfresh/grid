import { RouteConfig } from '../routes/config';

export class BaseController {
    get: {[path: string]: any};
    post: {[path: string]: any};
    put: {[path: string]: any};

    baseUrl: string;
    constructor(url: string){
        this.baseUrl = url;
    }

    loadRoutes() {
        Object.keys(this.get || {}).forEach(path => {
            this.addRoute('get', path);
        });
        Object.keys(this.post || {}).forEach(path => {
            this.addRoute('post', path);
        });
        Object.keys(this.put || {}).forEach(path => {
            this.addRoute('put', path);
        });
    }

    getRoutePath(path: string){
        return `/${this.baseUrl}/${path}`.toLowerCase();
    }

    private addRoute(method: string, path: string) {
        RouteConfig.router[method](this.getRoutePath(path), (req: Request, res: Response) => {
            const scopedController: BaseController = this;
            this.catch(req, res, () => {
                scopedController[scopedController[method][path]](req, res);
            });
        });
    }

    private catch(req: any, res: any, callback: (req: any, res: any) => void){
        try {
            callback(req, res);
        }
        catch(e){
            console.error(e);
        }
    }
}