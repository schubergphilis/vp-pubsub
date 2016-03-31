/*globals describe: true, it: true, require: true*/

var VPpubsub = VPpubsub || require('../vp-pubsub');

describe('vp-pubsub.js', function() {
    //methods
    it('should have have the method pub, sub, subonce, unsub, on, and fork', function() {
        expect(VPpubsub.pub).toBeDefined();
        expect(VPpubsub.sub).toBeDefined();
        expect(VPpubsub.subonce).toBeDefined();
        expect(VPpubsub.unsub).toBeDefined();
        expect(VPpubsub.fork).toBeDefined();
        expect(VPpubsub.on).toBeDefined();
    });
    //subscribe
    it('should call the subscriber', function (done) {
        function sub (data, evnt, $$sub) {
            expect(data).toBe('test');
            expect(evnt).toBe('test');
            expect($$sub).toBe(sub);
            VPpubsub.unsub('test', $$sub);
            done();
        }

        VPpubsub.sub('test', sub);
        VPpubsub.pub('test', 'test');

    });
    //test once
    it('should call the subscriber once', function (done) {
        var sub = {
                test: function () {
                    expect(data).toBe('testonce');
                    expect(evnt).toBe('test');
                    expect($$sub).toBe(sub.test);
                }
            };
        //spy
        spyOn(sub, 'test');
        VPpubsub.subonce('testonce', sub.test);

        VPpubsub.pub('testonce', 'test');
        VPpubsub.pub('testonce', 'test');

        setTimeout(function(){
            expect(sub.test.calls.count()).toEqual(1);
            done();
        }, 250);

    });
    //all test
    it('should match any event', function (done) {
        var sub = {
                test: function (d,e,$$sub) {
                    expect($$sub).toBe(sub.test);
                }
            };
        //spy
        spyOn(sub, 'test');
        //sub
        VPpubsub.sub('*', sub.test);
        //pub
        VPpubsub.pub('test1', 'test');
        VPpubsub.pub('test2', 'test');
        VPpubsub.pub('test3', 'test');

        setTimeout(function(){
            expect(sub.test.calls.count()).toEqual(3);
            done();
        }, 250);
    });
    //scope test
    it('should call the subscriber only if it match scope', function (done) {
        var scope = {},
            data = 'test scope';
        //sub
        VPpubsub.sub('test.scope', function (d) {
            expect(d).toBe(data);
            done();
        }, scope);
        //pub
        VPpubsub.pub('test.scope', 'no scope');
        //send correct scope
        setTimeout(function(){
            VPpubsub.pub('test.scope', data, scope);
        }, 250);
    });
    //channel test
    it('should call the subscriber that subscribed to the channel', function (done) {
        var sub = {
                test: function (data, evnt, $$sub) {
                    expect($$sub).toBe(sub.test);
                    expect(evnt).toMatch(/^test\.a\.*$/);
                    expect(data).toMatch(/^test-\d$/);
                }
            };
        //spy
        spyOn(sub, 'test');
        //sub
        VPpubsub.sub('test.a.*', sub.test);
        //pub
        VPpubsub.pub('test.a', 'test-1');   //channel
        VPpubsub.pub('test.a.a', 'test-2'); //extend channel
        VPpubsub.pub('test.a.b', 'test-3'); //extend channel
        VPpubsub.pub('test.a.c', 'test-4'); //extend channel
        VPpubsub.pub('test.a@id', 'test-5');//channel + id
        //count
        setTimeout(function(){
            expect(sub.test.calls.count()).toEqual(5);
            done();
        }, 250);
    });
    //sync test
    it('should call the subscriber sync and not async', function () {
        var data = 'test data';
        VPpubsub.sub('test.sync', function (d) {
            expect(d).toBe(data);
        });
        VPpubsub.pub('test.sync', data, null, true);
    });
    //force test
    it('should return the last published data' ,function (done) {
        var data = 'test force';
        VPpubsub.pub('test.force', data);
        VPpubsub.sub('!test.force', function (d) {
            expect(d).toBe(data);
            done();
        });
    });
    //ID test
    it('should call the subscriber that is subscribed on the ID', function (done) {
        var data = 'test ID';
        VPpubsub.sub('test.id@test', function (d) {
            expect(d).toBe(data);
            done();
        });
        //pub fake
        VPpubsub.pub('test.id');
        setTimeout(function(){
            VPpubsub.pub('test.id@test', data);
        }, 250);
    });
    //fork
    it('should have the method pub, sub, subonce, unsub and fork when forked', function() {
        var fork = VPpubsub.fork();
        expect(fork.pub).toBeDefined();
        expect(fork.sub).toBeDefined();
        expect(fork.subonce).toBeDefined();
        expect(fork.unsub).toBeDefined();
        expect(fork.fork).toBeDefined();
        expect(fork.on).toBeDefined();
    });


    //on
    it('should return an object with off and then if subscribed via on', function() {
        var tstOn  = VPpubsub.on('test.on.methods');
        expect(tstOn.off).toBeDefined();
        expect(tstOn.then).toBeDefined();
    });

    //on..then
    it('should call the fulfill after the event is published', function(done) {
        var data = 'on data';
        //sub
        VPpubsub
        .on('test.on.data')
        .then(function (d) {
            expect(d).toBe(data);
            done();
        });
        //pub
        VPpubsub.pub('test.on.data', data);
    });
    //on then multi
    it('should call all fulfill after the event is published', function(done) {
        var sub = {
                test1: function (data, evnt, $$sub) {
                    expect($$sub).not.toBe(sub.test1);
                    expect(evnt).toMatch(/^test\.on\.a.*$/);
                    expect(data).toMatch(/^test on data\d$/);
                },
                test2: function (data, evnt, $$sub) {
                    expect($$sub).not.toBe(sub.test2);
                    expect(evnt).toMatch(/^test\.on\.a.*$/);
                    expect(data).toMatch(/^test on data\d$/);
                },
                test3: function (data, evnt, $$sub) {
                    expect($$sub).not.toBe(sub.test3);
                    expect(evnt).toMatch(/^test\.on\.a.*$/);
                    expect(data).toMatch(/^test on data\d$/);
                }
            },
            //sub
            test = VPpubsub.on('test.on.a.*')
        //spy
        spyOn(sub, 'test1');
        spyOn(sub, 'test2');
        spyOn(sub, 'test3');
        //sub
        test.then(sub.test1);
        test.then(sub.test2);
        test.then(sub.test3);
        //pub
        VPpubsub.pub('test.on.a', 'test on data1');
        VPpubsub.pub('test.on.a.b', 'test on data2');
        VPpubsub.pub('test.on.a.c', 'test on data3');
        //check result
        setTimeout(function(){
            expect(sub.test1.calls.count()).toEqual(3);
            expect(sub.test2.calls.count()).toEqual(3);
            expect(sub.test3.calls.count()).toEqual(3);
            done();
        }, 250);
    });

    it('should unsubscribe after calling off method', function (done) {
        var test =  VPpubsub.on('test.on.off'),
            sub = {
                test: function () {}
            };
        //spy
        spyOn(sub, 'test');
        //then
        test.then(sub.test);
        //pub
        VPpubsub.pub('test.on.off');
        setTimeout(function () {
            test.off();
            VPpubsub.pub('test.on.off');
        }, 100)
        //count
        setTimeout(function(){
            expect(sub.test.calls.count()).toEqual(1);
            done();
        }, 250);
    });
    //test once
    it('should call the fulfill only once', function (done) {
        var sub = {
                test: function () {}
            };
        VPpubsub.pub('test.on.once');
        //spy
        spyOn(sub, 'test');
        VPpubsub.on('!test.on.once')
        .then(sub.test)
        .off();
        //pub
        VPpubsub.pub('test.on.once');
        //test
        setTimeout(function(){
            expect(sub.test.calls.count()).toEqual(1);
            done();
        }, 250);

    });
    //
    it('should work with a Promise', function (done) {
        var data =  'test promise',
            p = Promise.resolve(VPpubsub.on('test.on.promise'));
        //then
        p.then(function (d) {
            expect(d).toBe(data);
            done()
        });
        VPpubsub.pub('test.on.promise', data);
    });
});
