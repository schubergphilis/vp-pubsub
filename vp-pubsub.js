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
(function (VPpubsub) {
    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", VPpubsub);
    // CommonJS
    } else if (typeof exports === "object") {
        module.exports = VPpubsub();
    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(VPpubsub);
    // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeVPpubsub = VPpubsub;
        }
    // <script>
    } else {
        window.VPpubsub = VPpubsub();
    }
})(function () {
    "use strict";
    var validSubscribe = /^!?(\*$|[a-z])([a-z0-9]*)(\.([a-z0-9]+|\*$))*(@[0-9]+)?$/,
        validPublish = /^[a-z]([a-z0-9]*)(\.[a-z0-9]+)*(@[0-9]+)?$/;
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
                    scopeIndex = _.indexOf(published[evnt].scopes, scope);
                    if (~scopeIndex) {
                        scopeIndex = published[evnt].scopes.push(scope) - 1;
                    }
                    //update / add last called data to event scope
                    published[evnt].data[scopeIndex] = data;
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
                    evnt = evnt.split('.');
                    evntPart = evnt[0];
                    //first level name space
                    if (subscribers[evntPart + '.*']) {
                        subs = subs.concat(subscribers[evntPart]);
                    }
                    //all other levels
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
                    _.each(subs, function (subscriber) {
                        //check of subscriber still exits
                        if (!subscriber[1] || subscriber[1] === scope) {
                            if (notAsync) {
                                subscriber[0].call(subscriber[3], data, originEvent, subscriber[0]);
                            } else {
                                setTimeout(function () {
                                    subscriber[0].call(subscriber[3], data, originEvent, subscriber[0]);
                                }, 5);
                            }
                        }
                    });
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
                    var index,
                        orgEvent = evnt;
                    //if the sub don't have 
                    if (!~evnt.indexOf('*')) {
                        //check of event already is published for this scope
                        if (published[evnt]) {
                            index = _.indexOf(published[evnt].scopes, scope);
                        }
                    } else {
                        //rewrite event to regex
                        evnt = new RegExp('^' +
                                evnt.substr(0, evnt.length - 2)
                                .replace('.', '\\.') +
                                "(?![a-zA-Z0-9])");
                        //find event based on regex
                        for (orgEvent in published) {
                            if (evnt.test(orgEvent)) {
                                index = _.indexOf(published[orgEvent].scopes, scope);
                                break;
                            }
                        }
                    }
                    //do we've found a event ?
                    if (!~index) {
                        //call subscriber
                        sub.call(thisArg, published[orgEvent].data[index], orgEvent, sub);
                    }
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
                        //add subscriber
                        pubIndex = subscribers[parseEvnt].push([
                            subscriber,
                            scope,
                            subscriber,
                            thisArg
                        ]);
                        //is published check
                        if (isPublished) {
                            publish(parseEvnt, subscribers[parseEvnt][pubIndex - 1][0]);
                        }
                    }
                }
            },
            subonce: function (evnt, subscriber, scope, thisArg) {
                api.sub(evnt, function (data, evnt, $$sub) {
                    api.unsub(evnt, $$sub, scope);
                    subscriber.call(thisArg, data, evnt, subscriber);
                }, scope, thisArg);
            },
            /**
             * Unsubscribe a subscriber from a event
             * @param  {string}     evnt       Event where from you want to unsubscribe
             * @param  {Function}   subscriber the subscriber
             * @param  {*}          [scope]    the scope if used by subscribing
             */
            unsub: function (evnt, subscriber, scope) {
                _.each(subscribers[evnt], function (sub, i) {
                    if (sub[2] === subscriber && (!sub[1] || sub[1] === scope)) {
                        subscribers[evnt].splice(i, 1);
                    }
                });
            }
        });
    }
    //return the API
    return _.extend(VPpubsub(), {
        /**
         * Returns a VPpubsub with his own subscribers 
         * @return {VPpubsub} [description]
         */
        fork: function () {
            return VPpubsub();
        }
    });
});