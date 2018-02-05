{// Do Not Save Password, for Firefox 60 and later
  const { classes: Cc, interfaces: Ci, utils: Cu } = Components;
  const { Services } = Cu.import('resource://gre/modules/Services.jsm', {});

  lockPref('signon.rememberSignons', false);
  defaultPref('extensions.donotsavepassword@clear-code.com.clearStoredPasswords', true);

  const log = (aMessage) => {
    Services.console.logStringMessage(`[donotsavepassword] ${aMessage}`);
  };

  Services.obs.addObserver({
    observe(aSubject, aTopic, aData) {
      Services.obs.removeObserver(this);
      this.hideSavedPasswordUI();
      if (getPref('extensions.donotsavepassword@clear-code.com.clearStoredPasswords')) {
        this.clearStoredPasswords();
        this.clearMasterPassword();
      }
    },

    hideSavedPasswordUI() {
      const rules = `
        @namespace url("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul");

        @-moz-document
          url-prefix("about:preferences"),
          url-prefix("chrome://browser/content/preferences/in-content/preferences.xul") {
          *|*#passwordsGroup,
          *|*[id="passwordsGroup"] {
            visibility: collapse !important;
            -moz-user-focus: ignore !important;
          }
        }

        @-moz-document url-prefix("chrome://browser/content/preferences/preferences.xul") {
          #passwordsGroup {
            visibility: collapse !important;
            -moz-user-focus: ignore !important;
          }
        }
        @-moz-document url-prefix("chrome://messenger/content/preferences/preferences.xul") {
          tabbox#securityPrefs tab:nth-child(4),
          tabbox#securityPrefs tabpanel:nth-child(4) {
            visibility: collapse !important;
            -moz-user-focus: ignore !important;
          }
        }

        @-moz-document url-prefix("chrome://messenger/content/accountcreation/emailWizard.xul") {
          #remember_password {
            visibility: collapse !important;
            -moz-user-focus: ignore !important;
          }
        }
      `;
      const sheet = IOService.newURI(`data:text/css,${encodeURIComponent(rules)}`, null, null);
      const SSS = Cc['@mozilla.org/content/style-sheet-service;1']
                   .getService(Ci.nsIStyleSheetService);
      if (!SSS.sheetRegistered(sheet, SSS.USER_SHEET))
        SSS.loadAndRegisterSheet(sheet, SSS.USER_SHEET);
    },

    clearStoredPasswords() {
      const LoginManager = Cc['@mozilla.org/login-manager;1']
                            .getService(Ci.nsILoginManager);
      let loginInfos;
      try {
        loginInfos = LoginManager.getAllLogins({});
      }
      catch(e) {
        return;
      }

      for (let loginInfo of loginInfos) {
        LoginManager.removeLogin(loginInfo);
      }

      try {
        const imported = getPref('signon.importedFromSqlite');
        if (imported) {
          // Firefox migrates "signons.sqlite" to "logins.json".
          // Because new password manager ignores signons.sqlite,
          // we cannot remove passwords stored into the file via
          // the login manager.
          let DIRService = Cc['@mozilla.org/file/directory_service;1']
                            .getService(Ci.nsIProperties);
          let oldFile = DIRService.get('ProfD', Ci.nsIFile);
          oldFile.append('signons.sqlite');
          if (oldFile.exists())
            oldFile.remove(true);
        }
      }
      catch(e) {
      }
    },

    clearMasterPassword() {
      if (!this.hasMasterPassword())
        return;

      const pk11db = Cc['@mozilla.org/security/pk11tokendb;1']
                      .getService(Ci.nsIPK11TokenDB);
      const token = pk11db.getInternalKeyToken();
      token.reset();
    },

    hasMasterPassword() {
      const secmodDB = Cc['@mozilla.org/security/pkcs11moduledb;1']
                        .getService(Ci.nsIPKCS11ModuleDB);
      const slot = secmodDB.findSlotByName('');
      if (slot) {
        const status = slot.status;
        const hasMP = status != Ci.nsIPKCS11Slot.SLOT_UNINITIALIZED &&
                      status != Ci.nsIPKCS11Slot.SLOT_READY;
        return hasMP;
      }
      return false;
    }
  }, 'profile-after-change', false);
}
