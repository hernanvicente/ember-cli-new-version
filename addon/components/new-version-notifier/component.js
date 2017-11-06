/*jshint esnext:true */

import Ember from 'ember';
import layout from './template';

export default Ember.Component.extend({
  updateInterval: 20000,
  tagName: "div",
  versionFileName: "/VERSION.txt",
  versionFilePath: Ember.computed.alias("versionFileName"),
  showReload: true,
  showReloadButton: Ember.computed.alias("showReload"),
  reloadButtonText: Ember.computed(function(){
    return this.get('i18n').t('general.actions.reload');
  }),
  url: Ember.computed('versionFileName', function() {
    var config = Ember.getOwner(this).resolveRegistration('config:environment');
    var versionFileName = this.get('versionFileName');
    var baseUrl = config.rootURL || config.baseURL;

    if (!config || baseUrl === '/') {
      return versionFileName;
    }

    return baseUrl + versionFileName;
  }).readOnly(),
  init: function() {
    this._super(...arguments);
    this.updateVersion();
  },
  updateVersion() {
    var self = this;
    var t = setTimeout(function(){
      var currentTimeout = self.get('_timeout');
      if (currentTimeout) {
        clearTimeout(currentTimeout);
      }

      if(!Ember.$) {
        return;
      }

      Ember.$.ajax(self.get('url'), { cache:false }).then(function(res){
        var currentVersion = self.get('version');
        var newVersion = res && res.trim();

        if (currentVersion && newVersion !== currentVersion) {
          var message = self.get('i18n').t('general.messages.newVersion', {oldVersion: currentVersion, newVersion:newVersion});
          // Notify the user with UI to relaod
          self.setProperties({
            message,
            lastVersion: currentVersion
          });
          // Reload automatically after notification
          setTimeout(() => { self.reloadPage() }, self.get('updateInterval') / 2);
        }

        self.set('version',newVersion);
      }).done(() => {
          self.set('_timeout', setTimeout(function() {
              self.updateVersion();
          }, self.get('updateInterval')));
      }).fail(() => {
        self.set('updateInterval', (self.get('updateInterval') * 2));
        self.set('_timeout', setTimeout(function() {
            self.updateVersion();
        }, self.get('updateInterval')));
    });
    }, 10);
    self.set('_timeout', t);
  },
  reloadPage() {
    if(typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  },
  willDestroy() {
    this._super(...arguments);
    clearTimeout(this.get('_timeout'));
  },
  actions: {
    reload() {
      this.reloadPage();
    },
    close() {
      this.set('message', undefined);
    }
  }
});
