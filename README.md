VP PubSub
======
VP PubSub is a [publish/subscribe](http://en.wikipedia.org/wiki/Publish/subscribe) library that supports [message filtering](http://en.wikipedia.org/wiki/Publish–subscribe_pattern#Message_filtering)

##Requirements
* [underscorejs](https://github.com/jashkenas/underscore)

##Install

###Include

####Basic
```html
<script type="text/javascript" src="underscore.js"></script>
<script type="text/javascript" src="vp-pubsub.js"></script>
```

####Require js
```javascript
require.config({
    paths: {
        'vp-pubsub': 'vp-pubsub',
        'underscore': 'underscore'
    },
    shim: {
        'underscore': {
            exports: '_'
        },
        'vp-pubsub': {
            deps: ['underscore']
        }
    }
});
```

##API

Event names have some restrictions.

*   The event name is only allowed to use lowercase characters and numbers
*   The first character must be a-z
*   you can use a '.' to name space the event

Example of valid event names

-   x
-   somelongname
-   a123
-   x.x
-   x.x.x.x.x.x

Example of invalid event names

-   1a
-   a.
-   a#$

####pub

`VPpubsub.pub` publish a event

#####Parameters:
|  Name | Type | Description 
| :-|:-:|:-
|  evnt | string | The event that you want to publish
| [data] | * | Data that you want to send along with the event
| [scope] | * | Event scope
| [notAsync=false] | boolean | Events are default asynchronous, but in some cases yo don't want that 

#####Example
```javascript
//publish an event without data
VPpubsub.pub('foo');
//publish an event with `true` as data
VPpubsub.pub('foo', true);
//publish a event with `"test"` as data in the scope `window`
VPpubsub.pub('foo', "test", window);
//publish a event with `"test"` as data in the scope `window`, synchronise 
VPpubsub.pub('foo', "test", window, true);
```

####sub

`VPpubsub.sub` Subscribe to a event

You can subscribe to multiple events by separating the event with `|`.
You can subscribe to event in the same namespace by using `*`. example: 
`foo.*` will trigger the subscriber by the event `foo` but also every event that starts with the name space `foo` like `foo.bar`

You can subscribe to all events with `*`


#####Parameters:
| Name | Type | Description 
|:-|:-:|:-
| evnt | string | The event(s) where you want to subscribe to. 
| subscriber | function | The subscriber
| [scope] | * | Scope can be used to only subscribe to events that are in that scope
| [thisArg] | * | The `this` scope  of the subscriber 


#####Subscriber parameters
| Name | Type | Description 
| :-|:-:|:-
|  data | * | The data send by publishing the event 
|  event | string | the event that was published.
|  $$sub | function | the subscriber self

#####Example
```javascript
//only subscribe to foo
VPpubsub.sub('foo', function (data, evnt, $$sub) {
    console.log(data, evnt, $$sub);
});
//subscribe to name space foo
VPpubsub.sub('foo.*', function (data, evnt, $$sub) {
    console.log(data, evnt, $$sub);
});
//subscribe to name space foo.bar
VPpubsub.sub('foo.bar', function (data, evnt, $$sub) {
    console.log(data, evnt, $$sub);
});
//subscribe to foo.bar in the scope window
VPpubsub.sub('foo.bar', function (data, evnt, $$sub) {
    console.log(data, evnt, $$sub);
}, window);
//subscribe to foo.bar and execute the subscriber in the window scope
VPpubsub.sub('foo.bar', function (data, evnt, $$sub) {
    console.log(data, evnt, $$sub);
}, null, window);
//subscribe to all events
VPpubsub.sub('*', function (data, evnt, $$sub) {
    console.group(evnt);
    console.info(data);
    console.log($$sub);
    console.groupEnd();
});
```

####subonce

`VPpubsub.subonce` same as `sub` only it will subscribes once to the event

####unsub

`VPpubsub.unsub` unsubscribe from a event

Event, subscriber and scope must be the same as when you subscribed.

#####Parameters:
|  Name | Type | Description 
| :-|:-:|:-
|  evnt | string | Event where from you want to unsubscribe 
|  subscriber | function | The subscriber
|  [scope] | * | the scope if used by subscribing

####fork

`VPpubsub.fork` returns a VPpubsub with his own subscribers
