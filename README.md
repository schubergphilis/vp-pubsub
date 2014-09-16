VP PubSub
======
VP PubSub is a [publish/subscribe](http://en.wikipedia.org/wiki/Publish/subscribe) library that supports [message filtering](http://en.wikipedia.org/wiki/Publish–subscribe_pattern#Message_filtering)


## Getting Started

### Install

#### bower
`bower install vp-pubsub  --save-dev`

#### git
`git clone https://github.com/schubergphilis/vp-pubsub.git`

### Include

#### Basic
```html
<script type="text/javascript" src="vp-pubsub.js"></script>
```

#### AMD
```javascript
define(['/bower_components/vp-pubsub/vp-pubsub'], function (PubSub) {

})
```

## API

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

#### pub

`VPpubsub.pub` publish a event

##### Parameters:



Name | Type | Description 
--- | --- | ---
evnt | string | The event that you want to publish
[data] | * | Data that you want to send along with the event
[scope] | * | Event scope
[notAsync=false] | boolean | Events are default asynchronous, but in some cases yo don't want that 

##### Example
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

#### sub

`VPpubsub.sub` Subscribe to a event

You can subscribe to multiple events by separating the event with `|`.
You can subscribe to event in the same namespace by using `*`. example: 
`foo.*` will trigger the subscriber by the event `foo` but also every event that starts with the name space `foo` like `foo.bar`

You can subscribe to all events with `*`


##### Parameters:

Name | Type | Description 
---| --- | ---
evnt | string | The event(s) where you want to subscribe to. 
subscriber | function | The subscriber
[scope] | * | Scope can be used to only subscribe to events that are in that scope
[thisArg] | * | The `this` scope  of the subscriber 


##### Subscriber parameters

Name | Type | Description 
---| --- | ---
data | * | The data send by publishing the event 
event | string | the event that was published.
$$sub | function | the subscriber self

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

#### subonce

`VPpubsub.subonce` same as `sub` only it will subscribes once to the event

#### unsub

`VPpubsub.unsub` unsubscribe from a event

Event, subscriber and scope must be the same as when you subscribed.

##### Parameters:

Name | Type | Description 
---| --- | ---
evnt | string | Event where from you want to unsubscribe 
subscriber | function | The subscriber
[scope] | * | the scope if used by subscribing

#### fork

`VPpubsub.fork` returns a VPpubsub with his own subscribers


## Tips

### Unique events

#### Problem
If you've a set up as bellow, than module A and module B will always have the result of both request and that is probably not what you want.

```javascript
//module A
VPpubsub.sub('message.result', function (result) {
    console.log(result)
})
VPpubsub.pub('message.get', {
    type: 'error'
});

//module B
VPpubsub.sub('message.result', function (result) {
    console.log(result)
})
VPpubsub.pub('message.get');

//module log message
VPpubsub.sub('message.result', function (result) {
    console.log(result)
})

//module Message
VPpubsub.sub('message.get', function (filter) {
    VPpubsub.pub('message.result', [])
})
```

#### Solution 1 ( channels )
One way to fix this is to use the channel filter as used below.

```javascript
//module A
VPpubsub.sub('message.result.moduleA', function (result) {
    console.log(result)
})
VPpubsub.pub('message.get.moduleA', {
    type: 'error'
});

//module B
VPpubsub.sub('message.result.moduleB', function (result) {
    console.log(result)
})
VPpubsub.pub('message.get.moduleB');

//module log message
VPpubsub.sub('message.result.*', function (result) {
    console.log(result)
})

//module Message
VPpubsub.sub('message.get.*', function (filter, evnt) {
    var id = evnt.split('.').splice(2).join('.'),
        resultEvent = 'message.result';
    if (id) {
        resultEvent += '.' + id;
    }
    VPpubsub.pub(resultEvent, [])
})
```

#### Solution 2 ( ID's )
Another way to fix this is to use event ID's. 
You can subscribe and publish an event with a ID.
Subscribers that are subscripted to events with a ID will only be triggered if the ID match, all other subscribers for that event, include channel subscribers will be triggered normally.

You can give an event a ID via adding a `@` to the event name for example `message.get@myid`.
a Event ID can only exists of 0-9 and a-z characters.
To give a example of when what is triggered

```
- publish without ID
pub: message.get
sub: message.get        //triggered
sub: message.get@myid   //not triggered
sub: message.get.*      //triggered
- publish with ID
pub: message.get@myid
sub: message.get        //triggered
sub: message.get@myid   //triggered
sub: message.get.*      //triggered
```

the solution with id would like this

```javascript
//module A
VPpubsub.sub('message.result@moduleA', function (result) {
    console.log(result)
})
VPpubsub.pub('message.get@moduleA', {
    type: 'error'
});

//module B
VPpubsub.sub('message.result@moduleB', function (result) {
    console.log(result)
})
VPpubsub.pub('message.get@moduleB');

//module log message
VPpubsub.sub('message.result', function (result) {
    console.log(result)
})

//module Message
VPpubsub.sub('message.get', function (filter, evnt) {
    var id = evnt.split('@')[1],
        resultEvent = 'message.result';
    if (id) {
        resultEvent += '@' + id;
    }
    VPpubsub.pub(resultEvent, [])
})
```
