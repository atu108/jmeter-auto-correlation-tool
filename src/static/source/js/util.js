(function(window, documemt, $){

  var DEFAULT_TIMEOUT = 10,
    TIMER = false;

  function Util(){
    this.version = 1.0;
    this.author = "Ashok Vishwakarma <akvlko@gmail.com>";
  }

  function Alert(){
    var $continer = $("#alert"),
      timer = false;

    function hide(delayed){
      if(timer) clearTimeout(timer);
      if(!delayed) return $continer.removeClass('show success error');

      timer = window.setTimeout(function(){
        $continer.removeClass('show success error');
      }, DEFAULT_TIMEOUT);
    }

    function show(params){
        console.log("inside show",params);
      $continer.addClass('show ' + params.type).find('.message').text(params.message);
      if(!hide){
        hide(true);
      }
     
    }

    return {
      show: show.bind(this),
      hide: hide.bind(this)
    }
  }

  function Tabs(){
    var $container = false,
      $nav = false,
      $panels = false;

    function clickHandle(event){
      var $ele = $(event.currentTarget);
      $panels.removeClass("active");
      $nav.removeClass("active");
      
      $ele.addClass("active");

      $container.find($ele.data('panel')).addClass("active");
    }

    function init(selector){
      $container = $(selector);
      $panels = $container.find(".panel");
      $nav = $container.find('.nav li a');

      $nav.unbind("click").bind("click", clickHandle.bind(this));
    }

    return {
      init: init.bind(this)
    }
  }

  function Confirm(){
    var $container = $("#confirm");

    function cancel(params, $yes, $no, event){
      $container.removeClass("open");
      $yes.find("span").text("Okay");
      $no.find("span").text("Cancel");

      if(params.cancel) params.cancel(event);
    }

    function okay(params, $yes, $no, event){
      $container.removeClass("open");
      $yes.find("span").text("Okay");
      $no.find("span").text("Cancel");

      if(params.okay) params.okay(event);
    }

    function show(params){
      var $no = $container.find(".confirm-label-no");
      var $yes = $container.find(".confirm-label-yes");
      $container.find(".message").html(params.message);

      if(params.label && params.label.okay) $yes.find("span").text(params.label.okay);
      if(params.label && params.label.cancel) $no.find("span").text(params.label.cancel);

      $yes.unbind("click").bind("click", okay.bind(this, params, $yes, $no));
      $no.unbind("click").bind("click", cancel.bind(this, params, $yes, $no));

      $container.addClass("open");
    }

    return {
      show: show.bind(this)
    }
  }

  function Modal(){
    var $container = $("#modal");

    function open($div, params){
      $container.find(".modal-box").html($div.html());
      if(params.beforeOpen) params.beforeOpen($container.find(".modal-box"));
      $container.addClass("open");
    }

    function close(){
      $container.find(".modal-box").html("");
      $container.removeClass("open");
    }
    
    return {
      open: open.bind(this),
      close: close.bind(this)
    }
  }

  function Request(){
    var _params = {
      cache: 'no-cache',
      headers: {
        'content-type': 'application/json',
        'request-type': 'ajax'
      },
      credentials: 'same-origin',
      method: false
    }

    function raw(url, params){
      // console.log(url, params);
      return fetch(url, Object.assign(_params, params)).then(function(res) {
        return res.json();
      });
    }

    function get(url, params){
      if(!params) params = {};
      params.method = "GET";
      return raw(url, params);
    }

    function post(url, data, params){
      if(!params) params = {};
      params.body = data;
      params.method = "POST";
      return raw(url, params);
    }

    function put(url, data, params){
      if(!params) params = {};
      params.body = data;
      params.method = "PUT";
      return raw(url, params);
    }

    function del(url, params){
      if(!params) params = {};
      params.method = "DELETE";
      return raw(url, params);
    }

    return {
      get: get.bind(this),
      post: post.bind(this),
      put: put.bind(this),
      delete: del.bind(this)
    }
  }

  function Validator(form){
    var fields = {},
      rules = {
        email: {
          type: 'regex',
          regex: /^[a-z0-9][a-z0-9-_\.]+@[a-z0-9][a-z0-9-]+[a-z0-9]\.[a-z0-9]{2,10}(?:\.[a-z]{2,10})?$/
        },
        password: {
          type: 'func',
          method: '_password'
        },
        alphabet: {
          type: 'regex',
          regex: /^[a-zA-Z ]+$/
        },
        alphanumeric: {
          type: 'regex',
          regex: /^[a-zA-Z0-9]/
        },
        url: {
          type: 'regex',
          regex: /^(https?):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)*(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/
        }
      };

      function data(){
        var data = {};

        Object.keys(fields).forEach(function(name){
          if(name.indexOf("[") !== -1){
            var matches = name.match(/\[(.*?)\]$/);
            var key = name.replace(matches[0], "");
            if(typeof data[key] === "undefined") data[key] = {};
            data[key][matches[1]] = fields[name].value.trim();
          }else{
            data[name] = fields[name].value.trim();
          }
          fields[name].isDirty = false;
        });

        return data;
      }

      function checkDirty(){
        var isDirty = true;

        Object.keys(fields).forEach(function(name){
          if(!fields[name].isDirty) isDirty = false;
        })

        return isDirty;
      }

      function validate(){
        return _check_all();
      }

      function valid(){
        var isValid = true;

        Object.keys(fields).forEach(function(name){
          if(!fields[name].valid) isValid = false;
        });

        return isValid;
      }

      function check(name){
        if(name) return _check_one(name);

        return _validate_all();
      }

      function _check_one(name){
        return _check_field(fields[name]);
      }

      function _check_all(){
        Object.keys(fields).forEach(function(name){
          fields[name].isDirty = true;
          _blur(fields[name]);
        })
      }

      function _check_field(field){
        field.value = field.element.value;

        var isValid = true;
        var rules = field.rule.split(",");

        field.rule.split(",").forEach(function(rule){
          var param = rules[rule.trim()] || false;

          if(!param && rule.trim() === "required" && field.value.trim() === ""){
            isValid = false;
          }else if(!param && rule.trim() === "allow-blank" && field.value.trim() === ""){
            isValid = true;
          }else if(param && param.type === 'regex' && !param.regex.test(field.value.trim())){
            isValid = false;
          }

          if(field.same && fields[field.same].value.trim() !== field.value) isValid = false;
        })

        return isValid;
      }

      function _blur(field){
        if(!_check_field(field)){
          field.element.classList.remove('okay');
          field.element.classList.add('error');
          field.valid = false;
        }else{
          field.element.classList.remove('error');
          field.element.classList.add('okay');
          field.valid = true;
        }
      }

      function _focus(field){
        field.element.classList.remove('error', 'okay');
      }

      function bindEvents(element){
        element.addEventListener("blur", _blur.bind(this, fields[element.name]));
        element.addEventListener("focus", _focus.bind(this, fields[element.name]));
      }
      
      formElement = (typeof form === "string")?documemt.forms[form]:form;

      if(!formElement) return;

      [].forEach.call(formElement, function(element){
        if(element.type === "submit" || element.type === "reset") return;

        if(!element.name) return;

        var rule = element.getAttribute('data-validate') || "";

        fields[element.name] = {
          element: element,
          rule: rule,
          value: element.value,
          same: element.getAttribute('data-same'),
          who: element.name,
          dirty: false,
          valid: false
        }

        bindEvents(element);
      });

      return {
        check: check.bind(this),
        valid: valid.bind(this),
        validate: validate.bind(this),
        checkDirty: checkDirty.bind(this),
        data: data.bind(this)
      }
  }

  function Dropdown(){
    var $dropdown = $(".dropdown"),
      $trigger = $dropdown.find(".dropdown-trigger"),
      $overlay = $dropdown.find(".overlay");

    function init(){
      if(!$dropdown.length) return;

      var toggle = function(){
        $dropdown.toggleClass("open");
      }

      $trigger.unbind("click").bind("click", toggle);
      $overlay.unbind("click").bind("click", toggle);
    }

    return {
      init: init.bind(this)
    }
  }

  Util.prototype = Object.assign({}, Util.prototype, {
    noop: function(){},
    Validator: Validator,
    request: new Request(),
    alert: new Alert(),
    tabs: new Tabs(),
    confirm: new Confirm(),
    modal: new Modal(),
    dropdown: new Dropdown(),
    redirect: function(url, delay){
      if(TIMER) clearTimeout(TIMER);

      if(!delay) return window.location.href = url;

      TIMER = setTimeout(function(){
        window.location.href = url;
      }, DEFAULT_TIMEOUT);
    },
    reload: function(){
      location.reload();
    }
  });

  window.Util = new Util();

  $.fn.serializeObject = function(){
    var data = {};
    var formData = $(this).serializeArray();
    formData.forEach(function(d){
      data[d["name"]] = (d["value"] !== 'undefined' && d["value"] !== "")?d["value"]:"";
    });
    return data;
  };
  
})(window, document, jQuery.noConflict());