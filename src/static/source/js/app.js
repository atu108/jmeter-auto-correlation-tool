/**
 * App
 *
 * app.js
 */
(function(window, document, $, Util){

  var URL = {
    AUTH: {
      LOGIN: '/app/auth/login'
    },
    SCENARIO: {
      SAVE: '/app/scenario/save',
      DELETE: '/app/scenario/delete'
    },
    RUN: {
      RECORD: '/app/run/record',
      SAVE: '/app/run/save',
      COMPARE: '/app/run/compare',
      DELETE: '/app/run/delete'
    },
    SESSION:{
      SAVE:'/app/session/save'
    },
    PROJECT:{
      SAVE:'app/project/save',
      DELETE: 'app/project/delete'
    },
    CORRELATIONS:{
      GENEREATE:'app/run/backtrack'
    }
  };

  var App = {
    init: function(){
      var _this = this;

      Util.dropdown.init();

      $("[data-autofocus=true]").each(function(index, ele){
        $(ele).focus();
      });

      $("body").on("click", "[data-href]", function(e){
        Util.redirect($(this).data("href"));
        return false;
      });

      $(".trigger").each(function(e){
        var $ele = $(this);
        var model = $ele.data('model').toLowerCase();
        var callback = $ele.data('callback');
        var event = $ele.data('event');
        var func = ($.trim(model) !== '')?_this[model][callback]:_this[callback];

        if(event === "init"){
          func.apply(App[model], arguments);
          return;
        }

        $ele.on(event, function(event){
          event.preventDefault();
          return func.apply(App[model], arguments);
        });
      });

      $(".select2").each(function(index, ele){
        var $ele = $(ele);
        var data = $ele.data();

        if(!data.width) data.width = "100%";

        $ele.select2(data);
      });
    },
    common: {
      select: function(e){

        var $ele = $(e.currentTarget);
        var id = $ele.data('id');
        var model = $ele.data('app-model');
        var $bulkAction = $($ele.data('bulk-id'));

        if(!model) return false;

        if(model && !App[model]) return false;

        var _this = App[model];


        if(_this.selected.indexOf(id) === -1){
          _this.selected.push(id);
          $("#_"+id).addClass("selected");
        }else{
          var index = _this.selected.findIndex(function(i){
            return i === id;
          });
          _this.selected.splice(index, 1);
          $("#_"+id).removeClass("selected");
        }

        if(_this.selected.length > 0){
          $bulkAction.addClass('shown');
        }else{
          $bulkAction.removeClass('shown');
        }

        return false;
      },
      accordien: function(e){
        var $ele = $(e.currentTarget);
        var group = $($ele.data('group'));
        var current = $($ele.data("ele"));

        if(current.is(":visible")){
          group.hide();
        }else{
          group.hide();
          current.show();
        }
      }
    },
    auth:{
      init: function(){
        this.loginForm = new Util.Validator("login");
        this.registerFrom = new Util.Validator("register");
      },
      login: function(e){
        if(!this.loginForm.checkDirty()) this.loginForm.validate();

        if(!this.loginForm.valid()) return false;
        var data = this.loginForm.data();
        Util.request.post(URL.AUTH.LOGIN, JSON.stringify(data)).then(function(res){
          Util.alert.show(res);
          if(res.redirect) Util.redirect(res.redirect, true);
        });
        return false;
      },
      register: function(e){
        if(!this.registerFrom.checkDirty()) this.registerFrom.validate();

        if(!this.registerFrom.valid()) return false;
        var data = this.registerFrom.data();
        Util.request.post(URL.AUTH.REGISTER, JSON.stringify(data)).then(function(res){
          Util.alert.show(res);
          if(res.redirect) Util.redirect(res.redirect, true);
        });
        return false;
      }
    },
    scenario: {
      selected: [],
      delete: function(e){
        var $ele = $(e.currentTarget);
        var mode = $ele.data('mode');
        var ids = this.selected;

        if(mode && ids.length === 0) return Util.alert.show({type: 'error', message: 'Please select at least one Scenario'}) && false;

        if(!mode){
          ids = [$ele.data('id')];
        }

        Util.confirm.show({
          message: "<p class='px15 weight700 black-color'>Are you sure?</p><p class='weight400 px12'>All related items will also be deleted.</p>",
          okay: function(e){
            Util.request.post(URL.SCENARIO.DELETE, JSON.stringify(ids)).then(function(res){
              Util.alert.show(res);
              if(res.reload) Util.redirect(location.href, true);
            })
          }
        })

        return false;
      },
      openModel: function(e){
        var $ele = $(e.currentTarget);
        var values = $ele.data("values");
        Util.modal.open($("#AddScenario"), {
          beforeOpen: function($container){
            App.run.form = new Util.Validator($container.find(".form").attr("name"));
            App.run.$container = $container;
          }
        });

        return false;
      },
        save: function(){
          if(!App.run.form.checkDirty()) App.run.form.validate();
          if(!App.run.form.valid()) return false;
          var data = App.run.form.data();
          Util.request.post(URL.SCENARIO.SAVE, JSON.stringify(data)).then(function(res){
            Util.alert.show(res);
            if(res.reload) Util.redirect(location.href, true);
          });
          return false;
        }
    },
    step:{
      selected: []
    },
    run: {
      selected: [],
      record: function(e){
        var $ele = $(e.currentTarget);
        var id = $ele.data("id");
        console.log(id);

        Util.request.post(URL.RUN.RECORD, JSON.stringify({id: id})).then(function(res){
          Util.alert.show(res);
          if(res.reload) Util.redirect(location.href, true);
        });

        return false;
      },
      openModel: function(e){
        var $ele = $(e.currentTarget);
        var values = $ele.data("values");
        Util.modal.open($("#AddEditRunModal"), {
          beforeOpen: function($container){
            App.run.form = new Util.Validator($container.find(".form").attr("name"));
            App.run.$container = $container;
          }
        });

        return false;
      },
      save: function(){
        if(!App.run.form.checkDirty()) App.run.form.validate();
        if(!App.run.form.valid()) return false;

        var data = App.run.form.data();
        if(App.run._id) data._id = App.run._id;

        Util.request.post(URL.RUN.SAVE, JSON.stringify(data)).then(function(res){
          Util.alert.show(res);
          if(res.reload) Util.redirect(location.href, true);
        });
        return false;
      },
      compare: function(e){
        if(this.selected.length < 2 || this.selected.length > 2) return Util.alert.show({type: 'error', message: 'Only two run can be compared.'}) && false;
        var statusCheck = false;
        this.selected.forEach(function(rid){
          var status = $("#_" + rid).data("status");
          if(status !== "done"){
            statusCheck = true;
          }
        });

        if(statusCheck) return Util.alert.show({type: 'error', message: 'One or more run is in new or pending state.'}) && false;

        Util.request.post(URL.RUN.COMPARE, JSON.stringify({ids: this.selected})).then(function(res){
          Util.alert.show(res);
        });

        return false;
      },
      backtrack: function(){
        this.selected.forEach(function(rid){
          var status = $("#_" + rid).data("status");
          if(status !== "done"){
            statusCheck = true;
          }
        });

        if(statusCheck) return Util.alert.show({type: 'error', message: 'One or more run is in new or pending state.'}) && false;

        Util.request.post(URL.RUN.COMPARE, JSON.stringify({ids: this.selected})).then(function(res){
          Util.alert.show(res);
        });

        return false;
      },
      delete: function(e){
        var $ele = $(e.currentTarget);
        var mode = $ele.data('mode');
        var ids = this.selected;

        if(mode && ids.length === 0) return Util.alert.show({type: 'error', message: 'Please select at least one Scenario'}) && false;

        if(!mode){
          ids = [$ele.data('id')];
        }

        Util.confirm.show({
          message: "<p class='px15 weight700 black-color'>Are you sure?</p><p class='weight400 px12'>All related items will also be deleted.</p>",
          okay: function(e){
            Util.request.post(URL.RUN.DELETE, JSON.stringify(ids)).then(function(res){
              Util.alert.show(res);
              if(res.reload) Util.redirect(location.href, true);
            })
          }
        })

        return false;
      }
    },
    correlations:{

    },
    session:{
        openModel: function(e){
            var $ele = $(e.currentTarget);
            var values = $ele.data("values");
            Util.modal.open($("#AddSession"), {
                beforeOpen: function($container){
                    var form_ele = document.getElementById('RunId')
                    form_ele.setAttribute("value",values);
                }
            });
            return false;
        },
        save: function(res){
            Util.alert.show(res);
            if(res.reload) Util.redirect(location.href, true);
        }
    },
    project:{
      openModel: function(e){
        console.log("reached here");
        Util.modal.open($("#AddProject"), {
          beforeOpen: function($container){
            App.run.form = new Util.Validator($container.find(".form").attr("name"));
            App.run.$container = $container;
          }
        });
      },
      save: function(){
        if(!App.run.form.checkDirty()) App.run.form.validate();
        if(!App.run.form.valid()) return false;

        var data = App.run.form.data();
        Util.request.post(URL.PROJECT.SAVE, JSON.stringify(data)).then(function(res){
          Util.alert.show(res);
          if(res.reload) Util.redirect(location.href, true);
        });
        return false;
      },

      delete: function(){

      }
    }
  };

  App.init();
  window.App = App;
})(window, document, jQuery.noConflict(), window.Util || {});
