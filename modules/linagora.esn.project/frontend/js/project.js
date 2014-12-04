'use strict';

angular.module('esn.project', ['restangular'])
  .config(function($routeProvider) {

    $routeProvider.when('/projects/:project_id', {
      templateUrl: '/projects/views/partials/project',
      controller: 'projectController',
      resolve: {
        project: function(projectAPI, $route, $location) {
          return projectAPI.get($route.current.params.project_id).then(
            function(response) {
              return response.data;
            },
            function(err) {
              $location.path('/projects');
            }
          );
        }
      }
    });

  });
