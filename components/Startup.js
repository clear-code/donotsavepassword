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
				if (Prefs.getBoolPref('extensions.donotsavepassword@clear-code.com.clearStoredPasswords'))
					this.clearStoredPasswords();
				return;
		}
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
	}
}; 
  
if (XPCOMUtils.generateNSGetFactory) 
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([StartupService]);
else
	var NSGetModule = XPCOMUtils.generateNSGetModule([StartupService]);
