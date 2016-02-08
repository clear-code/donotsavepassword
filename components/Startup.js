/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

const ObserverService = Cc['@mozilla.org/observer-service;1']
			.getService(Ci.nsIObserverService);
const Prefs = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch);
const SSS = Cc['@mozilla.org/content/style-sheet-service;1']
			.getService(Ci.nsIStyleSheetService);
const IOService = Cc['@mozilla.org/network/io-service;1']
			.getService(Ci.nsIIOService);

function StartupService() { 
}
StartupService.prototype = {
	
	classDescription : 'DoNotSavePasswordStartupService', 
	contractID : '@clear-code.com/donotsavepassword/startup;1',
	classID : Components.ID('{57748650-c0a7-11df-851a-0800200c9a66}'),

	_xpcom_categories : [
		{ category : 'app-startup', service : true } // -Firefox 3.6
	],

	QueryInterface : XPCOMUtils.generateQI([
		Ci.nsIObserver
	]),

	get wrappedJSObject() {
		return this;
	},
 
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'app-startup':
				if (!this.listeningProfileAfterChange) {
					ObserverService.addObserver(this, 'profile-after-change', false);
					this.listeningProfileAfterChange = true;
				}
				return;

			case 'profile-after-change':
				if (this.listeningProfileAfterChange) {
					ObserverService.removeObserver(this, 'profile-after-change');
					this.listeningProfileAfterChange = false;
				}
				this.hideSavedPasswordUI();
				if (Prefs.getBoolPref('extensions.donotsavepassword@clear-code.com.clearStoredPasswords')) {
					this.clearStoredPasswords();
					this.clearMasterPassword();
				}
				return;
		}
	},

	hideSavedPasswordUI : function()
	{
		var sheet = IOService.newURI('chrome://donotsavepassword/content/global.css', null, null);
		if (!SSS.sheetRegistered(sheet, SSS.USER_SHEET))
			SSS.loadAndRegisterSheet(sheet, SSS.USER_SHEET);
	},
 
	clearStoredPasswords : function() 
	{
		var LoginManager = Cc['@mozilla.org/login-manager;1']
								.getService(Ci.nsILoginManager);
		var loginInfos;
		try {
			loginInfos = LoginManager.getAllLogins({});
		}
		catch(e) {
			return;
		}

		loginInfos.forEach(function(aLoginInfo) {
			LoginManager.removeLogin(aLoginInfo);
		}, this);

		try {
		  var imported = Prefs.getBoolPref('signon.importedFromSqlite');
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

	clearMasterPassword : function()
	{
		if (!this.hasMasterPassword())
			return;

		var pk11db = Cc['@mozilla.org/security/pk11tokendb;1']
				.getService(Ci.nsIPK11TokenDB);
		var token = pk11db.getInternalKeyToken();
		token.reset();
	},

	hasMasterPassword : function()
	{
		var secmodDB = Cc['@mozilla.org/security/pkcs11moduledb;1']
				.getService(Ci.nsIPKCS11ModuleDB);
		var slot = secmodDB.findSlotByName('');
		if (slot) {
			let status = slot.status;
			let hasMP = status != Ci.nsIPKCS11Slot.SLOT_UNINITIALIZED &&
						status != Ci.nsIPKCS11Slot.SLOT_READY;
			return hasMP;
		}
		return false;
	}
}; 
  
if (XPCOMUtils.generateNSGetFactory) 
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([StartupService]);
else
	var NSGetModule = XPCOMUtils.generateNSGetModule([StartupService]);
