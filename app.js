(function() {
  'use strict';

  angular
  .module('Timeline', [
    //'dependencies'
  ])
  .controller('timelineCtrl', timelineCtrl);

  timelineCtrl.$inject = ['$scope'];

  /* @ngInject */
  function timelineCtrl($scope) {
    var vm               = this;
    var dias             = [];
    var fechaInicio      = moment('7/10/2016','D/M/YYYY');
    var fechaTermino     = moment('27/2/2017','D/M/YYYY');
    var fechaInicioAux   = angular.copy(fechaInicio);
    var diffDays         = fechaTermino.diff(fechaInicio, 'days');
    var r                = 30;
    var cantidadSectores = 20;
    var cantidadEquipos  = 5;
    var el               = $("#container");
    var $tlc             = $(el).find('#tl-container');
    var $sidebar         = $(el).find('nav');
    var $header          = $(el).find('header');
    var leftOffset = 200; //TODO hacer dinamico
    var topOffset = 0;

    vm.equipos           = [];
    vm.lastPosition      = 0;
    vm.diasSeleccionados = [];

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
        hasRiego: _.random(0,1,false),
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
              riego: _.random(1, 5),
              position: unixToPosition(dia.unix)
            });
          }
          if (unixToPosition(dia.unix) > vm.lastPosition){
            vm.lastPosition = unixToPosition(dia.unix);
          }
        });
      });
    });


    vm.tlMouseOver = function(ev) {
      //var $tlc = $("#tl-container");
      var l    = $tlc.position().left + parseInt($tlc.css("padding-left"));
      var top  = _.floor((ev.clientY - $tlc.position().top + $tlc.scrollTop()) / r) * r;
      var left = _.floor((ev.clientX - l + $tlc.scrollLeft()) / r)*r  + parseInt($tlc.css("padding-left"));
      $(".hover-cursor").css({
        top  : top,
        left : left
      });
    }


    vm.eventToPosition = function(ev) {
      var target = $(ev.currentTarget);
      var t = parseInt(target.css("padding-left")) + parseInt(target.css("margin-left")) + parseInt(target.position().left);
      var a = ev.clientX + target.scrollLeft() - t;
      var left = a - (a%30);

      var y = parseInt(target.css("padding-top")) + parseInt(target.css("margin-top")) + parseInt(target.position().top);
      var b = ev.clientY + target.scrollTop() - y;
      var top = b - (b%30);
      return {
        left:left,
        top:top
      }
    }

    vm.selectDay = function(ev) {
      var positions = vm.eventToPosition(ev);
      var momentDate = positionToUnix(positions.left);
      var sector = positionToSector(positions.top);
      var sm  = {
        positions : positions,
        moment    : momentDate,
        sector    : sector,
        positionsOffset:{
          left: positions.left + leftOffset,
          top: positions.top + topOffset
        }
      }
      var i = vm.isSelected(sm)
      if ( i == -1) {
        vm.diasSeleccionados.push(sm);
      }else{
        vm.diasSeleccionados.splice(i, 1);
      }
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
      return $($tlc).scroll(function() {
        $($sidebar).css('margin-top', - $($tlc).scrollTop());
        return $($header).css('margin-left', - $($tlc).scrollLeft());
      });
    };

    fixedTable();



  }
})();
