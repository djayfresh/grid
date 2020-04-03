import { BaseEvent, TypeOfBaseEvent, BaseEventCallback } from './events';

import { Observable, Observer, Subscription, Subject } from 'rxjs';
import { filter, share } from 'rxjs/operators';

declare var setImmediate; 
if(typeof(setImmediate) === 'undefined') { var setImmediate: any = setTimeout; }

export class EventQueue {
    protected events: { [key: string]: Observable<BaseEvent<any>> } = {};
    protected activators: { [key: string]: Subject<BaseEvent<any>> } = {};
    protected subscribers: { [key: string]: { [key: string]: Subscription[] } } = {};

    constructor() {
    }
    
    subscribe<T extends BaseEvent<any>>(eventType: TypeOfBaseEvent<T>, subscriberId: number | string, callback: BaseEventCallback<T>, operators?: QueueOperators<T>) : Observable<T> {
        if(!eventType['eventName']) {
            throw('The event does not have a name. Please remember to annotate your event with @AppEvent.');    
        }
        
        var eventName = eventType['eventName'];
        var observable: Observable<any>;
        
        if (!this.events[eventName]) {
            this.events[eventName] = observable = Observable.create((observer: Observer<T>) => {
                if(!this.activators[eventName]) {
                    this.activators[eventName] = new Subject<T>();
                }
                
                this.activators[eventName].subscribe(observer);
            });
            
            observable = observable.pipe(share());
            this.subscribers[eventName] = {};
        }
        else {
            observable = this.events[eventName];
        }
        
        if (!this.subscribers[eventName][subscriberId]) {
            this.subscribers[eventName][subscriberId] = [];
        }

        if(operators) {
            for(var key in operators) {
                switch (key) {
                    case 'filter': observable = observable.pipe(filter(operators[key]));
                        break;
                }
            }
        }
        
        this.subscribers[eventName][subscriberId].push(observable.subscribe(event => {
            callback(event);
        }));

        return observable;
    }
    
    unsubscribe<T extends BaseEvent<any>>(subscriberId: any, eventType?: TypeOfBaseEvent<T>) {
        if(eventType) {
            if(this.subscribers[eventType['eventName']] && this.subscribers[eventType['eventName']][subscriberId]) {
                this.unsubscribeObservable(subscriberId, eventType['eventName']);
            }
        }
        else {
            for(var name in this.subscribers) {
                if(this.subscribers[name][subscriberId]) {
                    this.unsubscribeObservable(subscriberId, name);
                }
            }
        }
    }
    
    private unsubscribeObservable(subscriberId: any, eventName: string) {
        this.subscribers[eventName][subscriberId].forEach(subscription => {
            subscription.unsubscribe();    
        });
        
        delete this.subscribers[eventName][subscriberId];
    }

    notify(event: BaseEvent<any>) {
        var eventName = event.eventName;

        if (this.activators[eventName]) {
            setImmediate(() => {
                this.activators[eventName].next(event);
            });
        }
    }
    
    clearEvent(eventName: string) {
        if (this.events[eventName]) {
            delete this.events[eventName];
            for(var name in this.activators) {
                this.activators[name].complete();
            }
            
            for(var name in this.subscribers) {
                for(var subscriberId in this.subscribers[name]) {
                    this.subscribers[name][subscriberId].forEach(subscriber => {
                       subscriber.unsubscribe(); 
                    });

                    delete this.subscribers[name][subscriberId];
                }
            }
        }
    }
}

export class QueueOperators<T extends BaseEvent<any>> {
    filter: (value: T, index: number) => boolean;
}