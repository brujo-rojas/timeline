(function() {
  'use strict';

  angular
  .module('Timeline', [
    //'dependencies'
  ])
  .directive('bindOnce', function() {
    return {
      scope: true,
      link: function( $scope ) {
        setTimeout(function() {
          $scope.$destroy();
        }, 0);
      }
    }
  })
  .controller('timelineCtrl', timelineCtrl);

  timelineCtrl.$inject = ['$scope'];

  /* @ngInject */
  function timelineCtrl($scope) {
    var vm                   = this;
    var dias                 = [];
    var fechaInicio          = moment('7/10/2017','D/M/YYYY');
    var fechaTermino         = moment('27/12/2017','D/M/YYYY');
    var fechaInicioAux       = angular.copy(fechaInicio);
    var diffDays             = fechaTermino.diff(fechaInicio, 'days');
    var r                    = 30;
    var cantidadSectores     = 20;
    var cantidadEquipos      = 5;
    var el                   = $(".timeline");
    var $tlc                 = $(el).find('.tl-container');
    var $sidebar             = $(el).find('nav');
    var $sidebarExtended     = $(el).find('.sidebar-extended');
    var $sidebarRight        = $(el).find('.sidebar-right');
    var $headerRight         = $(el).find('.header-sidebar-right');
    var $header              = $(el).find('header');
    var leftOffset           = 200; //TODO hacer dinamico
    var topOffset            = 0;

    vm.equipos               = [];
    vm.lastPosition          = 0;
    vm.diasSeleccionados     = [];
    vm.visibleSidebarRight   = false;
    vm.visibleSidebarDetails = false;
    vm.showedHeaderInputs    = false;

    function unixToPosition(unix) {
      var m = moment(unix);
      var diff = m.diff(fechaInicio, 'days');
      var position = diff * r;
      return position;
    }

    function positionToUnix(position) {
      var offsetLeft = 0;
      var a = position - offsetLeft;
      a /= 30;
      var f = angular.copy(fechaInicio);
      f.add(a, "days");
      return f;
    }

    function positionToSector(position){
      var a = position / 30;
      var s = null;
      var index = 0;
      angular.forEach(vm.equipos, function(equipo) {
        angular.forEach(equipo.sectores, function(sector) {
          if (index == a) {
            s = sector;
          }
          index++;
        });
      });
      if (s === null) {
        console.error("positionToSector: sector no encontrado")
      }else{
        return s;
      }
    }

    function sectorToPosition(sectorParam){
      var index = 0;
      angular.forEach(vm.equipos, function(equipo) {
        angular.forEach(equipo.sectores, function(sector) {
          index++;
          if (sectorParam.id == sector.id) {
            position = index;
          }
        });
      });
      if (index > 0) {
        return position;
      }else{
        console.error("sectorToPosition: sector no encontrado");
      }
    }

    for (var i = 0; i <= diffDays; i++) {
      dias.push({
        unix: fechaInicioAux.unix() * 1000,
        hasRiego : _.random(0,1,false),
        tMin     : _.random(1,5,false),
        tMax     : _.random(1,5,false),
        tMed     : _.random(1,5,false),
        et       : _.random(1,5,false),
      });
      fechaInicioAux.add(1, "days");
    }

    vm.diasHeader = angular.copy(dias);
    for (var i = 1; i <= cantidadEquipos; i++) {
      var equipo = {
        name: "Equipo "+i,
        id: i,
        sectores:[]
      };
      for (var j = 0; j < cantidadSectores; j++) {
        equipo.sectores.push({
          id: j+1,
          name: "sector riego",
          dias: angular.copy(dias),
        });
      }
      vm.equipos.push(equipo);
    }





    angular.forEach(vm.equipos, function(equipo) {
      angular.forEach(equipo.sectores, function(sector) {
        sector.diasData = [];
        angular.forEach(sector.dias, function(dia) {
          if (dia.hasRiego == 1) {
            sector.diasData.push({
              unix: dia.unix,
              riego: _.random(1.1, 55.9),
              scholander: _.random(1, 12),
              position: unixToPosition(dia.unix)
            });
          }
          if (unixToPosition(dia.unix) > vm.lastPosition){
            vm.lastPosition = unixToPosition(dia.unix);
          }
        });
      });
    });

    vm.ocultarSidebar= function() {
      vm.visibleSidebarRight = false;
    }

    vm.mostrarSidebar = function() {
      vm.visibleSidebarRight = true;
    }

    vm.ocultarDetalles = function() {
      vm.visibleSidebarDetails = false;
    }
    vm.mostrarDetalles = function() {
      vm.visibleSidebarDetails = true;
    }

    vm.tlMouseOver = function(ev) {
      var position = vm.eventToPosition(ev);
      position.left += parseInt($tlc.css("padding-left"));//correccion de position
      $(".hover-cursor").css(position);
    }


    vm.eventToPosition = function(ev) {
      var target = $(ev.currentTarget);
      var t = parseInt(target.css("padding-left")) +  parseInt(target.offset().left);
      var a = ev.clientX + target.scrollLeft() - t;
      var left = a - (a%30);

      var y = parseInt(target.css("padding-top")) +  parseInt(target.offset().top);
      var b = ev.clientY + target.scrollTop() - y;
      var top = b - (b%30);

      var position = {
        left:left,
        top:top
      }
      return position;
    }

    vm.selectDay = function(ev) {
      var position = vm.eventToPosition(ev);
      var momentDate = positionToUnix(position.left);
      var sector = positionToSector(position.top);
      var sm  = {
        position : position,
        moment    : momentDate,
        sector    : sector,
        positionOffset:{
          left: position.left + leftOffset,
          top: position.top + topOffset
        }
      }
      var i = vm.isSelected(sm)
      if ( i == -1) {
        vm.diasSeleccionados.push(sm);
      }else{
        vm.diasSeleccionados.splice(i, 1);
      }
      /*
      sm.sector.diasData.push({
        unix: sm.moment.unix() * 1000,
        riego: _.random(1, 5),
        position: unixToPosition(sm.moment.unix()*1000),
      })
      */

    }

    vm.isSelected = function(sm){
      var isSelected = -1;
      angular.forEach(vm.diasSeleccionados, function(sms, index) {
        if (sms.sector.id == sm.sector.id && sms.moment.isSame(sm.moment)) {
          isSelected = index;
        }
      });
      return isSelected;
    }

    var fixedTable = function() {
      $($tlc).scroll(function() {
        $($sidebar).css('transform', "translateY(-"+ $($tlc).scrollTop()+"px)");
        $($sidebarExtended).css('transform', "translateY(-"+ $($tlc).scrollTop()+"px)");
        $($sidebarRight).css('margin-top', "-"+ $($tlc).scrollTop()+"px");

        $($header).css('transform', "translateX(-"+ $($tlc).scrollLeft()+"px)");
        $($headerRight).css('transform', "translateY("+ $($tlc).scrollTop()+"px)");
      });
    };

    fixedTable();


    vm.showHeaderInputs = function() {
      vm.showedHeaderInputs = true;
    }

    vm.hideHeaderInputs = function() {
      vm.showedHeaderInputs = false;
    }

    vm.toggleHeaderInputs = function() {
      if (vm.showedHeaderInputs) {
        vm.hideHeaderInputs();
      }else{
        vm.showHeaderInputs();
      }
    }





  }
})();
