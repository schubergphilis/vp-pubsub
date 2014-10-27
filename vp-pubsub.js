/*Copyright 2014 Schuberg Philis

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
/* globals bootstrap, ses */
(function (vpPubsub) {
    /* jshint strict: false*/
    // Montage Require
    if (typeof bootstrap === 'function') {
        bootstrap('promise', vpPubsub);
    // CommonJS & nodejs
    } else if (typeof exports === 'object') {
        module.exports = vpPubsub();
    // RequireJS
    } else if (typeof define === 'function' && define.amd) {
        define(vpPubsub);
    // SES (Secure EcmaScript)
    } else if (typeof ses !== 'undefined') {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeVPpubsub = vpPubsub;
        }
    // <script>
    } else {
        window.VPpubsub = vpPubsub();
    }
})(function () {
    /* jshint newcap: false */
    'use strict';
    var validSubscribe = /^!?(\*$|[a-z])([a-z0-9]*)(\.([a-z0-9]+|\*$))*(@[0-9a-z]+)?$/,
        validPublish = /^[a-z]([a-z0-9]*)(\.[a-z0-9]+)*(@[0-9a-z]+)?$/,
        async = (function () {
            var api = typeof window === 'undefined' ? process : window,
                next =  api.requestAnimationFrame  || api.webkitRequestAnimationFrame || api.mozRequestAnimationFrame || api.nextTick;
            //browser
            if (next) {
                return next;
            }
            //fake async
            return function (callback) {
                setTimeout(callback, 1000 / 60);
            };
        }());
    /**
     * Array indexOf for IE8
     * @param  {Array} arr
     * @param  {*} needed
     * @return {Number}
     */
    function indexOf(arr, needed) {
        if (arr.indexOf) {
            return arr.indexOf(needed);
        }
        for (var i = 0, max = arr.length; i < max; i++) {
            if (arr[i] === needed) {
                return i;
            }
        }
        return -1;
    }
    function isFunction (obj) {
        return typeof obj === 'function';
    }
    /**
     * VPpubsub module
     */
    function VPpubsub () {
        var subscribers = {},
            published = {},
            api;
        return (api = {
            /**
             * Publish a event
             * @param  {string}     evnt                The event that you want to publish
             * @param  {*}          [data]              Data that you want to send along with the event
             * @param  {*}          [scope]             Event scope
             * @param  {boolean}    [notAsync=false]    Events are default asynchronous, but in some cases yo don't want that
             */
            pub: function (evnt, data, scope, notAsync) {
                var evntPart = '',
                    subs = [],
                    originEvent = evnt;
                /**
                 * Adds the event to published events
                 * @param {String} evnt
                 */
                function addToPublished(evnt) {
                    var scopeIndex;
                    //add published
                    if (!published[evnt]) {
                        published[evnt] = {
                            scopes:[],
                            data: []
                        };
                    }
                    //get event scope index
                    scopeIndex = indexOf(published[evnt].scopes, scope);
                    if (!~scopeIndex) {
                        scopeIndex = published[evnt].scopes.push(scope) - 1;
                    }
                    //update / add last called data to event scope
                    published[evnt].data[scopeIndex] = data;
                }
                function callAsync(sub, thisArg, data, originEvent) {
                    async(function () {
                        if (sub.$$VPpubsubRemoved !== originEvent) {
                            sub.call(thisArg, data, originEvent, sub);
                        }
                    });
                }
                //is event valid
                if (validPublish.test(evnt)) {
                    //subscriber with id
                    if (subscribers[evnt]) {
                        subs = subs.concat(subscribers[evnt]);
                    }
                    //remove event
                    evnt = evnt.split('@')[0];
                    //subscriber without id
                    if (evnt !== originEvent && subscribers[evnt]) {
                        subs = subs.concat(subscribers[evnt]);
                    }
                    //add to published 
                    addToPublished(evnt);
                    //wild card
                    if (subscribers[evnt + '.*']) {
                        subs = subs.concat(subscribers[evnt + '.*']);
                    }
                    //all other levels
                    evnt = evnt.split('.');
                    evntPart = evnt[0];
                    for (var i = 1, max = evnt.length; i < max; i++) {
                        if (subscribers[evntPart + '.*']) {
                            subs = subs.concat(subscribers[evntPart + '.*']);
                        }
                        evntPart += '.' + evnt[i];
                    }
                    //all
                    if (subscribers['*']) {
                        subs = subs.concat(subscribers['*']);
                    }
                    //start publishing
                    for (var x = 0, xmax = subs.length; x < xmax; x++) {
                        if (!subs[x][1] || subs[x][1] === scope) {
                            if (notAsync) {
                                subs[x][0].call(subs[x][2], data, originEvent, subs[x][0]);
                            } else {
                                callAsync(subs[x][0], subs[x][2], data, originEvent);
                            }
                        }
                    }
                }
            },
            /**
             * Subscribe to a event
             * valid subscribe events
             *     'x' or 'somelongname' or 'a123' the first character of a event must be a-z, a event must only contain only small characters or numbers
             *     'x.x' you can use a '.' to name space the event
             *     'x.*' you can use a '*' to subscribe to all events in a name space
             *     '*' subscribe to all events
             * invalid subscribe events
             *     '1a' the first character can't be a number
             *     'a.' name space can't be empty
             *     'a#$' a event can't have other characters than a-z or 0-9
             * Explanation mark "!" will republish the event to this subscriber if the event was already publish before
             * @param {string}     evnt       The event where you want to subscribe
             * @param {Function}   subscriber The subscriber to the events
             * @param {*}          [scope]    Scope can be used to only subscribe to events that are in that scope
             * @param {*}          [thisArg]  The `this` scope  of the subscriber
             */
            sub: function (evnt, subscriber, scope, thisArg) {
                var allEvnt = evnt.split('|'),
                    parseEvnt, pubIndex, isPublished;
                /**
                 * Publish event to current subscriber, if force publish is used
                 * @param  {String} evnt [description]
                 * @param  {Function} sub  [description]
                 */
                function publish (evnt, sub) {
                    var index = -1,
                        orgEvent = evnt;
                    //if the sub don't have 
                    if (!~evnt.indexOf('*')) {
                        //check of event already is published for this scope
                        if (published[evnt]) {
                            index = indexOf(published[evnt].scopes, scope);
                        }
                    } else {
                        //rewrite event to regex
                        evnt = new RegExp('^' +
                                evnt.substr(0, evnt.length - 2)
                                .replace('.', '\\.') +
                                '(?![a-zA-Z0-9])');
                        //find event based on regex
                        for (orgEvent in published) {
                            if (evnt.test(orgEvent)) {
                                index = indexOf(published[orgEvent].scopes, scope);
                                break;
                            }
                        }
                    }
                    //do we've found a event ?
                    if (~index) {
                        //call subscriber
                        sub.call(thisArg, published[orgEvent].data[index], orgEvent, sub);
                    }
                }
                //check of subscriber is a function
                if (!isFunction(subscriber)) {
                    return;
                }
                //loop though all events
                for (var i = 0, max = allEvnt.length; i < max; i++) {
                    parseEvnt = allEvnt[i];
                    isPublished = false;
                    if (validSubscribe.test(allEvnt[i])) {
                        //fore publish if published to this subscriber
                        if (parseEvnt.slice(0, 1) === '!') {
                            parseEvnt = parseEvnt.slice(1);
                            isPublished = true;
                        }
                        //add subscriber list
                        if (!subscribers[parseEvnt]) {
                            subscribers[parseEvnt] = [];
                        }
                        delete subscriber.$$VPpubsubRemoved;
                        //add subscriber
                        pubIndex = subscribers[parseEvnt].push([
                            subscriber,
                            scope,
                            thisArg
                        ]);
                        //is published check
                        if (isPublished) {
                            publish(parseEvnt, subscribers[parseEvnt][pubIndex - 1][0]);
                        }
                    }
                }
            },
            /**
             * Subscribe once to an event
             * @param  {String} evnt       you can't subscribe to a channel ( * )
             * @param  {Function} subscriber
             * @param  {*} scope
             * @param  {*} thisArg
             */
            subonce: function (evnt, subscriber, scope, thisArg) {
                //check of subscriber is a function
                if (!isFunction(subscriber)) {
                    return;
                }
                //you can't use *
                if (!~evnt.indexOf('*')) {
                    api.sub(evnt, function (data, evnt, $$sub) {
                        api.unsub(evnt, $$sub, scope);
                        subscriber.call(thisArg, data, evnt, subscriber);
                    }, scope, thisArg);
                }
            },
            /**
             * Unsubscribe a subscriber from a event
             * @param  {string}     evnt       Event where from you want to unsubscribe
             * @param  {Function}   subscriber the subscriber
             * @param  {*}          [scope]    the scope if used by subscribing
             */
            unsub: function (evnt, subscriber, scope) {
                var eventSubs = subscribers[evnt] || [];
                 //check of subscriber is a function
                if (!isFunction(subscriber)) {
                    return;
                }
                for (var i = 0, max  = eventSubs.length; i < max; i++) {
                    if (eventSubs[i][0] === subscriber && (!eventSubs[i][1] || eventSubs[i][1] === scope)) {
                        subscriber.$$VPpubsubRemoved = evnt;
                        eventSubs.splice(i, 1);
                        //index changed
                        i--;
                        max--;
                    }
                }
            },
            fork: function () {
                return VPpubsub();
            }
        });
    }
    return VPpubsub();
});