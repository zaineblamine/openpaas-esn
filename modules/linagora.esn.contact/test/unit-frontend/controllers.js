'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Contacts Angular module', function() {
  describe('the newContactController', function() {

    beforeEach(function() {
      var self = this;

      this.bookId = '123456789';
      this.contactsService = {
        shellToVCARD: function() {}
      };
      this.notificationFactory = {};
      this.location = {};
      this.route = {current: {params: {bookId: this.bookId}}};

      angular.mock.module('ngRoute');
      angular.mock.module('esn.core');
      angular.mock.module('linagora.esn.contact');
      angular.mock.module(function($provide) {
        $provide.value('contactsService', self.contactsService);
        $provide.value('notificationFactory', self.notificationFactory);
        $provide.value('location', self.location);
      });
    });

    beforeEach(angular.mock.inject(function($rootScope, _$controller_, $q) {
      this.$rootScope = $rootScope;
      this.controller = _$controller_;
      this.$q = $q;
    }));

    beforeEach(function() {
      this.scope = this.$rootScope.$new();
      this.controller('newContactController', {
        $scope: this.scope,
        $route: this.route,
        $location: this.location,
        contactsService: this.contactsService,
        notificationFactory: this.notificationFactory
      });
    });

    describe('the accept function', function() {
      it('should not call contactsService.create when already calling it', function(done) {
        this.scope.calling = true;
        this.contactsService.create = function() {
          return done(new Error());
        };
        this.scope.accept();
        done();
      });

      it('should not call contactsService.create when contact is not valid', function(done) {
        this.scope.calling = true;
        this.scope.contact = {_id: 1};
        this.contactsService.create = function() {
          return done(new Error());
        };
        this.scope.accept();
        done();
      });

      it('should call contactsService.create with right path and card', function(done) {
        var self = this;
        this.scope.contact = {_id: 1, firstName: 'Foo', lastName: 'Bar'};
        this.contactsService.shellToVCARD = function() {
          return self.scope.contact;
        };
        this.contactsService.create = function(path, card) {
          expect(path).to.deep.equal('/addressbooks/' + self.bookId + '/contacts');
          done();

        };
        this.scope.accept();

        done(new Error());
      });

      it('should change page on contactsService.create success', function(done) {
        this.scope.contact = {_id: 1, firstName: 'Foo', lastName: 'Bar'};

        this.location.path = function(path) {
          expect(path).to.equal('/contact');
          done();
        };

        var defer = this.$q.defer();
        defer.resolve();

        this.contactsService.create = function(path, card) {
          return defer.promise;
        };

        this.scope.accept();
        this.scope.$digest();

        done(new Error());
      });

      it('should notice user on contactsService.create failure', function(done) {
        this.scope.contact = {_id: 1, firstName: 'Foo', lastName: 'Bar'};

        this.location.path = function() {
          done(new Error());
        };

        this.notificationFactory.weakError = function() {
          done();
        };

        var defer = this.$q.defer();
        defer.reject(new Error());

        this.contactsService.create = function() {
          return defer.promise;
        };

        this.scope.accept();
        this.scope.$digest();
      });

      it('should set back the calling flag to false when complete', function(done) {
        this.location.path = function() {
        };
        this.notificationFactory.weakError = function() {
        };
        this.notificationFactory.weakInfo = function() {
        };

        var defer = this.$q.defer();
        defer.resolve();

        this.contactsService.create = function(path, card) {
          return defer.promise;
        };
        this.scope.accept();
        this.scope.$digest();

        expect(this.scope.calling).to.be.false;
        done();
      });

    });
  });

  describe('the contactAvatarModalController', function() {
    beforeEach(function() {
      var self = this;

      this.selectionService = {};
      this.selectionService.clear = function() {};

      angular.mock.module('ngRoute');
      angular.mock.module('esn.core');
      angular.mock.module('linagora.esn.contact');
      angular.mock.module(function($provide) {
        $provide.value('selectionService', self.selectionService);
      });
    });

    beforeEach(angular.mock.inject(function($rootScope, _$controller_) {
      this.$rootScope = $rootScope;
      this.$controller = _$controller_;
    }));

    beforeEach(function() {
      this.scope = this.$rootScope.$new();
      this.$controller('contactAvatarModalController', {$scope: this.scope});
      this.scope.contact = {};
    });

    describe('the saveContactAvatar method', function() {
      it('should do nothing if no image is selected', function() {
        this.selectionService.getImage = function() {
          return false;
        };
        this.scope.saveContactAvatar();
        expect(this.scope.contact.photo).to.not.exist;
      });

      it('should add the image as base64 string to the contact and close the modal', function() {
        var blob = 'theblob';
        var imageAsBase64 = 'image';
        var modalHidden = false;

        window.FileReader = function() {
          return {
            readAsDataURL: function(data) {
              expect(data).to.equal(blob);
              this.result = imageAsBase64;
              this.onloadend();
            }
          };
        };

        this.selectionService.getImage = function() {
          return true;
        };
        this.selectionService.getBlob = function(mimetype, callback) {
          return callback(blob);
        };

        this.scope.modal = {
          hide: function() {
            modalHidden = true;
          }
        };

        this.scope.saveContactAvatar();
        expect(this.scope.loading).to.be.false;
        expect(modalHidden).to.be.true;
        expect(this.scope.contact.photo).to.equal(imageAsBase64);
      });
    });

  });

  describe('The contact controller', function() {

    beforeEach(function() {
      angular.mock.module('ngRoute');
      angular.mock.module('esn.core');
      angular.mock.module('linagora.esn.contact');
      angular.mock.module('esn.alphalist');
    });

    beforeEach(angular.mock.inject(function($controller, $rootScope, $q) {
      this.controller = $controller;
      this.$rootScope = $rootScope;
      this.scope = $rootScope.$new();
      this.$q = $q;
    }));

    describe('The contactsListController controller', function() {

      describe('The loadContacts function', function() {

        it('should call the contactsService.list fn', function(done) {
          var user = {_id: 123};
          var contactsService = {
            list: function(path) {
              expect(path).to.equal('/addressbooks/' + user._id + '/contacts.json');
              done();
            }
          };

          this.controller('contactsListController', {
            $scope: this.scope,
            contactsService: contactsService,
            user: user
          });
          this.scope.loadContacts();
        });
      });

      describe('The openContactCreation function', function() {
        it('should open the contact creation window', function(done) {

          var user = {
            _id: 123
          };

          var location = {
            path: function(url) {
              expect(url).to.equal('/contact/new/' + user._id);
              done();
            }
          };

          var self = this;
          this.controller('contactsListController', {
            $scope: this.scope,
            $location: location,
            contactsService: {
              list: function() {
                var defer = self.$q.defer();
                defer.resolve({});
                return defer.promise;
              }
            },
            user: user
          });

          this.scope.openContactCreation();
        });
      });
    });
  });


});