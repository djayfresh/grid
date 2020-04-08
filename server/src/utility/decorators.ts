import { BaseController } from '../controllers/base.controller';

export function Get(path: string) {
    return (target: BaseController, propertyKey: string, _descriptor: PropertyDescriptor) => {
		if(!target.get) { target.get = {}; }
		target.get[path] = propertyKey;
    };
}

export function Post(path: string) {
    return (target: BaseController, propertyKey: string, _descriptor: PropertyDescriptor) => {
		if(!target.post) { target.post = {}; }
		target.post[path] = propertyKey;
    };
}

export function Put(path: string) {
    return (target: BaseController, propertyKey: string, _descriptor: PropertyDescriptor) => {
		if(!target.put) { target.put = {}; }
		target.put[path] = propertyKey;
    };
}